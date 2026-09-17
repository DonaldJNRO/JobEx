/**
 * Where a listing is, as one shape.
 *
 * ITS OWN FILE ON PURPOSE. `listings.ts` imports firebase/firestore at the top,
 * so anything living there cannot be loaded by plain node and cannot be tested
 * without standing up Firebase. `slug.ts` and `booking-shape.ts` are split the
 * same way for the same reason: the logic that can be quietly wrong is kept
 * where a test can reach it, and the Firestore calls are kept out of its way.
 *
 * WHAT IT FIXES. `location` is a string on older listings and an object on
 * anything Studio created, so every caller that reached in had to branch and
 * most handled one side only. The explore page's search is the clearest case:
 * it read `location` only when it was a string, so a listing stored the modern
 * way could not be found by typing its city.
 */

/** Only what this file reads. Structural, so it never imports the Listing type
 *  back out of listings.ts and makes a cycle. Same arrangement as slug.ts. */
export interface PlaceSource {
  citySlug?: string | null;
  areaSlug?: string | null;
  location?:
    | string
    | {
        address?: string;
        city?: string;
        area?: string;
        areaSlug?: string;
        name?: string;
      }
    | null;
}

/**
 * ONE SHAPE, whatever the document holds.
 *
 * `location` is a string on older listings and an object on anything Studio
 * created, so every caller that reached in had to branch, and most of them
 * only handled one side. The explore page's search is the clearest case: it
 * read `location` only when it was a string, so a listing stored the modern
 * way could not be found by typing its city.
 *
 * The slugs are what filtering and linking use; the label is the one line a
 * card shows. They are different jobs and conflating them is how "Port
 * Harcourt" and "port-harcourt" become two places.
 */
export interface ListingPlace {
  /** For a person: "Jos", "Port Harcourt". Empty when nothing is recorded. */
  city: string;
  /** For code: "jos", "port-harcourt". Stable across both stored shapes. */
  citySlug: string;
  area: string;
  areaSlug: string;
  /** The single line a card or a listing header shows. */
  label: string;
}

/**
 * The same rule as `slugifyArea` in sabie-admin and sabie-scout, and as
 * Studio's LocationInput. An area or city resolved in one place has to key the
 * same in all of them or one neighbourhood becomes two filters.
 */
function placeKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Turn a slug back into something readable, for the one case where a document
 * carries `citySlug` and no human city: "port-harcourt" to "Port Harcourt".
 *
 * A guess, and only used as a last resort. It cannot recover a name whose real
 * spelling contains a hyphen, which is why a stored human name always wins.
 */
function unslug(s: string): string {
  return (s || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function listingPlace(listing: PlaceSource): ListingPlace {
  const loc = listing.location;
  const isObject = typeof loc === "object" && loc !== null;

  // A string is written most-specific-first, "Rayfield, Jos, Plateau", so the
  // first segment is what a card should show. It is NOT reliably the city, and
  // this used to be read as one.
  const firstSegment = typeof loc === "string" ? loc.split(",")[0].trim() : "";

  const cityWord = isObject ? (loc.city || "").trim() : "";
  const areaWord = isObject ? (loc.area || "").trim() : "";

  // citySlug on the document wins: it is already normalised, and it is what
  // admin and the mobile app filter on.
  const citySlug = placeKey(listing.citySlug || cityWord);
  const areaSlug = placeKey(listing.areaSlug || (isObject ? loc.areaSlug || "" : "") || areaWord);

  const city = cityWord || (citySlug ? unslug(citySlug) : "");
  const area = areaWord || (areaSlug && !areaWord ? unslug(areaSlug) : "");

  const label = isObject
    ? loc.city || loc.name || loc.address || area || ""
    : firstSegment || city;

  return { city, citySlug, area, areaSlug, label };
}



/**
 * The cities actually present in a set of listings, commonest first.
 *
 * NOT a hardcoded list and not the `cities` collection. Either would offer a
 * city with nothing in it, and an option that always returns "No listings
 * found" is worse than no option at all: it reads as a broken site rather than
 * an empty one. Only somewhere with something in it gets offered.
 *
 * The count rides along because "Jos (4)" tells a person whether it is worth
 * the tap, and because a city with one listing is a fact worth seeing.
 */
export interface CityOption {
  slug: string;
  name: string;
  count: number;
}

/**
 * A city as the shared `cities` collection records it, which is the same
 * source Scout's picker and admin read. Only the two fields this needs.
 */
export interface KnownCity {
  /** Document id: "lagos", "port-harcourt". */
  id: string;
  name: string;
  /** The neighbourhoods inside it. "Ikeja" is one of these, not a city. */
  areas?: string[];
}

/**
 * Fold a place key onto its parent city.
 *
 * IKEJA IS IN LAGOS. It appeared in the filter as a city of its own, beside
 * Lagos, because a listing recorded its area in the city field. Offering both
 * splits one place in two and invites a traveller to pick the smaller half.
 *
 * Resolved against the shared `cities` collection rather than a list of
 * exceptions kept here: Ikeja is not special, it is simply an area, and a
 * hardcoded alias would be wrong again the first time a rep records Lekki or
 * Rayfield the same way. Unknown keys are left exactly as they are, because a
 * city we have never heard of is far more likely to be a real new city than a
 * mistake.
 */
export function parentCity(slug: string, known: KnownCity[]): string {
  if (!slug) return "";
  if (known.some((c) => placeKey(c.id) === slug || placeKey(c.name) === slug)) return slug;
  for (const c of known) {
    for (const area of c.areas ?? []) {
      if (placeKey(area) === slug) return placeKey(c.id) || placeKey(c.name);
    }
  }
  return slug;
}

export function citiesOf(listings: PlaceSource[], known: KnownCity[] = []): CityOption[] {
  const label = new Map<string, string>();
  for (const c of known) {
    const key = placeKey(c.id) || placeKey(c.name);
    if (key) label.set(key, c.name || unslug(key));
  }

  const seen = new Map<string, CityOption>();
  for (const l of listings) {
    const place = listingPlace(l);
    // No key means nothing to filter on. Listings with no recorded city are
    // still SHOWN, under Everywhere; they just cannot be narrowed to.
    if (!place.citySlug) continue;
    const slug = parentCity(place.citySlug, known);
    const hit = seen.get(slug);
    if (hit) hit.count++;
    else seen.set(slug, {
      slug,
      // The collection's spelling wins, so one city is named one way however
      // any single listing happened to store it.
      name: label.get(slug) || (slug === place.citySlug ? place.city || slug : unslug(slug)),
      count: 1,
    });
  }
  return [...seen.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Does this listing belong under the given city filter? Folds the same way
 *  citiesOf does, or a listing recorded in Ikeja disappears under Lagos. */
export function inCity(listing: PlaceSource, slug: string, known: KnownCity[] = []): boolean {
  if (!slug || slug === "all") return true;
  return parentCity(listingPlace(listing).citySlug, known) === slug;
}
