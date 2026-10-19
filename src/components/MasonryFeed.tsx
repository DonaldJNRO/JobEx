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

import { useEffect, useState } from "react";
import ListingCard from "./ListingCard";
import { splitColumns } from "@/lib/masonry";
import { getListingImage, type Listing } from "@/lib/listings";

// COLUMNS FOLLOW THE WINDOW, not a fixed pair.
//
// Two on a phone, as the app has. Then more as there is room, because a
// 1920px monitor showing three columns in a 1280px strip with white either
// side is a page that does not know it is in a browser. Measured against the
// rail: these are widths of the FEED, after the 224px sidebar is taken out.
const BREAKS: [number, number][] = [
  [1700, 5],
  [1340, 4],
  [980, 3],
  [0, 2],
];

export default function MasonryFeed({ listings }: { listings: Listing[] }) {
  // Server-render two columns, which is the phone shape and the common case,
  // then widen once the browser can say so. Rendering three on the server and
  // two on the client would reflow the whole wall on hydration.
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      setColumns(BREAKS.find(([min]) => w >= min)?.[1] ?? 2);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

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
