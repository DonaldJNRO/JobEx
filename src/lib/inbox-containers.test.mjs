// A BASKET IS NOT A CONVERSATION.
//
// The chat list on sabieapp.com showed "The Rink Arena" twice from the same
// second, "Sunset Haven" twice, each one person with no messages, named
// after the first thing somebody put in a basket. They are containers: a
// trip spun up to hold a cart item, never meant to be talked in.
//
// The app has hidden them for a while and says so where it writes the flag
// (BundleContext: "Nobody asked for this trip") and where it reads it
// (MessageListScreen.js:471). The website listed every trip it could see.
//
// Run: tsx src/lib/inbox-containers.test.mjs

import { readFileSync } from "node:fs";
import { isRealConversation } from "./conversations.ts";
import { readSibling, skipNote } from "./sibling.mjs";

const trips = readFileSync(new URL("./trips.ts", import.meta.url), "utf8");
const cart = readFileSync(new URL("./cart.ts", import.meta.url), "utf8");

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails += 1; } else console.log("  ok   " + l); };

console.log("\nwhat the inbox keeps out");
ok(!isRealConversation({ createdVia: "cart", memberIds: ["a", "b"] }),
  "a cart container, even with two people in it");
ok(!isRealConversation({ travelType: "solo", memberIds: ["a", "b"] }),
  "a solo trip, which is a plan and not a chat");
ok(!isRealConversation({ memberIds: ["a"] }),
  "and a flagless trip of one, which is what every old container looks like");

console.log("\nand what it lets through");
ok(isRealConversation({ createdVia: "web", memberIds: ["a"] }),
  "a trip somebody started on the web, even before anyone joins");
ok(isRealConversation({ createdVia: "wizard", memberIds: ["a", "b"] }),
  "one made in the app's wizard");
ok(isRealConversation({ memberIds: ["a", "b"] }),
  "and a flagless trip with two people, because that is a real group");
ok(isRealConversation({ createdVia: "cart", memberIds: ["a"] }) === false,
  "intent beats member count in both directions");

console.log("\nthe website stops writing containers that look deliberate");
ok(/via\?: "web" \| "cart"/.test(trips), "createTrip can be told why a trip exists");
ok(/createdVia: details\.via \?\? "web"/.test(trips), "and writes it");
ok(/\{ via: "cart" \}/.test(cart), "addToTrip says its trip is a container");

console.log("\nand the rule is the app's, not a second opinion");
const app = readSibling("sabie-v53-main", "screens", "renter", "message", "MessageListScreen.js");
if (!app) {
  console.log(skipNote("sabie-v53-main"));
} else {
  ok(/createdVia === 'cart'/.test(app), "the app hides cart trips");
  ok(/travelType === 'solo'/.test(app), "and solo ones");
  ok(/createdVia === undefined/.test(app) && /memberCount <= 1/.test(app),
    "and falls back to member count only for trips written before the flag");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
