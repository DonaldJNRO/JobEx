// Does a converted price ever show the wrong money?
//
// Run:  node --experimental-strip-types src/lib/currency.test.mjs
//
// THE FAILURE THIS GUARDS is a price that looks completely normal and is
// wrong. Two functions decide what a listing costs: symbolFor picks the
// SYMBOL, nativeCurrencyOf picks the CODE the conversion divides by. If they
// ever disagree, a page shows "₦4.54": a naira symbol against a number
// converted out of pounds. Nothing errors, nothing looks broken, and the
// number is off by a factor of about 1,760.
//
// The two are separate functions because they answer different questions and
// one is exported for conversion while the other is internal to formatting.
// That is exactly the arrangement that drifts, so this pins them together.
//
// Measured against production 2026-09-27: 31 of 38 public listings carry an
// explicit `currency`. The other 7 fall back to `country`, which is written
// two ways in the real data, "Nigeria" and "GB", because two different tools
// wrote it. Both shapes appear below because both shapes exist.

import { nativeCurrencyOf, priceParts as getListingPriceParts } from './listing-price.ts';

let fails = 0;
const is = (got, want, label) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

// ── which money the operator priced in ────────────────────────────────────
is(nativeCurrencyOf({ currency: 'NGN' }), 'NGN', 'an explicit currency wins');
is(nativeCurrencyOf({ currency: 'ngn' }), 'NGN', 'and is uppercased');
is(nativeCurrencyOf({ currency: 'GBP', country: 'Nigeria' }), 'GBP',
  'an explicit currency beats the country, because the operator set it');

// THE TWO REAL SHAPES OF `country`, both present in production.
is(nativeCurrencyOf({ country: 'Nigeria' }), 'NGN', 'country as a name');
is(nativeCurrencyOf({ country: 'GB' }), 'GBP', 'country as an ISO code');
is(nativeCurrencyOf({ country: 'nigeria' }), 'NGN', 'case does not matter');
is(nativeCurrencyOf({}), 'GBP', 'nothing at all falls back to the platform default');

// ── conversion ────────────────────────────────────────────────────────────
// Real-ish rates, GBP base, the same shape the CDN returns.
const rates = { GBP: 1, NGN: 1761.53, USD: 1.3249, EUR: 1.163 };

{
  const lagos = { customPrice: { price: 8000 }, currency: 'NGN', country: 'Nigeria' };

  // No rates: the operator's own price, untouched. This is the rule inherited
  // from the app, "Rates not in yet: show native only (don't lie)", and it is
  // the single most important behaviour in this file.
  is(getListingPriceParts(lagos).amount, '₦8,000',
    'with no rates at all, the operator price stands');
  is(getListingPriceParts(lagos, { rates: null, ready: false, to: 'GBP' }).amount, '₦8,000',
    'rates not ready yet, still the operator price');
  is(getListingPriceParts(lagos, { rates, ready: true, to: '' }).amount, '₦8,000',
    'an unknown visitor region converts nothing');
  is(getListingPriceParts(lagos, { rates: {}, ready: true, to: 'GBP' }).amount, '₦8,000',
    'an EMPTY rate table invents nothing rather than dividing by undefined');

  // The actual conversion. 8000 NGN / 1761.53 = £4.54.
  is(getListingPriceParts(lagos, { rates, ready: true, to: 'GBP' }).amount, '£5',
    'a UK visitor sees pounds');

  // Same currency both ends is not a conversion.
  is(getListingPriceParts(lagos, { rates, ready: true, to: 'NGN' }).amount, '₦8,000',
    'a Nigerian visitor sees the price as written, with no round trip');
}

// ── THE DRIFT GUARD ───────────────────────────────────────────────────────
//
// symbolFor is not exported, so it cannot be called directly. It is reached
// through getListingPriceParts with no rates, which formats using the symbol.
// If the two functions ever disagree about a listing, the symbol shown here
// will not be the symbol for the code nativeCurrencyOf returns.
console.log();
console.log('the symbol and the conversion code never disagree');
{
  const SYMBOL = { NGN: '₦', GBP: '£', USD: '$', EUR: '€', XOF: 'CFA', MRU: 'UM' };
  const cases = [
    { currency: 'NGN' },
    { currency: 'GBP' },
    { currency: 'USD' },
    { country: 'Nigeria' },
    { country: 'GB' },
    { country: 'United Kingdom' },
    { country: 'Mali' },
    { country: 'Mauritania' },
    {},
  ];
  let mismatches = 0;
  for (const base of cases) {
    const listing = { ...base, customPrice: { price: 1000 } };
    const code = nativeCurrencyOf(listing);
    const rendered = getListingPriceParts(listing).amount || '';
    const expected = SYMBOL[code];
    if (!expected) { mismatches++; console.log(`   no symbol known for ${code} (${JSON.stringify(base)})`); continue; }
    if (!rendered.startsWith(expected)) {
      mismatches++;
      console.log(`   ${JSON.stringify(base)} → code ${code} but rendered ${rendered}`);
    }
  }
  is(mismatches, 0, `symbol matches the conversion code for all ${cases.length} shapes`);
}

// ── a price of zero is not a price ────────────────────────────────────────
// Measured: one real listing has customPrice {price: 0}. It must not render
// as "£0" or "₦0", which reads as free.
is(getListingPriceParts({ customPrice: { price: 0 }, currency: 'GBP' }).amount, null,
  'a zero price is not typeset as free');
is(getListingPriceParts({ currency: 'GBP' }).amount, null, 'and neither is a missing one');

console.log();
console.log(fails === 0 ? 'ALL PASSED' : `${fails} FAILED`);
process.exit(fails > 0 ? 1 : 0);
