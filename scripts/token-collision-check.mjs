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

// ── NO FOREIGN PALETTES ───────────────────────────────────────────────────
//
// Tailwind ships emerald, amber, red, blue and the rest, and they belong to
// no product. Five of them were in the live stylesheet: #fb2c36, #e40014,
// #ffa3a3, #ffe2e2 and #f99c00, from a handful of text-red-600 and
// bg-emerald-600 classes on the bookings, contact and payment surfaces.
//
// The brand has its own three for exactly these jobs, the same three the app
// and Scout use: settled (leaf) for money received, secondary (gold) for
// waiting, alarm (danger) for refused. A status pill in Tailwind's emerald
// beside one in the brand's leaf is two greens that do not match.
import { readdirSync as rd, statSync as st } from 'node:fs';

const FOREIGN = /\b(?:text|bg|border|from|to|via|ring|divide)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/g;

function walkTsx(dir, out = []) {
  for (const name of rd(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = `${dir}/${name}`;
    if (st(full).isDirectory()) walkTsx(full, out);
    else if (name.endsWith('.tsx') || name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const foreign = [];
for (const file of walkTsx(new URL('../src', import.meta.url).pathname)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.match(FOREIGN) || []) {
    foreign.push(`${file.split('/src/')[1]}: ${m}`);
  }
}

if (foreign.length) {
  console.error(`\n${foreign.length} off-brand colour class(es). Use the tokens in globals.css:\n`);
  for (const f of [...new Set(foreign)].slice(0, 20)) console.error(`  ${f}`);
  console.error('\n  money received -> settled-bg / settled-ink');
  console.error('  waiting        -> secondary/15 / secondary-ink');
  console.error('  refused        -> alarm-bg / alarm-ink');
  console.error('  anything grey  -> surface-sunken / ink-muted / line\n');
  process.exit(1);
}
console.log('No off-brand colour classes. Checked every .ts and .tsx under src.');
