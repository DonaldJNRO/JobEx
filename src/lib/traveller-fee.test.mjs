// THE WEB SAID £3 AND THE CARD WAS CHARGED £3.30.
//
// createSingleItemPaymentIntent, the function this site calls, adds the
// traveller's service fee server-side. So the fee was arriving on every web
// booking and nothing on the page said so. An undisclosed 10 percent at the
// moment somebody commits their card is worse than no fee at all.
//
// This holds the website's copy of the rule IDENTICAL to the function's, by
// parsing the function's own source rather than by restating its numbers
// here. Same arrangement region-currency already uses across these repos: a
// value copied into a test is a third place to drift.
//
// Run: tsx src/lib/traveller-fee.test.mjs

import { readFileSync, existsSync } from "node:fs";
import { readSibling, skipNote } from "./sibling.mjs";
import {
  TRAVELLER_FEE_PERCENT, FEE_MAX_PERCENT, FEE_FLOOR,
  travellerFeeMajor, travellerFeeMinor, breakdownOf, feeLabel,
} from "./traveller-fee.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const FN_SRC = readSibling("sabie-v53-main", "functions", "travellerFee.js");

console.log("\nthe website's copy matches the function that actually charges");
if (!FN_SRC) {
  // An early return, not a skipped describe: a suite that silently does
  // nothing when a sibling repo is absent is how sabie-admin's CI stayed red
  // for days while reporting green.
  console.log("  --   functions/travellerFee.js not on this machine, parity unchecked");
} else {
  const src = FN_SRC;
  const pct = Number(src.match(/TRAVELLER_FEE_PERCENT\s*=\s*([\d.]+)/)?.[1]);
  const max = Number(src.match(/FEE_MAX_PERCENT\s*=\s*([\d.]+)/)?.[1]);
  ok(pct === TRAVELLER_FEE_PERCENT, `the rate is ${TRAVELLER_FEE_PERCENT} percent on both sides (server says ${pct})`);
  ok(max === FEE_MAX_PERCENT, `the ceiling is ${FEE_MAX_PERCENT} percent on both sides (server says ${max})`);

  const block = src.slice(src.indexOf("FEE_FLOOR = {"), src.indexOf("}", src.indexOf("FEE_FLOOR = {")));
  const serverFloor = {};
  for (const m of block.matchAll(/([A-Z]{3}):\s*([\d.]+)/g)) serverFloor[m[1]] = Number(m[2]);
  ok(Object.keys(serverFloor).length >= 4, `parsed ${Object.keys(serverFloor).length} floors from the function`);
  for (const [code, value] of Object.entries(serverFloor)) {
    ok(FEE_FLOOR[code] === value, `${code} floor is ${value} on both sides`);
  }
  for (const code of Object.keys(FEE_FLOOR)) {
    ok(code in serverFloor, `${code} is not a floor the web invented on its own`);
  }
}

console.log("\nthe arithmetic, at the sizes that actually occur");
// His £3 booking: 5 percent is 15p, the GBP floor is 30p, so the floor wins
// and the total is £3.30. The page said £3.
ok(travellerFeeMajor(3, "GBP") === 0.3, "a £3 booking carries 30p, the floor beating the percentage");
ok(breakdownOf(3, "GBP").total === 3.3, "so the total is £3.30, which is what the card is charged");
ok(breakdownOf(3, "GBP").atFloor === true, "and the sheet can say the floor is why");
ok(travellerFeeMajor(100, "GBP") === 5, "a £100 booking is a straight 5 percent");
ok(breakdownOf(100, "GBP").atFloor === false, "no floor involved there");
// ₦5,000 is 5 percent = ₦250, but the ₦300 floor beats it, so the floor
// wins here too. Worth stating: the floor is not a rare edge, it is what
// most of this catalogue actually pays.
ok(travellerFeeMinor(500000, "NGN") === 30000, "₦5,000 carries ₦300, the floor again beating the percentage");
ok(travellerFeeMinor(2000000, "NGN") === 100000, "₦20,000 carries ₦1,000, where the percentage finally wins");

console.log("\nthe floor never makes the fee absurd");
// The NGN 300 listing in the catalogue: a NGN 300 floor would DOUBLE it.
const tiny = travellerFeeMinor(30000, "NGN");
ok(tiny === Math.round(30000 * 0.15), `a ₦300 listing is capped at 15 percent, not doubled (got ₦${tiny / 100})`);
ok(tiny < 30000, "the fee is never the price of the thing");

console.log("\nand nothing nonsensical gets through");
ok(travellerFeeMajor(0, "GBP") === 0, "no booking, no fee");
ok(travellerFeeMajor(-5, "GBP") === 0, "a negative subtotal is not a refund of our fee");
ok(travellerFeeMajor(NaN, "GBP") === 0, "NaN is zero, never NaN on a receipt");
ok(travellerFeeMajor(10, "") === 0.5, "an unknown currency gets the percentage");
ok(travellerFeeMajor(1, "XOF") === 0.05, "and NO floor rather than a wrong one");
ok(breakdownOf(0, "GBP").total === 0, "an empty breakdown totals zero");

console.log("\nthe sheet shows all three figures or none");
const b = breakdownOf(3, "GBP");
ok(Math.round((b.subtotal + b.fee) * 100) / 100 === b.total, "subtotal plus fee equals the total, always");
ok(feeLabel() === "Sabię service fee", "named with the ogonek, as the function names it");

// THE SERVER REMAINS AUTHORITATIVE. This module is a disclosure, not a
// second source of truth, and the comment saying so must survive.
const SRC = readFileSync("src/lib/traveller-fee.ts", "utf8");
ok(/SERVER STAYS AUTHORITATIVE/.test(SRC), "the file says out loud that it does not decide the charge");

console.log("\nthe sheet actually shows it");
// The fee existed and was charged for as long as this site has taken money.
// The regression to prevent is not the arithmetic, it is the DISCLOSURE
// quietly disappearing again.
const SHEET = readFileSync("src/components/BookingRequest.tsx", "utf8");
ok(/feeLabel\(\)/.test(SHEET), "the sheet renders the fee's own label");
ok(/breakdownOf\(/.test(SHEET), "through the shared breakdown, not its own arithmetic");
ok(/fee\.total/.test(SHEET), "and the headline total is subtotal plus fee");
ok(
  /breakdownOf\(typeof total === "number" \? total : 0, native\)/.test(SHEET),
  "computed in the LISTING's currency, where the server computes it, or a GBP floor lands on a naira booking",
);

console.log("\nand the promise we never built is gone");
// A traveller has never been able to message a business: the model is
// browse, basket, pay, and an operator hears at settlement, never at intent.
const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
ok(!/replies within 12 hours/.test(PAGE), "no listing claims a business will reply to you");
ok(!/\bmessage the business\b/i.test(PAGE), "and none offers a channel that does not exist");
ok(/Visited by Sabię/.test(PAGE), "the badge that IS backed by a record stays");

console.log("\nthe second currency under the total is gone");
ok(!/money\.original/.test(SHEET), "one price, in the visitor's own money");

console.log("\na row says what tapping it does");
// "It says see rooms but when I tap on it it just says pay." The row WAS
// the room, so there was nothing further to see.
const SECTION = readFileSync("src/components/ProfileServices.tsx", "utf8");
ok(/bookBookCtaRowWord/.test(SECTION), "a row has its own word, separate from the page's button");
ok(!/const cta = CTA_LABEL\[bookCta\];/.test(SECTION), "and no longer borrows the page's");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
