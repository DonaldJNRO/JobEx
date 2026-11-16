// The waiting wall has to be the shape of the wall that replaces it.
//
// This file exists because it was not, and the failure was invisible to every
// check the repo had: the skeleton and the feed were two pieces of JSX in two
// files that happened to agree on a phone and disagreed on every desktop.
// Nothing imported anything, so nothing could be asserted. Now both read one
// module, and the last test here holds them to it by source.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { columnsForWidth, waitingWall, FEED_BREAKS, WAITING_PER_COLUMN } from "./feed-columns.ts";

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

test("two columns on a phone", () => {
  assert.equal(columnsForWidth(390), 2);
  assert.equal(columnsForWidth(979), 2);
});

test("widens at each break, and only at each break", () => {
  assert.equal(columnsForWidth(980), 3);
  assert.equal(columnsForWidth(1339), 3);
  assert.equal(columnsForWidth(1340), 4);
  assert.equal(columnsForWidth(1699), 4);
  assert.equal(columnsForWidth(1700), 5);
  assert.equal(columnsForWidth(3840), 5);
});

test("an unmeasurable window is two, never zero columns", () => {
  assert.equal(columnsForWidth(0), 2);
  assert.equal(columnsForWidth(-1), 2);
  assert.equal(columnsForWidth(NaN), 2);
  // Infinity is not a wide screen, it is a broken measurement, so it takes
  // the safe shape rather than the widest one.
  assert.equal(columnsForWidth(Infinity), 2);
});

test("the breaks descend, so find() reaches the right one", () => {
  const mins = FEED_BREAKS.map(([m]) => m);
  assert.deepEqual(mins, [...mins].sort((a, b) => b - a));
  assert.equal(mins[mins.length - 1], 0, "the last break must catch every width");
});

test("the phone's waiting wall is unchanged, byte for byte", () => {
  // The literal pair that was hardcoded in app/page.tsx before this module
  // existed. A phone must see exactly what it saw.
  assert.deepEqual(waitingWall(2, 4), [
    [1.33, 0.75, 1.5, 1.0],
    [0.75, 1.33, 1.21, 1.75],
  ]);
});

test("the waiting wall has as many columns as the wall", () => {
  for (const columns of [2, 3, 4, 5]) {
    const wall = waitingWall(columns);
    assert.equal(wall.length, columns);
    for (const column of wall) assert.equal(column.length, WAITING_PER_COLUMN);
  }
});

test("every waiting tile is a shape the real wall can produce", () => {
  // masonry.ts clamps a tile to between 0.56 and 2.2. A skeleton outside that
  // range promises a tile the wall will never draw.
  for (const ratio of waitingWall(5).flat()) {
    assert.ok(ratio >= 0.56 && ratio <= 2.2, `${ratio} is outside the wall's clamp`);
  }
});

test("the waiting wall is ragged, not a block of identical rectangles", () => {
  for (const column of waitingWall(5)) {
    assert.ok(new Set(column).size > 1, "a column of one repeated ratio resolves into a jump");
  }
});

test("a nonsense column count still returns a wall", () => {
  assert.equal(waitingWall(0).length, 1);
  assert.equal(waitingWall(-3).length, 1);
  assert.equal(waitingWall(2.7).length, 2);
});

// THE GUARD. The defect was never in the arithmetic, it was that two files
// held the same number separately. These assert that neither has gone back to
// holding its own.
test("the feed and the skeleton both take the count from the shared hook", () => {
  const feed = readFileSync(new URL("../components/MasonryFeed.tsx", import.meta.url), "utf8");
  const skeleton = readFileSync(new URL("../components/FeedSkeleton.tsx", import.meta.url), "utf8");

  for (const [name, src] of [["MasonryFeed", feed], ["FeedSkeleton", skeleton]]) {
    assert.match(src, /useFeedColumns\(\)/, `${name} must read the shared column count`);
    assert.doesNotMatch(src, /window\.innerWidth/, `${name} must not measure the window itself`);
    assert.doesNotMatch(
      src,
      /\[\s*1700\s*,/,
      `${name} must not carry its own copy of the breakpoints`,
    );
  }
});

test("the home page no longer draws a waiting wall of its own", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<FeedSkeleton \/>/, "the home page must use the shared skeleton");
  assert.doesNotMatch(
    page,
    /1\.21/,
    "a hardcoded tile ratio on the home page means the skeleton has been typed out again",
  );
});

test("the skeleton's caption is built from the card's own type classes", () => {
  // The old skeleton used h-4 and h-3, which is why it was 35px shorter than
  // the card per tile. The heights must come from the line box of the real
  // type, so that changing ListingCard's caption carries the skeleton with it.
  const skeleton = readFileSync(new URL("../components/FeedSkeleton.tsx", import.meta.url), "utf8");
  const card = readFileSync(new URL("../components/ListingCard.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(skeleton, /\bh-[34]\b/, "a hand-picked bar height drifts from the card");

  // The card's caption is three lines. The skeleton must draw three.
  assert.equal((skeleton.match(/<Bar /g) ?? []).length, 3);

  // And in the same type sizes, in the same order.
  for (const cls of ["text-body leading-snug", "text-small"]) {
    assert.ok(skeleton.includes(cls), `the skeleton must stand in ${cls}`);
    assert.ok(card.includes(cls), `the card no longer uses ${cls}; the skeleton needs updating`);
  }
});

console.log(`\n${n} passed`);
