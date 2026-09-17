"use client";

/**
 * One themed row of listings.
 *
 * Scrolls sideways on purpose. A row that runs off the right edge says there
 * is more without having to show it, which is the whole reason the home page
 * is rows rather than one grid: twenty-eight listings in a grid reads as
 * everything we have.
 *
 * scroll-pl-4 is not decoration. `scroll-snap-align: start` snaps to the
 * SCROLLPORT edge and ignores padding, so without it the row silently scrolls
 * itself and eats the gutter it was just given. Same bug, same fix, as the
 * category pills.
 */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/listings";

export default function ListingRow({ title, href, items }: { title: string; href?: string; items: Listing[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-14 sm:mb-16">
      {/* THE HEADING IS THE WAY IN. "Stays in Lagos" names a filter, so it
          should be the filter. Rows that have no single filter behind them,
          New and the catch-all, stay plain text rather than pretending. */}
      <h2 className="text-xl sm:text-2xl text-ink mb-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {href ? (
          <Link href={href} className="group inline-flex items-center gap-1 hover:text-primary transition-colors">
            {title}
            <ChevronRight size={20} className="mt-0.5 text-ink-faint group-hover:text-primary transition-colors" />
          </Link>
        ) : (
          title
        )}
      </h2>
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 px-4 sm:px-6 lg:px-8 pb-2">
          {items.map((l, i) => (
            <div key={l.id} className="snap-start shrink-0 w-[70%] sm:w-[45%] lg:w-[23%]">
              <ListingCard listing={l} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
