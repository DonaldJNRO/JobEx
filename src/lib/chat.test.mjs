// A message is TWO documents, and the second one is the one people notice.
//
// No Cloud Function maintains lastMessage or unreadCounts for a human
// message: the triggers fan out pushes and nothing else, so the client is the
// only writer. A web client that writes only the message doc leaves every
// mobile inbox showing the PREVIOUS message as the latest, with a wrong
// badge, for ever. The message is in the thread and the inbox disagrees,
// which is worse than it not sending, because nobody knows to look.
//
// These are source assertions. chat.ts imports firebase/firestore, which
// cannot be loaded in a bare node test, and the behaviour worth guarding is
// structural: which documents get written, and with what shape of key.
//
// Run: tsx src/lib/chat.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const raw = readFileSync(new URL("./chat.ts", import.meta.url), "utf8");
const src = raw
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
const send = src.slice(src.indexOf("export async function sendMessage"));

console.log("\nboth documents, in one batch");
ok(/writeBatch\(db\)/.test(send), "a batch is used");
ok(/batch\.set\(messageRef/.test(send), "the message is written");
ok(/batch\.set\(tripRef/.test(send), "AND the trip doc is written");
ok(/batch\.commit\(\)/.test(send), "they commit together, so neither lands alone");
ok(send.indexOf("batch.set(messageRef") < send.indexOf("batch.commit"), "the message is in the batch, not after it");

console.log("\nthe trip doc carries what an inbox reads");
for (const field of ["lastMessage", "lastMessageTime", "lastMessageSenderId", "lastMessageSenderName", "lastMessageType", "lastMessageId", "updatedAt"]) {
  ok(new RegExp(`${field}:`).test(send), `trip doc sets ${field}`);
}
ok(/\{ merge: true \}/.test(send), "merged, so sending a message cannot clobber the trip");

console.log("\nunread counts use DOTTED paths with updateDoc");
// setDoc treats "unreadCounts.<uid>" as a literal field name, so the count
// lands beside the real map where nothing reads it. The app's own adapter
// carries a comment about this exact fault being copied into it once.
ok(/updateDoc\(tripRef, unread\)/.test(send), "updateDoc, not setDoc");
ok(/\[`unreadCounts\.\$\{sender\.id\}`\]: 0/.test(send), "the sender's own count is reset to zero");
ok(/\[`unreadCounts\.\$\{id\}`\] = increment\(1\)/.test(send), "everybody else is incremented");
ok(/id !== sender\.id/.test(send), "and the sender is excluded from that");
ok(/lastMessageSeenBy/.test(send), "lastMessageSeenBy is reset, or the next message inherits these readers");

console.log("\nnothing the push fan-out early-returns on");
// functions/index.js:3584-3689 returns before pushing on these shapes.
ok(!/status: ['"]sending['"]/.test(send), "never writes status 'sending', which suppresses the push");
ok(!/senderId: ['"](system|sabie_ai)['"]/.test(send), "never impersonates system or Bie");
ok(/type: ['"]text['"]/.test(send), "carries a type the notification switch recognises");

console.log("\nthe sender has seen their own message");
ok(/seenBy: \{ \[sender\.id\]: true \}/.test(send), "seenBy");
ok(/deliveredTo: \{ \[sender\.id\]: true \}/.test(send), "deliveredTo");

console.log("\nan empty message is not sent at all");
ok(/if \(!body\) return/.test(send), "blank text returns before any write");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
