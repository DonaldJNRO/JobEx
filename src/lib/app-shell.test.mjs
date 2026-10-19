// The bar is on the app and off the website.
//
// Run: tsx src/lib/app-shell.test.mjs

import { showsShell, isChatRoute, isMarketingRoute } from "./app-shell.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe app surfaces get the shell");
for (const p of ["/", "/explore", "/listing/arrows-den", "/cart", "/bookings", "/account"]) {
  ok(showsShell(p), p);
}

console.log("\nthe website does not");
for (const p of ["/about", "/contact", "/terms", "/privacy", "/blog", "/auth/login", "/auth/signup"]) {
  ok(!showsShell(p), p);
}

console.log("\nthe trips screen has no room for a bar");
// BOTH PANES LIVE AT /trips NOW, with ?t= choosing the thread, the way
// Studio's messages page and WhatsApp Web lay it out. It was two routes, and
// opening a chat replaced the list — which on a desktop left a narrow column
// of bubbles beside an empty half screen.
//
// It is h-[calc(100vh-4rem)] with a composer pinned to the bottom, so a bar
// under it would be two bars fighting for the same sixty pixels.
ok(isChatRoute("/trips"), "/trips is the whole screen");
ok(!showsShell("/trips"), "and gets no shell");
ok(!isChatRoute("/trips/anything"), "a child route is not it, and there are none");
ok(!isChatRoute("/"), "nor is the feed");

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
ok(showsShell("/trips/abc/settings"), "a hypothetical trip sub-page would keep the shell");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
