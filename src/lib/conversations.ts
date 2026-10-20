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
          title: "",
          otherId: otherOf(members, me),
          memberIds: members,
          lastMessage: previewOf(v.lastMessage),
          lastMessageAtMs: millisOf(v.lastMessageTime || v.updatedAt),
          lastMessageSenderName: typeof v.senderName === "string" ? v.senderName : null,
          unread: unreadFor(v.unreadCounts, me),
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
      trips = snap.docs.map((d) => {
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
