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
// £1.70, which is what 3,000 over 1,760 is. This asserted "£2", rounding
// 30p off a £1.70 plate: the same rounding that made a 55p service fee
// print as "£1" beside a label reading 5 percent.
ck(show(3000, undefined, "GBP") === "£1.70",
  "so ₦3,000 of jollof reads as £1.70, not £3,000");

// GBP IS THE UNIT. $100 is £75.76 at 1.32, not £100, and the figure the
// comment already named is now the figure the assertion wants.
ck(show(100, "USD", "GBP") === "£75.76", "$100 converts to £75.76, not £100");
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

// ── a bill's lines must add up ──────────────────────────────────────────
// Rounded on their own, £11.40 and £0.57 print as "£11" and "£1" over a
// total of "£12", and the reader is asked to believe 11 + 1 = 12 while a
// fee LABELLED 5 percent looks like nine. The charge was exactly 5.00
// percent, measured against The Rink Arena's ₦20,000 Skate Nights on
// 20 Oct 2026; only the rendering was wrong.
const { billDecimals, decimalsFor } = await import("./display-price.ts");

ck(decimalsFor(0.55, "GBP") === 2, "a figure under a unit keeps its pennies");
ck(decimalsFor(11, "GBP") === 0, "a whole figure does not grow a .00");
ck(decimalsFor(20000, "NGN") === 0, "and naira never shows kobo");
ck(decimalsFor(1000, "NGN") === 0, "whatever the arithmetic says");

ck(billDecimals([11.4, 0.57, 11.97], "GBP") === 2,
  "one bill takes the precision its most demanding line needs");
ck(billDecimals([11, 1, 12], "GBP") === 0,
  "and stays clean when every line is whole");

// A LINE LABELLED 5 PERCENT MUST LOOK LIKE 5 PERCENT, which is the thing
// that actually broke and the thing "do the lines add up" does not catch:
// "£11 + £1 = £12" IS self-consistent, and the fee in it still reads as
// nine percent of the price.
//
// The figures are The Rink Arena's real ones, read from production on
// 20 Oct 2026: ₦20,000 Skate Nights, ₦1,000 fee, which is 5.00 percent
// exactly, shown to a guest whose money is pounds.
const SUB = 20000 / 1818.18, FEE = 1000 / 1818.18;
const dp = billDecimals([SUB, FEE, SUB + FEE], "GBP");
const printed = (n) => Number(n.toFixed(dp));
const shownPct = (printed(FEE) / printed(SUB)) * 100;
ck(Math.abs(shownPct - 5) < 0.5,
  `the fee a reader can see is still 5 percent of the price they can see (got ${shownPct.toFixed(1)}%)`);

// And the lines still come to the total, which is the lesser half of it.
ck(printed(SUB) + printed(FEE) === printed(SUB + FEE),
  "and the lines a reader adds up come to the total they are shown");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
