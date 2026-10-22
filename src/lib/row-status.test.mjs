// A ROW IS A STATE, NOT CONTENT.
//
// The app's inbox follows Snapchat's rule: the TITLE says who, the STATUS
// says what. This website printed the message instead, WhatsApp style, in a
// list the app had rebuilt on the other convention, so the same inbox said
// two different things depending which surface you opened.
//
// Ported from TripItem.js rather than re-derived, including the two
// corrections it carries, each of which was a row lying in production.
//
// Run: tsx src/lib/row-status.test.mjs

import { rowStatus, countOtherReaders } from "./conversations.ts";
import { readSibling, skipNote } from "./sibling.mjs";

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails += 1; } else console.log("  ok   " + l); };
const ME = "me";
const row = (o) => ({ id: "x", kind: "trip", title: "T", memberIds: [ME, "you"], lastMessageAtMs: 1, unread: 0, ...o });

console.log("\nyour own message, and whether it was read");
ok(rowStatus(row({ lastMessage: "hi", lastMessageSenderId: ME }), ME) === "Sent",
  "out, and nobody has opened it");
ok(rowStatus(row({ lastMessage: "hi", lastMessageSenderId: ME, lastMessageSeenBy: { you: true } }), ME)
  === "Opened by 1", "a group says how many, because Opened in five is a different fact");
ok(rowStatus(row({ kind: "chat", lastMessage: "hi", lastMessageSenderId: ME, lastMessageSeenBy: { you: true } }), ME)
  === "Opened", "a one-to-one needs no number");
ok(rowStatus(row({ kind: "chat", lastMessage: "x", lastMessageType: "moment", lastMessageSenderId: ME, lastMessageSeenBy: { you: true } }), ME)
  === "Viewed", "you OPEN a message and VIEW a photo");

console.log("\ntheirs");
ok(rowStatus(row({ lastMessage: "hi", lastMessageSenderId: "you", unread: 1 }), ME) === "New message",
  "unread");
ok(rowStatus(row({ lastMessage: "hi", lastMessageSenderId: "you", unread: 4 }), ME) === "4 new messages",
  "and how many when there are several");
ok(rowStatus(row({ lastMessage: "hi", lastMessageSenderId: "you" }), ME) === "Received",
  "read");
// NOT `|| true`. A guard that cannot fail is worse than no guard, which is
// the lesson three of today's suites taught in a row.
ok(rowStatus(row({ lastMessageType: "moment", lastMessage: "x", lastMessageSenderId: "you",
                   lastMessageSenderName: "Kamsi Obi", unread: 1 }), ME) === "Kamsi's Moment",
  "a group moment names who sent it, first name only");
ok(rowStatus(row({ lastMessageType: "moment", lastMessage: "x", lastMessageSenderId: "you", unread: 3 }), ME)
  === "3 new Moments", "and several say how many instead of naming one");
ok(rowStatus(row({ kind: "chat", lastMessageType: "moment", lastMessage: "x", lastMessageSenderId: "you", unread: 1 }), ME)
  === "New Moment", "a one-to-one moment does not");

console.log("\nand an empty thread");
ok(rowStatus(row({ lastMessage: null, lastMessageAtMs: 0 }), ME) === "Tap to chat",
  "says so, rather than claiming it was wiped");

console.log("\nthe two corrections the app paid for");
ok(countOtherReaders({ me: true }, undefined, null) === 0,
  "NO UID NO CLAIM: an undefined me excluded nobody and read your own tick as a reader");
ok(countOtherReaders({ you: true }, ME, { you: 1 }) === 0,
  "UNREAD BEATS seenBy: a stale tick cannot outrank an unread count");
ok(countOtherReaders({ you: true }, ME, { you: 0 }) === 1,
  "but a genuine reader still counts");

console.log("\nand it is the app's rule, not a second opinion");
const app = readSibling("sabie-v53-main", "screens", "renter", "message", "TripItem.js");
if (!app) {
  console.log(skipNote("sabie-v53-main"));
} else {
  for (const w of ["'Received'", "'Sent'", "'New message'", "'Tap to chat'", "'Viewed'", "'Opened'"]) {
    ok(app.includes(w), `the app says ${w} too`);
  }
  ok(/if \(uid === myUid \|\| !seenBy\[uid\]\) continue;/.test(app),
    "and counts readers the same way");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
