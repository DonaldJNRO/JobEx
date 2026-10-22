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
ok(/h-\[calc\(var\(--app-h\)-4rem-var\(--app-bar-h\)\)\]/.test(trips),
  "the chat column measures the real window and subtracts the variable");
ok(!/4\.5rem/.test(code(trips)) && !/8\.5rem/.test(code(trips)),
  "and no copy of the number survives in the column's own markup");

console.log("\ntyping is detected by FOCUS, not by measuring the keyboard");
// The first version measured it: innerHeight minus visualViewport.height,
// keyboard past 120px. The founder's browser draws its address bar at the
// BOTTOM, so visualViewport is permanently shorter with no keyboard at all.
// The gap never fell under the threshold, the flag never cleared, and the
// tab bar stayed hidden on every page whether or not anyone was typing.
// visualViewport is used to MEASURE the window, which is what it is for.
// What it must never do again is infer the keyboard by subtraction: the
// founder's bottom address bar made that gap permanently keyboard-sized.
ok(!/innerHeight\s*-\s*vv\.height|vv\.height\s*-\s*window\.innerHeight/.test(code(shell)),
  "the typing flag is never inferred by subtracting one viewport from another");
ok(!/>\s*120/.test(code(shell)),
  "and no pixel threshold stands in for a question focus can answer");
ok(/focusin/.test(shell) && /focusout/.test(shell),
  "focus in and out, which is the thing itself rather than a side effect");
ok(/pointer: coarse/.test(shell),
  "and only where a focused field actually summons a keyboard");
ok(/root\.removeAttribute\("data-kb"\)/.test(shell),
  "the flag is cleared, or a page keeps hiding a bar nothing is covering");
ok(/\[data-kb="open"\] \[data-app-bar\] \{ display: none/.test(css),
  "and the bar hides while typing, as a native app does");
ok(/data-app-bar=""/.test(shell), "which needs the bar to carry the hook");

console.log("\nthe window is measured, because dvh is only right on one platform");
// interactive-widget=resizes-content makes dvh follow the keyboard on
// Chromium 108+. Safari ignores it and shrinks only the VISUAL viewport, and
// the CSSWG has an open issue saying there is no standards answer for a
// composer pinned under a scrolling thread. So dvh is right on Android and
// wrong on iPhone, and visualViewport.height is what both agree on.
ok(/resizes-content/.test(layout),
  "the meta still asks Chromium to shrink, which costs nothing and helps there");
ok(/:root \{ --app-h: 100dvh; \}/.test(css),
  "dvh is the fallback for the first paint and for anything without the API");
ok(/--app-h["'`,\s]*,?\s*`\$\{Math\.round\(vv\.height\)\}px`/.test(shell)
   || /setProperty\("--app-h"/.test(shell),
  "and script overwrites it with visualViewport.height");
ok(/Math\.round\(vv\.height\)/.test(shell),
  "rounded, or a fractional pixel reflows the page on every scroll");
ok(!/h-\[calc\(100dvh/.test(code(trips)),
  "no full-height surface still measures from dvh directly");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
