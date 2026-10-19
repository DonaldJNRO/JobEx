// Three guests in one room were quoted — and could be charged — three nights.
//
// Run: tsx src/lib/offer-total.test.mjs

import { readFileSync } from "node:fs";
import { offerTotal } from "./offer-total.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\na nightly rate is not multiplied by heads");
const night = offerTotal("Per night", 20000, 3);
ok(night.amount === 20000, "three guests in one room is one night's rate");
ok(night.isRate === true, "and it is marked a rate, not a total");

console.log("\nper head does scale");
ok(offerTotal("Per person", 5000, 3).amount === 15000, "three people at 5,000");
ok(offerTotal("Per person", 5000, 3).isRate === false, "and that IS the total");
ok(offerTotal("Ticket", 2500, 4).amount === 10000, "four tickets");

console.log("\nper head wins when an offer says both");
const both = offerTotal("Per person per night", 5000, 2);
ok(both.amount === 10000, "scaled by heads");
ok(both.isRate === false, "not flagged untotallable");

console.log("\na flat booking is itself");
ok(offerTotal("Booking", 30000, 5).amount === 30000, "five guests, one booking");
ok(offerTotal("Deep tissue massage", 12000, 2).amount === 12000, "a named service is flat");

console.log("\nother time units are rates too");
for (const n of ["Per hour", "Per day", "Per week", "Per month"]) {
  const r = offerTotal(n, 100, 3);
  ok(r.amount === 100 && r.isRate, `${n} is a rate, unscaled`);
}

console.log("\nno price is no number, never zero");
// A zero would reach `totalPrice` and read as free.
ok(offerTotal("Per night", undefined, 2).amount === undefined, "undefined");
ok(offerTotal("Per night", null, 2).amount === undefined, "null");
ok(offerTotal("Per night", NaN, 2).amount === undefined, "NaN");

console.log("\nthe guest count is survivable");
ok(offerTotal("Per person", 100, 0).amount === 100, "zero guests is one");
ok(offerTotal("Per person", 100, -3).amount === 100, "negative is one");
ok(offerTotal("Per person", 100, undefined).amount === 100, "missing is one");
ok(offerTotal("Per person", 100, 2.6).amount === 200, "a fraction floors");
ok(offerTotal(null, 100, 2).amount === 100, "no offer name is flat, not per head");

console.log("\nthe component uses it, rather than multiplying again");
const src = readFileSync(new URL("../components/BookingRequest.tsx", import.meta.url), "utf8");
const live = src
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
ok(/offerTotal\(/.test(live), "BookingRequest calls offerTotal");
ok(!/unit \* Math\.max\(1, guests\)/.test(live), "and no longer multiplies the unit by the head count");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
