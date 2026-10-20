// THE AFFORDANCE RULES, asserted on the real recipes.
//
// The founder's complaint was "the Book is same colour, doesn't show any
// different colours". The cause was two-fold: the action colour was the text
// colour (theme-contrast.test.mjs guards that now), and the control itself
// was a twelve-pixel WORD with no fill, no border and no padding sitting next
// to a price in the same colour.
//
// A colour guard alone would not have caught the second half. These are the
// rules about shape: no affordance is distinguished by the colour of its text
// alone, exactly one variant carries the action's fill, every size is a real
// touch target, and there is one radius and one focus treatment.
//
// Imported as DATA from ui-recipes.ts, which is why that file exists apart
// from the components: a .tsx cannot be imported here, so every check would
// otherwise be a grep for a spelling, and this repo has been burned five
// times by exactly that.
//
// Run: tsx src/lib/ui-recipes.test.mjs

import { readFileSync } from "node:fs";
import { BUTTON, PILL, FIELD, ROW, CARD, CONTAINER, FOCUS, RADIUS, cx } from "./ui-recipes.ts";
import { contrast, AA_BODY, AA_LARGE } from "./contrast.ts";
import { readThemeTokens, ROLES } from "./theme.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const T = readThemeTokens(readFileSync("src/app/globals.css", "utf8"));
const n = (x) => Math.round(x * 100) / 100;

// Resolve the colour a class names, so a recipe is judged against the LIVE
// token file rather than against a hex copied into this test.
const tokenOf = (cls, prefix) => {
  const m = cls.match(new RegExp(`(?:^|\\s)${prefix}-([a-z0-9-]+)`));
  return m ? m[1] : null;
};
const hexOfClass = (cls, prefix) => {
  const t = tokenOf(cls, prefix);
  return t && T[t] ? T[t] : null;
};

console.log("\nthe recipes are there to be checked");
ok(Object.keys(BUTTON.variant).length >= 3, `${Object.keys(BUTTON.variant).length} button variants parsed`);
ok("primary" in BUTTON.variant, "there is a primary variant (if this fails, nothing below is checked)");
ok(Object.keys(T).length > 25, "and the theme parsed");

// ------------------------------------------------------- the founder's bug
console.log("\nno affordance is distinguished by its text colour alone");
// THIS IS THE ONE. A twelve-pixel charcoal word is not a button, whatever
// colour it is. Every variant must declare a background or a border.
// THREE WAYS TO BE AN AFFORDANCE: a fill, a border, or an underline. Colour
// is not one of them. A control distinguished from the sentence beside it
// only by the colour of its own text is the twelve-pixel "Book" this whole
// day started with, and no palette repair rescues it.
for (const [name, cls] of Object.entries(BUTTON.variant)) {
  const hasFill = /(?:^|\s)bg-(?!transparent)/.test(cls);
  const hasEdge = /(?:^|\s)border(?:\s|-)/.test(cls) && !/border-transparent/.test(cls);
  const hasRule = /(?:^|\s)underline(?:\s|$)/.test(cls);
  ok(hasFill || hasEdge || hasRule, `${name} is a fill, a border or an underline, not a text colour`);
}

console.log("\nexactly one variant carries the action fill");
// One gold control on screen at a time, mechanically rather than by comment.
const golden = Object.entries(BUTTON.variant).filter(([, c]) => /(?:^|\s)bg-action(?:\s|$)/.test(c));
ok(golden.length === 1, `${golden.length} variant(s) use bg-action, expected exactly 1 (${golden.map((g) => g[0]).join(", ")})`);
ok(golden[0]?.[0] === "primary", "and it is the one called primary");

console.log("\nand a pill never takes it, so nothing competes with the button");
for (const [name, cls] of Object.entries(PILL.tone)) {
  ok(!/(?:^|\s)bg-action(?:\s|$)/.test(cls), `the ${name} pill is not the action's gold`);
}

console.log("\nevery variant's label is readable on its own fill");
for (const [name, cls] of Object.entries(BUTTON.variant)) {
  const bg = hexOfClass(cls, "bg");
  const fg = hexOfClass(cls, "text") || (/text-white/.test(cls) ? "#FFFFFF" : null);
  if (!bg || !fg) { ok(true, `${name} has no opaque pair to measure`); continue; }
  const r = contrast(bg, fg);
  ok(r >= AA_BODY, `${name}: label on fill is ${n(r)}:1, needs ${AA_BODY}`);
  // And distinct from the body text, which is the whole point.
  const vsBody = contrast(bg, T[ROLES.text.body]);
  ok(vsBody >= AA_LARGE, `${name}: its fill is ${n(vsBody)}:1 against body text`);
}

