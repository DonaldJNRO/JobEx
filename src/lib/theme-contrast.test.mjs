// THE GUARD THAT WOULD HAVE CAUGHT IT.
//
// --color-primary and --color-ink were the same hex for most of a day. Four
// review passes went by, the founder said "it all looks lame" four times, and
// the cause was two lines of CSS that look like two different tokens in any
// diff you care to read.
//
// Every assertion below is a PROPERTY of a named role, never a hex and never
// a class name. This repo has been bitten five times by guards that matched a
// spelling and kept passing after the thing they guarded was deleted, so a
// ratio or a role relationship is the only acceptable form here.
//
// Run: tsx src/lib/theme-contrast.test.mjs

import { readFileSync } from "node:fs";
import { contrast, mixOver, AA_BODY, AA_LARGE } from "./contrast.ts";
import { readThemeTokens, ROLES, CHIPS } from "./theme.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const css = readFileSync("src/app/globals.css", "utf8");
const T = readThemeTokens(css);
const hex = (role) => {
  const v = T[role];
  if (!v) throw new Error(`the theme has no --color-${role}`);
  return v;
};
const ratio = (a, b) => contrast(hex(a), hex(b));
const n = (x) => Math.round(x * 100) / 100;

// THE EXISTENCE CHECK FIRST. privacy-truth.test.mjs established this habit
// and it is the answer to a guard that passes forever because it is reading
// nothing: if the parse is empty, every ratio below is vacuously fine.
console.log("\nthe theme parsed at all");
ok(Object.keys(T).length > 25, `found ${Object.keys(T).length} colour tokens, expected over 25`);
ok(!!T[ROLES.action.fill], "there is a token playing the action's role");
ok(!!T[ROLES.text.body], "there is a token playing the body text's role");

// ---------------------------------------------------------------- the bug
console.log("\nthe action is not the colour of the sentence beside it");
// THIS IS THE ONE. Under the bug: #2C2C2A against #3F3E3A is 1.31:1.
const vsBody = ratio(ROLES.action.fill, ROLES.text.body);
ok(vsBody >= AA_LARGE, `action vs body text is ${n(vsBody)}:1, needs ${AA_LARGE}`);
const vsHeading = ratio(ROLES.action.fill, ROLES.text.heading);
ok(vsHeading >= AA_LARGE, `action vs headings is ${n(vsHeading)}:1, needs ${AA_LARGE}`);

console.log("\nno two different roles are the same colour");
// Deliberately NOT "no two tokens share a hex". --color-primary sharing with
// --color-ink is fine once primary's role IS ink. What is never fine is the
// ACTION sharing with TEXT, because then "press this" and "read this" are one
// colour and the page has no affordances at all.
const named = [];
for (const [group, roles] of Object.entries(ROLES)) {
  for (const [slot, token] of Object.entries(roles)) named.push([`${group}.${slot}`, token]);
}
for (const [aName, aTok] of named) {
  for (const [bName, bTok] of named) {
    if (aName >= bName) continue;
    const aGroup = aName.split(".")[0];
    const bGroup = bName.split(".")[0];
    // Two slots in one group may legitimately share: the action's label is
    // charcoal and so is the focus ring.
    if (aGroup === bGroup) continue;
    if (aGroup === "focus" || bGroup === "focus") continue;
    if (aName === "action.label" || bName === "action.label") continue;
    ok(hex(aTok) !== hex(bTok), `${aName} and ${bName} are different colours`);
  }
}

// ------------------------------------------------------- the label and edge
console.log("\nthe label on the fill is readable, and is never white");
const label = ratio(ROLES.action.fill, ROLES.action.label);
ok(label >= AA_BODY, `label on the action is ${n(label)}:1, needs ${AA_BODY}`);
// A conditional, so the REASONING is encoded and not the value. If the fill
// ever changes to something white can sit on, white becomes allowed on its
// own merits rather than by this line being edited.
if (contrast(hex(ROLES.action.fill), "#FFFFFF") < AA_BODY) {
  ok(
    hex(ROLES.action.label).toLowerCase() !== "#ffffff",
    `white cannot sit on this fill (${n(contrast(hex(ROLES.action.fill), "#FFFFFF"))}:1), so the label is not white`,
  );
}
const hover = ratio(ROLES.action.hover, ROLES.action.label);
ok(hover >= AA_BODY, `the hover state keeps its label at ${n(hover)}:1`);

console.log("\na fill too close to the page carries its own edge");
// WCAG 1.4.11: a component boundary needs 3:1. Gold on cream is 1.88:1, so
// the button would read as a smudge rather than an object without this.
for (const surf of [ROLES.surface.page, ROLES.surface.card]) {
  const fillVsSurface = ratio(ROLES.action.fill, surf);
  if (fillVsSurface < AA_LARGE) {
    const edge = ratio(ROLES.action.edge, surf);
    ok(
      edge >= AA_LARGE,
      `action is ${n(fillVsSurface)}:1 on ${surf}, so its edge carries the boundary at ${n(edge)}:1`,
    );
  } else {
    ok(true, `action is ${n(fillVsSurface)}:1 on ${surf}, which stands on its own`);
  }
}

// ------------------------------------------------------------------- focus
console.log("\nfocus is visible, at full opacity");
const ring = ratio(ROLES.focus.ring, ROLES.surface.page);
ok(ring >= AA_LARGE, `the focus ring is ${n(ring)}:1 on the page, needs ${AA_LARGE}`);
ok(/:focus-visible\s*\{/.test(css), "there is a :focus-visible rule in globals.css");
ok(
  /outline:\s*2px solid var\(--color-focus\)/.test(css),
  "the ring uses the focus token at full opacity, not a tint",
);
// The tint this replaced composites to about 1.3:1, which is why no control
// on this site showed focus even where the class was applied.
const tinted = mixOver(hex(ROLES.focus.ring), 30, hex(ROLES.surface.page));
ok(
  contrast(tinted, hex(ROLES.surface.page)) < AA_LARGE,
  `and a 30% ring would have been ${n(contrast(tinted, hex(ROLES.surface.page)))}:1, which is why it was invisible`,
);

// ------------------------------------------------------------------- chips
console.log("\nevery tinted chip is readable, composited");
for (const chip of CHIPS) {
  const bg = chip.alpha ? mixOver(hex(chip.bg), chip.alpha, hex(chip.over || ROLES.surface.page)) : hex(chip.bg);
  const r = contrast(bg, hex(chip.fg));
  ok(r >= AA_BODY, `${chip.name} is ${n(r)}:1, needs ${AA_BODY}`);
}

console.log("\nand the recipe this replaced would fail here");
// bg-primary/10 text-primary: text on a wash of itself. Fourteen chips used
// it. It reads as correct in the markup, which is the whole danger.
const goldOnGold = mixOver(hex(ROLES.action.fill), 10, hex(ROLES.surface.page));
ok(
  contrast(goldOnGold, hex(ROLES.action.fill)) < AA_BODY,
  `a gold chip holding gold text would be ${n(contrast(goldOnGold, hex(ROLES.action.fill)))}:1, so the guard above is not decorative`,
);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
