// A PHONE ON ITS SIDE.
//
// Rotated, a phone has roughly 380 pixels of height. The navbar is 64 and
// the tab bar about 72, so a third of the screen was chrome and the feed
// was a letterbox between them, with the sticky filter row taking a third
// band on top of that.
//
// Run: tsx src/lib/short-screen.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const CSS = readFileSync("src/app/globals.css", "utf8");
const SHELL = readFileSync("src/components/AppShell.tsx", "utf8");
const NAV = readFileSync("src/components/Navbar.tsx", "utf8");
const HOME = readFileSync("src/app/page.tsx", "utf8");

console.log("\nthe chrome can be addressed");
ok(/data-chrome="top"/.test(NAV), "the navbar is named");
ok(/data-chrome="bar"/.test(SHELL), "the tab bar is named");
ok(/data-chrome=\{bar \? "body"/.test(SHELL), "and the padding that makes room for it");
ok(/data-sticky-filters/.test(HOME), "so is the sticky filter row");

console.log("\nand it stands down on a short screen");
const block = CSS.slice(CSS.indexOf("A PHONE ON ITS SIDE"));
ok(/@media \(max-height: 560px\)/.test(block), "keyed on height");
// Orientation would catch a tablet in landscape, which has plenty of room,
// and miss a short window on a laptop, which has the same problem.
ok(!/orientation:\s*landscape/.test(block), "not on orientation, which is the wrong question");
ok(/\[data-chrome="top"\][\s\S]{0,80}height: 3rem/.test(block), "the navbar shortens");
ok(/\[data-chrome="bar"\][\s\S]{0,200}padding-top/.test(block), "the tab bar tightens");
ok(/\[data-sticky-filters\][\s\S]{0,60}position: static/.test(block), "and the filter row stops sticking");

console.log("\nthe padding follows the bar");
// A bar that shrinks while the padding below it does not leaves a gap; a
// padding that shrinks while the bar does not hides the last row.
ok(/\[data-chrome="body"\][\s\S]{0,120}padding-bottom: calc\(3rem/.test(block),
  "they move together, or the last row of the feed sits under the bar");

console.log("\nand nothing disappears");
// A tab bar that vanishes when you rotate is a worse surprise than a short
// one: somebody who rotated to see a photo still has to get Home.
// THE SELECTOR ITSELF, not a window of characters after it. The first
// version of this matched 120 characters past the bar's name and caught the
// rule hiding its LABELS two rules later, which is the opposite of the
// thing it was asserting. Eighth time in this repo.
const barRules = [...block.matchAll(/\[data-chrome="bar"\]([^{]*)\{([^}]*)\}/g)];
ok(barRules.length > 0, "the bar has rules on a short screen (if this fails, nothing below is checked)");
const barItself = barRules.filter(([, sel]) => !sel.trim());
ok(
  barItself.every(([, , body]) => !/display:\s*none/.test(body)),
  "the bar itself is never hidden, only shortened",
);
ok(
  barRules.some(([, sel]) => sel.trim()),
  "and what IS hidden is something inside it, not the bar",
);
ok(/aria-label/.test(SHELL), "and the labels it drops are still announced");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
