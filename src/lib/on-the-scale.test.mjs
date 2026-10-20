// A SCALE NOTHING USES IS NOT A SCALE.
//
// globals.css defined hero, display, title, heading, body, small and
// caption, and the site used them ELEVEN times against 228 raw Tailwind
// sizes plus 18 arbitrary pixel values. text-hero, text-title and text-body
// had never been used at all.
//
// That is what makes a page read as assembled rather than composed: not
// that any one size is wrong, but that nothing agrees with anything.
//
// Run: tsx src/lib/on-the-scale.test.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const walk = (d) => readdirSync(d).flatMap((n) => {
  const f = join(d, n);
  return statSync(f).isDirectory() ? walk(f) : /\.tsx$/.test(n) ? [f] : [];
});
const files = ["src/app", "src/components"].flatMap(walk);
ok(files.length > 20, `scanning ${files.length} components`);

console.log("\nevery size on this site is a rung of the scale");
// The five exact equivalents were renamed with no visual change at all:
// xs is caption, sm is small, lg is heading, 2xl is title, 4xl is display.
// Only text-xl had no rung, and all six of those were section headings.
const raw = [];
const arbitrary = [];
for (const f of files) {
  const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  for (const m of src.matchAll(/(?<![\w-])text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)(?![\w-])/g)) {
    raw.push(`${f.replace("src/", "")}: ${m[0]}`);
  }
  for (const m of src.matchAll(/text-\[\d+px\]/g)) arbitrary.push(`${f.replace("src/", "")}: ${m[0]}`);
}
ok(raw.length === 0, raw.length ? `${raw[0]} is off the scale` : "no raw Tailwind size is left");
// An arbitrary value is a decision to leave the system for one element.
// All 18 sat between two rungs; none needed a size the scale lacks.
ok(arbitrary.length === 0, arbitrary.length ? `${arbitrary[0]} is an arbitrary size` : "and no arbitrary pixel size");

console.log("\nthe scale is actually used, not merely defined");
const tokenUses = files.reduce(
  (n, f) => n + (readFileSync(f, "utf8").match(/text-(caption|small|body|heading|title|display|hero)(?![\w-])/g) || []).length,
  0,
);
ok(tokenUses > 200, `${tokenUses} uses of the named sizes, against 11 this morning`);

console.log("\nand the page gutter has consumers");
// --spacing-gutter existed with ZERO consumers while the padding it is for
// was written as px-4 forty-nine times. The token means "page side
// padding", not "any 1rem", so only the gutter triple was changed.
const gutters = files.reduce((n, f) => n + (readFileSync(f, "utf8").match(/px-gutter/g) || []).length, 0);
ok(gutters >= 7, `${gutters} page gutters use it`);
const rhythm = files.reduce((n, f) => n + (readFileSync(f, "utf8").match(/py-(section|page)/g) || []).length, 0);
ok(rhythm >= 9, `${rhythm} sections use the rhythm tokens`);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