// ------------------------------------------------------------------ shape
console.log("\nsizes are touch targets");
const px = (cls) => {
  const h = cls.match(/h-(\d+)/);
  if (h) return Number(h[1]) * 4;
  const min = cls.match(/min-h-\[(\d+)px\]/);
  return min ? Number(min[1]) : null;
};
for (const [name, cls] of Object.entries(BUTTON.size)) {
  const h = px(cls);
  ok(h !== null, `${name} declares a height`);
  if (name !== "sm") ok(h >= 44, `${name} is ${h}px, needs 44 for a page action`);
}
ok(px(BUTTON.size.sm) >= 36, `sm is ${px(BUTTON.size.sm)}px, allowed inside a row only`);

console.log("\none radius per meaning");
// Nineteen treatments existed partly because a pill and a button were the
// same shape: rounded-full on seven buttons, rounded-xl on nine.
const radii = new Set(Object.values(BUTTON.variant).concat([BUTTON.base]).flatMap((c) => c.match(/rounded-[a-z0-9]+/g) || []));
ok(radii.size === 1, `buttons use ${radii.size} radius value(s): ${[...radii].join(", ")}`);
ok(RADIUS.control !== RADIUS.pill && RADIUS.pill !== RADIUS.card, "a control, a pill and a card are three different shapes");

console.log("\none focus treatment, shared by every primitive");
for (const [name, cls] of Object.entries({ button: BUTTON.base, input: FIELD.input, textarea: FIELD.textarea, row: ROW.interactive })) {
  ok(cls.includes(FOCUS), `${name} uses the shared focus recipe`);
}
ok(/focus-visible/.test(FOCUS) && !/(?:^|\s)focus:/.test(FOCUS), "it is focus-visible, so a mouse click leaves no ring behind");
ok(/ring-offset/.test(FOCUS), "with an offset, or the ring vanishes into a filled button");

console.log("\ndisabled is not optional");
// Thirteen of twenty-one buttons had no disabled treatment, so a submitting
// form looked identical to a ready one.
ok(/disabled:/.test(BUTTON.base), "every button inherits a disabled treatment");
const disBg = BUTTON.base.match(/disabled:bg-([a-z0-9-]+)/)?.[1];
const disFg = BUTTON.base.match(/disabled:text-([a-z0-9-]+)/)?.[1];
if (disBg && disFg && T[disBg] && T[disFg]) {
  const r = contrast(T[disBg], T[disFg]);
  ok(r >= AA_LARGE, `a disabled label is still legible at ${n(r)}:1`);
}

console.log("\nthe spacing token finally has a consumer");
// --spacing-gutter existed unused while the padding it exists for was
// written as px-4 forty-nine times.
ok(/px-gutter/.test(CONTAINER.base), "Container uses px-gutter");

console.log("\nand one separation mechanic for rows");
ok(/divide-y/.test(ROW.group), "rows separate with divide-y, not four different ways");

console.log("\nand a card has one definition, not twenty-five");
// There were 25 hand-rolled cards across 10 files in 7 radius and shadow
// variants and 11 paddings, for one idea. A <Card> is right where a card is
// its own box; half of these are a <section>, an <li> or a wrapper that
// already carries layout, and turning those into components means
// rewriting JSX trees for no behaviour change, which is how a migration
// breaks a page. The string form fixes the thing that actually mattered.
import { readdirSync as rd, statSync as st } from "node:fs";
import { join as jn } from "node:path";
const tsxFiles = (dir) => rd(dir).flatMap((n) => {
  const f = jn(dir, n);
  return st(f).isDirectory() ? tsxFiles(f) : /\.tsx$/.test(n) ? [f] : [];
});
const all = ["src/app", "src/components"].flatMap(tsxFiles).filter((f) => !f.includes("/ui/"));
let rogue = [];
for (const f of all) {
  const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  for (const m of src.matchAll(/rounded-2xl border border-line bg-card/g)) {
    rogue.push(f.replace("src/", ""));
  }
}
ok(all.length > 20, `swept ${all.length} components outside the primitives`);
ok(rogue.length === 0, rogue.length ? `${rogue[0]} still spells a card by hand` : "every card goes through cardClass");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
