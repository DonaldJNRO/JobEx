// Sending a message from the web, so the phone agrees it happened.
//
// THE ONE THING THAT MATTERS HERE: a message is TWO documents, not one.
//
// components/messaging/adapters/TripChatAdapter.js writes the message AND the
// trip's lastMessage/lastMessageTime/lastMessageSenderId in the same batch,
// then increments unreadCounts. No Cloud Function does this for a human
// message — grep the triggers: they fan out pushes and nothing else. The
// client is the only writer.
//
// So a web client that writes only the message doc leaves every mobile inbox
// showing the PREVIOUS message as the latest, with a wrong unread badge, for
// ever. The message is in the thread and the inbox disagrees, which is worse
// than the message not sending: nobody knows to look.
//
// WHAT THE FAN-OUT WILL DO WITH IT. onTripMessageNotification
// (functions/index.js:3564) pushes to every participant except the sender,
// and it early-returns on several shapes. A web message must NOT carry
// status: 'sending' (that is the moment placeholder, and the push fires later
// on the transition), must not use senderId 'system' or 'sabie_ai', and
// should carry a `type` the switch recognises or it falls to a generic "sent
// a message". `text` with `type: 'text'` is the plain path.

import {
  collection, doc, onSnapshot, orderBy, query, limitToLast,
  serverTimestamp, writeBatch, updateDoc, increment,
  type Unsubscribe, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { messagesPath, type ConversationKind } from "./conversations";

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  type: string;
  timestamp: { toMillis?: () => number; seconds?: number } | null;
  imageUrl?: string | null;
  /** True while this one is only in the browser, not yet acknowledged. */
  pending?: boolean;
}

const PAGE = 60;

function toMessage(id: string, d: DocumentData): ChatMessage {
  return {
    id,
    text: typeof d.text === "string" ? d.text : "",
    senderId: typeof d.senderId === "string" ? d.senderId : "",
    senderName: typeof d.senderName === "string" ? d.senderName : "Traveller",
    type: typeof d.type === "string" ? d.type : "text",
    // sentAt FIRST. The app writes both and orders by sentAt; this file
    // read only `timestamp`, which 510 of 2,081 messages carry.
    timestamp: d.sentAt ?? d.timestamp ?? null,
    imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : null,
  };
}

/**
 * The thread, live and oldest-first.
 *
 * limitToLast matches the app's own window, so the web and the phone open on
 * the same stretch of conversation rather than disagreeing about where the
 * history starts.
 */
export function watchMessages(
  tripId: string,
  onMessages: (messages: ChatMessage[]) => void,
  // WHICH COLLECTION. A one-to-one chat's messages live under `chats` and a
  // trip's under `trips`, and this read only ever knew about trips, so the
  // website could not open 74 of the 116 conversations that exist. Defaulted
  // to "trip" so every existing caller is unchanged.
  kind: ConversationKind = "trip",
): Unsubscribe {
  // ORDER BY sentAt, WHICH IS THE FIELD THAT EXISTS.
  //
  // FIRESTORE DROPS ANY DOCUMENT MISSING THE orderBy FIELD. Not sorts it
  // last: omits it from the result entirely. This ordered by `timestamp`,
  // which 510 of 2,081 messages carry, while the app writes and orders by
  // `sentAt`, which 2,076 carry.
  //
  // Measured 21 Oct 2026, across every conversation of ten messages or
  // more: THE WEBSITE COULD SEE 22 PERCENT OF THEM AND THE APP SAW 100.
  // The longest thread has 1,094 messages and the website rendered 116. One
  // 67-message conversation rendered two. Nothing errored, nothing logged,
  // and the thread looked like a short conversation rather than a broken
  // read, which is why it survived a redesign of this very screen.
  const q = query(
    collection(db, ...messagesPath(kind, tripId)),
    orderBy("sentAt", "asc"),
    limitToLast(PAGE),
  );
  return onSnapshot(
    q,
    (snap) => onMessages(
      snap.docs
        .map((d) => toMessage(d.id, d.data()))
        // The app writes hidden placeholders for Bie and for moments mid-send.
        // Rendering them shows an empty bubble that never fills.
        .filter((m) => m.text || m.imageUrl),
    ),
    () => onMessages([]),
  );
}

