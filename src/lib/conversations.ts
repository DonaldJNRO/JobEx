// ONE INBOX: the people you talk to AND the trips you are in.
//
// "All my 1v1 chat are not there, just trip chats." Measured: the `chats`
// collection holds 74 one-to-one conversations carrying 2,076 messages, 15 of
// them the founder's, and this website had never read that collection at all.
// It queried trips and only trips, so two thirds of somebody's messages were
// not missing from the page, they were missing from the product.
//
// A chat and a trip are the same object to a reader: a name, a face, the last
// thing said and when. They are two collections because one has an itinerary
// behind it. So they merge into one ranked list here, and the thread view
// reads whichever subcollection the row names.
//
// The sort key is the LAST MESSAGE, not creation, because an inbox ordered by
// when a conversation started is not an inbox.

import {
  collection, doc, limit as qLimit, onSnapshot, orderBy, query, where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

/** Which collection a thread's messages live under. */
export type ConversationKind = "chat" | "trip";

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title: string;
  /** The other person, on a one-to-one. Null on a trip. */
  otherId?: string | null;
  photoUrl?: string | null;
  memberIds: string[];
  lastMessage?: string | null;
  lastMessageAtMs: number;
  lastMessageSenderName?: string | null;
  /** Who sent the last one, so a row can tell yours from theirs. */
  lastMessageSenderId?: string | null;
  /** Who has read it, stamped on the same write that clears their unread. */
  lastMessageSeenBy?: Record<string, boolean> | null;
  /** Everyone's unread count, because it beats seenBy when they disagree. */
  unreadCounts?: Record<string, number> | null;
  /** 'moment' reads differently: you VIEW a photo and OPEN a message. */
  lastMessageType?: string | null;
  unread: number;
  /** A trip's people, for the avatar stack. */
  memberNames?: string[];
  /** "@handle" on a one-to-one, so the header says who rather than how many. */
  handleLine?: string | null;
}

/** Firestore timestamps arrive in three shapes depending on who wrote them. */
export function millisOf(t: unknown): number {
  if (!t) return 0;
  const o = t as { toMillis?: () => number; seconds?: number; _seconds?: number };
  if (typeof o.toMillis === "function") return o.toMillis();
  if (typeof o.seconds === "number") return o.seconds * 1000;
  if (typeof o._seconds === "number") return o._seconds * 1000;
  if (typeof t === "number") return t;
  return 0;
}

// A LAST MESSAGE IS SOMETIMES AN OBJECT. Eight writers in the app stored
// `lastMessage` as {text, type, senderId} rather than a string, which renders
// as "[object Object]" in a list. The app's own repo carries a guard for it
// now; this is the reading end of the same bug.
export function previewOf(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw.trim() || null;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["text", "body", "message", "caption"]) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
    }
    // A photo or a moment with no caption is still something that happened.
    const type = typeof o.type === "string" ? o.type : null;
    if (type === "image" || type === "photo") return "Photo";
    if (type === "moment") return "Moment";
    if (type) return null;
  }
  return null;
}

/** The person on the other side of a two-person chat. */
/** Bie's id in a participants list. Not a user document, so it never
 *  resolves to a person and must not be looked up as one. */
export const BIE_ID = "sabie_ai";

export function otherOf(memberIds: string[], me: string): string | null {
  return memberIds.find((u) => u && u !== me) || null;
}

export function unreadFor(counts: unknown, me: string): number {
  if (!counts || typeof counts !== "object") return 0;
  const n = (counts as Record<string, unknown>)[me];
  return typeof n === "number" && n > 0 ? n : 0;
}

/** Newest conversation first, by its last message. */
export function rankConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (b.lastMessageAtMs !== a.lastMessageAtMs) return b.lastMessageAtMs - a.lastMessageAtMs;
    return a.title.localeCompare(b.title);
  });
}

/** A stable key, since a chat id and a trip id could collide. */
export function keyOf(c: Pick<Conversation, "kind" | "id">): string {
  return `${c.kind}:${c.id}`;
}

export function parseKey(key: string): { kind: ConversationKind; id: string } | null {
  const i = key.indexOf(":");
  if (i < 1) return null;
  const kind = key.slice(0, i);
  if (kind !== "chat" && kind !== "trip") return null;
  return { kind, id: key.slice(i + 1) };
}

