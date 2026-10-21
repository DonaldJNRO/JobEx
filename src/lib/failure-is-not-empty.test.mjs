// AN OUTAGE LOOKED LIKE AN EMPTY MARKETPLACE.
//
// Four pages caught a failed read into an empty array, so a Firestore
// failure or a dropped connection rendered a cheerful empty state:
//
//   the home feed told EVERY visitor "Nothing here yet, we are adding
//     places every week"
//   the inbox said "No conversations yet" to somebody with 74
//   the bookings page told a traveller with ten bookings they had none
//
// An empty state is a fact about the DATA. An error is a fact about US, and
// conflating them is how an outage reads as a product with nothing in it.
//
// Run: tsx src/lib/failure-is-not-empty.test.mjs

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

console.log("\nthere is one way to say a read failed");
ok(existsSync("src/components/ui/LoadError.tsx"), "the error state exists");
const LE = code("src/components/ui/LoadError.tsx");
ok(/role="alert"/.test(LE), "announced, not just drawn");
ok(/onRetry/.test(LE), "and offers a way to try again");

console.log("\nand the pages that take money or hold your things use it");
// ── SWEPT, NOT LISTED ───────────────────────────────────────────────────
// This had a hardcoded list of the three files I had been SHOWN. It was
// written to stop me spot-fixing one case and missing its sibling, and it
// was itself a spot-check: RoomList and the cart carried exactly this bug
// while this test passed, because neither was on the list.
//
// A guard that only looks where it has already been told to look is a
// record of past bugs, not a defence against the next one.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name);
  return e.isDirectory() ? walk(p) : (/\.tsx$/.test(e.name) ? [p] : []);
});

// The shape of the bug is a catch that CLEARS what is rendered and records
// nothing, so the empty state below speaks for the failure. A catch that
// clears AND raises a flag is the fix, not the bug, so the whole body is
// read rather than its first statement.
const CLEARS = /catch\s*\(([^)]*)\)\s*=>\s*(\{[\s\S]{0,220}?\}|[^;\n]{0,120})/g;
const RECORDS_FAILURE = /set\w*(Failed|Error|Errored)\w*\(\s*true\s*\)/i;

const offenders = [];
for (const f of [...walk("src/app"), ...walk("src/components")]) {
  const src = code(f);
  // A read that cannot fail visibly is one nobody is waiting on: a
  // best-effort extra like a city list or a background prefetch. Those
  // swallow deliberately and have no empty state of their own.
  if (!/(useState|useEffect)/.test(src)) continue;
  for (const m of src.matchAll(CLEARS)) {
    const body = m[2] || "";
    if (!/set\w+\(\s*(\[\]|null)\s*\)/.test(body)) continue;   // clears nothing rendered
    if (RECORDS_FAILURE.test(body)) continue;                      // clears AND says so: the fix
    offenders.push(`${f}  →  ${m[0].slice(0, 54).replace(/\s+/g, " ")}…`);
    break;
  }
}

console.log("\nand no page anywhere turns a failure into an empty list");
ok(offenders.length === 0,
  offenders.length
    ? `a failed read is rendered as "nothing here":\n        ${offenders.join("\n        ")}`
    : "every read that can fail says so");

for (const [f, label] of [
  ["src/app/page.tsx", "the home feed"],
  ["src/app/bookings/page.tsx", "the bookings page"],
  ["src/app/trips/page.tsx", "the inbox"],
  ["src/app/cart/page.tsx", "the cart"],
  ["src/components/RoomList.tsx", "the room list"],
]) {
  const src = code(f);
  ok(/LoadError|failed|couldNotLoad/i.test(src), `${label} can say it failed`);
}


console.log("\nand a refused listener says so rather than emitting nothing");
const CONV = code("src/lib/conversations.ts");
ok(/failed\.chats = true/.test(CONV) && /failed\.trips = true/.test(CONV), "each half records its own refusal");
ok(/onList\(rankConversations\(\[\.\.\.chats, \.\.\.trips\]\), failed\.chats \|\| failed\.trips\)/.test(CONV),
  "and the page is told");
// One side failing must still not blank the other: that rule predates this
// and is the reason the halves empty at all.
ok(/chats = \[\]; ready\.chats = true; failed\.chats = true/.test(CONV),
  "the half still empties, so one refusal does not take the other list down with it");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
