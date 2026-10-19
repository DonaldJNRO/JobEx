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

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
