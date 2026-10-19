// The bar is on the app and off the website.
//
// Run: tsx src/lib/app-shell.test.mjs

import { showsShell, showsBottomBar, showsFooter, isChatRoute, isMarketingRoute } from "./app-shell.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe app surfaces get the shell");
for (const p of ["/", "/explore", "/listing/arrows-den", "/trips", "/cart", "/bookings", "/account"]) {
  ok(showsShell(p), p);
}

console.log("\nand the footer is on the website pages only");
for (const p of ["/about", "/terms", "/privacy", "/contact", "/auth/login"]) {
  ok(showsFooter(p), `${p} has a footer`);
}
for (const p of ["/", "/trips", "/cart", "/bookings", "/account", "/listing/x"]) {
  ok(!showsFooter(p), `${p} does not`);
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
// IT KEEPS THE RAIL. LinkedIn keeps its nav on Messaging, and dropping it
// here left no way back to the feed or the basket from inside a
// conversation. Only the PHONE bar steps aside, because the composer is
// pinned to the same sixty pixels.
ok(showsShell("/trips"), "it keeps the rail, so there is a way out");
ok(!showsBottomBar("/trips"), "but not the phone bar, which the composer needs");
// AND NO FOOTER. This is the bug that made the message "shift up": /trips
// dropping the shell also GAVE it a footer, and a full-height chat with a
// footer under it scrolls the page instead of the thread.
ok(!showsFooter("/trips"), "and no footer under a conversation");
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
