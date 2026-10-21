// A MESSAGE YOU SENT IS ON THE SCREEN BEFORE THE SERVER HAS HEARD OF IT.
//
// The web chat awaited sendMessage and showed nothing until the round trip
// came back. On a good connection that is a blink. On the mobile data the
// travellers and the field reps actually use, it is a second or three of a
// thread that looks like it ignored you, and the only feedback on failure
// was the text reappearing in the box with no explanation.
//
// THREE STATES, AND THE DIFFERENCE MATTERS:
//   sending  it is on the screen, the server has not confirmed
//   failed   it did not go, and it is still here with a way to try again
//   (gone)   the server echoed it back through onSnapshot
//
// The reconciliation is the awkward part. A sent message comes back from
// Firestore as a NEW document, so without a shared id the sender sees their
// own message twice for a moment. The app already solved this: messages
// carry `clientMessageId`, which 1,456 of 2,081 production messages have.
// So the web mints one, sends it, and drops its local copy when a message
// bearing the same id arrives.
//
// Pure. No React, no Firebase: the component owns the state, this owns the
// rules, and a test can run them without a browser.

export interface Pending {
  /** The id that joins this local copy to the document that comes back. */
  clientMessageId: string;
  text: string;
  /** Local clock, only for ordering against itself. */
  at: number;
  state: "sending" | "failed";
}

/** A new outgoing message. */
export function queue(text: string, clientMessageId: string, now = Date.now()): Pending {
  return { clientMessageId, text, at: now, state: "sending" };
}

/** Mark one failed, keeping its text so it can be retried or copied. */
export function markFailed(list: Pending[], id: string): Pending[] {
  return list.map((p) => (p.clientMessageId === id ? { ...p, state: "failed" } : p));
}

/** Back to sending, for a retry. */
export function markSending(list: Pending[], id: string): Pending[] {
  return list.map((p) => (p.clientMessageId === id ? { ...p, state: "sending" } : p));
}

export function drop(list: Pending[], id: string): Pending[] {
  return list.filter((p) => p.clientMessageId !== id);
}

/**
 * Drop every pending message the server has now echoed back.
 *
 * MATCHES ON clientMessageId, never on text. Two identical messages are an
 * ordinary thing to send ("ok", "ok"), and matching on their text would make
 * the second one vanish the moment the first arrived.
 */
export function reconcile(
  list: Pending[],
  arrived: Array<{ clientMessageId?: string | null }>,
): Pending[] {
  if (!list.length) return list;
  const seen = new Set(
    arrived.map((m) => m.clientMessageId).filter((x): x is string => typeof x === "string" && !!x),
  );
  return seen.size ? list.filter((p) => !seen.has(p.clientMessageId)) : list;
}

/** Ids worth retrying, oldest first, so a reconnect replays in order. */
export function retryable(list: Pending[]): string[] {
  return list.filter((p) => p.state === "failed").sort((a, b) => a.at - b.at)
    .map((p) => p.clientMessageId);
}

/** A client id that cannot collide with another tab or another device. */
export function newClientMessageId(): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `web-${Date.now()}-${rand}`;
}
