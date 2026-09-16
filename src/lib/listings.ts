import { collection, getDocs, doc, getDoc, query, limit, where, orderBy, startAt, endAt, documentId } from "firebase/firestore";
import { db } from "./firebase";
import { makeSlug, slugCandidates, looksLikeSlug, slugForListing } from "./slug";

export type ListingRole = "Landlord" | "Host" | "HospitalityManager" | "ExperienceProviders" | "EventOrganizer" | "FoodBeverageManager";

const ROLE_COLLECTIONS: ListingRole[] = [
  "Landlord", "Host", "HospitalityManager", "ExperienceProviders", "EventOrganizer", "FoodBeverageManager",
];

const ROLE_LABELS: Record<ListingRole, string> = {
  Landlord: "Stays",
  Host: "Stays",
  HospitalityManager: "Hotels & Restaurants",
  ExperienceProviders: "Experiences",
  EventOrganizer: "Events",
  FoodBeverageManager: "Food & Drink",
};

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
  location?: string | { address?: string; city?: string; name?: string };
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

/** The city, preferring the already-normalised citySlug the ad document
    carries, so the website and admin build the same slug from the same word. */
export function getListingCity(listing: Listing): string {
  if (listing.citySlug) return listing.citySlug;
  if (typeof listing.location === "object" && listing.location?.city) return listing.location.city;
  return "";
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

export function getListingLocation(listing: Listing): string {
  if (!listing.location) return "";
  if (typeof listing.location === "string") return listing.location.split(",")[0].trim();
  return listing.location.city || listing.location.name || listing.location.address || "";
}

export function getCategoryLabel(role: string): string {
  return ROLE_LABELS[role as ListingRole] || role;
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
  const roleMap: Record<string, ListingRole[]> = {
    stays: ["Landlord", "Host"],
    experiences: ["ExperienceProviders"],
    events: ["EventOrganizer"],
    food: ["HospitalityManager", "FoodBeverageManager"],
  };

  const roles = roleMap[category] || ROLE_COLLECTIONS;
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
