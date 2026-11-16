// How many columns the wall has, and what it looks like while it waits.
//
// WHY THIS IS ITS OWN FILE. The column count lived inside MasonryFeed and the
// waiting skeleton was typed out again in app/page.tsx with the number 2
// hardcoded. So on every desktop the page waited as TWO fat columns and then
// re-laid-out into three, four or five narrow ones the moment the listings
// landed. Not a settle: a different page. That is half of "it looks jangly".
//
// The other half was the card's own height. The skeleton drew two grey bars
// under each tile and the real card carries three lines (name, then location
// and category, then the price), so every tile GREW about 35px when the data
// arrived and a four-tile column shoved everything under it down by 140. Both
// halves are the same defect: the thing we show while waiting was not the
// shape of the thing that replaces it.
//
// Pure arithmetic, so it can be asserted on. The hook that reads the window
// is in useFeedColumns.ts, and both the feed and the skeleton take the count
// from it, which is what stops the two drifting apart again.

/**
 * Widths of the FEED, after the rail is taken out, to a column count.
 *
 * Two on a phone, as the app has. Then more as there is room: a 1920px
 * monitor showing three columns in a 1280px strip with white either side is a
 * page that does not know it is in a browser.
 */
export const FEED_BREAKS: ReadonlyArray<readonly [number, number]> = [
  [1700, 5],
  [1340, 4],
  [980, 3],
  [0, 2],
];

/** The column count for a window width. Two for anything unmeasurable. */
export function columnsForWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) return 2;
  return FEED_BREAKS.find(([min]) => width >= min)?.[1] ?? 2;
}

// THE WAITING WALL'S SHAPES, and they are the ones already on screen today.
//
// A grid of identical rectangles that resolves into a ragged wall is its own
// small jump, so the skeleton is ragged too. These eight values are exactly
// the two columns app/page.tsx used to carry as literals, in the same order,
// so a phone sees precisely what it saw before and only the wider screens
// change. Every one of them is inside masonry.ts's 0.56 to 2.2 clamp, which
// means the real wall can actually produce a tile this shape.
const WAITING_RATIOS = [1.33, 0.75, 1.5, 1.0, 0.75, 1.33, 1.21, 1.75] as const;

/** How many tiles each waiting column holds. Four is about a screen. */
export const WAITING_PER_COLUMN = 4;

/**
 * The waiting wall, as a height ratio per tile per column.
 *
 * Dealt down each column rather than across, so at two columns of four it is
 * byte for byte the pair that was hardcoded before.
 */
export function waitingWall(
  columns: number,
  perColumn: number = WAITING_PER_COLUMN,
): number[][] {
  const cols = Math.max(1, Math.floor(columns));
  const each = Math.max(1, Math.floor(perColumn));
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: each }, (_, i) => WAITING_RATIOS[(c * each + i) % WAITING_RATIOS.length]),
  );
}
