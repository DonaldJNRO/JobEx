// Trips, as the phone writes them.
//
// A trip IS the group chat: messages live at trips/{id}/messages, there is no
// separate chats collection for a group. So "create a group chat on the web"
// means "create a trip", and the shape below is not negotiable, for two
// reasons that are both invisible when you get them wrong.
//
// ONE. THE NOTIFICATION FAN-OUT DOES NOT READ memberIds.
// functions/index.js:3855-3880 collects recipients from createdBy.id,
// selectedUsers and participants. A trip created with only memberIds passes
// the security rules, renders correctly in both apps, and notifies NOBODY.
// It looks like it worked.
//
// TWO. THE SECURITY RULES DO NOT READ selectedUsers.
// firestore.rules:181-203 allows read and update on createdBy.id or
// memberIds. A trip with only selectedUsers is invisible to its own members.
//
// So all three are written together, every time, exactly as
// components/hook/useTripCreation.js:270-348 does. AddTripParticipants.js:194
// updates only selectedUsers and is the bug, not the example;
// functions/backfillTripMemberIds.js exists because sixteen trips drifted
// this way and their members were silently denied.

import {
  collection, doc, addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, arrayUnion, updateDoc, onSnapshot,
  type Unsubscribe, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

/** A member, in the shape every trip field stores them. */
export interface TripMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string | null;
  username?: string | null;
}

export interface Trip {
  id: string;
  tripName: string;
  imageUrl?: string | null;
  createdBy: TripMember;
  memberIds: string[];
  selectedUsers: TripMember[];
  lastMessage?: string | null;
  lastMessageTime?: { toMillis?: () => number; seconds?: number } | null;
  lastMessageSenderName?: string | null;
  unreadCounts?: Record<string, number>;
  startDate?: string | null;
  endDate?: string | null;
  primaryDestination?: string | null;
}

/**
 * A member object, the one shape every trip field stores them in.
 *
 * EXPORTED because pay.ts creates trips too, and wrote `selectedUsers: [uid]`
 * as bare strings with createdBy.name hardcoded to "Guest". Both clients now
 * list trips, so that shape is visible: it showed as a trip created by Guest,
 * and the notification fan-out reads selectedUsers[].id, which a string does
 * not have. One builder means the two paths cannot disagree again.
 */
export function memberOf(u: {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
}, profile?: { fullName?: string; firstName?: string; lastName?: string; profileImage?: string; handle?: string } | null): TripMember {
  const name = profile?.fullName || u.displayName || "Traveller";
  return {
    id: u.uid,
    name,
    firstName: profile?.firstName || name.split(" ")[0] || "",
    lastName: profile?.lastName || name.split(" ").slice(1).join(" ") || "",
    profileImage: profile?.profileImage || u.photoURL || null,
    username: profile?.handle || null,
  };
}

function toTrip(id: string, d: DocumentData): Trip {
  return {
    id,
    tripName: typeof d.tripName === "string" ? d.tripName : "Trip",
    imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : null,
    createdBy: (d.createdBy || { id: "", name: "" }) as TripMember,
    memberIds: Array.isArray(d.memberIds) ? d.memberIds : [],
    selectedUsers: Array.isArray(d.selectedUsers) ? d.selectedUsers : [],
    lastMessage: typeof d.lastMessage === "string" ? d.lastMessage : null,
    lastMessageTime: d.lastMessageTime ?? null,
    lastMessageSenderName: typeof d.lastMessageSenderName === "string" ? d.lastMessageSenderName : null,
    unreadCounts: (d.unreadCounts || {}) as Record<string, number>,
    startDate: typeof d.startDate === "string" ? d.startDate : null,
    endDate: typeof d.endDate === "string" ? d.endDate : null,
    primaryDestination: typeof d.primaryDestination === "string" ? d.primaryDestination : null,
  };
}

/**
 * Live list of the trips this person is in.
 *
 * firestore.indexes.json already carries memberIds CONTAINS + createdAt DESC,
 * so this needs no new index.
 */
export function watchMyTrips(uid: string, onTrips: (trips: Trip[]) => void): Unsubscribe {
  const q = query(
    collection(db, "trips"),
    where("memberIds", "array-contains", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => onTrips(snap.docs.map((d) => toTrip(d.id, d.data()))),
    // A listener that throws takes the page with it. An empty list is wrong
    // but survivable; a blank screen is not.
    () => onTrips([]),
  );
}

/** One trip, live, so the header and the member list follow a change. */
export function watchTrip(tripId: string, onTrip: (trip: Trip | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "trips", tripId),
    (snap) => onTrip(snap.exists() ? toTrip(snap.id, snap.data()) : null),
    () => onTrip(null),
  );
}

/**
 * Start a trip. The creator is its first member.
 *
 * travelBuddies puts the creator LAST and selectedUsers puts them FIRST,
 * which is what useTripCreation.js does; the two orders are load-bearing in
 * the app's own screens, so they are preserved rather than tidied.
 */
/**
 * ISO alpha-2 for the countries Sabię is actually in.
 *
 * The app derives this with toAlpha2 over a full country table; the website
 * has no such table and does not need one, because the destination can only
 * be a city from the shared `cities` collection and there are seven of them
 * in four countries. Anything unrecognised returns null, which is the same
 * silent-allow every trip made before destinations existed falls through to.
 */
const ALPHA2: Record<string, string> = {
  nigeria: "NG",
  mali: "ML",
  mauritania: "MR",
  uk: "GB",
  "united kingdom": "GB",
};