/** Where a thread's messages live. */
/**
 * A TRIP SOMEBODY MEANT TO HAVE, as opposed to a container for a basket.
 *
 * Ported verbatim from the app's MessageListScreen.js:471, which has hidden
 * these for a while. The website listed every trip, so a chat list showed
 * containers the phone was quietly leaving out: "The Rink Arena" twice from
 * the same second, "Sunset Haven" twice, every one of them a single person
 * with no messages, named after the first thing somebody added to a basket.
 *
 * Intent, not member count. BundleContext stamps `createdVia: 'cart'` on a
 * trip spun up to hold a cart item, and says so where it writes it.
 *
 * The legacy clause is the reason this is not one line. Trips written before
 * createdVia existed carry no flag, and defaulting those to "show" would put
 * every old container back in the list. For those only, the old proxy holds:
 * a flagless single-member trip is overwhelmingly a container, and anything
 * genuinely shared has two members and survives either way.
 */
export function isRealConversation(v: Record<string, unknown>): boolean {
  if (v.travelType === "solo") return false;
  if (v.createdVia === "cart") return false;
  if (v.createdVia === undefined) {
    const members = Array.isArray(v.memberIds) ? v.memberIds.length : 0;
    if (members <= 1) return false;
  }
  return true;
}

/**
 * HOW MANY OTHER PEOPLE HAVE READ THE LAST MESSAGE.
 *
 * Ported from TripItem.js, including both corrections it carries, because
 * each was a real row lying in production:
 *
 * NO UID, NO CLAIM. `uid !== myUid` excludes nobody when myUid is undefined,
 * so a seenBy holding only YOUR OWN read counted one reader and the row said
 * "Opened by 1" about a message nobody else had opened.
 *
 * UNREAD BEATS seenBy. lastMessageSeenBy is denormalised and goes stale when
 * a write path forgets to reset it; unreadCounts cannot drift that way,
 * because it is incremented by arrival and cleared only by the recipient's
 * own device. Somebody with unread messages has not seen the last one,
 * whatever seenBy claims.
 */
export function countOtherReaders(
  seenBy: Record<string, boolean> | null | undefined,
  myUid: string | undefined,
  unreadCounts?: Record<string, number> | null,
): number {
  if (!seenBy || !myUid) return 0;
  let n = 0;
  for (const uid of Object.keys(seenBy)) {
    if (uid === myUid || !seenBy[uid]) continue;
    if (unreadCounts && (unreadCounts[uid] || 0) > 0) continue;
    n += 1;
  }
  return n;
}

/**
 * WHAT A ROW SAYS UNDER THE NAME.
 *
 * The app's rule, ported: the TITLE says who, the STATUS says what. A row is
 * a STATE, never content. This website printed the message instead, which is
 * WhatsApp's convention in a list built on Snapchat's, so the same inbox said
 * two different things on two surfaces.
 *
 * Echoing your own words back at you is the clearest case: you wrote them.
 * The one fact you do not have is whether they have been read, which is the
 * whole reason the row exists.
 */
export function rowStatus(c: Conversation, me: string): string {
  const unread = c.unread || 0;
  const isMoment = c.lastMessageType === "moment";
  const direct = c.kind === "chat";
  const first = (n?: string | null) => (n || "Someone").split(" ")[0];

  if (!c.lastMessage && !c.lastMessageAtMs) return "Tap to chat";

  if (unread > 0) {
    if (isMoment) {
      return unread > 1
        ? `${unread} new Moments`
        : direct ? "New Moment" : `${first(c.lastMessageSenderName)}'s Moment`;
    }
    return unread > 1 ? `${unread} new messages` : "New message";
  }

  if (c.lastMessageSenderId && c.lastMessageSenderId === me) {
    const readers = countOtherReaders(c.lastMessageSeenBy, me, c.unreadCounts);
    if (readers > 0) {
      // VIEWED FOR A MOMENT, OPENED FOR A MESSAGE. You open a message: it is
      // sealed and opening is the act. You view a photo: there is nothing to
      // unseal, you just looked at it.
      const word = isMoment ? "Viewed" : "Opened";
      return direct ? word : `${word} by ${readers}`;
    }
    // SENT, not Delivered. The message reached the server, which is delivery
    // for a chat that lives in Firestore. What is not known is whether anyone
    // opened it, and "Delivered" claims a receipt nothing here checks.
    return "Sent";
  }

  // Theirs, and read. A Moment you have already seen says so rather than
  // spending the line reporting that nothing is waiting.
  if (isMoment) return "Moment";
  return c.lastMessage ? "Received" : "Tap to chat";
}

