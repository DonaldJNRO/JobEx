// A ROOM AT 84 A NIGHT PRODUCED A REQUEST WITH NO CHECKOUT.
//
// The booking sheet asks one date and a time, because it was built for a
// haircut and a skate night. offer-total.ts already admits it cannot total a
// nightly rate "because the form has a date and no checkout, so there is no
// stay length". This is that stay length, and what it costs.
//
// Run: tsx src/lib/stay.test.mjs

import { readFileSync } from "node:fs";
import { isDay, nightsBetween, dayAfter, todayISO, quoteStay, stayLine } from "./stay.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe checkout day is not a night");
// Arriving on the 8th and leaving on the 10th is TWO nights. Counting three
// overcharges every stay on the platform by one night.
ok(nightsBetween("2027-01-08", "2027-01-10") === 2, "8 to 10 January is two nights, not three");
ok(nightsBetween("2027-01-08", "2027-01-09") === 1, "one night is one night");
ok(nightsBetween("2027-01-08", "2027-01-08") === 0, "arriving and leaving the same day is no nights");
ok(nightsBetween("2027-01-10", "2027-01-08") === 0, "and backwards is not negative nights");
ok(nightsBetween("2027-02-27", "2027-03-02") === 3, "across a month end");
ok(nightsBetween("2028-02-27", "2028-03-01") === 3, "and across a leap day");
ok(nightsBetween("2026-12-30", "2027-01-02") === 3, "and across a new year");

console.log("\ndates are calendar facts, not instants");
// Building Date objects from these strings is how an arrival lands a day
// early for somebody west of the meridian. Lagos arrival dates are already
// an open ticket in this ecosystem for exactly that reason.
ok(isDay("2027-01-08"), "a real day");
ok(!isDay("2027-02-31"), "31 February is not, even though its numbers are in range");
ok(!isDay("2027-13-01") && !isDay("2027-01-32"), "nor an impossible month or day");
ok(!isDay("08/01/2027") && !isDay("") && !isDay(null) && !isDay(20270108), "nor anything that is not that shape");
ok(dayAfter("2027-01-31") === "2027-02-01", "the day after the 31st is the 1st");
ok(dayAfter("2028-02-28") === "2028-02-29", "and a leap year has its extra day");
ok(dayAfter("bad") === "", "and nonsense yields nothing");
ok(/^\d{4}-\d{2}-\d{2}$/.test(todayISO(new Date(2027, 0, 8))), "today is written the way a date input writes one");
ok(todayISO(new Date(2027, 0, 8)) === "2027-01-08", "in the viewer's own zone, not UTC");

console.log("\nnights times rate, and nothing else");
const q = quoteStay("2027-01-08", "2027-01-10", { rate: 84 });
ok(q.nights === 2 && q.subtotal === 168, "two nights at 84 is 168");
ok(q.ok === true && q.problem === null, "and it is bookable");
ok(quoteStay("2027-01-08", "2027-01-09", { rate: 0.1 }).subtotal === 0.1, "a small rate does not vanish to rounding");
ok(quoteStay("2027-01-08", "2027-01-11", { rate: 33.333 }).subtotal === 100, "and three nights of a third rounds to the penny");

console.log("\nthe minimum stay is enforced, in words a guest can act on");
const short = quoteStay("2027-01-08", "2027-01-09", { rate: 84, minStay: 2 });
ok(short.ok === false, "one night against a two night minimum is refused");
ok(/2 nights/.test(short.problem), `and says why: "${short.problem}"`);
ok(short.subtotal === null, "with no total, since there is nothing to charge for");
ok(quoteStay("2027-01-08", "2027-01-10", { rate: 84, minStay: 2 }).ok === true, "two nights passes it");
const long = quoteStay("2027-01-08", "2027-02-08", { rate: 84, maxStay: 14 });
ok(long.ok === false && /14 nights/.test(long.problem), "and a maximum is enforced the same way");

