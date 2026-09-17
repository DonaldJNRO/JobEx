import { collection, getDocs, doc, getDoc, query, limit, where, orderBy, startAt, endAt, documentId } from "firebase/firestore";
import { db } from "./firebase";
import { makeSlug, slugCandidates, looksLikeSlug, slugForListing } from "./slug";
import { listingPlace, type KnownCity } from "./listing-place";
import { CATEGORY_ROLES, categoryLabelOfRole, type ListingRole } from "./categories";

export { listingPlace, citiesOf, inCity, parentCity, areaIndexFrom } from "./listing-place";
export type { ListingPlace, CityOption, KnownCity, AreaIndex } from "./listing-place";

// The one role-to-category table. Re-exported so everything that already
// imports from listings.ts keeps working, the same arrangement as listing-place.
export { CATEGORY_ROLES, CATEGORY_LABELS, categoryOfRole, categoryLabelOfRole } from "./categories";
export type { ListingRole } from "./categories";


const ROLE_COLLECTIONS: ListingRole[] = [
  "Landlord", "Host", "HospitalityManager", "ExperienceProviders", "EventOrganizer", "FoodBeverageManager",
];

export interface Listing {
  id: string;
  role: string;
  title?: string;
  businessName?: string;
  description?: string;
  imageUrls?: { url: string }[];
  coverImage?: string;
  customPrice?: { price: number; model?: string };
  pricingUnit?: string;
  currency?: string;
  /**
   * TWO SHAPES, AND BOTH ARE REAL. Older documents store a single string,
   * "Rayfield, Jos, Plateau". Anything created through Studio's LocationInput
   * stores the object, and stores MORE of it than this type used to admit:
   * the fields below are LocationData in sabie-studio/src/components/
   * LocationInput.tsx, field for field.
   *
   * Understating a stored shape is not a harmless omission here. The same
   * mistake on `subCategory`, recorded a few lines down, emptied the type pill
   * and the Type row on every listing page, and nothing looked broken while it
   * did. Read this through listingPlace() rather than reaching in.
   */
  location?:
    | string
    | {
        address?: string;
        city?: string;
        area?: string;
        areaSlug?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        name?: string;
        latitude?: number;
        longitude?: number;
        placeId?: string;
      };
  coordinates?: { latitude: number; longitude: number };
  rating?: number;
  subCategory?: string | { id: string; name: string };
  amenities?: string[];
  selectedAmenities?: string[];
  userId?: string;
  businessName_lower?: string;
  status?: string;
  isPromoted?: boolean;
  createdAt?: { seconds: number };
  category?: string;
  viewsCount?: number;
  views?: number;
  // The human link. Written by admin when a listing is published; absent on
  // every listing created before slugs existed, which listingSlug() covers.
  slug?: string;
  // Already on every ad document and already normalised the way a slug wants
  // it: "abuja", "port-harcourt". Preferred over digging into location.
  citySlug?: string;
  areaSlug?: string;
  listingName?: string;
  // The real shape of subCategory in Firestore is a STRING key
  // ("adventure_outdoor") with the human label in its own field. The object
  // form below it is what this file used to assume, and assuming it is why
  // the type pill and the Type row on the listing page never rendered.
  subCategoryLabel?: string;
  country?: string;
  packages?: { name?: string; price?: number }[];
  services?: { name?: string; price?: number }[];
}

// Founder-only dev listings should never surface on the public
// marketing site. Add ad ids or owner uids here to filter them
// out at query time.
const FOUNDER_TEST_IDS = new Set(['founder_test_hospitality']);
const FOUNDER_UIDS = new Set(['dYJAiyJCVQWzW13IWfGEpM1JQJE2']); // Donald

export function isPublicListing(l: Listing): boolean {
  if (FOUNDER_TEST_IDS.has(l.id)) return false;
  // Hide anything Donald owns from the marketing site — his account
  // is the founder dev account and everything he posts is test data.
  // If we ever add real listings under his uid, promote them out of
  // this filter with an explicit exception on the ad doc.
  if (l.userId && FOUNDER_UIDS.has(l.userId)) return false;
  // Guard against soft-deleted / hidden listings.
  if (l.status === 'hidden' || l.status === 'deleted') return false;
  return true;
}

// Currency symbols keyed by ISO 4217 code. Fall back to the raw
// code for anything not on the list (safer than showing $).
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', NGN: '₦', ZAR: 'R',
  GHS: 'GH₵', KES: 'KSh', UGX: 'USh', TZS: 'TSh',
  RWF: 'RWF', XOF: 'CFA', XAF: 'FCFA', MAD: 'DH',
  EGP: 'E£', ETB: 'Br', CAD: 'C$', AUD: 'A$', JPY: '¥',
  INR: '₹', CNY: '¥',
};

