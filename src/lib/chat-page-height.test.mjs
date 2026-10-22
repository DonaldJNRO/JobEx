// The chat page must be exactly as tall as the window, not a tab bar more.
//
// Three fixes for "the header scrolls away" went out in one afternoon and
// each was worse than the last, because each reached for the keyboard
// instead of adding the page up. The sum was the bug:
//
//   main's pt-16                     4.0rem   clears the fixed navbar
//   the chat column, 100dvh - 4rem 100dvh - 4rem
//   AppShell's pb              4.5rem + safe   clears the fixed tab bar
//   ----------------------------------------------------------------
//   total                      100dvh + 4.5rem + safe
//
// One tab bar too tall, so the page scrolled by one tab bar, and what
// scrolled away was the header and its back arrow.
//
// This holds the identity rather than the strings: the bar is subtracted
// from the column AND cancelled from the shell's padding, which is the step
// the first attempt missed when it counted the bar twice.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(here, "..", ...p), "utf8");
const layout = src("app", "layout.tsx");
const shell = src("components", "AppShell.tsx");
const trips = src("app", "trips", "page.tsx");

// CODE, not comments: the note above the className explains the sum and has
// to be able to name the numbers it is about.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

let fails = 0;
const ok = (cond, name) => {
  if (cond) console.log(`  ok   ${name}`);
  else { fails += 1; console.log(`  FAIL ${name}`); }
};

console.log("=== THE CHAT PAGE ADDS UP ===\n");

console.log("the two pieces of chrome it has to clear");
ok(/<main className="pt-16">/.test(layout),
  "the navbar is fixed and main pads 4rem (pt-16) for it");
const BAR = "calc(4.5rem+env(safe-area-inset-bottom,0px))";
ok(code(shell).includes(`pb-[${BAR}]`),
  "the tab bar is fixed and the shell pads 4.5rem plus the safe area for it");

console.log("\nand the chat column counts each of them exactly once");
const col = code(trips).match(/h-\[calc\(100dvh([^\]]*)\)\]/)?.[1] ?? "";
ok(col.includes("-4rem"), "it subtracts the navbar, which main padded above it");
ok(col.includes("-4.5rem") && col.includes("env(safe-area-inset-bottom,0px)"),
  "and the tab bar, which the shell padded below it");
ok(code(trips).includes(`-mb-[${BAR}]`),
  "THE STEP THE FIRST ATTEMPT MISSED: it cancels the shell's padding, so the "
  + "bar is counted once and not twice");

console.log("\nso the sum is the window, and the page does not scroll");
// 4rem (pt) + [100dvh - 4rem - bar] (column) + bar (pb) - bar (mb)
//   = 100dvh - bar, which ends exactly on top of the tab bar.
ok(col.includes("-4rem") && col.includes("-4.5rem") && code(trips).includes(`-mb-[${BAR}]`),
  "4rem + (100dvh - 4rem - bar) + bar - bar = 100dvh - bar");

console.log("\nfrom md there is no tab bar, so both terms go to zero");
ok(/md:h-\[calc\(100dvh-4rem\)\]/.test(code(trips)), "the column stops subtracting it");
ok(/md:mb-0/.test(code(trips)), "and stops cancelling a padding that is no longer applied");
ok(/md:pb-0/.test(code(shell)), "because the shell stops applying it");

console.log("\nand the skeleton is the same height as the thing it stands in for");
const fallback = code(trips).match(/Suspense fallback=\{<div className="([^"]+)"/)?.[1] ?? "";
ok(fallback.includes("-4.5rem") && fallback.includes("md:h-[calc(100dvh-4rem)]"),
  "or the page jumps as it resolves");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
