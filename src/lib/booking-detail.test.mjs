// What the guest is actually told before they commit.
//
// The form asked for a service, a date and a name, and showed none of what a
// person needs to decide: no price on the thing they picked, no address, and
// none of the operator's terms.
//
// Measured on Naileditbyd, 9 Oct 2026: the dropdown held 36 rows for 17
// services, 15 of them the same name twice, and the first six had NO PRICE.
// She would pick "Acrylic or BIAB nails, plain short", be shown nothing, and
// the request would reach the operator with totalPrice undefined.
//
// Run: npx tsx src/lib/booking-detail.test.mjs

import { offersOf, policyLines, addressOf } from "./shop-window.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

// Her real shape: services priced on the TIER, plus a flat `packages` mirror
// of the same list that the assemble path writes.
const NAILS = {
  services: [
    { name: "Acrylic, plain short", tiers: [{ label: "Single", price: "17000" }] },
    { name: "Gel nails, plain", tiers: [{ label: "Short", price: "12000" }, { label: "Medium", price: "14000" }] },
  ],
  packages: [
    { name: "Acrylic, plain short", price: 17000 },
    { name: "Gel nails, plain (Short)", price: 12000 },
    { name: "Gel nails, plain (Medium)", price: 14000 },
  ],
};

const o = offersOf(NAILS);
is(o.filter((x) => typeof x.price !== "number").length, 0,
  "EVERY offer has a price, read off the tier where the row has none");
is(o.map((x) => x.name).filter((n, i, a) => a.indexOf(n) !== i).length, 0,
  "and none is listed twice: services and packages are the same list, not two");
is(o.find((x) => x.name === "Acrylic, plain short")?.price, 17000,
  "a single-tier service keeps its own name");
is(o.filter((x) => x.name.startsWith("Gel nails")).map((x) => x.price), [12000, 14000],
  "a service with two real prices becomes two choices, not an averaged one");

// Falling back to packages only when there are no services at all.
is(offersOf({ packages: [{ name: "Only a package", price: 500 }] }).length, 1,
  "packages are used when a listing has no services");

// A named but unpriced service is still bookable. "Ask to book" means the
// operator can say what it costs when they accept.
is(offersOf({ services: [{ name: "Consultation" }] }), [{ name: "Consultation" }],
  "an unpriced service is offered without inventing a number");

// ── what they are agreeing to ───────────────────────────────────────────
is(policyLines({ policy: { lines: ["No refunds.", "  ", "Arrive on time."] } }),
  ["No refunds.", "Arrive on time."], "the operator's terms, blanks dropped");
is(policyLines({}), [], "a listing with no terms shows no terms block");
is(policyLines(null), [], "and rubbish does not throw");

is(addressOf({ location: { address: " 2 Bolajide Avenue, Gbagada " } }), "2 Bolajide Avenue, Gbagada",
  "the address, which the form never showed");
is(addressOf({ location: "A plain string address" }), "A plain string address",
  "both location shapes are read");
is(addressOf({}), "", "and a listing with none renders nothing rather than an empty pin");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
