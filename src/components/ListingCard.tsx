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
import { MapPin, Star, Heart } from "lucide-react";
import { Listing, getListingImage, getListingPriceParts, getListingLocation, getCategoryLabel, listingSlug } from "@/lib/listings";
import { useMoney } from "@/lib/useRates";
import { heightRatioFor } from "@/lib/masonry";
import { likeCountOf, formatCount } from "@/lib/listing-likes";

export default function ListingCard({
  listing,
  index = 0,
  // THE WALL'S FACE. In a row every card is aspect-[4/3] and `sizes` can name
  // the row's widths. In the masonry the tile's height comes from the
  // listing's own cover ratio and the column is a different width at every
  // breakpoint, so BOTH have to change together: a stale `sizes` makes the
  // browser fetch the wrong file on every card at once.
  masonry = false,
}: {
  listing: Listing;
  index?: number;
  masonry?: boolean;
}) {
  const image = getListingImage(listing);
  // THE VISITOR'S OWN MONEY. A card used to print the operator's currency, so
  // somebody in London scrolling Lagos listings saw ₦ figures with no way to
  // tell what anything cost. Falls back to the operator's price whenever the
  // rates are not in, which is never wrong, only less useful.
  const money = useMoney();
  const { amount, unit, from } = getListingPriceParts(listing, money);
  const location = getListingLocation(listing);
  const name = listing.businessName || listing.title || "Listing";
  const category = getCategoryLabel(listing.role);
  // Null when there is nothing worth showing: no likes, or a figure we do not
  // believe. See listing-likes.ts.
  const likes = likeCountOf(listing);

  return (
    <Link
      // The slug, not the document id, so the address a visitor can copy out of
      // their bar is the one we want them to have.
      href={`/listing/${listingSlug(listing)}`}
      // THE TAP HAS TO ANSWER. Opening a listing awaits a server read, so
      // for the length of that read nothing on screen moved and the card
      // gave no sign it had been pressed. A press state plus loading.tsx is
      // the difference between slow and broken: the finger gets an answer
      // immediately and the page arrives when it arrives.
      className="group block transition-transform duration-150 ease-out active:scale-[0.985]"
      style={{ animationDelay: `${index * 0.06}s` }}
      // THE PHOTO YOU TAPPED BECOMES THE PHOTO AT THE TOP.
      //
      // A view transition name has to be UNIQUE in the document, and this
      // wall renders sixty cards, so naming them all `listing-hero` would
      // name none of them. The name is therefore put on ONE card at the
      // moment it is tapped, and taken off again if the navigation never
      // happens, which is what makes the morph pick the right photo.
      onClick={(e) => {
        const box = (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-hero]");
        if (!box) return;
        box.style.viewTransitionName = "listing-hero";
        // A back-navigation, or a cancelled tap, must not leave the name
        // behind: the next card tapped would then collide with it.
        window.setTimeout(() => { box.style.viewTransitionName = ""; }, 1200);
      }}
    >
      <div
        data-hero
        className={`relative overflow-hidden rounded-2xl bg-surface-sunken ${masonry ? "" : "aspect-[4/3]"}`}
        // THE BOX IS RESERVED BEFORE THE IMAGE ARRIVES. The ratio is stored on
        // the listing, so the tile is already the right height on the first
        // paint and the wall does not jump when the photos land. That is the
        // whole reason the masonry reads the document rather than measuring.
        style={masonry ? { aspectRatio: `1 / ${heightRatioFor(listing)}` } : undefined}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes={masonry
              ? "(max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 25vw"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint/40">
            <MapPin size={28} />
          </div>
        )}

        {/* The one badge worth keeping, because it is RARE. A label that appears
            on every card is decoration; one that appears on a few is a signal. */}
        {listing.isPromoted && (
          <span className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm text-ink text-caption font-semibold px-2.5 py-1 rounded-full shadow-sm">
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
        <h3 className="font-semibold text-body text-ink leading-snug truncate">{name}</h3>

        <div className="mt-1 flex items-baseline justify-between gap-3 text-small text-ink-muted">
          <span className="truncate">{[location, category].filter(Boolean).join(" · ")}</span>
          {listing.rating ? (
            <span className="shrink-0 inline-flex items-center gap-1">
              <Star size={12} className="fill-ink text-ink" />
              {listing.rating}
            </span>
          ) : likes !== null ? (
            // HOW MANY PEOPLE LIKED IT, AND IT IS NOT A BUTTON.
            //
            // The heart on this site was deleted on purpose: it wrote a real
            // save and there was no page anywhere that listed saves, so it
            // filed things where nobody could look at them. That is still
            // true, so this does not bring one back. It is social proof, the
            // same job the rating does and in the same slot, which is why a
            // rated listing shows its rating instead: two numbers competing
            // in one corner is the clutter the rating was moved here to
            // avoid.
            //
            // Nothing is shown at zero, exactly as the app does. A row of
            // cards each displaying 0 is worse than a row with no numbers.
            <span className="shrink-0 inline-flex items-center gap-1" aria-label={`${likes} ${likes === 1 ? "person likes" : "people like"} this`}>
              <Heart size={12} className="text-ink-faint" aria-hidden="true" />
              {formatCount(likes)}
            </span>
          ) : null}
        </div>

        {/* A NUMBER WITH NO UNIT IS NOT A PRICE. A 500 gate fee and a 120,000
            apartment were set identically, in the same bold, with nothing to
            say which was a night and which was one person walking through a
            gate. The amount keeps the weight; the unit sits beside it in the
            muted colour, so the eye reads the number first and still learns
            what it buys. */}
        <p className="mt-1.5 text-body leading-snug">
          {amount ? (
            <>
              {/* "from" BEFORE the number, because that is where a reader
                  expects it and because the number alone is a different
                  claim. Naileditbyd read "£2", her cheapest add on, next to
                  acrylics that start at eight times that. */}
              {from && <span className="text-small text-ink-muted mr-1">from</span>}
              <span className="font-semibold text-ink">{amount}</span>
              {unit && <span className="ml-1.5 text-small text-ink-muted">{unit}</span>}
            </>
          ) : (
            // Not a price, so not set as one. It used to read "Contact host",
            // in price weight, in Airbnb's word rather than ours.
            <span className="text-small text-ink-muted">Price on request</span>
          )}
        </p>
      </div>
    </Link>
  );
}
