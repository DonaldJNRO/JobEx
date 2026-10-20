// EVERY FULL-SCREEN SURFACE IS BOUNDED ON A LAPTOP.
//
// The room screen was `fixed inset-0` with no width constraint in the file.
// Right at 390px, horrible at 1280: a room photo stretched across the whole
// monitor, a date field 630px wide for eight characters, and a price at the
// far left with its own button 1,200px away at the far right.
//
// Nothing was broken. Nothing was bounded either, and a thing nobody
// bounded is a thing that looks designed for one screen and abandoned on
// every other. This sweeps rather than spot-checks because spot-fixing one
// case and missing its sibling is the mistake of the day.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ck = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) fails++; };

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name);
  return e.isDirectory() ? walk(p) : (/\.tsx$/.test(e.name) ? [p] : []);
});

const files = [...walk("src/components"), ...walk("src/app")];

// A surface that covers the window must say how wide it is willing to be.
const unbounded = [];
for (const f of files) {
  const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  if (/<ScreenPanel/.test(src)) continue;          // bounded BY the shell
  if (!/(<input|<select|<textarea|<h1|<h2|<p className)/.test(src)) continue;

  // THE ELEMENT ITSELF, not the file. The first version of this asked
  // whether "max-w-" appeared ANYWHERE in the source, and RoomGallery has a
  // max-w-xs on a date label, so unwrapping the whole screen still passed.
  // Ninth time a guard in this family matched a spelling instead of the
  // thing it cares about. Read the className that carries `fixed inset-0`
  // and ask whether THAT is capped.
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{cx\(([\s\S]*?)\)\})/g)) {
    const cls = m[1] ?? m[2] ?? m[3] ?? "";
    if (!/fixed inset-0/.test(cls)) continue;
    if (/(max-w-|md:max-w)/.test(cls)) continue;

    // A BACKDROP IS NOT AN UNBOUNDED SCREEN. The booking sheet and the city
    // picker cover the window on purpose, to CENTRE a capped child: the
    // outer element positions, the inner one is `sm:max-w-md`. Both were
    // already right, and a guard that called them wrong would have been
    // retuned until it stopped reporting anything.
    const isBackdrop = /justify-center/.test(cls) && /\bsm:max-w-|\bmd:max-w-|\bmax-w-/.test(src.replace(cls, ""));
    if (isBackdrop) continue;

    unbounded.push(`${f} → "${cls.slice(0, 60)}…"`);
  }
}
ck(unbounded.length === 0,
  `every full-screen surface with reading content caps its width${unbounded.length ? ": " + unbounded.join(", ") : ""}`);

// The shared shell exists and does the job, so the next screen inherits it.
const PANEL = readFileSync("src/components/ui/ScreenPanel.tsx", "utf8");
ck(/md:max-w-/.test(PANEL), "the shared screen shell caps its width");
ck(/md:max-h-\[90dvh\]/.test(PANEL), "and its height, in dvh, since a phone's vh lies");
ck(/md:rounded-/.test(PANEL), "and reads as a panel rather than a torn-off page");
ck(/onClose/.test(PANEL) && /md:absolute md:inset-0/.test(PANEL),
  "and the dimmed ground closes it, which is the gesture a panel teaches");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
