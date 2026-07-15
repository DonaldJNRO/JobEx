import { collection, getDocs, doc, getDoc, query, limit } from "firebase/firestore";
import { db } from "./firebase";

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
  subCategory?: { id: string; name: string };
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
}

// Founder-only dev listings should never surface on the public
// marketing site. Add ad ids or owner uids here to filter them
// out at query time.
const FOUNDER_TEST_IDS = new Set(['founder_test_hospitality']);
const FOUNDER_UIDS = new Set(['dYJAiyJCVQWzW13IWfGEpM1JQJE2']); // Donald

function isPublicListing(l: Listing): boolean {
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

function symbolFor(currency?: string): string {
  if (!currency) return '£'; // Sabię defaults to GBP for the platform
  const code = currency.toUpperCase();
  return CURRENCY_SYMBOLS[code] || code + ' ';
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
  const sym = symbolFor(listing.currency);
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
