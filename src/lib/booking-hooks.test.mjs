// Tapping Book must not take the tab down.
//
// BookingRequest had `if (!open) return null` ABOVE its useMoney() call. So a
// closed sheet ran fewer hooks than an open one, and the render where a guest
// tapped Book went from one hook count to the next. React treats that as
// unrecoverable; on Chrome for Android it does not surface as a red error, it
// kills the tab: "This page couldn't load".
//
// It survived twelve days because the form was gated to two listings and
// nobody pressed Book on either, which is its own finding. The moment the gate
// came off, the first guest to try it hit this.
//
// Run: npx tsx src/lib/booking-hooks.test.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

/**
 * Every hook a COMPONENT calls must sit above its first early return.
 *
 * Only component-level declarations count, which is two spaces of indent: a
 * `return null` inside a helper further down the file is not a conditional
 * render and must not be flagged, or the check cries wolf and gets deleted.
 */
function hooksAfterEarlyReturn(src) {
  // START AT THE COMPONENT, not at the top of the file. A `return null`
  // inside a formatting helper is two spaces deep as well, and counting it
  // flagged bookings/page.tsx on the first run of this test, where money()
  // returns null for a missing amount. A check that cries wolf gets deleted.
  const comp = /\n(?:export default )?function [A-Z]\w*\(/.exec(src);
  const body = comp ? src.slice(comp.index) : src;
  const m = /\n  if \([^)]*\) return null;/.exec(body);
  if (!m) return [];
  return body
    .slice(m.index + m[0].length)
    .split("\n")
    .filter((l) => /^  (const|let)\s.*\buse[A-Z]\w*\(/.test(l))
    .map((l) => l.trim());
}

const SHEET = readFileSync(new URL("../components/BookingRequest.tsx", import.meta.url), "utf8");
ck(hooksAfterEarlyReturn(SHEET).length === 0,
  "BookingRequest calls every hook before it can return null");
ck(SHEET.indexOf("useMoney()") < SHEET.indexOf("if (!open) return null;"),
  "useMoney in particular, which is the one that crashed it");

// The whole client surface, so the next component does not reintroduce it.
const dirs = ["../components", "../app"];
const walk = (d) => {
  let out = [];
  for (const e of readdirSync(new URL(d + "/", import.meta.url), { withFileTypes: true })) {
    if (e.isDirectory()) out = out.concat(walk(`${d}/${e.name}`));
    else if (e.name.endsWith(".tsx")) out.push(`${d}/${e.name}`);
  }
  return out;
};
let offenders = 0;
for (const rel of walk(dirs[0]).concat(walk(dirs[1]))) {
  const src = readFileSync(new URL(rel, import.meta.url), "utf8");
  if (!src.startsWith('"use client"')) continue;
  const bad = hooksAfterEarlyReturn(src);
  if (bad.length) { offenders++; console.log(`      ${rel}: ${bad[0].slice(0, 60)}`); }
}
ck(offenders === 0, "and no other client component does it either");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
