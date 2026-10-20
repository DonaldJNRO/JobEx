// WHAT IS DIFFERENT ON AN IPHONE.
//
// I cannot run iOS. These are the two Safari behaviours that silently undo
// layout work, both found by reading rather than by testing, and both
// affecting things built today.
//
// Run: tsx src/lib/ios-viewport.test.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

console.log("\nthe page asks to draw into the safe area");
// env(safe-area-inset-*) IS ZERO on iOS unless the viewport says
// viewport-fit=cover, and Next's default does not. So every bar and sheet
// that pads itself to clear the home indicator was padding by nothing, and
// sitting under it on every iPhone.
const LAYOUT = code("src/app/layout.tsx");
ok(/export const viewport/.test(LAYOUT), "there is a viewport export");
ok(/viewportFit:\s*"cover"/.test(LAYOUT), "set to cover, or every safe-area inset is zero");

const usesInset = [];
for (const dir of ["src/app", "src/components"]) {
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const f = join(d, n);
    return statSync(f).isDirectory() ? walk(f) : /\.tsx$/.test(n) ? [f] : [];
  });
  usesInset.push(...walk(dir).filter((f) => /safe-area-inset/.test(readFileSync(f, "utf8"))));
}
ok(usesInset.length > 0, `${usesInset.length} components pad for the home indicator, and now actually get an inset`);

console.log("\nand heights follow the URL bar rather than ignoring it");
// On iOS Safari 100vh is the height WITHOUT the browser chrome, so anything
// sized in vh is taller than what you can see and its bottom is cut off.
// dvh tracks the bar. Supported since iOS 15.4.
const files = [];
for (const dir of ["src/app", "src/components"]) {
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const f = join(d, n);
    return statSync(f).isDirectory() ? walk(f) : /\.(tsx|css)$/.test(n) ? [f] : [];
  });
  files.push(...walk(dir));
}
for (const f of files) {
  const src = code(f);
  const bad = [...src.matchAll(/(\d+)vh\b/g)].map((m) => m[0]);
  ok(bad.length === 0, bad.length ? `${f.split("/").pop()} still sizes in vh: ${bad[0]}` : `${f.split("/").pop()}`);
}

console.log("\nthe date fields are not blank boxes");
// Safari renders an empty <input type="date"> as NOTHING. No placeholder,
// no dd/mm/yyyy. Chrome draws its own hint, which is why this looked right
// everywhere except on the phone it was opened on.
const GAL = code("src/components/RoomGallery.tsx");
ok(/type="date"/.test(GAL), "the room screen asks for dates");
ok(/Add a date/.test(GAL), "and says so when they are empty, since Safari shows nothing");

console.log("\nand a date field can shrink to its column");
// Safari gives <input type="date"> an intrinsic width of its own, and a
// grid cell will not shrink below its content, so check in and check out
// grew past their columns, touched in the middle and ran off the right
// edge. Chrome lets them shrink, which is why this looked right until it
// was opened on an iPhone.
ok(/\[&>\*\]:min-w-0/.test(GAL), "the date grid's cells may shrink");
ok(/w-full min-w-0 appearance-none rounded-xl/.test(GAL), "and so may the inputs inside them");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