export function messagesPath(kind: ConversationKind, id: string): [string, string, string] {
  return [kind === "chat" ? "chats" : "trips", id, "messages"];
}

/**
 * Both collections, live, merged into one ranked list.
 *
 * Two listeners rather than one query, because they are two collections and
 * Firestore has no union. Each keeps its own slice so one going quiet does
 * not blank the other, which is what a single combined state would do.
 */
export function watchMyConversations(
  me: string,
  onList: (list: Conversation[], failed?: boolean) => void,
): Unsubscribe {
  let chats: Conversation[] = [];
  let trips: Conversation[] = [];
  let ready = { chats: false, trips: false };
  const failed = { chats: false, trips: false };

  const emit = () => {
    // Hold the first paint until both have spoken once, or the list visibly
    // reshuffles as the second one lands.
    if (!ready.chats || !ready.trips) return;
    onList(rankConversations([...chats, ...trips]), failed.chats || failed.trips);
  };

  const chatQ = query(
    collection(db, "chats"),
    where("participants", "array-contains", me),
    qLimit(100),
  );
  const tripQ = query(
    collection(db, "trips"),
    where("memberIds", "array-contains", me),
    qLimit(100),
  );

  const unsubChat = onSnapshot(
    chatQ,
    (snap) => {
      chats = snap.docs.map((d) => {
        const v = d.data() as Record<string, unknown>;
        const members = (Array.isArray(v.participants) ? v.participants : []) as string[];
        return {
          id: d.id,
          kind: "chat" as const,
          // Filled in by the caller from the users it resolves: a chat
          // document does not carry the other person's name.
          // BIE IS NOT "SOMEONE". 52 of the 74 chat documents in production
          // are personal Bie threads: participants [uid, 'sabie_ai'], marked
          // isBieChat. sabie_ai has no user document, so resolving it found
          // nothing and nameOf fell through to its last resort. Two thirds of
          // the one-to-one rows on this website read "Someone".
          //
          // Named here rather than in withPeople, so it is right on the first
          // paint instead of correcting itself once the people resolve.
          title: v.isBieChat === true || otherOf(members, me) === BIE_ID ? "Bie" : "",
          otherId: otherOf(members, me),
          memberIds: members,
          lastMessage: previewOf(v.lastMessage),
          lastMessageAtMs: millisOf(v.lastMessageTime || v.updatedAt),
          lastMessageSenderName: typeof v.senderName === "string" ? v.senderName : null,
          unread: unreadFor(v.unreadCounts, me),
          lastMessageSenderId: typeof v.lastMessageSenderId === "string" ? v.lastMessageSenderId : null,
          lastMessageSeenBy: (v.lastMessageSeenBy ?? null) as Record<string, boolean> | null,
          unreadCounts: (v.unreadCounts ?? null) as Record<string, number> | null,
          lastMessageType: (() => {
            const lm = v.lastMessage as Record<string, unknown> | string | undefined;
            if (lm && typeof lm === "object" && typeof lm.type === "string") return lm.type;
            return typeof v.lastMessageType === "string" ? v.lastMessageType : null;
          })(),
        };
      });
      ready.chats = true;
      emit();
    },
    // A listener that throws takes the page with it, and an empty half is
    // survivable where a blank screen is not. Same rule as watchMyTrips.
    // A REFUSED LISTENER IS NOT AN EMPTY INBOX. This emitted [], so the
    // page said "No conversations yet" to somebody with 74 of them. The
    // half still empties, because one side failing must not blank the
    // other, but it says that it failed.
    () => { chats = []; ready.chats = true; failed.chats = true; emit(); },
  );

  const unsubTrip = onSnapshot(
    tripQ,
    (snap) => {
      trips = snap.docs
        // See isRealConversation: a basket is not a conversation.
        .filter((d) => isRealConversation(d.data() as Record<string, unknown>))
        .map((d) => {
        const v = d.data() as Record<string, unknown>;
        const selected = (Array.isArray(v.selectedUsers) ? v.selectedUsers : []) as Array<Record<string, unknown>>;
        return {
          id: d.id,
          kind: "trip" as const,
          title: (typeof v.tripName === "string" && v.tripName.trim()) || "Trip",
          memberIds: (Array.isArray(v.memberIds) ? v.memberIds : []) as string[],
          photoUrl: typeof v.imageUrl === "string" ? v.imageUrl : null,
          lastMessage: previewOf(v.lastMessage),
          lastMessageAtMs: millisOf(v.lastMessageTime || v.updatedAt || v.createdAt),
          lastMessageSenderName: typeof v.lastMessageSenderName === "string" ? v.lastMessageSenderName : null,
          unread: unreadFor(v.unreadCounts, me),
          lastMessageSenderId: typeof v.lastMessageSenderId === "string" ? v.lastMessageSenderId : null,
          lastMessageSeenBy: (v.lastMessageSeenBy ?? null) as Record<string, boolean> | null,
          unreadCounts: (v.unreadCounts ?? null) as Record<string, number> | null,
          lastMessageType: (() => {
            const lm = v.lastMessage as Record<string, unknown> | string | undefined;
            if (lm && typeof lm === "object" && typeof lm.type === "string") return lm.type;
            return typeof v.lastMessageType === "string" ? v.lastMessageType : null;
          })(),
          memberNames: selected
            .map((u) => (typeof u.name === "string" ? u.name : typeof u.displayName === "string" ? u.displayName : ""))
            .filter(Boolean),
        };
      });
      ready.trips = true;
      emit();
    },
    () => { trips = []; ready.trips = true; failed.trips = true; emit(); },
  );

  return () => { unsubChat(); unsubTrip(); };
}

