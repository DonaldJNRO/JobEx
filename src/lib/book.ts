/**
 * Sending a booking request from a phone browser, with no app installed.
 *
 * THE MODEL DOES NOT CHANGE HERE. A guest REQUESTS, the operator has 12 hours
 * to accept, and only then is there anything to pay. There is no instant book
 * on this path and no card taken: this file writes one document and stops.
 * That is also why "do not take money unless a booking record exists" is
 * satisfied by construction rather than by a check, since nothing here can
 * take money at all.
 *
 * ANONYMOUS AUTH, not a sign-up wall. firestore.rules:544 requires
 * `request.auth != null && request.resource.data.userId == request.auth.uid`,
 * and a guest arriving from an Instagram bio has no account and will not make
 * one to ask a question. ensureAnonymousAuth gives them a real uid, so the
 * rule is satisfied honestly rather than loosened. The contact form already
 * works this way.
 */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, ensureAnonymousAuth } from "./firebase";
import {
  buildBookingRequestPayload,
  validateBookingForm,
  type BookingFormInput,
} from "./booking-request";
import type { Listing } from "./listings";

export interface BookingAsk extends BookingFormInput {
  /** What the offer costs, so the operator sees what was agreed to. */
  totalPrice?: number;
  note?: string;
}

export class BookingError extends Error {}

/**
 * Write the request. Returns the new document id.
 *
 * Throws with a sentence meant for a person standing outside a spa, never a
 * provider error. If this throws, the guest must be told plainly that nothing
 * was sent, because the alternative is somebody waiting twelve hours for a
 * reply to a message that does not exist.
 */
export async function sendBookingRequest(
  listing: Listing,
  ask: BookingAsk,
  idempotencyKey: string,
): Promise<string> {
  const problem = validateBookingForm(ask);
  if (problem) throw new BookingError(problem);

  // The operator this reaches. Without it the request is unroutable, and
  // Studio filters on exactly this field, so a blank one is a silent loss.
  const businessOwnerId = listing.userId || "";
  if (!businessOwnerId) {
    throw new BookingError(
      "This listing is not set up to take requests yet. Please contact them directly.",
    );
  }

  let uid: string;
  try {
    uid = await ensureAnonymousAuth();
  } catch {
    throw new BookingError("Could not reach Sabię just now. Please try again in a moment.");
  }

  const contact = ask.contact.trim();
  const isEmail = contact.includes("@");

  const payload = buildBookingRequestPayload({
    userId: uid,
    userName: ask.name.trim(),
    userEmail: isEmail ? contact : "",
    itemId: listing.id,
    adId: listing.id,
    businessOwnerId,
    businessName: listing.businessName || listing.title || "",
    businessImageUrl: listing.coverImage || listing.imageUrls?.[0]?.url || null,
    role: listing.role || null,
    currency: listing.currency || null,
    idempotencyKey,
    bookingDetails: {
      package: ask.offer,
      date: ask.date,
      guests: ask.guests,
      totalPrice: ask.totalPrice,
      // A phone number has nowhere else to go: userEmail is for addresses, and
      // an operator who cannot reach the guest cannot accept the booking.
      note: [ask.note?.trim(), isEmail ? "" : `Phone: ${contact}`]
        .filter(Boolean)
        .join("\n") || undefined,
      // Where this came from. An operator seeing "asked from your Sabię page"
      // knows the guest never opened the app, which changes how they reply.
      source: "web-listing",
    },
  });

  try {
    const ref = await addDoc(collection(db, "bookingRequests"), {
      ...payload,
      requestedAt: serverTimestamp(),
    });
    return ref.id;
  } catch {
    throw new BookingError(
      "That did not send. Nothing has been booked, so please try again.",
    );
  }
}
