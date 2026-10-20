// THE ROOMS, AND THE 195 PHOTOS THE WEBSITE NEVER LOOKED AT.
//
// "It says see rooms, but when I tap it shows you nothing. Nothing at all.
// On the app it shows pictures or video for it."
//
// He was right, and the cause is that the real rooms are not where this site
// was looking. A stay's rooms live in a SUBCOLLECTION, `roomTypes` for a
// Landlord, Host or HospitalityManager and `stayUnits` for an
// ExperienceProvider running a hybrid beach listing. Measured across
// production: 10 listings carry one, holding 30 room documents, and ALL 30
// carry media: 195 photos and 45 videos between them.
//
// The website read `services[]` instead, where Scout also writes a stay's
// room NAMES. So every row was a stub with a name and a price and no
// picture, and the same rooms were drawn twice on some pages. Tapping one
// could only ever go straight to payment, because there was nothing behind
// it to show.
//
// deriveRoomSections below is the web's copy of components/stay/
// roomSections.js in the app. Same rule, including the legacy fallback, so a
// room looks the same on a phone and in a browser.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface RoomSection {
  id: string;
  title?: string | null;
  photos: string[];
  videos: string[];
}

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  quantity?: number | null;
  maxGuests?: number | null;
  amenities?: string[];
  sections: RoomSection[];
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];

/**
 * What sections this room shows, mirroring deriveRoomSections in the app.
 *
 * A section with no media is dropped, because the strip tile at index N has
 * to be the same section the viewer opens at: filter differently on two
 * surfaces and the gallery opens on the wrong one. The app's file records
 * shipping exactly that bug.
 *
 * The legacy fallback is a read-time migration and not a data change: a room
 * carrying flat images[] or videoUrls[] instead of sections still lights up,
 * wrapped in one synthetic gallery.
 */
export function deriveRoomSections(raw: Record<string, unknown>): RoomSection[] {
  const sections = Array.isArray(raw.mediaSections) ? (raw.mediaSections as Record<string, unknown>[]) : [];
  const filled = sections
    .map((s, i) => ({
      id: typeof s.id === "string" && s.id ? s.id : `section-${i}`,
      title: typeof s.title === "string" ? s.title : typeof s.name === "string" ? s.name : null,
      photos: strings(s.photos),
      videos: strings(s.videos),
    }))
    // Travellers never see a broken promise: an empty section is a heading
    // over nothing.
    .filter((s) => s.photos.length + s.videos.length > 0);
  if (filled.length > 0) return filled;

  const legacyPhotos = strings(raw.images);
  const legacyVideos = strings(raw.videoUrls).concat(
    typeof raw.videoUrl === "string" && raw.videoUrl ? [raw.videoUrl] : [],
  );
  if (legacyPhotos.length + legacyVideos.length === 0) return [];
  return [{ id: "gallery", title: null, photos: legacyPhotos, videos: legacyVideos }];
}

export function toRoom(id: string, raw: Record<string, unknown>): Room {
  const price = (raw.basePrice || {}) as Record<string, unknown>;
  return {
    id,
    name: (typeof raw.name === "string" && raw.name.trim()) || "Room",
    description: typeof raw.description === "string" ? raw.description : null,
    priceAmount: typeof price.amount === "number" ? price.amount : typeof raw.price === "number" ? raw.price : null,
    priceCurrency: typeof price.currency === "string" ? price.currency : null,
    quantity: typeof raw.quantity === "number" ? raw.quantity : null,
    maxGuests: typeof raw.maxGuests === "number" ? raw.maxGuests : null,
    amenities: strings(raw.amenities),
    sections: deriveRoomSections(raw),
  };
}

/** Every photo in the room, in the order the sections run. */
export function roomPhotos(room: Room): string[] {
  return room.sections.flatMap((s) => s.photos);
}

export function roomVideos(room: Room): string[] {
  return room.sections.flatMap((s) => s.videos);
}

/** The one image for the row. A room with only a film has no cover. */
export function roomCover(room: Room): string | null {
  return roomPhotos(room)[0] ?? null;
}

export function hasMedia(room: Room): boolean {
  return room.sections.length > 0;
}

/**
 * The facts line, the way Airbnb puts "2 guests · 1 bedroom · 1 bed · 1
 * bathroom" under a title. A stay answers "will we fit" before it answers
 * anything else, and this page has never said.
 *
 * Only what the data actually holds. An invented bedroom count is worse
 * than a shorter line, and these documents carry guests and quantity and
 * nothing about beds or bathrooms.
 */
export function stayFacts(rooms: Room[]): string[] {
  if (rooms.length === 0) return [];
  const out: string[] = [];

  const sleeps = Math.max(0, ...rooms.map((r) => r.maxGuests || 0));
  if (sleeps > 0) out.push(`Sleeps up to ${sleeps}`);

  // How many separate things there are to book, which is what somebody
  // choosing between a cabin and a whole resort needs.
  out.push(`${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`);

  const photos = rooms.reduce((n, r) => n + roomPhotos(r).length, 0);
  const films = rooms.reduce((n, r) => n + roomVideos(r).length, 0);
  if (films > 0) out.push(`${films} ${films === 1 ? "film" : "films"}`);
  else if (photos > 0) out.push(`${photos} ${photos === 1 ? "photo" : "photos"}`);

  return out;
}

/** A room that is switched off is not sold, and must not be shown. */
export function sellableRooms(rooms: Room[], raws: Record<string, unknown>[]): Room[] {
  return rooms.filter((_, i) => raws[i]?.active !== false);
}

// THE TWO SUBCOLLECTION NAMES, from BusinessProfileScreen in the app:
// roomTypes for the hospitality roles, stayUnits for a hybrid beach listing
// under ExperienceProvider. Reading both rather than branching on the role
// keeps this correct when a listing is recategorised, which has happened.
const ROOM_SUBCOLLECTIONS = ["roomTypes", "stayUnits"] as const;

/** The rooms for one listing, from whichever subcollection holds them. */
export async function fetchRooms(role: string, docId: string): Promise<Room[]> {
  if (!role || !docId) return [];
  const results = await Promise.allSettled(
    ROOM_SUBCOLLECTIONS.map((sub) => getDocs(collection(db, "ads", role, "documents", docId, sub))),
  );
  const out: Room[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      const raw = d.data() as Record<string, unknown>;
      if (raw.active === false) continue;
      out.push(toRoom(d.id, raw));
    }
  }
  return out;
}
