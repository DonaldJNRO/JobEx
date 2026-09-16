/**
 * Saved listings, shared with the phone.
 *
 * The heart on a listing used to be `useState(false)`: it filled in, and
 * nothing was written anywhere. /favorites then told people to "tap the heart
 * on any listing to save it here", which was a promise the product could not
 * keep. This is the other half of that promise.
 *
 * WHERE. `users/{uid}/savedAds/{listingId}`, which is where the traveller app
 * writes from DiscoverScreen and DiscoverInfoScreen. Same place on purpose: a
 * listing saved on the phone shows up on the web and the other way round,
 * because to a traveller it is one account and one list.
 *
 * A NOTE ON THE PHONE'S OWN SPLIT. The app writes savedAds but its Favourites
 * tab (screens/renter/favorites/AdsScreen.js) reads savedPropertyListings,
 * which nothing writes, while HighlightsScreen reads savedAds. So the app's
 * favourites are split across two collections and one screen reads an empty
 * one. Not ours to fix from here, but it is why this file writes the
 * collection that is genuinely used rather than the one a screen expects.
 *
 * WHAT WE STORE. The phone writes a thin body (videoUrl, firstName,
 * description, location, profileImage) with no business name, price or role.
 * We write a superset, and `role` is the one that earns its place: with it,
 * reading a saved listing back is a single document read instead of a scan
 * across all six role collections. Entries written by the phone have no role,
 * so those fall back to the scan rather than disappearing.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  getListingById,
  getListingImage,
  listingSlug,
  type Listing,
} from "./listings";

export interface SavedEntry {
  listingId: string;
  role?: string;
  businessName?: string;
  slug?: string;
  image?: string | null;
  savedAt?: number;
}

function savedDoc(uid: string, listingId: string) {
  return doc(db, "users", uid, "savedAds", listingId);
}

export async function isSaved(uid: string, listingId: string): Promise<boolean> {
  try {
    return (await getDoc(savedDoc(uid, listingId))).exists();
  } catch {
    return false;
  }
}

/**
 * Save a listing. Denormalises just enough to draw the card without a second
 * read, which is what keeps /favorites from being a loading spinner over a
 * list of six-collection scans.
 */
export async function saveListing(uid: string, listing: Listing): Promise<void> {
  await setDoc(savedDoc(uid, listing.id), {
    listingId: listing.id,
    role: listing.role,
    businessName: listing.businessName || listing.listingName || listing.title || "",
    slug: listingSlug(listing),
    image: getListingImage(listing),
    // Both, deliberately. serverTimestamp is the one to trust; savedAtMs is
    // readable the instant the write lands, before the server value resolves.
    savedAt: serverTimestamp(),
    savedAtMs: Date.now(),
  });
}

export async function unsaveListing(uid: string, listingId: string): Promise<void> {
  await deleteDoc(savedDoc(uid, listingId));
}

/**
 * Every saved listing, newest first, resolved to a full listing so the cards
 * on /favorites are the same cards as everywhere else.
 *
 * A saved listing that has since been deleted is dropped rather than rendered
 * as a blank card. It stays in the subcollection: silently deleting somebody's
 * saved item because one read failed is worse than showing a shorter list.
 */
export async function listSavedListings(uid: string): Promise<Listing[]> {
  let entries: SavedEntry[] = [];
  try {
    const snap = await getDocs(collection(db, "users", uid, "savedAds"));
    entries = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        listingId: d.id,
        role: typeof data.role === "string" ? data.role : undefined,
        businessName: typeof data.businessName === "string" ? data.businessName : undefined,
        slug: typeof data.slug === "string" ? data.slug : undefined,
        image: typeof data.image === "string" ? data.image : null,
        savedAt: typeof data.savedAtMs === "number" ? data.savedAtMs : 0,
      };
    });
  } catch {
    return [];
  }

  entries.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

  const resolved = await Promise.all(
    entries.map(async (entry) => {
      try {
        // With a role it is one read. Without one (every entry the phone
        // wrote), fall back to the scan rather than dropping the listing.
        if (entry.role) {
          const snap = await getDoc(
            doc(db, "ads", entry.role, "documents", entry.listingId),
          );
          if (snap.exists()) {
            return { id: snap.id, ...snap.data(), role: entry.role } as Listing;
          }
        }
        return await getListingById(entry.listingId);
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((l): l is Listing => l !== null);
}
