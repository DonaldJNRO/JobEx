// Does this listing match what somebody typed?
//
// Lifted out of /explore, which was otherwise the home page with a search box
// on it. One feed, one rule, and a rule that can be tested rather than one
// buried in a useMemo.
//
// EVERY PART OF THE PLACE IS SEARCHABLE, in both stored shapes. `location` is
// a string on older documents and an object on anything Studio created, and
// the previous version read it only when it was a string: a listing created
// in Studio could not be found by typing its own city.

import { listingPlace } from "./listing-place";

export interface SearchSource {
  businessName?: string;
  title?: string;
  description?: string;
  location?: unknown;
  city?: string;
  area?: string;
}

/**
 * Case-insensitive substring across the name, the place and the description.
 *
 * Substring rather than prefix, deliberately: somebody looking for a place
 * they half remember types the middle of its name, and a catalogue of 61 is
 * small enough that the looser match costs nothing and finds more.
 */
export function matchesSearch(listing: SearchSource, term: string): boolean {
  const q = (term || "").trim().toLowerCase();
  if (!q) return true;

  const place = listingPlace(listing as Parameters<typeof listingPlace>[0]);

  // THE RAW LOCATION TOO, WHEN IT IS A STRING, and this is not belt and
  // braces. listingPlace on "Victoria Island, Lagos" returns
  // label: "Victoria Island" and an EMPTY city: it takes the first segment and
  // cannot tell which of the rest is the city. So searching the resolved place
  // alone cannot find that listing by typing "Lagos" — which is the bug
  // /explore's own comment claimed to have fixed, and had not. Found by the
  // test below, not by reading.
  const rawLocation = typeof listing.location === "string" ? listing.location : "";

  const haystack = [
    listing.businessName,
    listing.title,
    place.label,
    place.city,
    place.area,
    rawLocation,
    listing.city,
    listing.area,
    listing.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
