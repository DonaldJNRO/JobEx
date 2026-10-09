// The page and the sheet must both ASK THE SERVER, and neither may decide.
//
// booking-mode.ts used to decide here. It was the 118th place re-deriving
// the same rule, and its own comment said it mirrored canSellInstantly,
// which is an honest way of saying it would drift. Deleted; both surfaces
// now call bookingDecision.
//
// Run: npx tsx src/lib/instant-book.test.mjs

import { readFileSync, existsSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

const SHEET = readFileSync(new URL("../components/BookingRequest.tsx", import.meta.url), "utf8");
const PAGE = readFileSync(new URL("../app/listing/[id]/ListingClient.tsx", import.meta.url), "utf8");
const CLIENT = readFileSync(new URL("./booking-decision.ts", import.meta.url), "utf8");

ck(!existsSync(new URL("./booking-mode.ts", import.meta.url)),
  "the local copy of the rule is gone");
ck(/fetchBookingDecision/.test(SHEET) && /fetchBookingDecision/.test(PAGE),
  "both surfaces ask the server");
ck(!/acceptsInAppPayment/.test(SHEET) && !/acceptsInAppPayment/.test(PAGE),
  "and neither decides payability for itself");
ck(!/food_beverage/.test(SHEET) && !/food_beverage/.test(PAGE),
  "nor re-derives the cafe rule");

// THE FALLBACK IS "ASK". Failing to reach the server must never promise
// "confirmed on the spot" or a price nobody has agreed to.
ck(/mode: "request"/.test(CLIENT), "the fallback mode is request");
ck(/payNow: 0/.test(CLIENT), "and it charges nothing");
ck(/catch\s*\{\s*\n?\s*return ASK;/.test(CLIENT) || /catch \{[\s\S]{0,40}ASK/.test(CLIENT),
  "a failed call falls back rather than throwing into the sheet");

// Re-asked per offer, because a deposit is per SERVICE.
ck(/\[open, listing\?\.id, offer\]/.test(SHEET),
  "the sheet re-asks when the chosen service changes");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
