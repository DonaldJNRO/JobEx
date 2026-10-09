// How a listing takes a booking, decided per listing.
//
// "We build a system that understands when someone needs instant booking."
//
// Measured across all 49 live listings before building it:
//   acceptsInAppPayment, sabieAllocationPerSlot, role  present on all 49
//   externalBookingUrl                                 1
//   a written policy                                   1
//
// So the mode is inferred from what every listing has. The deposit is NOT
// inferred from policy prose: at n=1 that is a classifier trained on one
// business's wording, wrong the first time somebody phrases it differently.
// It is a field an operator's figure goes into.
//
// Run: npx tsx src/lib/booking-mode.test.mjs

import { bookingMode, payNowAmount } from "./booking-mode.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

const PAYABLE = { acceptsInAppPayment: true, sabieAllocationPerSlot: 2, role: "ExperienceProviders" };

is(bookingMode(PAYABLE).mode, "instant",
  "a payable listing with an allocation is confirmed on the spot");
is(bookingMode(PAYABLE).payNowFraction, 1, "and the whole price is taken");

// THE LOCKED RULE, and it outranks being payable.
is(bookingMode({ ...PAYABLE, role: "FoodBeverageManager" }).mode, "request",
  "a cafe takes a reservation, never a payment");
is(bookingMode({ ...PAYABLE, role: "restaurant" }).mode, "request", "however the role is spelled");

// TWO DIARIES OVER ONE CHAIR is what externalBookingUrl exists to prevent, so
// it outranks everything, including being payable.
is(bookingMode({ ...PAYABLE, externalBookingUrl: "https://acuity.example/x" }).mode, "external",
  "a service booked on their own system is never ours to sell");

is(bookingMode({ ...PAYABLE, acceptsInAppPayment: false }).mode, "request",
  "a listing that cannot take payment asks");
is(bookingMode({ ...PAYABLE, sabieAllocationPerSlot: 0 }).mode, "request",
  "and so does one with no allocation, which is what the server counts against");
// The two reasons differ, because they are different problems for the office.
is(bookingMode({ ...PAYABLE, sabieAllocationPerSlot: 0 }).why.includes("No slots"), true,
  "and it says which of the two it is");

// ── the deposit, which is a figure and not a guess ──────────────────────
const DEP = { ...PAYABLE, depositPercent: 30 };
is(bookingMode(DEP).mode, "deposit", "an operator who set a deposit takes a deposit");
is(bookingMode(DEP).payNowFraction, 0.3, "at their own percentage");
is(payNowAmount(DEP, 17000), 5100, "so 30% of 17,000 naira is 5,100");
is(payNowAmount(PAYABLE, 17000), 17000, "and a full-price listing takes all of it");

// Nobody is charged a fraction of a naira.
is(payNowAmount({ ...PAYABLE, depositPercent: 33 }, 1000), 330, "rounded to a whole unit");

// Nonsense percentages are not deposits. 0 and 100 are both "pay in full"
// said badly, and a negative is a bug.
for (const p of [0, 100, 150, -10, "abc", null]) {
  is(bookingMode({ ...PAYABLE, depositPercent: p }).mode, "instant", `depositPercent ${JSON.stringify(p)} is ignored`);
}

// A deposit on something that is not payable is still not payable.
is(bookingMode({ ...PAYABLE, acceptsInAppPayment: false, depositPercent: 30 }).mode, "request",
  "a deposit cannot make an unpayable listing payable");

is(payNowAmount(PAYABLE, 0), null, "no price is not a charge of zero");
is(payNowAmount(PAYABLE, null), null, "and neither is no price at all");
is(bookingMode(null).mode, "request", "nothing known falls back to asking, the safe direction");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
