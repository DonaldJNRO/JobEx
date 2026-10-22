// BIE IN THE WEB CHAT, ASSERTED AGAINST THE FUNCTION THAT ANSWERS.
//
// The web does not reimplement Bie: it writes the message document the Cloud
// Function will fill, then calls the function. Three things have to agree
// across the two repos, and all three fail silently if they drift.
//
// Run: tsx src/lib/bie.test.mjs

import { readFileSync } from "node:fs";
import { readSibling, skipNote } from "./sibling.mjs";

const bie = readFileSync(new URL("./bie.ts", import.meta.url), "utf8");
const chat = readFileSync(new URL("./chat.ts", import.meta.url), "utf8");

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails += 1; } else console.log("  ok   " + l); };

console.log("\nthe placeholder is one the listener can see");
// watchMessages orders by sentAt, and Firestore OMITS a document missing the
// field it is ordered by rather than sorting it last. A reply written into a
// doc with no sentAt is written perfectly and never appears.
ok(/orderBy\("sentAt"/.test(chat), "the thread is ordered by sentAt");
ok(/sentAt: serverTimestamp\(\)/.test(bie), "so the placeholder carries sentAt");
ok(/timestamp: serverTimestamp\(\)/.test(bie), "and timestamp, which older readers use");

console.log("\nand it stays invisible until there is something to read");
ok(/text: ""/.test(bie), "the placeholder starts with no text");
ok(/m\.text \|\| m\.imageUrl/.test(chat),
  "and the listener drops a message with none, so there is no empty bubble");

console.log("\nBie is asked, not reimplemented");
ok(!/anthropic|openai|api[_-]?key/i.test(bie), "no model and no key on the client");
ok(/httpsCallable[\s\S]{0,120}"callBieAI"/.test(bie), "it calls the same function the app calls");
ok(/useTools: true/.test(bie), "with the tools on, as the trip chat does");
ok(!/role: "system"/.test(bie),
  "and sends no system message: the function builds its own, enriched with the trip");

console.log("\nand the two repos agree on the contract");
const fn = readSibling("sabie-v53-main", "functions", "index.js");
if (!fn) {
  console.log(skipNote("sabie-v53-main"));
} else {
  ok(/streamToDoc\?\.messageId && \(streamToDoc\?\.tripId/.test(fn),
    "the function streams when given messageId + tripId");
  ok(/streamToDoc: \{ tripId: id, messageId \}/.test(bie),
    "which is what this sends for a trip");
  // A PERSONAL BIE CHAT IS THE OTHER HALF, and the bigger one: 52 of the 74
  // chat documents in production are chats/bie_{uid}. The function picks the
  // parent collection from which id it is handed.
  ok(/streamToDoc\?\.chatId/.test(fn), "the function also streams into a chat");
  ok(/streamToDoc: \{ chatId: id, messageId \}/.test(bie), "which this sends too");
  ok(/startsWith\('bie_'\)/.test(fn) && /startsWith\("bie_"\)/.test(bie),
    "and both recognise a personal thread by the same prefix");
  ok(/senderId: 'sabie_ai'/.test(fn) && /BIE_SENDER_ID = "sabie_ai"/.test(bie),
    "and both name Bie the same way in a messages collection");
  // The server UPDATES the doc. If it ever created it instead, the web's
  // placeholder would become a duplicate empty message.
  ok(/docRef\.update\(/.test(fn), "the server updates the document rather than creating it");
  ok(/setDoc\(/.test(bie), "so the web creates it first");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
