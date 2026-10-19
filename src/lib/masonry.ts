// How tall a tile is, and which column it goes in.
//
// THE POINT OF DOING IT THIS WAY. Most masonry layouts measure images after
// they load and reflow around them, which is why they jump. Sabię's listings
// carry `coverAspectRatio` — backfilled, present on 60 of the 61 live ones —
// so the box can be reserved before a single byte of image arrives and the
// page never moves. That is the whole reason this is arithmetic and not a
// resize observer.
//
// The numbers here are the app's, not new ones: components/feed/GridCard.js
// clamps to the same bounds and falls back to the same six ratios, so a
// listing is the same shape on both surfaces.

/** Listings carry this; everything else about them is irrelevant here. */
export interface MasonryItem {
  id?: string;
  coverAspectRatio?: number | string | null;
}

// GridCard.js:52-53. 0.56 is 16:9 landscape, 2.2 is just past 9:16 portrait.
// Without the clamp one very tall photo makes a column nothing can balance.
const MIN = 0.56;
const MAX = 2.2;

// GridCard.js:196. Used when a listing has no usable ratio.
const FALLBACK = [1.3, 1.0, 1.5, 1.2, 1.4, 1.1];

/**
 * A stable number from a string.
 *
 * DETERMINISTIC ON PURPOSE. A random fallback height changes every time the
 * list re-filters, so switching tab or city visibly reshuffles the wall even
 * for cards that did not move. Hashing the id means a listing keeps its shape
 * for ever. Same reason GridCard.js:133 hashes rather than randomises.
 */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Tile height as a multiple of the column width.
 *
 * `coverAspectRatio` is width over height, so the height ratio is its
 * reciprocal: a 0.5 ratio (tall) becomes 2.
 */
export function heightRatioFor(item: MasonryItem | null | undefined): number {
  const raw = Number(item?.coverAspectRatio);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.max(MIN, Math.min(MAX, 1 / raw));
  }
  // No id either: give it the middle of the range rather than always the
  // first bucket, so a batch of unidentified items is not a flat block.
  const id = typeof item?.id === "string" ? item.id : "";
  return id ? FALLBACK[hash(id) % FALLBACK.length] : 1.3;
}

/**
 * Deal items into columns, shortest first.
 *
 * The same rule MasonryFlashList uses, and the reason the two sides finish
 * level instead of one trailing half a screen behind. Reading order is kept:
 * the next item goes to whichever column is currently shortest, so the wall
 * still reads roughly top to bottom.
 *
 * EVERY ITEM COMES OUT EXACTLY ONCE. That is not a detail: it is the
 * guarantee inherited from the named rows this replaced, whose own test said
 * an operator paying us to be invisible is worse than an untidy row.
 */
export function splitColumns<T extends MasonryItem>(items: T[], columns: number): T[][] {
  const n = Math.max(1, Math.floor(columns) || 1);
  const out: T[][] = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);

  for (const item of items || []) {
    let shortest = 0;
    for (let c = 1; c < n; c++) {
      if (heights[c] < heights[shortest]) shortest = c;
    }
    out[shortest].push(item);
    // Plus a constant for the text under each tile, or a column of tall
    // photos looks balanced by height and ragged by card count.
    heights[shortest] += heightRatioFor(item) + 0.35;
  }
  return out;
}
