// A listing created in Studio could not be found by typing its own city.
//
// Run: tsx src/lib/listing-search.test.mjs

import { matchesSearch } from "./listing-search.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const stringLoc = { businessName: "Arrows Den", location: "Victoria Island, Lagos", description: "Archery range" };
const objectLoc = { businessName: "Naileditbyd", location: { city: "Lagos", area: "Gbagada" }, description: "Nails and beauty" };

console.log("\nan empty search matches everything");
ok(matchesSearch(stringLoc, "") === true, "empty string");
ok(matchesSearch(stringLoc, "   ") === true, "spaces only");

console.log("\nby name");
ok(matchesSearch(stringLoc, "arrows"), "lowercase");
ok(matchesSearch(stringLoc, "ARROWS"), "uppercase");
ok(matchesSearch(stringLoc, "rows"), "the middle of a word, since people half remember names");

console.log("\nby place, in BOTH stored shapes");
// The bug this replaces: location was read only when it was a string, so
// anything Studio created was unfindable by its own city.
ok(matchesSearch(stringLoc, "lagos"), "a string location");
ok(matchesSearch(objectLoc, "lagos"), "an object location");
ok(matchesSearch(objectLoc, "gbagada"), "and its area");

console.log("\nby description");
ok(matchesSearch(stringLoc, "archery"), "a word only in the description");

console.log("\nno match is no match");
ok(!matchesSearch(stringLoc, "sushi"), "an unrelated word");
ok(!matchesSearch(objectLoc, "abuja"), "a different city");

console.log("\nnothing a listing can be shaped like throws");
ok(matchesSearch({}, "x") === false, "an empty listing");
ok(matchesSearch({ businessName: null, location: null }, "x") === false, "null fields");
ok(matchesSearch({ location: { city: null } }, "x") === false, "a null inside the object");
ok(matchesSearch({ businessName: "A" }, "a") === true, "a one-letter name still matches");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
