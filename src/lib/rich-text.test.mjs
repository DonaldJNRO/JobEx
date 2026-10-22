// Bie's bold, without the asterisks.
//
// The function instructs Bie never to use markdown and Bie does it anyway,
// so the website printed "**560 messages & 83 photos**" at people. This
// renders the one thing Bie actually emits and leaves everything else
// exactly as typed, because a chat bubble is not a document.
//
// Run: tsx src/lib/rich-text.test.mjs

import { withBold } from "./rich-text.tsx";

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails += 1; } else console.log("  ok   " + l); };
/** What a reader ends up seeing, bold or not. */
const flat = (parts) => parts.map((p) => (typeof p === "string" ? p : p.props.children)).join("");
const bolds = (parts) => parts.filter((p) => typeof p !== "string").map((p) => p.props.children);

console.log("\nthe asterisks go, the words stay");
let r = withBold("Card is up for **Sabię UI/UX Design Team** — a heads up");
ok(flat(r) === "Card is up for Sabię UI/UX Design Team — a heads up", "no asterisks reach the reader");
ok(bolds(r).length === 1 && bolds(r)[0] === "Sabię UI/UX Design Team", "and the name is the bold bit");

console.log("\ntwo runs are two runs");
r = withBold("it has **560 messages** and **83 photos**");
ok(bolds(r).length === 2, "not one that swallows the middle");
ok(bolds(r)[1] === "83 photos", "and the second is the second");

console.log("\nand everything else is left alone");
ok(flat(withBold("plain text")) === "plain text", "text with no markup is unchanged");
ok(flat(withBold("2 * 3 * 4")) === "2 * 3 * 4", "single asterisks are arithmetic, not emphasis");
ok(flat(withBold("**unclosed")) === "**unclosed", "an unclosed run is somebody typing");
ok(flat(withBold("a **b**\n**c** d")) === "a b\nc d", "a run never crosses a line break");
ok(flat(withBold("")) === "", "and an empty message stays empty");
ok(withBold("hi").length === 1, "a string with no bold comes back whole rather than in pieces");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
