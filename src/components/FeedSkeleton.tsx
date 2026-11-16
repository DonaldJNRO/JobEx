"use client";

/**
 * What the wall looks like while the listings are on their way.
 *
 * THE SHAPE OF THE THING THAT REPLACES IT, which it was not. This was typed
 * out inside app/page.tsx and it got the wall wrong twice over.
 *
 * It was HARDCODED TO TWO COLUMNS while MasonryFeed takes its count from the
 * window: three at 980px, four at 1340, five at 1700. So every desktop
 * visitor waited in front of two fat columns and then watched the page
 * re-lay-out into four narrow ones. That is not a page settling, it is a
 * second page arriving. The count now comes from the same hook the wall uses,
 * so the two cannot drift apart again.
 *
 * And the CAPTION WAS A THIRD TOO SHORT. It drew two grey bars, 48px of
 * block; the real card carries three lines, about 83px: the name, then the
 * location and category, then the price. Every tile grew by ~35px when the
 * data landed, so a four-tile column pushed the footer and everything else
 * below it down by 140. The bars below are therefore drawn INSIDE the real
 * card's own type classes, with transparent text holding the line box open,
 * rather than as hand-picked heights that have to be kept in step by hand.
 * Change ListingCard's caption and this follows it.
 *
 * The ratios are the app's own skeleton pair (GridSkeleton.js:33), so both
 * surfaces wait in the same shape, and at two columns of four they are byte
 * for byte what was here before: nothing changes on a phone.
 */

import { useFeedColumns } from "@/lib/useFeedColumns";
import { waitingWall } from "@/lib/feed-columns";

/** One line of the caption: a grey bar exactly one line box tall. */
function Bar({ width }: { width: string }) {
  return (
    <span className={`inline-block ${width} rounded bg-surface-sunken align-middle`}>
      {/* A non-breaking space, not a height. The bar is as tall as a line of
          the type it stands in, whatever that type is set to. */}
      &nbsp;
    </span>
  );
}

export default function FeedSkeleton() {
  const columns = useFeedColumns();

  return (
    <div className="flex gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading places</span>
      {waitingWall(columns).map((column, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          {column.map((ratio, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-2xl bg-surface-sunken" style={{ aspectRatio: `1 / ${ratio}` }} />
              {/* ListingCard's caption, line for line. */}
              <div className="pt-3">
                <div className="font-semibold text-body leading-snug">
                  <Bar width="w-3/4" />
                </div>
                <div className="mt-1 text-small">
                  <Bar width="w-1/2" />
                </div>
                <div className="mt-1.5 text-body leading-snug">
                  <Bar width="w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
