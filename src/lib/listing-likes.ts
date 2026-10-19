// How many people liked this, and when to say so.
//
// THREE SPELLINGS, ALL REAL. The app reads `likesCount || likes || fireCount`
// (useForYouData.js:851) because listings were written by different paths over
// time. 59 of the 61 live listings carry one of them, and 58 of those agree
// exactly with the `likes` subcollection they denormalise, so the number on a
// card is trustworthy and free: no extra read per tile.
//
// ZERO SHOWS NOTHING. Not a zero, not a dash. The app gates on `likes > 0`
// (GridCard.js:1056) and it is right to: a row of cards each proudly
// displaying 0 is worse than a row with no numbers on it.
//
// AND IT IS BOUNDED. One production listing, "Sabię Founder Test", carries
// 1,000,002 against a real 3 — somebody typed a number into a test record. A
// card claiming a million likes does not just look wrong, it discredits the 3
// and the 8 on the cards beside it. Anything past a sane ceiling is treated as
// unknown and shown as nothing, which is the honest answer for a figure we do
// not believe.

export interface LikeSource {
  likesCount?: number;
  likes?: number;
  fireCount?: number;
}

/**
 * The ceiling. Sabię's most-liked listing has 8 and the whole platform has
 * 145, so five figures is already far past anything real; past that the value
 * is data entry, not popularity. Raise it the day a listing legitimately
 * nears it.
 */
const BELIEVABLE = 100_000;

/** The count, or null when there is nothing worth showing. */
export function likeCountOf(listing: LikeSource | null | undefined): number | null {
  for (const raw of [listing?.likesCount, listing?.likes, listing?.fireCount]) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const n = Math.floor(raw);
    if (n <= 0) return null;
    if (n > BELIEVABLE) return null;
    return n;
  }
  return null;
}

/** 1.2K rather than 1200, as the app's formatCount does. */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