export { doc };

// ── who the other person is ──────────────────────────────────────────────
//
// A chat document carries participant UIDS and nothing else, so a
// one-to-one row has no name and no face until the users are resolved. The
// app does this from a cache it already holds; the website has to ask.
//
// TEN AT A TIME, because `documentId() in [...]` is capped at ten, and a
// bare users query with no limit is REFUSED outright by the rules, not
// merely trimmed. That refusal has caused three unrelated-looking bugs in
// this ecosystem already: a blank search, a friends list that loaded for
// ever, and letter avatars where photos should be.

import { getDocs as fsGetDocs, documentId } from "firebase/firestore";

export interface Person {
  id: string;
  name: string;
  photoUrl?: string | null;
  handle?: string | null;
}

const CHUNK = 10;

export function nameOf(v: Record<string, unknown>): string {
  for (const k of ["name", "displayName", "firstName", "handle"]) {
    const raw = v[k];
    if (typeof raw === "string" && raw.trim()) return raw.trim().replace(/^@/, "");
  }
  return "Someone";
}

/** Resolve a set of uids to people, in batches of ten. */
export async function fetchPeople(uids: string[]): Promise<Map<string, Person>> {
  const out = new Map<string, Person>();
  const wanted = [...new Set(uids.filter(Boolean))];
  const batches: string[][] = [];
  for (let i = 0; i < wanted.length; i += CHUNK) batches.push(wanted.slice(i, i + CHUNK));

  // allSettled, not all: one denied batch must not empty the whole inbox.
  // A row with a letter avatar is a worse row; a list with no rows is a
  // broken product.
  const results = await Promise.allSettled(
    batches.map((ids) => fsGetDocs(query(collection(db, "users"), where(documentId(), "in", ids), qLimit(CHUNK)))),
  );
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      const v = d.data() as Record<string, unknown>;
      out.set(d.id, {
        id: d.id,
        name: nameOf(v),
        photoUrl: typeof v.photoUrl === "string" ? v.photoUrl : typeof v.profileImage === "string" ? v.profileImage : null,
        handle: typeof v.handle === "string" ? v.handle : null,
      });
    }
  }
  return out;
}

/** Fill a conversation list's blank titles from resolved people. */
export function withPeople(list: Conversation[], people: Map<string, Person>): Conversation[] {
  return list.map((c) => {
    if (c.kind !== "chat") return c;
    // Bie already has its name and no person to resolve.
    if (c.otherId === BIE_ID) return c;
    const p = c.otherId ? people.get(c.otherId) : null;
    return {
      ...c,
      // A name we could not resolve is still a conversation, and the row has
      // to render. It never renders a raw uid at somebody.
      title: p?.name || c.title || "Someone",
      photoUrl: p?.photoUrl ?? c.photoUrl ?? null,
      handleLine: p?.handle ? (p.handle.startsWith("@") ? p.handle : `@${p.handle}`) : null,
    };
  });
}
