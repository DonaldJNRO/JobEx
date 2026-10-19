// What a trip looks like in a list when it has no photo, and what its last
// message says when that message is not a sentence.
//
// MEASURED ON THE REAL DATA, 19 Oct 2026, across 41 trips:
//   - 31 have NO imageUrl, so a list that only renders a photo shows an empty
//     grey square for three quarters of somebody's trips.
//   - 4 carry the literal string "[object Object]" as lastMessage, because
//     something upstream handed an object to a field that holds a preview.
//     It is printed straight into the list.
//
// Both are small and both are the difference between a chat list that reads
// as a product and one that reads as a debug view.

/** Deterministic, so a trip keeps its colour for ever and across devices. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Drawn from the brand's own palette rather than a rainbow: purple is the
// product's colour and these are tints of it plus the gold accent, so a list
// of trips still looks like Sabię and not like a chart.
const TINTS = [
  "bg-primary/15 text-primary",
  "bg-secondary/25 text-ink",
  "bg-primary/25 text-primary-dark",
  "bg-ink/10 text-ink",
  "bg-primary/10 text-primary",
];

export interface TripAvatar {
  /** One or two letters. "May Trip" gives MT; "Vibes" gives V. */
  initials: string;
  /** Tailwind classes for the circle. */
  tint: string;
}

export function tripAvatar(name: string | null | undefined, id: string): TripAvatar {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  const initials = words.length === 0
    ? "?"
    : words.length === 1
      ? words[0].slice(0, 1).toUpperCase()
      : (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return { initials, tint: TINTS[hash(id || name || "") % TINTS.length] };
}

/**
 * The preview line, or null when there is nothing honest to show.
 *
 * Null rather than a placeholder, so the caller can fall back to something
 * true about the trip — how many people are in it — instead of printing a
 * fake message.
 */
export function previewOf(lastMessage: unknown): string | null {
  if (typeof lastMessage !== "string") return null;
  const t = lastMessage.trim();
  if (!t) return null;
  // The exact string four trips carry. It is what String(someObject) gives,
  // so it is a bug upstream, and printing it tells a person nothing except
  // that something is broken.
  if (t === "[object Object]" || t === "undefined" || t === "null") return null;
  return t;
}
