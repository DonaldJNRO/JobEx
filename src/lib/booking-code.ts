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
import { db } from "./firebase";

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
export function watchBookingCode(
  bookingRequestId: string,
  onState: (s: CodeState) => void,
  giveUpAfterMs = 10_000,
): Unsubscribe {
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) onState({ status: "unavailable" });
  }, giveUpAfterMs);

  const stop = onSnapshot(
    doc(db, "bookingRequests", bookingRequestId),
    (snap) => {
      const code = codeOf(snap.data() as Record<string, unknown>);
      if (!code) return;
      settled = true;
      clearTimeout(timer);
      onState({ status: "ready", code });
      stop();
    },
    () => {
      // A refused or dropped listener is not a reason to invent a code.
      settled = true;
      clearTimeout(timer);
      onState({ status: "unavailable" });
    },
  );

  return () => { clearTimeout(timer); stop(); };
}