function symbolFor(listing: Listing): string {
  const code = listing.currency?.toUpperCase();
  if (code) return CURRENCY_SYMBOLS[code] || code + ' ';
  // No currency on the document. The platform default is GBP, but a listing
  // in Nigeria priced in pounds is simply a wrong number on the page, and
  // every listing we have today is Nigerian. Trust the country first.
  if ((listing.country || '').toLowerCase().includes('nigeria')) return '₦';
  return '£';
}

/** The human label for the listing type. Firestore stores subCategory as a
    string key with the label beside it; the object form is older data. */
export function getListingType(listing: Listing): string {
  if (listing.subCategoryLabel) return listing.subCategoryLabel;
  const sub = listing.subCategory;
  if (!sub) return "";
  if (typeof sub === "string") {
    // "adventure_outdoor" reads as a database key. Make it a phrase.
    return sub.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return sub.name || "";
}

/** The city as a key, so the website and admin build the same slug from the
 *  same word. Safe to feed makeSlug either way, since words() strips the
 *  hyphens anyway, but one definition beats two. */
export function getListingCity(listing: Listing): string {
  return listingPlace(listing).citySlug;
}

/**
 * The slug this listing should be linked by.
 *
 * Falls back to computing one when the document has no `slug` field. Every
 * listing predates slugs, and a link that only works after a backfill has run
 * is a link that does not work. The computed value is the plain-name candidate,
 * which is what the backfill will write for anything without a name collision.
 */
export function listingSlug(listing: Listing): string {
  return slugForListing(listing);
}

export function getListingImage(listing: Listing): string | null {
  if (listing.imageUrls?.length) {
    const first = listing.imageUrls[0];
    return typeof first === "string" ? first : first?.url || null;
  }
  return listing.coverImage || null;
}

export function getListingPrice(listing: Listing): string {
  const price = listing.customPrice?.price;
  if (!price) return "Contact host";
  // Use the operator's actual currency, not a hardcoded $. This is
  // the source-of-truth price the traveller will be charged. Locale
  // conversion (~₦16,600) is a future add — for now, honest currency
  // beats a wrong symbol.
  const sym = symbolFor(listing);
  const nice = price.toLocaleString('en-US');
  const unit = listing.pricingUnit || "";
  if (unit.includes("night")) return `${sym}${nice}/night`;
  if (unit.includes("person")) return `${sym}${nice}/person`;
  if (unit.includes("ticket")) return `${sym}${nice}/ticket`;
  return `${sym}${nice}`;
}

/** The one line a card shows. Kept as its own name because that is what every
 *  view calls it, but it is now just the label off listingPlace(). */
export function getListingLocation(listing: Listing): string {
  return listingPlace(listing).label;
}

/**
 * The words on a card. This used to be its own table, and it read
 * HospitalityManager as "Hotels & Restaurants" while the filter of that name
 * did not exist, so a card said one thing and every filter said another. It
 * now answers from CATEGORY_ROLES like everything else, and falls back to the
 * raw role rather than inventing a label for something unrecognised.
 */
export function getCategoryLabel(role: string): string {
  return categoryLabelOfRole(role) || role;
}

// Fetch featured listings from all collections
export async function getFeaturedListings(count: number = 12): Promise<Listing[]> {
  const all: Listing[] = [];

  await Promise.all(
    ROLE_COLLECTIONS.map(async (role) => {
      try {
        const ref = collection(db, "ads", role, "documents");
        // Over-fetch per role so the isPublicListing filter can
        // reject test/founder docs without leaving a sparse grid.
        const q = query(ref, limit(Math.ceil(count / ROLE_COLLECTIONS.length) * 2));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          if (data.imageUrls?.length > 0 || data.coverImage) {
            all.push({ id: d.id, ...data, role } as Listing);
          }
        });
      } catch {}
    })
  );

  // Shuffle, filter out founder/test/hidden listings, then trim.
  return all.filter(isPublicListing).sort(() => Math.random() - 0.5).slice(0, count);
}

// Fetch single listing by ID (searches all collections)
export async function getListingById(id: string): Promise<Listing | null> {
  for (const role of ROLE_COLLECTIONS) {
    try {
      const ref = doc(db, "ads", role, "documents", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data(), role } as Listing;
      }
    } catch {}
  }
  return null;
}

/** Every ad document, across all six role collections. Small enough to do
    (thirty-odd listings) and only reached on the fallback paths below. */
export async function getAllListings(): Promise<Listing[]> {
  const all: Listing[] = [];
  await Promise.all(
    ROLE_COLLECTIONS.map(async (role) => {
      try {
        const snap = await getDocs(collection(db, "ads", role, "documents"));
        snap.forEach((d) => all.push({ id: d.id, ...d.data(), role } as Listing));
      } catch {}
    })
  );
  return all;
}