export interface TripDestination {
  /** What a person calls it: "Lagos". */
  name: string;
  /** "Lagos, Nigeria". The app reads this one first, and it is what
   *  deriveDestinationCountry parses, so it carries the country. */
  location: string;
}

export interface NewTripDetails {
  destination?: TripDestination | null;
  /** Local calendar dates as the person picked them, "2026-12-24". */
  startDate?: string | null;
  endDate?: string | null;
}

export async function createTrip(
  user: { uid: string; displayName?: string | null; photoURL?: string | null },
  profile: { fullName?: string; firstName?: string; lastName?: string; profileImage?: string; handle?: string } | null,
  tripName: string,
  details: NewTripDetails = {},
): Promise<string> {
  const me = memberOf(user, profile);
  const dest = details.destination?.name?.trim() ? details.destination : null;
  // NOON, NOT MIDNIGHT. A date picked as "2026-12-24" parsed as UTC midnight
  // is the 23rd at 11pm in any timezone west of London, and the trip then
  // reads as starting a day early. Midday survives every offset on earth.
  const dayAt = (d?: string | null) =>
    d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : null;
  const start = dayAt(details.startDate);
  const end = dayAt(details.endDate);

  const ref = await addDoc(collection(db, "trips"), {
    tripName: tripName.trim() || "New trip",
    createdBy: me,
    // All three, together. See the note at the top of this file.
    memberIds: [me.id],
    selectedUsers: [me],
    travelBuddies: [me],
    travelType: "group",
    // So a reader can tell where a trip came from, as createdVia does for the
    // wizard and the cart.
    createdVia: "web",
    isSoloTravel: false,
    // WHERE AND WHEN, in the three shapes the app already reads.
    //
    // callBieAI looks for primaryDestination.name, then destinations[0]
    // .location, then destinationName, then destination, and tells itself
    // "you already know this is a Lagos trip, never ask". A trip with none of
    // them makes Bie open by asking the question it is built never to ask,
    // which is what a web trip was until now.
    //
    // Only written when there is something to write: an absent field is a
    // trip with no destination yet, which is a real state and the one every
    // trip made before today is in.
    ...(dest
      ? {
          destinations: [dest],
          primaryDestination: dest,
          destinationCountry:
            ALPHA2[(dest.location.split(",").pop() ?? "").trim().toLowerCase()] ?? null,
        }
      : {}),
    ...(start ? { startDate: start } : {}),
    ...(end ? { endDate: end } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCounts: { [me.id]: 0 },
  });
  return ref.id;
}

/**
 * Add somebody to a trip.
 *
 * Writes all three member fields. AddTripParticipants.js:194 updates only
 * selectedUsers, which is how members end up able to see a trip that cannot
 * notify them, or notified about one they cannot open.
 */
export async function addTripMember(tripId: string, member: TripMember): Promise<void> {
  await updateDoc(doc(db, "trips", tripId), {
    memberIds: arrayUnion(member.id),
    selectedUsers: arrayUnion(member),
    travelBuddies: arrayUnion(member),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Find somebody to add, by handle or first name.
 *
 * THE DATA, MEASURED 19 Oct 2026 across 230 users: 75 have a handle, every
 * one of them stored WITH a leading "@", and only 57 of those are lowercase
 * ("@Louisa" is real). So a naive prefix query on the typed text matches
 * almost nobody.
 *
 * Firestore cannot do case-insensitive or contains matching, so this fires
 * three bounded prefix queries and merges them: the handle as typed, the
 * handle capitalised, and firstName capitalised, which is how names are
 * actually stored. Three small indexed reads beat fetching the collection and
 * filtering, and beat a search that quietly finds nobody.
 *
 * EVERY QUERY CARRIES A LIMIT, and that is not decoration: firestore.rules
 * has `allow list: if request.auth != null && request.query.limit <= 100`, so
 * a query with NO limit is refused exactly like an oversized one. The app's
 * own screens/renter/searchUsers.js passes no limit at all and is therefore
 * denied on every call, which is why it is not the model here.
 */
export async function findTravellers(term: string, limitTo = 8): Promise<TripMember[]> {
  const raw = term.trim().replace(/^@+/, "");
  if (raw.length < 2) return [];
  const lower = raw.toLowerCase();
  const capped = lower.charAt(0).toUpperCase() + lower.slice(1);

  const prefix = (field: string, value: string) => query(
    collection(db, "users"),
    orderBy(field),
    where(field, ">=", value),
    where(field, "<=", value + "\uf8ff"),
    limit(limitTo),
  );

  const attempts = [
    prefix("handle", "@" + lower),
    prefix("handle", "@" + capped),
    prefix("firstName", capped),
  ];

  const found = new Map<string, TripMember>();
  // allSettled, not all: one denied or un-indexed query must not empty the
  // whole result. A shorter list is a worse search; no list is a broken one.
  const results = await Promise.allSettled(attempts.map((q) => getDocs(q)));
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      if (found.has(d.id)) continue;
      const u = d.data();
      const name = u.fullName || u.name || u.firstName || u.handle || "Traveller";
      found.set(d.id, {
        id: d.id,
        name,
        firstName: u.firstName || String(name).split(" ")[0] || "",
        lastName: u.lastName || "",
        profileImage: u.profileImage || u.photoURL || null,
        // Shown as "@name", so the stored "@" is stripped rather than doubled.
        username: typeof u.handle === "string" ? u.handle.replace(/^@+/, "") : null,
      });
    }
  }
  return [...found.values()].slice(0, limitTo);
}