console.log("\nnothing nonsensical is quoted");
ok(quoteStay("2027-01-10", "2027-01-08", { rate: 84 }).problem !== null, "checkout before check in is explained, not silently zero");
ok(quoteStay("", "", { rate: 84 }).problem === null, "but an unfilled form is not an error yet");
ok(quoteStay("2027-01-08", "2027-01-10", { rate: null }).ok === true, "a room with no rate can still be requested");
ok(quoteStay("2027-01-08", "2027-01-10", { rate: null }).subtotal === null, "it just cannot be totalled");
ok(quoteStay("2027-01-08", "2027-01-10", { rate: NaN }).subtotal === null, "and NaN never reaches a price");
ok(quoteStay("2027-01-08", "2027-01-10", { rate: -5 }).subtotal === null, "nor a negative rate");

console.log("\nthe deposit is NOT in the total");
// No Cloud Function reads cautionFee, so Sabię never charges it: it is
// money the property takes and gives back. Adding it to a total would take
// it off a card nobody intended to.
const SRC = readFileSync("src/lib/stay.ts", "utf8");
ok(!/caution/i.test(SRC.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")),
  "no deposit term appears in the arithmetic at all");
ok(/deposit is deliberately NOT in here/i.test(SRC), "and the file says why, where the next person will look");

console.log("\nand the stay reads as a sentence");
ok(stayLine("2027-01-08", "2027-01-10").startsWith("2 nights · "), `"${stayLine("2027-01-08", "2027-01-10")}"`);
ok(stayLine("2027-01-08", "2027-01-09").startsWith("1 night · "), "singular where it should be");
ok(stayLine("", "") === "", "and nothing before any dates are picked");

console.log("\nthe room screen asks for two dates");
const GAL = readFileSync("src/components/RoomGallery.tsx", "utf8");
ok(/Check in/.test(GAL) && /Check out/.test(GAL), "both, where there was one date and a time");
ok(/quoteStay\(/.test(GAL), "priced through the shared arithmetic, not its own");
ok(/min=\{checkIn \? dayAfter\(checkIn\) : todayISO\(\)\}/.test(GAL),
  "checkout cannot be on or before arrival, in the picker itself");
ok(/min=\{todayISO\(\)\}/.test(GAL), "and arrival cannot be in the past");
ok(/setCheckOut\(dayAfter\(e\.target\.value\)\)/.test(GAL),
  "moving arrival past departure repairs the pair rather than leaving an impossible one on screen");
ok(/quote\.problem/.test(GAL), "a refused stay says why");
ok(/disabled=\{!quote\.ok \|\| quote\.nights === 0\}/.test(GAL), "and cannot be booked while it is refused");

console.log("\nthe deposit is shown and never added");
// No Cloud Function reads cautionFee. Adding it to a total would take money
// off a card that nothing on the platform would ever give back.
ok(/paid at the property/.test(GAL), "it is labelled as the property's, not ours");
ok(/room\.cautionFee/.test(GAL), "and shown");
const breakdown = GAL.slice(GAL.indexOf("WHAT IT COMES TO"), GAL.indexOf("Pick your dates"));
ok(!/cautionFee\s*\+|\+\s*room\.cautionFee/.test(breakdown), "it is never summed into anything");

console.log("\nthe nights reach the operator and the card");
const SHEET = readFileSync("src/components/BookingRequest.tsx", "utf8");
const BOOK = readFileSync("src/lib/book.ts", "utf8");
ok(/nightsBetween\(date, checkOut\)/.test(SHEET), "the sheet counts the nights");
ok(/isRate && stayNights > 0/.test(SHEET), "a nightly rate becomes a bill once there are nights");
ok(/rawTotal/.test(SHEET), "and stays a rate when there are none, exactly as before");
ok(/ask\.checkOut \? \{ checkOut: ask\.checkOut \}/.test(BOOK),
  "the departure is written, so an operator is not told a room on the 8th with no idea for how long");
ok(/ask\.nights \? \{ nights: ask\.nights \}/.test(BOOK), "with the night count beside it");
ok(/\.\.\.\(ask\.checkOut \?/.test(BOOK), "spread conditionally, so a haircut's request is unchanged");
ok((SHEET.match(/\.\.\.stayBits/g) || []).length >= 2, "and every path that writes a booking carries it");

console.log("\nand the dates are not asked for twice");
ok(/initialStay/.test(SHEET), "the sheet accepts nights already chosen");
ok(/setDate\(initialStay\.checkIn\)/.test(SHEET), "and starts from them");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
