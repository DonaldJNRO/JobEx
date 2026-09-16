// A theme token must not be named after a CSS keyword.
//
// WHY THIS EXISTS. Tailwind v4 turns every --spacing-* token into a value for
// EVERY spacing utility, and `inline-*` (inline-size) is one of them. So a
// token named `--spacing-block` generated
//
//   .inline-block { inline-size: 1.5rem }
//
// which lands after Tailwind's own `.inline-block { display: inline-block }`
// at equal specificity and wins. Every inline-block on the site silently
// became a 24px-wide box. Nothing failed and nothing warned. It was found by
// measuring a status pill on /bookings that had collapsed to "C..".
//
// The first version of this check parsed the built stylesheet looking for a
// class declared twice. That turned out to be the wrong instrument: Tailwind
// legitimately declares many utilities more than once (a hex value then a
// color-mix one, gradients across several rules), so the check was noisy AND
// still missed the case it was written for. Minified CSS is a bad thing to
// reason about with a regex.
//
// So this checks the SOURCE instead, where the rule is simple and exact: a
// token name may not be a CSS keyword that a utility sharing its namespace can
// already take. No parsing, no false positives, and it fails for the reason a
// human would give.
//
// Run: node scripts/token-collision-check.mjs

import { readFileSync } from "node:fs";

const THEME_FILE = "src/app/globals.css";

// Keywords a Tailwind utility can already take as a value. A token with one of
// these names generates a utility whose class name already means something.
// `block` is the one that bit us; the rest are the same shape.
const RESERVED = new Set([
  "auto", "none", "full", "screen", "min", "max", "fit", "px", "dvh", "svh", "lvh",
  "block", "inline", "flex", "grid", "table", "contents", "hidden", "flow", "list",
  "ruby", "static", "fixed", "absolute", "relative", "sticky", "visible", "clip",
  "scroll", "start", "end", "center", "between", "around", "evenly", "baseline",
  "stretch", "first", "last", "normal", "reverse", "wrap", "nowrap", "col", "row",
]);

const css = readFileSync(THEME_FILE, "utf8");

// Token declarations inside @theme, e.g. `--spacing-section: 3.5rem;`
const tokens = [...css.matchAll(/--(spacing|text|color|font|radius|shadow)-([a-z0-9-]+)\s*:/g)]
  .map(([, namespace, name]) => ({ namespace, name }));

const bad = tokens.filter((t) => RESERVED.has(t.name));

if (bad.length > 0) {
  console.error(`\n${bad.length} theme token(s) are named after a CSS keyword:\n`);
  for (const t of bad) {
    console.error(`  --${t.namespace}-${t.name}`);
    console.error(`    generates utilities whose class names already mean something.`);
    console.error(`    --spacing-block, for one, generated .inline-block { inline-size } and`);
    console.error(`    overrode .inline-block { display: inline-block } site-wide.`);
  }
  console.error(`\nRename it to a word that describes the ROLE (stack, section, gutter, page)\nrather than a CSS value.\n`);
  process.exit(1);
}

console.log(
  `No token is named after a CSS keyword. Checked ${tokens.length} tokens in ${THEME_FILE}.`,
);
