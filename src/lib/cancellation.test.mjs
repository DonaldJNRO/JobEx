// THE WEBSITE'S CANCELLATION COPY AND THE SERVER'S REFUND AGREE.
//
// A quoted term that does not match what the refund does is worse than no
// term: it is an argument the traveller wins and the operator loses, after
// the money has moved.
//
// So this PARSES the constants out of functions/cancellationPolicy.js, the
// authority the refund actually runs on, rather than trusting a comment.
// Same arrangement the traveller fee already uses between the web, the app
// and the server.
//
// Run: tsx src/lib/cancellation.test.mjs

import { readFileSync, existsSync } from "node:fs";
import { FULL_REFUND_HOURS, HALF_REFUND_HOURS, LADDER, oneLine } from "./cancellation.ts";

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails++; } else console.log("  ok   " + l); };

console.log("\nthe ladder reads as a traveller reads it");
ok(LADDER.length === 3, "three rungs");
ok(LADDER[0].percent === 100 && LADDER[2].percent === 0, "most generous first");
ok(LADDER.map((r) => r.percent).join() === "100,50,0", "100, 50, 0 and nothing in between");
ok(/Free to cancel up to 48 hours/.test(oneLine()), "and the one-line version leads with the generous end");

// NO DASHES AS PUNCTUATION in anything a person reads. The em dash as an
// empty-value placeholder is typography, not punctuation; this is copy.
console.log("\nand follows the house rules for copy");
const copy = [...LADDER.map((r) => `${r.when} ${r.outcome}`), oneLine()].join(" ");
ok(!/[—–]|\s-\s/.test(copy), "no dashes used as punctuation");

const SERVER = "/Users/k9/Downloads/sabie-v53-main/functions/cancellationPolicy.js";
console.log("\nand the numbers are the server's, not ours");
if (existsSync(SERVER)) {
  const src = readFileSync(SERVER, "utf8");
  const full = Number(src.match(/FULL_REFUND_HOURS\s*=\s*(\d+)/)?.[1]);
  const half = Number(src.match(/HALF_REFUND_HOURS\s*=\s*(\d+)/)?.[1]);
  ok(full === FULL_REFUND_HOURS, `full refund window matches the server (${full})`);
  ok(half === HALF_REFUND_HOURS, `half refund window matches the server (${half})`);
  ok(/percent: 100/.test(src) && /percent: 50/.test(src) && /percent: 0/.test(src),
    "and the server really does pay 100, 50 and 0");
} else {
  console.log("  --   sabie-v53-main not on this machine, skipped");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
