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

import { readFileSync, existsSync } from "node:fs";

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
for (const [f, label] of [
  ["src/app/page.tsx", "the home feed"],
  ["src/app/bookings/page.tsx", "the bookings page"],
  ["src/app/trips/page.tsx", "the inbox"],
]) {
  const src = code(f);
  ok(/LoadError/.test(src), `${label} can say it failed`);
  // THE SHAPE OF THE BUG: a catch that sets an empty array, which the
  // empty state then renders as a fact about the data.
  ok(
    !/catch\s*\([^)]*\)\s*=>\s*set\w+\(\[\]\)/.test(src) && !/catch\s*\{\s*set\w+\(\[\]\);?\s*\}/.test(src),
    `${label} does not catch a failure into an empty list`,
  );
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
