"use client";

// The wall. Two columns on a phone, three on a wide desktop.
//
// WHY COLUMNS AND NOT CSS `columns`. The CSS multi-column property does the
// same thing in one line, and lays items out in a way nobody reads: it fills
// the first column to the bottom before starting the second, so the newest
// listing can sit at the foot of the left column and the oldest at the top of
// the right. Dealing them shortest-first keeps reading order roughly top to
// bottom AND keeps the two sides level. That rule is in src/lib/masonry.ts,
// where it is tested.
//
// NOTHING MOVES WHEN THE IMAGES LAND. Every tile's height comes from the
// listing's stored coverAspectRatio, so the boxes are already the right size
// on the first paint. Most masonry implementations measure after load and
// reflow, which is the jump this exists to avoid.
//
// A LISTING WITH NO IMAGE IS NOT RENDERED, which is what the app does
// (GridCard.js:745). One live listing has no photo at all, and a grey
// rectangle in a wall of photographs reads as broken rather than as missing.

import ListingCard from "./ListingCard";
import { splitColumns } from "@/lib/masonry";
import { useFeedColumns } from "@/lib/useFeedColumns";
import { getListingImage, type Listing } from "@/lib/listings";

export default function MasonryFeed({ listings }: { listings: Listing[] }) {
  // COLUMNS FOLLOW THE WINDOW, and the count comes from the shared hook so
  // the skeleton on the home page cannot disagree with the wall that replaces
  // it. It did: the skeleton was hardcoded to two, so every desktop visitor
  // watched the page re-lay-out from two columns into four at the moment the
  // listings landed. See lib/feed-columns.ts.
  const columns = useFeedColumns();

  const shown = listings.filter((l) => getListingImage(l));
  const split = splitColumns(shown, columns);

  if (shown.length === 0) return null;

  return (
    // FULL WIDTH, not a centred 1280px column. The rail already takes 224px
    // out of the window; centring what is left inside another cap put the
    // feed in a narrow strip with empty space on both sides of a large
    // screen. An app fills its window.
    <div className="flex gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
      {split.map((column, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          {column.map((listing, j) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              masonry
              // The stagger runs down each column rather than across the
              // whole list, so the two sides animate in together instead of
              // the right-hand one trailing the left.
              index={j}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
