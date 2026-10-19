// A card claiming a million likes discredits the 3 on the card beside it.
//
// Run: tsx src/lib/listing-likes.test.mjs

import { likeCountOf, formatCount } from "./listing-likes.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe three spellings that exist in the wild");
ok(likeCountOf({ likesCount: 3 }) === 3, "likesCount");
ok(likeCountOf({ likes: 5 }) === 5, "likes");
ok(likeCountOf({ fireCount: 2 }) === 2, "fireCount");
ok(likeCountOf({ likesCount: 3, likes: 99 }) === 3, "likesCount wins, as the app reads them");

console.log("\nzero shows NOTHING, not a zero");
// A row of cards each displaying 0 is worse than a row with no numbers.
ok(likeCountOf({ likesCount: 0 }) === null, "zero");
ok(likeCountOf({ likes: -4 }) === null, "negative");
ok(likeCountOf({}) === null, "no field at all");
ok(likeCountOf(null) === null, "no listing");
ok(likeCountOf(undefined) === null, "undefined");

console.log("\nthe real numbers in production today");
// 145 likes across 59 listings, the most on one is 8.
ok(likeCountOf({ likesCount: 8 }) === 8, "the most-liked listing");
ok(likeCountOf({ likesCount: 1 }) === 1, "a single like still counts");

console.log("\nand the one that is data entry, not popularity");
// Sabię Founder Test says 1,000,002 against a real 3.
ok(likeCountOf({ likesCount: 1_000_002 }) === null, "a million likes is not shown");
ok(likeCountOf({ likesCount: 100_001 }) === null, "just past the ceiling");
ok(likeCountOf({ likesCount: 100_000 }) === 100_000, "the ceiling itself is allowed");

console.log("\nnothing a bad document can do throws");
for (const bad of ["3", NaN, Infinity, -Infinity, {}, [], true]) {
  ok(likeCountOf({ likesCount: bad }) === null, `${JSON.stringify(bad)} -> nothing`);
}
ok(likeCountOf({ likesCount: 4.8 }) === 4, "a fraction floors rather than showing 4.8 likes");

console.log("\nshortening, as the app does");
ok(formatCount(8) === "8", "small numbers are themselves");
ok(formatCount(999) === "999", "999");
ok(formatCount(1000) === "1K", "1K, not 1.0K");
ok(formatCount(1200) === "1.2K", "1.2K");
ok(formatCount(12_300) === "12.3K", "12.3K");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
