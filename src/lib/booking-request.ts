/**
 * The bookingRequests write contract, on the web.
 *
 * A VERBATIM COPY, not this repo's own file. The original is
 * `sabie-v53-main/utils/bookingRequestPayload.js`, and its header says why it
 * is a pure function split out from the Firestore call: so a verify harness
 * can exercise the contract from Node. Same reason it can live here.
 *
 * THE KEYSTONE, quoting that file: Studio's
 * `src/app/dashboard/booking-requests/page.tsx` filters by
 * (businessOwnerId, status='pending') and orders by requestedAt, and
 * `functions/index.js#convertRequestToBooking` reads businessOwnerId, userId,
 * itemId and bookingDetails.{checkIn,checkOut,date,guests,price} when an
 * operator confirms. A wrong key name means the operator's inbox stays dark
 * even though the write succeeded. Nothing about that is visible to the guest,
 * who is told their request was sent.
 *
 * So: change one, change both, and run the tests beside each. Same arrangement
 * as slug.ts across the four repos.
 */

export interface BookingDetails {
  /** The offer the guest chose, by name. Studio renders this as a row. */
  package?: string;
  date?: string;
  guests?: number;
  note?: string;
  totalPrice?: number;
  currency?: string | null;
  [key: string]: unknown;
}

export interface BookingRequestInput {
  userId?: string;
  userName?: string;
  userEmail?: string;
  tripId?: string | null;
  itemId?: string;
  businessOwnerId?: string;
  businessName?: string;
  businessImageUrl?: string | null;
  bookingDetails?: BookingDetails;
  idempotencyKey?: string | null;
  currency?: string | null;
  adId?: string;
  role?: string | null;
}

export function buildBookingRequestPayload({
  userId, userName, userEmail, tripId, itemId, businessOwnerId,
  businessName, businessImageUrl, bookingDetails, idempotencyKey,
  currency, adId, role,
}: BookingRequestInput = {}) {
  // 2026-07-10, from the original: currency became load-bearing. Without it,
  // MyBookingsScreen and BookingReceiptModal display an operator's ₦20,000 as
  // £20,000, the "naira-labelled-as-pounds" bug. Callers must pass currency
  // from the ad or room; it is accepted on bookingDetails too as a fallback and
  // mirrored at the top level for query convenience.
  const resolvedCurrency = (currency
    || bookingDetails?.currency
    || "").toUpperCase() || null;

  return {
    userId: userId || "",
    userName: userName || "Traveler",
    // requestedBy mirrors userId/userName/userEmail so a query on either shape
    // finds this doc. Studio's booking-requests page accepts both.
    requestedBy: {
      userId: userId || "",
      userName: userName || "Traveler",
      userEmail: userEmail || "",
    },
    businessOwnerId: businessOwnerId || "",
    businessName: businessName || "",
    businessImageUrl: businessImageUrl || null,
    itemId: itemId || "",
    adId: adId || itemId || "",
    role: role || null,
    status: "pending" as const,
    bookingDetails: {
      ...(bookingDetails || {}),
      currency: (bookingDetails?.currency || resolvedCurrency || "").toUpperCase() || null,
    },
    currency: resolvedCurrency,
    requestedAt: null, // overridden with serverTimestamp() at write
    respondedAt: null,
    userEmail: userEmail || "",
    tripId: tripId || null,
    idempotencyKey: idempotencyKey || null,
  };
}

/** What the guest must give us before a request is worth sending. */
export interface BookingFormInput {
  offer: string;
  date: string;
  guests: number;
  name: string;
  contact: string;
}

/**
 * Refuse a request the operator could not act on.
 *
 * A booking request with no name or no way to reply is not a lead, it is a
 * notification an operator cannot answer. Better to stop it here than to tell
 * a guest "they have 12 hours" about a message nobody can reply to.
 */
export function validateBookingForm(input: BookingFormInput): string | null {
  if (!input.offer.trim()) return "Choose what you are booking.";
  if (!input.date.trim()) return "Pick a date.";
  if (!Number.isFinite(input.guests) || input.guests < 1) return "How many people are coming?";
  if (!input.name.trim()) return "Please add your name, so they know who is asking.";
  const contact = input.contact.trim();
  if (!contact) return "Add an email or phone number, so they can reply.";
  // Deliberately loose, the same judgement as the contact form: a rule that
  // rejects a real address is worse than one that lets a typo through, because
  // the typo is the guest's to notice and the rejection is ours.
  if (contact.includes("@")) {
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(contact)) return "That email address looks incomplete.";
  } else if (contact.replace(/[^0-9]/g, "").length < 7) {
    return "That phone number looks too short.";
  }
  return null;
}