/** What the inbox shows under a trip name. Mirrors _getLastMessagePreview. */
function previewOf(text: string, type: string): string {
  if (type === "image") return "📷 Photo";
  if (type === "voice") return "🎤 Voice note";
  const t = (text || "").trim();
  return t.length > 80 ? t.slice(0, 79) + "…" : t;
}

/**
 * Send a message.
 *
 * Both documents, in one batch, then the unread counts. See the note at the
 * top of this file for why the second document is not optional.
 */
export async function sendMessage(
  tripId: string,
  sender: { id: string; name: string },
  text: string,
  memberIds: string[],
  kind: ConversationKind = "trip",
): Promise<void> {
  const body = text.trim();
  if (!body) return;

  const tripRef = doc(db, kind === "chat" ? "chats" : "trips", tripId);
  const messageRef = doc(collection(db, ...messagesPath(kind, tripId)));

  const batch = writeBatch(db);
  batch.set(messageRef, {
    text: body,
    type: "text",
    senderId: sender.id,
    senderName: sender.name,
    // BOTH FIELDS, as the app's ChatScreen writes both. sentAt is what
    // every reader orders by; timestamp is kept so nothing older that still
    // reads it loses sight of a web-sent message. A message written with
    // only one of them is invisible to whichever surface sorts by the other.
    sentAt: serverTimestamp(),
    timestamp: serverTimestamp(),
    // The sender has by definition seen and received their own message.
    seenBy: { [sender.id]: true },
    deliveredTo: { [sender.id]: true },
    // Where it came from, the same way bookingDetails.source names the web.
    source: "web",
  });
  // merge, because the parent already exists and this must not clobber it.
  //
  // BOTH SPELLINGS ON A CHAT. A trip document names its last sender
  // `lastMessageSenderName`; a one-to-one chat document names it
  // `senderName`, and that is the field the mobile app's inbox reads. Write
  // only the trip's spelling and a reply sent from the website leaves the
  // phone's list showing whoever spoke before, which is worse than showing
  // nothing because it is confidently wrong.
  batch.set(tripRef, {
    lastMessage: previewOf(body, "text"),
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageSenderId: sender.id,
    lastMessageSenderName: sender.name,
    lastMessageType: "text",
    lastMessageId: messageRef.id,
    ...(kind === "chat" ? { senderId: sender.id, senderName: sender.name } : {}),
  }, { merge: true });
  await batch.commit();

  // Fire and forget, exactly as the app does: the message is already sent,
  // and a failed badge must not look like a failed message.
  //
  // DOTTED PATHS WITH updateDoc, never setDoc. setDoc treats
  // "unreadCounts.<uid>" as a literal field name, so the count lands beside
  // the real map where nothing reads it. The app's own adapter carries a
  // comment about exactly this fault being copied into it once already.
  const unread: Record<string, unknown> = {
    [`unreadCounts.${sender.id}`]: 0,
    // Reset, or the next message inherits this one's readers and the sender
    // is told it was opened before anybody has seen it.
    lastMessageSeenBy: { [sender.id]: true },
  };
  for (const id of memberIds) {
    if (id !== sender.id) unread[`unreadCounts.${id}`] = increment(1);
  }
  updateDoc(tripRef, unread).catch(() => {});
}

/** Clear this person's badge when they open the thread. */
export async function markTripRead(tripId: string, uid: string, kind: ConversationKind = "trip"): Promise<void> {
  try {
    await updateDoc(doc(db, kind === "chat" ? "chats" : "trips", tripId), {
      [`unreadCounts.${uid}`]: 0,
      [`lastMessageSeenBy.${uid}`]: true,
    });
  } catch { /* a stale badge is not worth an error on screen */ }
}
