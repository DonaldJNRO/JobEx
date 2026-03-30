import { collection, getDocs, doc, getDoc, query, limit, orderBy, where } from "firebase/firestore";
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
  const unit = listing.pricingUnit || "";
  if (unit.includes("night")) return `$${price}/night`;
  if (unit.includes("person")) return `$${price}/person`;
  if (unit.includes("ticket")) return `$${price}/ticket`;
  return `$${price}`;
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
        const q = query(ref, limit(Math.ceil(count / ROLE_COLLECTIONS.length)));
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

  // Shuffle and return
  return all.sort(() => Math.random() - 0.5).slice(0, count);
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
        const q = query(ref, limit(count));
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

  return all.slice(0, count);
}
