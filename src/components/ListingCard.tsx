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
import { Listing, getListingImage, getListingPriceParts, getListingLocation, getCategoryLabel, listingSlug } from "@/lib/listings";

export default function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const image = getListingImage(listing);
  const { amount, unit } = getListingPriceParts(listing);
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
        {/* THE NAME GETS THE WHOLE WIDTH. The rating used to sit on this line,
            so a card with one truncated and a card without did not, and the
            most important line on the card was cut short for a reason that had
            nothing to do with the business. "The Grove Apar…" was the tell.
            The rating moved down to the meta line, where it is the same kind
            of thing as the place: a fact about the listing, not its title. */}
        <h3 className="font-semibold text-[15px] text-ink leading-snug truncate">{name}</h3>

        <div className="mt-1 flex items-baseline justify-between gap-3 text-[13px] text-ink-muted">
          <span className="truncate">{[location, category].filter(Boolean).join(" · ")}</span>
          {listing.rating && (
            <span className="shrink-0 inline-flex items-center gap-1">
              <Star size={12} className="fill-ink text-ink" />
              {listing.rating}
            </span>
          )}
        </div>

        {/* A NUMBER WITH NO UNIT IS NOT A PRICE. A 500 gate fee and a 120,000
            apartment were set identically, in the same bold, with nothing to
            say which was a night and which was one person walking through a
            gate. The amount keeps the weight; the unit sits beside it in the
            muted colour, so the eye reads the number first and still learns
            what it buys. */}
        <p className="mt-1.5 text-[15px] leading-snug">
          {amount ? (
            <>
              <span className="font-semibold text-ink">{amount}</span>
              {unit && <span className="ml-1.5 text-[13px] text-ink-muted">{unit}</span>}
            </>
          ) : (
            // Not a price, so not set as one. It used to read "Contact host",
            // in price weight, in Airbnb's word rather than ours.
            <span className="text-[13px] text-ink-muted">Price on request</span>
          )}
        </p>
      </div>
    </Link>
  );
}
