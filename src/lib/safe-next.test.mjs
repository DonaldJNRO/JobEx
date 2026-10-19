// An open redirect wearing our own domain.
//
// Run: tsx src/lib/safe-next.test.mjs

import { safeNext } from "./safe-next.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\na path on this site is kept");
ok(safeNext("/trips") === "/trips", "/trips");
ok(safeNext("/cart") === "/cart", "/cart");
ok(safeNext("/listing/arrows-den") === "/listing/arrows-den", "a deep path");
ok(safeNext("/trips?x=1#y") === "/trips?x=1#y", "query and hash survive");

console.log("\nanywhere else is refused");
// Each of these, taken at its word, sends somebody off this site from a URL
// that still reads sabieapp.com.
for (const bad of [
  "https://evil.com",
  "http://evil.com",
  "//evil.com",
  "/\\evil.com",
  "javascript:alert(1)",
  "evil.com",
  "data:text/html,<script>",
]) {
  ok(safeNext(bad) === "/", `${JSON.stringify(bad)} -> /`);
}

console.log("\nnothing is still home");
ok(safeNext(null) === "/", "null");
ok(safeNext(undefined) === "/", "undefined");
ok(safeNext("") === "/", "empty");
ok(safeNext(123) === "/", "not a string");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
