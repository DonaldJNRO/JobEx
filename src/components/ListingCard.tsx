"use client";

/**
 * One place, on a card that is not a card.
 *
 * IT LOST ITS BOX. This was `rounded-2xl bg-card border border-line`: a bordered
 * panel with the photograph inside it. A grid of outlined boxes is the visual
 * language of an admin table, and it is most of what made the listings read as
 * a directory rather than somewhere you would spend money. Airbnb's cards have
 * no border and no background at all. The photograph is the card; the words sit
 * under it on the page. Space does the separating, not lines.
 *
 * THE PRICE WAS PRINTED TWICE. Once as a gold-on-black chip that faded in over
 * the image on hover, and again underneath. On a phone there is no hover, so
 * half of that was invisible to most people and noise to the rest.
 *
 * THE CATEGORY MOVED OFF THE PHOTOGRAPH. Every single card carried a dark
 * translucent "Experiences" pill over the top left corner. A badge that appears
 * on everything tells you nothing and costs you the corner of every image. The
 * word still appears, quietly, beside the location, which is where the rest of
 * the facts about the place already are.
 *
 * MOTION GOT QUIETER. The image zoomed 10% and a black gradient washed over it.
 * A 3% lift reads as responsive; 10% reads as a slideshow.
 */

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Listing, getListingImage, getListingPrice, getListingLocation, getCategoryLabel, listingSlug } from "@/lib/listings";

export default function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const image = getListingImage(listing);
  const price = getListingPrice(listing);
  const location = getListingLocation(listing);
  const name = listing.businessName || listing.title || "Listing";
  const category = getCategoryLabel(listing.role);

  return (
    <Link
      // The slug, not the document id, so the address a visitor can copy out of
      // their bar is the one we want them to have.
      href={`/listing/${listingSlug(listing)}`}
      className="group block"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-sunken">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint/40">
            <MapPin size={28} />
          </div>
        )}

        {/* The one badge worth keeping, because it is RARE. A label that appears
            on every card is decoration; one that appears on a few is a signal. */}
        {listing.isPromoted && (
          <span className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Featured
          </span>
        )}
      </div>

      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold text-[15px] text-ink leading-snug truncate">{name}</h3>
          {listing.rating && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[13px] text-ink-muted">
              <Star size={12} className="fill-ink text-ink" />
              {listing.rating}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-ink-muted truncate">
          {[location, category].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1.5 text-[15px] font-semibold text-ink">{price}</p>
      </div>
    </Link>
  );
}
