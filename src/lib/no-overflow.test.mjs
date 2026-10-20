// WHY EVERY SCREEN SIZE LOOKED WRONG AT ONCE.
//
// The listing page zoomed itself out. Not the hero, not the font: Chrome
// shrinks the whole document when the page is wider than the window, so the
// logo, the body text and the hero all looked small together and each one
// looked like its own bug.
//
// The cause is a rule that has bitten this ecosystem before and is written
// down in its own notes: A GRID OR FLEX ITEM DEFAULTS TO min-width: auto,
// so it refuses to shrink below its content. The room carousel scrolls
// horizontally and reached past the gutter with -mx-4, so the column grew
// to fit it, the grid grew to fit the column, and the page grew to fit the
// grid.
//
// Nothing fails to build. Nothing throws. The page just quietly stops
// fitting, which is invisible to every check in this repo and obvious in a
// photograph.
//
// Run: tsx src/lib/no-overflow.test.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

const files = ["src/app", "src/components"].flatMap(walk);
ok(files.length > 20, `scanning ${files.length} components`);

console.log("\na horizontal scroller never reaches past the page");
// -mx-* on a scroller is the edge-bleed trick. It is also exactly how a
// scroller widens its parent, and the bleed is not worth a document that
// zooms itself out.
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (!/overflow-x-auto|overflow-x-scroll/.test(line)) return;
    ok(
      !/(^|\s|")-m[xl]-\d/.test(line),
      `${file.split("/").pop()}:${i + 1} scroller does not use a negative margin to bleed past the gutter`,
    );
  });
}

console.log("\nand a column that holds one can shrink");
// This is the half that actually bit. A grid child with min-width: auto is
// sized by its widest content, and a scroller's content is as wide as it
// likes.
const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
ok(/<div className="grid lg:grid-cols-3 gap-10">/.test(PAGE), "the listing page still has its two column grid");
ok(/className="min-w-0 lg:col-span-2/.test(PAGE), "whose main column may shrink below its content");
ok(/className="min-w-0 lg:col-span-1"/.test(PAGE), "and so may the sidebar");

console.log("\nevery grid or flex child holding a scroller says min-w-0");
for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (!/overflow-x-auto/.test(src)) continue;
  // The scroller's own ancestors in this file: any col-span or flex-1 that
  // wraps it has to be allowed to shrink.
  const risky = [...src.matchAll(/className="([^"]*(?:col-span-\d|flex-1)[^"]*)"/g)]
    .map((m) => m[1])
    .filter((c) => !/min-w-0/.test(c));
  ok(
    risky.length === 0,
    risky.length
      ? `${file.split("/").pop()} has a sizing parent without min-w-0: "${risky[0].slice(0, 60)}"`
      : `${file.split("/").pop()}`,
  );
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
