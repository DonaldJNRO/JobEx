// NO HOOK BELOW AN EARLY RETURN.
//
// "That did not load", on a page that had loaded perfectly. The error
// boundary was doing its job and the page underneath was fine; what threw
// was the rules of hooks.
//
// ListingClient has `if (loading) return <skeleton>` and `if (!listing)
// return <not found>`. An IntersectionObserver effect was added BELOW both,
// so the first render ran fifteen hooks and the second ran sixteen. React
// treats a changing hook count as unrecoverable, and every listing page went
// to the error boundary.
//
// Second time in this codebase: BookingRequest carries a comment four lines
// above its own early return saying exactly this, written the last time. A
// comment is not a guard, which is why this file exists.
//
// Run: tsx src/lib/hooks-above-returns.test.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const HOOK = /(?:^|[^.\w])(use[A-Z]\w*)\s*\(/;
const ROOTS = ["src/app", "src/components"];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap(walk);
ok(files.length > 20, `scanning ${files.length} components (if this is small, the check below is vacuous)`);

// SEGMENT BY COMPONENT FIRST. The first version of this flagged
// PayStep.tsx and ProfileServices.tsx, and both were wrong: the hooks it
// found were the FIRST lines of CardForm and ServiceRow, separate
// components declared lower in the same file. A file is not a component,
// and a rule about hook order is a rule about one function's body.
function bodies(code) {
  const lines = code.split("\n");
  const starts = [];
  lines.forEach((line, i) => {
    if (/^(export default )?function [A-Za-z]/.test(line)) starts.push(i);
  });
  return starts.map((start, i) => ({
    start,
    lines: lines.slice(start, starts[i + 1] ?? lines.length),
    name: (lines[start].match(/function (\w+)/) || [])[1] || "?",
  }));
}

let checked = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (!/^"use client"/m.test(src)) continue;

  // Strip comments, or a prose mention of useEffect counts as a call. This
  // repo has had seven guards match a spelling instead of the thing.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  for (const body of bodies(code)) {
    // EVERY return IN THE BODY, at any indent. The first version demanded
    // two spaces, and ListingClient's early returns sit at FOUR because they
    // are inside `if (loading) {`. So it found no early return, checked
    // nothing, and reported ok for the very file whose bug it was written
    // for. A guard that passes vacuously is worse than no guard: it is a
    // claim that something was verified.
    // WHAT AN EARLY RETURN ACTUALLY LOOKS LIKE: a component returns JSX or
    // null. Matching every `return` at any indent was the opposite mistake
    // to matching only two spaces: a bare `return;` guarding a callback
    // inside a useEffect counted as one, and the guard failed on files that
    // were fine. Both versions were wrong in the same way, by describing
    // the shape of the text rather than the thing.
    const returns = [];
    body.lines.forEach((line, i) => {
      const t = line.trim();
      if (/^return \($/.test(t) || /^return </.test(t) || /^return null;?$/.test(t)) returns.push(i);
    });
    // The last is the component's own render; anything before it is early.
    if (returns.length < 2) continue;
    const firstEarlyReturn = returns[0];

    checked++;
    const offenders = [];
    body.lines.slice(firstEarlyReturn + 1).forEach((line, i) => {
      if (!HOOK.test(line)) return;
      if (!/^ {2}(const|let|useEffect|useLayoutEffect|useMemo|useCallback)/.test(line)) return;
      offenders.push(`line ${body.start + firstEarlyReturn + i + 2}: ${line.trim().slice(0, 56)}`);
    });
    ok(
      offenders.length === 0,
      offenders.length
        ? `${file} — ${body.name}() has a hook below its early return, ${offenders[0]}`
        : `${file.split("/").slice(-2).join("/")} ${body.name}()`,
    );
  }
}

ok(checked > 0, `${checked} client components have an early return, and each was checked`);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
