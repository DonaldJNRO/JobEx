// THE CODE AN OPERATOR ACTUALLY CHECKS AT THE DOOR.
//
// The confirmation screen printed the first eight characters of the
// bookingRequest's Firestore document id, upper-cased, and called it "your
// booking reference". That string exists nowhere else on the platform: the
// operator's till and the app's My Bookings both read `publicCode`, which is
// minted as SAB-R-XXXXX. A traveller showed up with 1U2BO0BF and the
// operator was looking for SAB-R-DEMO1.
//
// It was not laziness. publicCode is minted in tripPaymentWebhook
// (functions/payTrip.js:2735), which fires AFTER Stripe confirms, so at the
// instant this screen first draws, the real code genuinely does not exist
// yet. Rather than wait a second, the screen invented one.
//
// So: watch the booking document and show the real code the moment the
// webhook writes it. The wait is usually under two seconds and the screen
// says what is happening rather than filling the gap with a fiction.

import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db } from "./firebase";
import { functions } from "./firebase";

/** What the screen knows about the code at any moment. */
export type CodeState =
  | { status: "waiting" }
  | { status: "ready"; code: string }
  /** The webhook did not write one in time. The booking is still real: it is
   *  paid, the operator has it, and the email carries the code. Saying so is
   *  the honest answer; inventing a string is not. */
  | { status: "unavailable" };

/** Read the code from wherever a booking happens to keep it. */
export function codeOf(d: Record<string, unknown> | undefined | null): string | null {
  if (!d) return null;
  const direct = d.publicCode;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const nested = (d.bookingDetails as Record<string, unknown> | undefined)?.publicCode;
  if (typeof nested === "string" && nested.trim()) return nested.trim();
  return null;
}

/**
 * Watch a booking until its code lands.
 *
 * `giveUpAfterMs` is not a failure state for the BOOKING, only for this
 * screen's ability to show the code on it. 10 seconds is generous against a
 * webhook that normally writes within two.
 */
/**
 * ASK THE SERVER, because a guest cannot read their own booking.
 *
 * firestore.rules:613 refuses an anonymous read of bookingRequests, and the
 * website signs every visitor in anonymously, so the listener below is
 * refused for exactly the person who needs the code. That rule is right and
 * closing a real hole; a callable runs as the server and is the way round it
 * without reopening anything.
 *
 * Measured 21 Oct 2026: the first real web booking showed "on its way by
 * email" while SAB-R-000012 sat in the document.
 */
async function askServer(bookingRequestId: string): Promise<string | null> {
  try {
    const fn = httpsCallable<{ bookingRequestId: string }, { code: string | null }>(
      functions, "getBookingCode",
    );
    const { data } = await fn({ bookingRequestId });
    const code = data?.code;
    return typeof code === "string" && code.trim() ? code.trim() : null;
  } catch {
    return null;
  }
}

export function watchBookingCode(
  bookingRequestId: string,
  onState: (s: CodeState) => void,
  giveUpAfterMs = 10_000,
): Unsubscribe {
  let settled = false;
  const done = (code: string) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    clearInterval(poll);
    onState({ status: "ready", code });
  };
  const timer = setTimeout(() => {
    if (!settled) { clearInterval(poll); onState({ status: "unavailable" }); }
  }, giveUpAfterMs);

  // BOTH, because neither alone is enough. The listener is instant for a
  // signed-in traveller and refused for a guest; the callable works for
  // everybody but has to be asked. Whichever answers first wins, and the
  // webhook usually writes within two seconds.
  const poll = setInterval(() => {
    void askServer(bookingRequestId).then((c) => { if (c) done(c); });
  }, 1500);
  void askServer(bookingRequestId).then((c) => { if (c) done(c); });

  const stop = onSnapshot(
    doc(db, "bookingRequests", bookingRequestId),
    (snap) => {
      const code = codeOf(snap.data() as Record<string, unknown>);
      if (!code) return;
      done(code);
      stop();
    },
    () => {
      // REFUSED IS ORDINARY HERE, not a failure: a guest is anonymous and
      // the rule refuses them by design. The callable is still running, so
      // this says nothing and lets it answer.
    },
  );

  return () => { clearTimeout(timer); clearInterval(poll); stop(); };
}
