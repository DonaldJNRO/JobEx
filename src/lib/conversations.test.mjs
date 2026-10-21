// THE INBOX HELD TWO THIRDS OF NOTHING.
//
// Measured in production: `chats` holds 74 one-to-one conversations carrying
// 2,076 messages, 15 of them the founder's, and this website queried `trips`
// and only `trips`. "All my 1v1 chat are not there, just trip chats" was not
// a styling note, it was a collection the product never read.
//
// Run: tsx src/lib/conversations.test.mjs

import { readFileSync } from "node:fs";
import {
  millisOf, previewOf, otherOf, unreadFor, rankConversations,
  keyOf, parseKey, messagesPath, nameOf, withPeople,
} from "./conversations.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nboth collections are read");
const SRC = readFileSync("src/lib/conversations.ts", "utf8");
ok(/collection\(db, "chats"\)/.test(SRC), 'the chats collection is queried');
ok(/collection\(db, "trips"\)/.test(SRC), "and so is trips");
ok(/array-contains", me/.test(SRC) || /"array-contains", me/.test(SRC), "both by membership");
// The whole bug: one of these was absent.
ok(
  (SRC.match(/onSnapshot\(/g) || []).length === 2,
  "two listeners, since Firestore has no union and one going quiet must not blank the other",
);

console.log("\na thread reads the collection its row names");
ok(messagesPath("chat", "abc")[0] === "chats", "a chat's messages are under chats");
ok(messagesPath("trip", "abc")[0] === "trips", "a trip's are under trips");
ok(messagesPath("chat", "abc")[2] === "messages", "both in a messages subcollection");

console.log("\nids from two collections cannot collide");
// A chat id and a trip id are both Firestore ids and could be equal.
ok(keyOf({ kind: "chat", id: "x" }) !== keyOf({ kind: "trip", id: "x" }), "the key carries the kind");
ok(parseKey("chat:x")?.kind === "chat" && parseKey("chat:x")?.id === "x", "and parses back");
ok(parseKey("trip:a:b")?.id === "a:b", "an id containing a colon survives the round trip");
ok(parseKey("nonsense") === null && parseKey("other:x") === null, "and anything else is refused");

console.log("\nthe inbox is ordered by the last thing said");
// An inbox ordered by when a conversation STARTED is not an inbox.
const ranked = rankConversations([
  { id: "a", kind: "trip", title: "Old trip", memberIds: [], lastMessageAtMs: 1000, unread: 0 },
  { id: "b", kind: "chat", title: "Fresh chat", memberIds: [], lastMessageAtMs: 9000, unread: 0 },
  { id: "c", kind: "trip", title: "Middle", memberIds: [], lastMessageAtMs: 5000, unread: 0 },
]);
ok(ranked.map((c) => c.id).join("") === "bca", "newest first, across both kinds");
ok(
  rankConversations([
    { id: "z", kind: "chat", title: "Zoe", memberIds: [], lastMessageAtMs: 0, unread: 0 },
    { id: "a", kind: "chat", title: "Ada", memberIds: [], lastMessageAtMs: 0, unread: 0 },
  ])[0].title === "Ada",
  "and a silent conversation falls back to the name, not to whatever order Firestore returned",
);

console.log("\na timestamp arrives in three shapes");
ok(millisOf({ toMillis: () => 1234 }) === 1234, "a Firestore Timestamp");
ok(millisOf({ seconds: 2 }) === 2000, "a plain {seconds} from the admin SDK");
ok(millisOf({ _seconds: 3 }) === 3000, "and the underscored form a JSON round trip leaves");
ok(millisOf(null) === 0 && millisOf(undefined) === 0, "absent is zero, never NaN, or the sort collapses");

console.log("\na last message is sometimes an object");
// Eight writers in the app stored {text, type, senderId} instead of a string,
// which renders as "[object Object]" in a list. This is the reading end.
ok(previewOf("hello") === "hello", "a string passes through");
ok(previewOf({ text: "hi", type: "text" }) === "hi", "an object yields its text");
ok(previewOf({ body: "hi" }) === "hi", "whichever key it used");
ok(previewOf({ type: "image" }) === "Photo", "a captionless photo still says something happened");
ok(previewOf({ type: "moment" }) === "Moment", "and so does a moment");
ok(previewOf({}) === null, "an unreadable object is nothing, never the literal [object Object]");
ok(previewOf(null) === null && previewOf("   ") === null, "and so is empty");
ok(
  !String(previewOf({ a: 1 })).includes("[object"),
  "nothing can ever render as [object Object], which is the bug this mirrors",
);

console.log("\nthe other person, and the unread count");
ok(otherOf(["me", "you"], "me") === "you", "a two-person chat names the other side");
ok(otherOf(["me"], "me") === null, "a chat with only me has no other side");
ok(otherOf(["me", "", "you"], "me") === "you", "and an empty id is not a person");
ok(unreadFor({ me: 3 }, "me") === 3, "my unread count");
ok(unreadFor({ me: 0 }, "me") === 0 && unreadFor({ you: 9 }, "me") === 0, "and never somebody else's");
ok(unreadFor(null, "me") === 0 && unreadFor("x", "me") === 0, "a missing map is zero");

console.log("\nresolving who the other person is");
// A chat doc carries UIDs and nothing else, so a one-to-one row has no name
// until the users are asked for. A bare users query with NO limit is REFUSED
// by the rules, not trimmed, and `documentId() in [...]` is capped at ten.
// That refusal has already caused three unrelated-looking bugs here: a blank
// search, a friends list loading for ever, and letter avatars.
ok(/where\(documentId\(\), "in", ids\)/.test(SRC), "uids are fetched by document id");
ok(/qLimit\(CHUNK\)/.test(SRC), "with an explicit limit, because no limit is refused outright");
ok(/const CHUNK = 10;/.test(SRC), "ten at a time, which is the cap on an `in` clause");
ok(/Promise\.allSettled/.test(SRC), "allSettled, so one denied batch does not empty the inbox");

ok(nameOf({ name: "Ada" }) === "Ada", "a name is a name");
ok(nameOf({ displayName: "Ada" }) === "Ada", "whichever of four keys carries it");
ok(nameOf({ handle: "@ada" }) === "ada", "a handle loses its at sign, since the row is not a mention");
ok(nameOf({}) === "Someone", "and an unresolvable person is Someone");
ok(nameOf({ name: "   " }) === "Someone", "never a blank row");

const filled = withPeople(
  [{ id: "c1", kind: "chat", title: "", otherId: "u2", memberIds: ["u1", "u2"], lastMessageAtMs: 1, unread: 0 }],
  new Map([["u2", { id: "u2", name: "Ada", photoUrl: null }]]),
);
ok(filled[0].title === "Ada", "a chat row takes the other person's name");
const unresolved = withPeople(
  [{ id: "c1", kind: "chat", title: "", otherId: "ghost", memberIds: [], lastMessageAtMs: 1, unread: 0 }],
  new Map(),
);
ok(unresolved[0].title === "Someone", "and an unresolved one still renders");
ok(
  unresolved[0].title !== "ghost" && !/[A-Za-z0-9]{20,}/.test(unresolved[0].title),
  "it NEVER shows a raw uid at somebody",
);
const trip = withPeople(
  [{ id: "t1", kind: "trip", title: "Lagos", memberIds: [], lastMessageAtMs: 1, unread: 0 }],
  new Map(),
);
ok(trip[0].title === "Lagos", "and a trip keeps its own name");

console.log("\nthe page and the thread both read the whole inbox");
// The regression this file exists to prevent is the page quietly going back
// to one collection. Asserted on the page's source, since it imports React.
const PAGE = readFileSync("src/app/trips/page.tsx", "utf8");
const THREAD = readFileSync("src/components/TripChat.tsx", "utf8");
ok(/watchMyConversations\(/.test(PAGE), "the list watches conversations, not trips alone");
ok(!/watchMyTrips\(/.test(PAGE), "and does not ALSO watch trips, which was a second listener on the same collection");
ok(/keyOf\(c\)/.test(PAGE), "every row's link carries its kind, so a chat id cannot open a trip");
ok(/trip\.kind/.test(THREAD), "the thread reads whichever collection its conversation names");
ok(/watchMessages\(trip\.id, setMessages, trip\.kind\)/.test(THREAD), "including for its messages");
ok(/markTripRead\(trip\.id, me\.id, trip\.kind\)/.test(THREAD), "and clears the badge on the right document");
// The send now carries a clientMessageId too, so the sender's own screen can
// show the message before the server has it and drop the local copy when
// that very document arrives back.
ok(/sendMessage\(trip\.id, me, body, trip\.memberIds, trip\.kind, cid\)/.test(THREAD), "and replies into it");

// BOTH SPELLINGS OF THE LAST SENDER. A trip names it lastMessageSenderName;
// a chat names it senderName, and that is what the mobile app's inbox reads.
// Writing only one leaves the phone showing whoever spoke before.
const CHAT = readFileSync("src/lib/chat.ts", "utf8");
ok(/kind === "chat" \? \{ senderId: sender\.id, senderName: sender\.name \}/.test(CHAT),
  "a reply sent from the web updates the field the phone reads");

console.log("\nthe skeleton has the shape of a row");
// "No shimmer or skeletons at all." There was one, but it was three grey
// bars that did not resemble what replaced them, so the list jumped.
ok(/animate-shimmer/.test(PAGE), "there is a shimmer");
ok(/rounded-full bg-surface-sunken animate-shimmer/.test(PAGE), "with a circle where the face goes");
ok(/aria-busy="true"/.test(PAGE) && /aria-live/.test(PAGE), "announced, not silent");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
