// Three quarters of trips have no photo and four print "[object Object]".
//
// Run: tsx src/lib/trip-visual.test.mjs

import { tripAvatar, previewOf } from "./trip-visual.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\ninitials from the real trip names");
ok(tripAvatar("May Trip", "a").initials === "MT", "two words give two letters");
ok(tripAvatar("Vibes", "a").initials === "V", "one word gives one");
ok(tripAvatar("Matt trip let's go", "a").initials === "MG", "first and LAST word, not the first two");
ok(tripAvatar("Trip to Nigeria", "a").initials === "TN", "Trip to Nigeria");
ok(tripAvatar("", "a").initials === "?", "no name");
ok(tripAvatar(null, "a").initials === "?", "null name");
ok(tripAvatar("   ", "a").initials === "?", "whitespace");

console.log("\nthe colour is stable, or a list reshuffles its own colours");
ok(tripAvatar("x", "trip1").tint === tripAvatar("x", "trip1").tint, "same id, same tint");
ok(tripAvatar("totally different", "trip1").tint === tripAvatar("x", "trip1").tint,
  "the ID decides it, not the name, so renaming a trip does not recolour it");

console.log("\nthe preview never prints a bug");
// The literal four trips carry today.
ok(previewOf("[object Object]") === null, "[object Object] is not a message");
ok(previewOf("undefined") === null, "nor is the string undefined");
ok(previewOf("null") === null, "nor null");
ok(previewOf({}) === null, "nor an actual object");
ok(previewOf(undefined) === null, "nor nothing");
ok(previewOf("") === null, "an empty string is not a message");
ok(previewOf("   ") === null, "nor spaces");

console.log("\na real message is passed through untouched");
ok(previewOf("Paid for Naileditbyd") === "Paid for Naileditbyd", "a real one");
ok(previewOf("  hello  ") === "hello", "trimmed");
ok(previewOf("[object") === "[object", "something that merely starts like the bug is kept");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
