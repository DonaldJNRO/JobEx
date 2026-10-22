// Two files create trips. They must create the same thing.
//
// pay.ts makes a trip of one so the website can take a card, and trips.ts
// makes one so people can chat. They drifted: pay.ts wrote
// `selectedUsers: [uid]` as bare strings and hardcoded createdBy.name to
// "Guest". Nobody saw it while the web had no trips list. Now it has one, and
// the shape is visible twice over:
//
//   1. The trip reads as created by "Guest".
//   2. functions/index.js:3855 collects push recipients from
//      selectedUsers[].id. A string has no .id, so a trip written that way
//      passes the rules, renders fine, and notifies nobody.
//
// One trip in production carries the old shape, out of 41.
//
// Source assertions, because both files import firebase and cannot be loaded
// in a bare node test. What matters here is structural anyway: which fields
// get written, and whether they hold objects or strings.
//
// Run: tsx src/lib/trip-shape.test.mjs

import { readFileSync } from "node:fs";

import { readSibling, skipNote } from "./sibling.mjs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const strip = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");

const pay = strip(readFileSync(new URL("./pay.ts", import.meta.url), "utf8"));
const trips = strip(readFileSync(new URL("./trips.ts", import.meta.url), "utf8"));

console.log("\nboth writers build members the same way");
ok(/export function memberOf/.test(trips), "trips.ts exports the one member builder");
ok(/memberOf\(/.test(pay), "pay.ts uses it rather than building its own");
ok(!/name: ["']Guest["']/.test(pay), "nobody is hardcoded as Guest any more");

console.log("\nselectedUsers holds OBJECTS, never bare uids");
// The fan-out reads selectedUsers[].id.
ok(!/selectedUsers: \[uid\]/.test(pay), "pay.ts no longer writes [uid]");
ok(/selectedUsers: \[me\]/.test(pay), "it writes the member object");
ok(/selectedUsers: \[me\]/.test(trips), "and so does trips.ts");

console.log("\nall three member fields are written together");
// memberIds is what the RULES read; selectedUsers is what the NOTIFICATIONS
// read. Writing one without the other gives a trip that is either invisible
// to its members or silent to them.
for (const [label, src] of [["pay.ts", pay], ["trips.ts", trips]]) {
  const create = src.slice(src.indexOf("addDoc(collection(db, \"trips\")"));
  const block = create.slice(0, 900);
  ok(/memberIds:/.test(block), `${label} writes memberIds, which the rules read`);
  ok(/selectedUsers:/.test(block), `${label} writes selectedUsers, which the fan-out reads`);
  ok(/travelBuddies:/.test(block), `${label} writes travelBuddies`);
}

console.log("\nthe creator is in their own trip");
ok(/memberIds: \[(me\.id|uid)\]/.test(pay), "pay.ts puts the payer in memberIds");
ok(/memberIds: \[me\.id\]/.test(trips), "trips.ts puts the creator in memberIds");


// ── A WEB TRIP IS A TRIP BIE CAN READ ───────────────────────────────────
//
// callBieAI reads a trip's destination and dates and then tells itself:
// "you already know this is a Lagos trip, never ask". A trip carrying none
// of those fields makes Bie open by asking the one question it is built
// never to ask, which is what every web-made trip did until today.
//
// The field names are not this file's to invent, so they are PARSED out of
// the function that reads them. If somebody renames one there, this fails
// here rather than Bie quietly losing the context.
console.log("\nand a web trip carries what Bie reads");
const fn = readSibling("sabie-v53-main", "functions", "index.js");
if (!fn) {
  console.log(skipNote("sabie-v53-main"));
} else {
  const reader = fn.match(/const dest = t\.primaryDestination[^;]+;/)?.[0] ?? "";
  ok(reader.length > 0, "found the line in callBieAI that reads a destination");
  ok(/primaryDestination/.test(reader) && /primaryDestination/.test(trips),
    "trips.ts writes primaryDestination, which Bie reads first");
  ok(/destinations/.test(reader) && /destinations: \[dest\]/.test(trips),
    "and destinations[], which Bie falls back to");
  ok(/t\.startDate/.test(fn) && /startDate: start/.test(trips),
    "startDate is written under the name Bie reads");
  ok(/t\.endDate/.test(fn) && /endDate: end/.test(trips),
    "and endDate");
}

// NOON, NOT MIDNIGHT. "2026-12-24" parsed as UTC midnight is the 23rd at
// 11pm anywhere west of London, so a trip reads as starting a day early.
ok(/T12:00:00/.test(trips), "a picked date is anchored at midday, not midnight");

// Absent, not empty. A trip with no destination yet is a real state, and the
// one every trip made before today is in.
ok(/\.\.\.\(dest\s*\n?\s*\?/.test(trips) || /\.\.\.\(dest \?/.test(trips),
  "a trip with no destination writes no destination fields at all");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
