// THE BOTTOM BAR'S HEIGHT IS ONE NUMBER.
//
// It was written three times: the shell padded the page by it, the chat
// column subtracted it, and the bar itself was it. A number written three
// times disagrees with itself, and it did the moment the keyboard opened:
// the viewport meta says interactive-widget=resizes-content, so every dvh
// SHRINKS when the keyboard appears, and the column then took a bar off an
// already-shrunken window while the shell still padded underneath. The
// composer floated half a screen above the keyboard over a band of cream.
//
// Run: tsx src/lib/app-bar-height.test.mjs

import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
const trips = readFileSync(new URL("../app/trips/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

// CODE, not comments. Twice now a note explaining WHY something moved has
// failed an assertion about the thing it moved away from. A note that cannot
// name its own subject is a note nobody can follow.
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s*\*.*$/gm, "");

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails += 1; } else console.log("  ok   " + l); };

console.log("\nthe height is declared once");
ok(/:root \{ --app-bar-h: calc\(4\.5rem \+ env\(safe-area-inset-bottom/.test(css),
  "a bar plus the home indicator under it");
ok(/:root\[data-kb="open"\] \{ --app-bar-h: 0px/.test(css),
  "zero while the keyboard is up, because the bar is not on screen");
ok(/min-width: 768px\) \{ :root \{ --app-bar-h: 0px/.test(css),
  "and zero from md, where the rail replaces it");

console.log("\nand read, never re-typed");
ok(/pb-\[var\(--app-bar-h\)\]/.test(shell), "the shell pads by the variable");
ok(/h-\[calc\(100dvh-4rem-var\(--app-bar-h\)\)\]/.test(trips), "the chat column subtracts the variable");
ok(!/4\.5rem/.test(code(trips)) && !/8\.5rem/.test(code(trips)),
  "and no copy of the number survives in the column's own markup");

console.log("\ntyping is detected by FOCUS, not by measuring the keyboard");
// The first version measured it: innerHeight minus visualViewport.height,
// keyboard past 120px. The founder's browser draws its address bar at the
// BOTTOM, so visualViewport is permanently shorter with no keyboard at all.
// The gap never fell under the threshold, the flag never cleared, and the
// tab bar stayed hidden on every page whether or not anyone was typing.
ok(!/visualViewport/.test(code(shell)),
  "no viewport arithmetic, which browser chrome can and did defeat");
ok(/focusin/.test(shell) && /focusout/.test(shell),
  "focus in and out, which is the thing itself rather than a side effect");
ok(/pointer: coarse/.test(shell),
  "and only where a focused field actually summons a keyboard");
ok(/root\.removeAttribute\("data-kb"\)/.test(shell),
  "the flag is cleared, or a page keeps hiding a bar nothing is covering");
ok(/\[data-kb="open"\] \[data-app-bar\] \{ display: none/.test(css),
  "and the bar hides while typing, as a native app does");
ok(/data-app-bar=""/.test(shell), "which needs the bar to carry the hook");

console.log("\nand the premise this all rests on");
ok(/interactive-widget=resizes-content|resizes-content/.test(layout),
  "the viewport opts into shrinking when the keyboard opens");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
