// The wall must not move, and must not lose anybody.
//
// Two failures matter here and both are quiet. A tile whose height is not
// known before the image loads makes the page jump, which is the thing using
// the stored coverAspectRatio is meant to prevent. And a listing that falls
// out of the column split is simply invisible — the guarantee inherited from
// the named rows this replaced, whose test said "an operator paying us to be
// invisible is worse than an untidy row".
//
// Run: tsx src/lib/masonry.test.mjs

import { heightRatioFor, splitColumns } from "./masonry.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const near = (a, b) => Math.abs(a - b) < 0.0001;

console.log("\nthe stored ratio decides the height");
// coverAspectRatio is width/height, so the height ratio is its reciprocal.
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 1 }), 1), "square is 1");
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 2 }), 0.56), "a 2.0 wide photo clamps to the floor");
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 1.5 }), 1 / 1.5), "landscape is shorter than wide");
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 0.8 }), 1.25), "portrait is taller");

console.log("\nthe clamp, which is what stops one photo owning a column");
// GridCard.js:52-53 — 0.56 is 16:9, 2.2 is just past 9:16.
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 0.1 }), 2.2), "a very tall photo stops at 2.2");
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 9 }), 0.56), "a very wide one stops at 0.56");
// The real extremes in production today are 0.46 and 1.90.
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 0.46 }), 2.173913), "the tallest real listing is inside the clamp");
// 1/1.9 is 0.526, BELOW the 0.56 floor, so the widest real listing clamps.
// The clamp is not theoretical: it bites on live data at the wide end, and
// the app's own note says it catches exactly one of its 72 items.
ok(near(heightRatioFor({ id: "a", coverAspectRatio: 1.9 }), 0.56), "the widest real listing clamps to the floor");

console.log("\na missing or broken ratio never throws, and never returns zero");
// A zero height would collapse the tile and the image would overflow it.
for (const bad of [0, -1, NaN, null, undefined, "", "tall", {}, Infinity]) {
  const r = heightRatioFor({ id: "x", coverAspectRatio: bad });
  ok(Number.isFinite(r) && r >= 0.56 && r <= 2.2, `${JSON.stringify(bad)} -> a usable ${r.toFixed(2)}`);
}
ok(Number.isFinite(heightRatioFor(null)), "a null item still answers");
ok(Number.isFinite(heightRatioFor(undefined)), "so does undefined");

console.log("\nthe fallback is STABLE, or the wall reshuffles on every filter");
const a1 = heightRatioFor({ id: "abc" });
const a2 = heightRatioFor({ id: "abc" });
ok(a1 === a2, "the same id gives the same height twice");
ok(heightRatioFor({ id: "abc" }) !== heightRatioFor({ id: "zzz" }) ||
   heightRatioFor({ id: "abc" }) !== heightRatioFor({ id: "qqq" }),
  "different ids do not all collapse to one height");
// A numeric ratio must win over the hash, or a real photo gets a made-up shape.
ok(near(heightRatioFor({ id: "abc", coverAspectRatio: 1 }), 1), "a real ratio beats the fallback");

console.log("\nevery listing comes out exactly once");
const items = Array.from({ length: 61 }, (_, i) => ({ id: `l${i}`, coverAspectRatio: 0.5 + (i % 15) / 10 }));
for (const cols of [1, 2, 3, 4]) {
  const split = splitColumns(items, cols);
  const flat = split.flat();
  ok(flat.length === items.length, `${cols} column(s): ${flat.length} of ${items.length} kept`);
  ok(new Set(flat.map((i) => i.id)).size === items.length, `${cols} column(s): nobody duplicated`);
  ok(split.length === cols, `${cols} column(s): that many columns`);
}

console.log("\nthe columns finish level");
const split = splitColumns(items, 2);
const tall = split.map((c) => c.reduce((h, i) => h + heightRatioFor(i) + 0.35, 0));
// Shortest-first cannot be perfect, but it must not be a landslide.
ok(Math.abs(tall[0] - tall[1]) < 3, `within ${Math.abs(tall[0] - tall[1]).toFixed(2)} of each other`);

console.log("\nthe same input gives the same columns");
const first = splitColumns(items, 2).map((c) => c.map((i) => i.id).join(","));
const again = splitColumns(items, 2).map((c) => c.map((i) => i.id).join(","));
ok(first[0] === again[0] && first[1] === again[1], "stable across calls");

console.log("\nthe shapes a render can hand it");
ok(splitColumns([], 2).length === 2, "empty gives empty columns, not nothing");
ok(splitColumns(null, 2).flat().length === 0, "null does not throw");
ok(splitColumns(items, 0).length === 1, "zero columns is one column, not a crash");
ok(splitColumns(items, -3).length === 1, "negative likewise");

// ── THE GUARANTEE INHERITED FROM THE NAMED ROWS ──────────────────────────
//
// home-rows.ts built up to 7 rows of up to 12 and its test said, in capitals,
// that nothing may go missing: a thin listing had to stay reachable "one card
// and all", because an operator paying us to be invisible is worse than an
// untidy row. Seven capped rows CAN drop a listing. A wall cannot, and this is
// where that promise now lives.
console.log("\nnothing goes missing, whatever the data looks like");
{
  const awkward = [
    { id: "no-ratio" },
    { id: "zero", coverAspectRatio: 0 },
    { id: "negative", coverAspectRatio: -2 },
    { id: "string", coverAspectRatio: "1.2" },
    { id: "huge", coverAspectRatio: 99 },
    { id: "tiny", coverAspectRatio: 0.01 },
    { coverAspectRatio: 1 },
  ];
  const out = splitColumns(awkward, 2).flat();
  ok(out.length === awkward.length, `all ${awkward.length} awkward listings survive the split`);
  // The one with no id must still be placed: a listing without an id is a
  // data problem, not a reason to hide a business.
  ok(out.some((i) => i.id === undefined), "even the one with no id is placed");
}

// A single listing must not need a full column's worth of friends to appear.
ok(splitColumns([{ id: "only", coverAspectRatio: 1 }], 3).flat().length === 1,
  "one listing in a three-column wall still renders");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
