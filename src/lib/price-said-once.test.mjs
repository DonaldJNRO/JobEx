// "from from £4.50"
//
// getListingPrice already returns "from £4.50" when the figure is a floor:
// priceLine builds `from ${amount}` from the same flag. The sticky bar and
// the price card each prepended their OWN styled "from" on top of that
// string, so the word was said twice.
//
// The rule is that a formatted string is a sentence and must not be
// decorated. A surface that wants to style part of it reads the PARTS.
//
// Run: tsx src/lib/price-said-once.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
const LINE = readFileSync("src/lib/listing-price.ts", "utf8");

console.log("\nthe price line already says it");
ok(/const head = from \? `from \$\{amount\}` : amount;/.test(LINE),
  "priceLine builds the word from the flag (if this fails, the rule below has moved)");

console.log("\nso the page does not say it again");
// Comments stripped: this file explains the bug in prose and the guard must
// not match its own explanation. Seven of these in this repo now.
const code = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
ok(!/>from <\/span>/.test(code), "no literal from is rendered beside a price string");
ok(!/\{delegating && <span[^>]*>from/.test(code), "and none is conditionally prepended");
ok(/getListingPriceParts/.test(code), "the page reads the parts instead");
ok(/priceBits\.from \? "from " : ""/.test(code), "and composes the word once, from the flag");

// Both surfaces, or one of them drifts back.
const composed = (code.match(/priceBits\.from \? "from " : ""/g) || []).length;
ok(composed === 2, `both the card and the bar compose it the same way (found ${composed})`);

console.log("\nand Total is not claimed over a starting price");
// "Total" under a FROM price is a worse lie than saying nothing: it is the
// cheapest of several things and the bill will be larger.
ok(/priceBits\.from \? "Cheapest option" : "Total"/.test(code),
  "the bar only says Total when the figure really is one");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
