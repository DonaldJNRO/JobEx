// ASKING BIE, FROM THE WEB.
//
// Bie is not phone logic. It is a Cloud Function, `callBieAI`, which already
// holds the prompt, the tools and the keys, and already reads the trip's
// destination and dates to answer in context. The website calls the same
// function with the same auth, so there is one brain and not two.
//
// AND THE STREAMING IS FREE. Bie does not stream to a screen: it streams
// into a Firestore message document at trips/{tripId}/messages/{id},
// throttled to about two writes a second. The web already watches that exact
// collection in chat.ts and already reads text, senderId and sentAt. So a
// reply appears as it is written without a line of streaming code here.
//
// What this file does is the small half: write the document the function
// will fill, then ask it to fill it.

import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { messagesPath, type ConversationKind } from "./conversations";
import type { ChatMessage } from "./chat";

/** Who Bie is in a messages collection. The app writes this id and the web
 *  renders a message by it, so it is not ours to choose. */
export const BIE_SENDER_ID = "sabie_ai";
export const BIE_NAME = "Bie";

/** How many messages of the thread Bie is told about. Enough for "what about
 *  the other one", not so many that an old trip sends a novel on every ask. */
const CONTEXT_MESSAGES = 12;

/** A personal Bie chat is chats/bie_{uid}. 52 of the 74 chat documents in
 *  production are these, and the function detects one by that prefix. */
export function isBieChat(id: string): boolean {
  return id.startsWith("bie_");
}

interface BieCall {
  messages: { role: "user" | "assistant"; content: string }[];
  /** tripId for a trip chat, chatId for a personal one. The function reads
   *  whichever is present and writes into the matching collection. */
  streamToDoc: { tripId?: string; chatId?: string; messageId: string };
  tripId?: string;
  model?: string;
  useTools: boolean;
}

const callBieAI = httpsCallable<BieCall, { content?: string; provider?: string }>(
  functions,
  "callBieAI",
  // Bie's own timeout is 300s and it can run tools for a while. The SDK
  // default of 70 would give up on a long plan while the server was still
  // writing the answer into the document the screen is watching.
  { timeout: 180_000 },
);

/**
 * Ask Bie in a trip, and let the thread render the answer.
 *
 * Returns once the function has finished. The text will already be on screen
 * by then, because the document it wrote into is the one being watched.
 */
export async function askBie(
  id: string,
  question: string,
  history: ChatMessage[],
  /** "trip" for a group chat, "chat" for a personal Bie thread. */
  kind: ConversationKind = "trip",
): Promise<void> {
  const body = question.trim();
  if (!body) return;

  // The placeholder. The function UPDATES this document rather than creating
  // it, so it has to exist first.
  //
  // sentAt IS NOT OPTIONAL. watchMessages orders by it, and Firestore does
  // not sort a document missing the ordered field, it OMITS it: without this
  // the reply would be written correctly and never appear.
  //
  // text starts empty on purpose. The same listener drops a message with no
  // text, so there is no empty grey bubble while Bie thinks, and if a tool
  // posts a card instead the server blanks this doc and it stays invisible.
  const messageId = doc(collection(db, ...messagesPath(kind, id))).id;
  await setDoc(doc(db, ...messagesPath(kind, id), messageId), {
    text: "",
    type: "text",
    senderId: BIE_SENDER_ID,
    senderName: BIE_NAME,
    sentAt: serverTimestamp(),
    timestamp: serverTimestamp(),
    isPartialResponse: true,
    seenBy: {},
    source: "web",
  });

  // The thread, oldest first, as a conversation. Bie's own messages come back
  // as the assistant's, which is what makes a follow-up question work.
  const messages = history
    .slice(-CONTEXT_MESSAGES)
    .filter((m) => m.text.trim())
    .map((m) => ({
      role: m.senderId === BIE_SENDER_ID ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));
  messages.push({ role: "user", content: body });

  // No system message. The function builds its own and enriches it with the
  // trip's destination, dates and group size; sending one from here would be
  // a second prompt competing with the one that knows where the trip is.
  // A PERSONAL CHAT IS NOT A TRIP. The function picks the parent collection
  // from which id it is given, and a personal thread also asks for sonnet:
  // it is the one with no trip behind it to lean on, so the reasoning has to
  // come from the model rather than the context.
  await callBieAI(
    kind === "chat"
      ? { messages, model: "sonnet", streamToDoc: { chatId: id, messageId }, useTools: true }
      : { messages, streamToDoc: { tripId: id, messageId }, tripId: id, useTools: true },
  );
}
