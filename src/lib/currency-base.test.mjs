// The arithmetic behind a converted price.
//
// Two bugs lived in four lines of buildDisplayPrice, and both were found by
// sweeping the six surfaces for shared definitions rather than by anyone
// reporting them.
//
//   1. A missing currency defaulted to USD. Seven live listings carry no
//      currency and all seven are Lagos cafés, so a ₦3,000 plate of jollof
//      displayed as £3,000. Not a rounding error — 1500x, on the page a
//      traveller reads.
//
//   2. The rate table is GBP-based (currencies/gbp.json, as useRates.ts
//      says in its first line) and the code hardcoded USD as the unit. So
//      $100 converted as though a dollar were a pound: £100, not £75.
//
// Uses a FIXED rate table, so this tests the arithmetic rather than today's
// market.

import { buildDisplayPrice, DEFAULT_CURRENCY } from "./display-price.ts";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

// Per 1 GBP, the shape the feed actually returns.
const RATES = { GBP: 1, USD: 1.32, NGN: 1760, EUR: 1.18, MXN: 24 };
const show = (amount, from, to) =>
  buildDisplayPrice({ amount, nativeCurrency: from, selectedCurrency: to, exchangeRates: RATES, ratesReady: true }).display;

ck(DEFAULT_CURRENCY === "NGN", "a listing with no currency is assumed to be in naira");
ck(show(3000, undefined, "GBP") === "£2",
  "so ₦3,000 of jollof reads as £2, not £3,000");

// GBP IS THE UNIT. $100 is £75.76 at 1.32, not £100.
ck(show(100, "USD", "GBP") === "£76", "$100 converts to about £76, not £100");
ck(show(100, "GBP", "USD") === "$132", "and £100 the other way is $132");
ck(show(1760, "NGN", "GBP") === "£1", "₦1,760 is £1 at this table");
ck(show(1, "GBP", "NGN") === "₦1,760", "and back again");

// A cross rate neither side of which is the base.
ck(show(1760, "NGN", "MXN") === "MXN 24", "naira to pesos goes through the base correctly");

// Same currency is never "converted".
const same = buildDisplayPrice({ amount: 35000, nativeCurrency: "NGN", selectedCurrency: "NGN", exchangeRates: RATES, ratesReady: true });
ck(same.display === "₦35,000" && same.isConverted === false, "the same currency is left alone");
ck(same.original === "", "and carries no ≈ line, because there is nothing to approximate");

// RATES NOT IN YET: show native, never a guess.
const cold = buildDisplayPrice({ amount: 35000, nativeCurrency: "NGN", selectedCurrency: "GBP", exchangeRates: null, ratesReady: false });
ck(cold.display === "₦35,000", "with no rates it shows the operator's own price");
ck(cold.isConverted === false, "and does not claim to have converted anything");

// An unknown currency has no rate, so it must not silently become 1.
const odd = buildDisplayPrice({ amount: 100, nativeCurrency: "XXX", selectedCurrency: "GBP", exchangeRates: RATES, ratesReady: true });
ck(!/£100/.test(odd.display), "a currency with no rate is not treated as parity with the base");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
