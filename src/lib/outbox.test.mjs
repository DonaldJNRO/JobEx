// Run: tsx src/lib/outbox.test.mjs
import assert from "node:assert";
import { queue, markFailed, markSending, drop, reconcile, retryable, newClientMessageId } from "./outbox.ts";

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails++; } else console.log("  ok   " + l); };

console.log("\na sent message is on the screen at once");
const a = queue("hello", "c1", 1000);
ok(a.state === "sending", "it starts as sending, not absent");
ok(a.text === "hello" && a.clientMessageId === "c1", "carrying its text and its id");

console.log("\nand leaves when the server echoes it back");
ok(reconcile([a], [{ clientMessageId: "c1" }]).length === 0, "matched on clientMessageId");
ok(reconcile([a], [{ clientMessageId: "other" }]).length === 1, "a different message does not clear it");
ok(reconcile([a], [{}]).length === 1, "and neither does one with no id");

// THE TRAP: matching on TEXT would make the second of two identical
// messages vanish the moment the first arrived. "ok" then "ok" is an
// ordinary thing to send.
console.log("\ntwo identical messages stay two messages");
const twice = [queue("ok", "c1", 1), queue("ok", "c2", 2)];
const after = reconcile(twice, [{ clientMessageId: "c1" }]);
ok(after.length === 1 && after[0].clientMessageId === "c2", "only the echoed one goes");

console.log("\na failure keeps the words");
const failed = markFailed([a], "c1");
ok(failed[0].state === "failed", "marked failed");
ok(failed[0].text === "hello", "and the text is still there to retry or copy");
ok(markSending(failed, "c1")[0].state === "sending", "a retry puts it back to sending");
ok(drop(failed, "c1").length === 0, "and it can be given up on");

console.log("\na reconnect replays oldest first");
const mixed = [queue("third", "c3", 300), queue("first", "c1", 100), queue("second", "c2", 200)];
const r = retryable(mixed.map((p) => ({ ...p, state: "failed" })));
ok(r.join(",") === "c1,c2,c3", `oldest first (${r.join(",")})`);
ok(retryable(mixed).length === 0, "and nothing still sending is replayed");

console.log("\nids do not collide");
ok(newClientMessageId() !== newClientMessageId(), "two calls differ");
ok(newClientMessageId().startsWith("web-"), "and say where they came from");

// ── and the screen actually uses it ─────────────────────────────────────
import { readFileSync } from "node:fs";
const THREAD = readFileSync("src/components/TripChat.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
const CHAT = readFileSync("src/lib/chat.ts", "utf8");

console.log("\nthe composer does not lock while a message is in flight");
ok(/disabled=\{!draft\.trim\(\)\}/.test(THREAD), "the send button waits only on there being words");
ok(!/\|\| sending\}/.test(THREAD), "not on a round trip, which is the whole point");

console.log("\nand every state is visible on the bubble");
ok(/m\.failed \?/.test(THREAD), "failed has its own tail");
ok(/Not sent\. Tap to retry/.test(THREAD), "and a way back");
ok(/m\.pending \?/.test(THREAD), "sending has its own tail");
ok(/<Clock/.test(THREAD), "a clock, so it does not read as delivered");
ok(/seen \? <CheckCheck/.test(THREAD), "and seen is still distinct from delivered");

console.log("\nand a reconnect replays what failed");
ok(/addEventListener\("online"/.test(THREAD), "it listens for the connection coming back");
ok(/retryable\(pendingRef\.current\)\.forEach\(retry\)/.test(THREAD), "and replays, oldest first");

console.log("\nand the id the whole thing hangs on is written");
ok(/clientMessageId: clientMessageId \?\? null/.test(CHAT), "sendMessage writes it");
ok(/clientMessageId: typeof d\.clientMessageId === "string"/.test(CHAT), "and the reader exposes it");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
