// A WATER PARK THAT RUNS 10AM TO 7PM ACCEPTED A BOOKING FOR 03:00.
//
// 116 services across 17 listings carry timeSlots and the booking sheet
// asked for a time with a free text clock. 27 of them also carry
// availableDays, which nothing had ever read, so a Saturday-only experience
// accepted a Tuesday.
//
// Run: tsx src/lib/slots.test.mjs

import { readFileSync } from "node:fs";
import { weekdayOf, runsOn, minutesOf, slotChoices, hasSlots, nextRunningDay } from "./slots.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe operator's own spellings");
// Slots arrive as "10:00 AM" and days as "monday". Reformatting them is how
// a slot stops matching what the operator sees in Studio.
ok(weekdayOf("2026-10-20") === "tuesday", "20 October 2026 is a Tuesday");
ok(weekdayOf("2026-10-25") === "sunday", "and the 25th is a Sunday");
ok(weekdayOf("not a day") === null && weekdayOf("") === null, "nonsense is not a weekday");

console.log("\na service runs on the days it says, and every day when it says nothing");
// 89 of the 116 carry no availableDays at all.
ok(runsOn("2026-10-20", { slots: ["10:00 AM"] }) === true, "no days listed means every day");
ok(runsOn("2026-10-20", { slots: [], availableDays: [] }) === true, "and an empty list means the same, not never");
ok(runsOn("2026-10-20", { slots: [], availableDays: ["tuesday"] }) === true, "a Tuesday service on a Tuesday");
ok(runsOn("2026-10-21", { slots: [], availableDays: ["tuesday"] }) === false, "and not on the Wednesday");
ok(runsOn("2026-10-20", { slots: [], availableDays: ["TUESDAY", " monday "] }) === true, "whatever case and spacing Studio wrote");

console.log("\ntimes parse in both shapes operators actually type");
ok(minutesOf("10:00 AM") === 600, "10:00 AM");
ok(minutesOf("12:00 PM") === 720, "noon is 12 PM, not midnight");
ok(minutesOf("12:30 AM") === 30, "and half past midnight is 12:30 AM");
ok(minutesOf("7:00 PM") === 1140, "7 in the evening");
ok(minutesOf("14:30") === 870, "and a 24 hour clock, which some type instead");
ok(minutesOf("rubbish") === null && minutesOf("25:00") === null, "nonsense is not a time");

console.log("\na past slot is shown and disabled, not hidden");
// A list that silently shortens as the day goes on reads as a service
// losing its times. A greyed row reads as a time that has gone.
const rules = { slots: ["10:00 AM", "2:00 PM", "6:00 PM"] };
const noon = new Date(2026, 9, 20, 12, 0);
const today = slotChoices("2026-10-20", rules, noon);
ok(today.length === 3, "all three are still listed at midday");
ok(today[0].available === false && /gone/i.test(today[0].reason), "the 10am has gone");
ok(today[1].available === true && today[2].available === true, "the afternoon and evening are open");

const tomorrow = slotChoices("2026-10-21", rules, noon);
ok(tomorrow.every((s) => s.available), "and tomorrow every slot is open");

console.log("\nlead time is notice, not a closing time");
// 7 services carry one.
const lead = slotChoices("2026-10-20", { ...rules, leadTimeHours: 3 }, noon);
ok(lead[1].available === false && /3h notice/.test(lead[1].reason), "a 2pm slot needs more than two hours' notice at midday");
ok(lead[2].available === true, "the 6pm is far enough ahead");

console.log("\nand a day the service does not run says so on every slot");
const shut = slotChoices("2026-10-21", { ...rules, availableDays: ["tuesday"] }, noon);
ok(shut.length === 3 && shut.every((s) => !s.available), "every slot is refused");
ok(shut.every((s) => s.reason === "Not on this day"), "with the same reason, since it is the day and not the time");

console.log("\nnothing nonsensical reaches the page");
ok(slotChoices("2026-10-20", { slots: [] }, noon).length === 0, "no slots, no picker");
ok(hasSlots({ slots: [] }) === false && hasSlots({ slots: ["  "] }) === false, "blank strings are not slots");
ok(hasSlots({ slots: ["10:00 AM"] }) === true, "a real one is");
ok(slotChoices("2026-10-20", { slots: ["bad time"] }, noon)[0].available === true,
  "a time we cannot parse is offered rather than refused, since the operator meant something by it");

console.log("\nand a sensible first day is suggested");
ok(nextRunningDay("2026-10-20", { slots: [], availableDays: ["saturday"] }) === "2026-10-24", "the next Saturday");
ok(nextRunningDay("2026-10-20", { slots: [] }) === "2026-10-20", "or today where every day runs");
ok(nextRunningDay("bad", { slots: [] }) === null, "and nothing from nonsense");

