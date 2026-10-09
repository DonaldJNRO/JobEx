// The page has to agree with the server about who waits.
//
// onBookingRequestCreated confirms a request on the spot when the listing
// takes payment, is not a cafe, and has an allocation. It counts against the
// slot in a transaction and stamps confirmedBy: 'instant_allocation'. That
// has already happened 14 times.
//
// The web never knew. EVERY listing's page and form said "has 12 hours to
// accept. You pay after they do", including the ones confirmed before the
// operator had looked. Of 35 requests ever made, 26 were cancelled by the
// traveller; telling somebody to wait for a yes they already have is one way
// that happens.
//
// Run: npx tsx src/lib/instant-book.test.mjs

import { readFileSync } from "node:fs";
import { confirmsInstantly } from "./shop-window.ts";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

// Naileditbyd as she stands: payable, allocation 2, an experience.
ck(confirmsInstantly({ acceptsInAppPayment: true, sabieAllocationPerSlot: 2, role: "ExperienceProviders" }) === true,
  "a payable experience with an allocation confirms on the spot");

ck(confirmsInstantly({ acceptsInAppPayment: false, sabieAllocationPerSlot: 2, role: "ExperienceProviders" }) === false,
  "a listing that cannot take payment still asks");
ck(confirmsInstantly({ acceptsInAppPayment: true, sabieAllocationPerSlot: 0, role: "ExperienceProviders" }) === false,
  "and so does one with no allocation, which is what the server counts against");

// THE LOCKED RULE. A cafe is never payable, so it is never instant.
for (const role of ["FoodBeverageManager", "food_beverage_manager", "restaurant"]) {
  ck(confirmsInstantly({ acceptsInAppPayment: true, sabieAllocationPerSlot: 2, role }) === false,
    `a cafe is never instant (${role})`);
}

ck(confirmsInstantly(null) === false, "nothing known is not instant");
ck(confirmsInstantly({}) === false, "and neither is an empty listing");
ck(confirmsInstantly({ acceptsInAppPayment: true, sabieAllocationPerSlot: "2", role: "Host" }) === true,
  "an allocation stored as a string still counts, as Firestore has held both");

// ── the same rule, on both sides ────────────────────────────────────────
const SHEET = readFileSync(new URL("../components/BookingRequest.tsx", import.meta.url), "utf8");
const PAGE = readFileSync(new URL("../app/listing/[id]/ListingClient.tsx", import.meta.url), "utf8");

ck(/confirmsInstantly\(listing\)/.test(SHEET) && /confirmsInstantly\(listing\)/.test(PAGE),
  "both the page and the sheet ask the same function");
ck(/instant \? "Book now" : "Ask to book"/.test(SHEET),
  "the sheet says Book now rather than Ask to book");
ck(/Confirmed on the spot/.test(PAGE),
  "and the page stops promising a 12 hour wait it does not mean");
ck(!/^\s*Ask first, pay later\. They have 12 hours to accept\.$/m.test(PAGE.replace(/\{[^}]*\}/g, "")),
  "the unconditional version of that line is gone");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
