// The bar is on the app and off the website.
//
// Run: tsx src/lib/app-shell.test.mjs

import { showsShell, isChatRoute, isMarketingRoute } from "./app-shell.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe app surfaces get the shell");
for (const p of ["/", "/explore", "/listing/arrows-den", "/trips", "/cart", "/bookings", "/account"]) {
  ok(showsShell(p), p);
}

console.log("\nthe website does not");
for (const p of ["/about", "/contact", "/terms", "/privacy", "/blog", "/auth/login", "/auth/signup"]) {
  ok(!showsShell(p), p);
}

console.log("\none trip's chat has no room for a bar");
// It is h-[calc(100vh-4rem)] with its own composer pinned to the bottom.
ok(isChatRoute("/trips/abc123"), "/trips/abc123 is the chat");
ok(!showsShell("/trips/abc123"), "and gets no shell");
ok(!isChatRoute("/trips"), "the LIST is not the chat");
ok(showsShell("/trips"), "so the list keeps its shell");

console.log("\na prefix is a path segment, not a string match");
// "/aboutface" is not "/about". Matching on startsWith alone would hide the
// bar on a route nobody meant to exclude.
ok(showsShell("/aboutface"), "/aboutface is not /about");
ok(showsShell("/blogging"), "/blogging is not /blog");
ok(!showsShell("/about/team"), "but /about/team is under /about");

console.log("\nnothing throws on the shapes a router can hand you");
ok(showsShell("") === true, "empty string");
ok(isChatRoute("") === false, "empty string is not a chat");
ok(typeof showsShell("/trips/a/b") === "boolean", "a deeper trips path still answers");
ok(showsShell("/trips/abc/settings"), "a trip SUB-page keeps the shell, only the chat loses it");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