/** Find a listing by its stored `slug` field. */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  for (const role of ROLE_COLLECTIONS) {
    try {
      const ref = collection(db, "ads", role, "documents");
      const snap = await getDocs(query(ref, where("slug", "==", slug), limit(1)));
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data(), role } as Listing;
      }
    } catch {}
  }
  return null;
}

/**
 * Find a listing whose document id STARTS WITH this.
 *
 * This is what /listing/ARH actually is. There has never been a short-code
 * field anywhere in the platform; Arrows Den's document id is
 * ARHiIBWZVpKyhuzO8dqk, and "ARH" is the front of it, from a link that got
 * truncated somewhere between the address bar and the person reading it.
 * Rather than tell the founder his link was never real, resolve the prefix.
 *
 * Ambiguity returns nothing rather than guessing: sending someone to the wrong
 * business is worse than sending them to a page that says it cannot find it.
 */
export async function getListingByIdPrefix(prefix: string): Promise<Listing | null> {
  const hits: Listing[] = [];
  await Promise.all(
    ROLE_COLLECTIONS.map(async (role) => {
      try {
        const ref = collection(db, "ads", role, "documents");
        // \uf8ff is the last character Firestore will sort, so startAt/endAt
        // over the document id is a prefix scan.
        const snap = await getDocs(
          query(ref, orderBy(documentId()), startAt(prefix), endAt(prefix + "\uf8ff"), limit(2))
        );
        snap.forEach((d) => hits.push({ id: d.id, ...d.data(), role } as Listing));
      } catch {}
    })
  );
  return hits.length === 1 ? hits[0] : null;
}

export interface ResolvedListing {
  listing: Listing;
  /** The slug this listing should live at. */
  slug: string;
  /** Was the URL already the canonical one, or should we redirect? */
  canonical: boolean;
}

/**
 * Turn whatever is in /listing/[id] into a listing and the URL it belongs at.
 *
 * Four things can arrive here and all four have to work, because all four are
 * already in the wild: a slug, a Firebase document id, a truncated document id,
 * and a slug shaped like an older guess at one ("central-park-abuja" when the
 * listing settled on "central-park"). Only the first is canonical; the rest
 * resolve and then redirect, so a link an operator printed keeps working while
 * the address bar quietly corrects itself.
 */
export async function resolveListing(param: string): Promise<ResolvedListing | null> {
  const value = decodeURIComponent(String(param || "")).trim();
  if (!value) return null;

  const found = async (listing: Listing | null, wasCanonical = false) =>
    listing ? { listing, slug: listingSlug(listing), canonical: wasCanonical } : null;

  if (looksLikeSlug(value)) {
    const stored = await getListingBySlug(value);
    if (stored) return found(stored, true);

    // Nothing has this slug stored. Either the backfill has not run yet, or
    // this is a candidate the listing did not end up keeping. Recompute every
    // listing's candidates and see whose it is. This path disappears on its own
    // once slugs are written: the indexed query above answers first.
    const all = await getAllListings();
    const match = all.find((l) =>
      slugCandidates(l.businessName || l.listingName || l.title || "", getListingCity(l)).includes(value)
    );
    if (match) return found(match, listingSlug(match) === value);
    return null;
  }

  const byId = await getListingById(value);
  if (byId) return found(byId);

  return found(await getListingByIdPrefix(value));
}

// Fetch listings by category
export async function getListingsByCategory(category: string, count: number = 20): Promise<Listing[]> {
  const roles = CATEGORY_ROLES[category] || ROLE_COLLECTIONS;
  const all: Listing[] = [];

  await Promise.all(
    roles.map(async (role) => {
      try {
        const ref = collection(db, "ads", role, "documents");
        // Over-fetch so the isPublicListing filter has room to reject
        // founder-test/hidden docs before we trim to count.
        const q = query(ref, limit(count * 2));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          if (data.imageUrls?.length > 0 || data.coverImage) {
            all.push({ id: d.id, ...data, role } as Listing);
          }
        });
      } catch {}
    })
  );

  return all.filter(isPublicListing).slice(0, count);
}

/**
 * The shared `cities` collection, the same source Scout's area picker and
 * admin read. The website had never read it, which is why an area recorded in
 * a city field had nothing to be checked against and showed up as its own city.
 *
 * Failure is not an error here. With no list the filter behaves exactly as it
 * did before: it offers whatever the listings say, unfolded. Worth having, not
 * worth blocking a page for.
 */
export async function getKnownCities(): Promise<KnownCity[]> {
  try {
    const snap = await getDocs(collection(db, "cities"));
    return snap.docs.map((d) => {
      const data = d.data() as { name?: string; areas?: unknown };
      return {
        id: d.id,
        name: data.name || d.id,
        areas: Array.isArray(data.areas) ? (data.areas as string[]) : [],
      };
    });
  } catch {
    return [];
  }
}
