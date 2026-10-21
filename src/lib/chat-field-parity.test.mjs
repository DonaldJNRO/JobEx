// THE WEB AND THE PHONE MUST SORT A THREAD BY THE SAME FIELD.
//
// FIRESTORE DROPS ANY DOCUMENT MISSING THE orderBy FIELD. Not sorts it
// last: omits it from the result entirely. So a reader ordering by a field
// the writer does not always set shows a SHORTER CONVERSATION, with no
// error and nothing in a log.
//
// Measured 21 Oct 2026 against production: `sentAt` on 2,076 of 2,081
// messages, `timestamp` on 510. The app writes both and orders by sentAt.
// The website ordered by timestamp, so across every conversation of ten
// messages or more IT SAW 22 PERCENT OF THEM AND THE APP SAW 100. The
// longest thread has 1,094 messages and the website rendered 116; one
// 67-message conversation rendered two.
//
// It survived a redesign of this very screen because a thread missing most
// of itself looks like a short conversation, not a broken read.
//
// Run: tsx src/lib/chat-field-parity.test.mjs

import { readFileSync, existsSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const CHAT = code("src/lib/chat.ts");

console.log("\nthe thread is ordered by the field every message actually has");
ok(/orderBy\("sentAt", "asc"\)/.test(CHAT), "the web orders a thread by sentAt");
ok(!/orderBy\("timestamp"/.test(CHAT), "and never by timestamp, which three quarters of messages lack");

console.log("\nand a message written here is visible to every reader");
ok(/sentAt: serverTimestamp\(\)/.test(CHAT), "a sent message carries sentAt");
ok(/timestamp: serverTimestamp\(\)/.test(CHAT), "and timestamp too, as the app's ChatScreen writes both");

console.log("\nand a message is read from whichever field it carries");
ok(/d\.sentAt \?\? d\.timestamp/.test(CHAT), "sentAt first, falling back to timestamp");

// THE OTHER HALF OF THE PAIR. If the app is on disk, hold the two together
// rather than trusting a comment about what it does.
const APP = "/Users/k9/Downloads/sabie-v53-main/contexts/MessageContext.js";
console.log("\nand the phone agrees, where the phone is on disk");
if (existsSync(APP)) {
  const src = readFileSync(APP, "utf8");
  ok(/orderBy\('sentAt'/.test(src), "the app orders by sentAt, which is why the web must");
} else {
  console.log("  --   sabie-v53-main not on this machine, skipped");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