console.log("\nthe sheet uses it");
const SHEET = readFileSync("src/components/BookingRequest.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
ok(/slotChoices\(/.test(SHEET), "the booking sheet asks which slots can be taken");
ok(/hasSlots\(\{ slots \}\)/.test(SHEET), "and only where there are some, so a haircut keeps its clock");
ok(/disabled=\{!c\.available\}/.test(SHEET), "a gone slot is greyed, not removed");
// ONCE, UNDERNEATH, not appended to every option. A native select cannot
// style an option, so putting the reason inside the label was both the only
// way to explain a grey row AND the thing that made the dropdown wider than
// its column, which is what pushed Date and Time into each other.
ok(/takeable\.some\(\(c\) => !c\.available\)/.test(SHEET), "the sheet knows when something has gone");
ok(/Greyed times have gone/.test(SHEET), "and says why, once, in words");
ok(!/` · \$\{c\.reason\}`/.test(SHEET), "rather than inside every option, where it sets the control's width");
// Pick 10am for tomorrow, move the date to today after 10, and the request
// would carry a time the operator cannot honour.
ok(/setTime\(""\)/.test(SHEET), "a chosen time that stops being takeable clears itself");

// ONE SOURCE OF TIMES. shop-window's slotsFor gathers the operator's slots
// and stays the only thing that does; this module decides availability.
const SLOTS = readFileSync("src/lib/slots.ts", "utf8");
ok(!/services\?:/.test(SLOTS), "this module never reads a listing's services itself");
ok(/AVAILABILITY LAYER/.test(SLOTS), "and says so where the next person will look");

console.log("\nand the hours are a picker, not a notice board");
// They were read-only pills: the screen listed sixteen times a guest could
// not choose between, and the NEXT screen then asked them to pick one from
// a dropdown anyway.
const OFFER = readFileSync("src/components/OfferScreen.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
// A PICKER BESIDE THE DAY, not a grid of pills. Tappable was the fix for
// read-only; a nine-pill grid was still the wrong object, taking four rows
// of height to say what a dropdown says in one, and looking nothing like
// the pair of boxes the rest of the site uses for exactly this job.
ok(/grid grid-cols-2 gap-2\.5/.test(OFFER), "the day and the time sit side by side");
ok(/<select/.test(OFFER), "and the time is a picker");
ok(!/role="radiogroup"/.test(OFFER), "rather than a grid of pills");

// THE DAY DECIDES THE HOURS, so it cannot be asked for second.
ok(/type="date"/.test(OFFER), "the offer screen asks which day");
ok(/setDay\(e\.target\.value\); setSlot\(""\)/.test(OFFER),
  "and changing it clears the hour, since that hour may not run on the new day");
ok(/disabled=\{!day\}/.test(OFFER), "no hour can be picked before a day");
ok(/day \? "Pick a time" : "Pick a day first"/.test(OFFER), "and it says so rather than sitting there greyed");
ok(/disabled=\{!c\.available\}/.test(OFFER), "an hour that has gone cannot be chosen");
ok(/Nothing runs on that day/.test(OFFER), "a day the thing does not run says so");
// An empty date input is blank on iOS, the same as everywhere else.
ok(/Add a day/.test(OFFER), "and the day field says what it wants, since Safari draws nothing");

const SHOP2 = readFileSync("src/lib/shop-window.ts", "utf8");
ok(/availableDays: Array\.isArray/.test(SHOP2), "the group carries the days it runs");
ok(/leadTimeHours: typeof/.test(SHOP2), "and the notice it needs");

ok(/onPick\(group\.name, slot \|\| undefined, day \|\| undefined\)/.test(OFFER),
  "the hour travels with the booking, and the day with it");

const SHEET2 = readFileSync("src/components/BookingRequest.tsx", "utf8");
ok(/initialSlot/.test(SHEET2), "and the sheet starts from it rather than asking again");
ok(/setDate\(initialDay\)/.test(SHEET2), "and opens on the day already chosen, rather than asking for that again either");

console.log("\nand a bonfire is not a room");
// On a lodging the services heading said "Pick a room", which was right
// while that list WAS the rooms. The real rooms now come from the
// roomTypes subcollection and are drawn above, so what is left is a
// bonfire, a walk to the lighthouse and a pitched tent.
const SECTION2 = readFileSync("src/components/ProfileServices.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
ok(/roomsShown\s*\n?\s*\? "Also here"/.test(SECTION2), "the heading changes when the rooms were drawn above");
ok(/roomsShown=\{roomNames\.length > 0\}/.test(readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8")),
  "and the page tells it whether they were");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
