// Taking money on the web, by doing exactly what the app does.
//
// THE TRIP IS NOT AN OBSTACLE, IT IS THE POINT. createSingleItemPaymentIntent
// demands a tripId and checks the caller is in memberIds, and the first
// instinct is to see that as something standing between the website and a
// payment. It is the opposite. The product doc puts it plainly: "The booking:
// one record with a line per operator. A basket paid once can hold several
// businesses." A web booking of one service IS that record, with one line.
//
// A web-only payment path that skipped trips would mean two money paths, two
// places computing a total, two shapes of booking downstream. That is the
// failure the same doc names: "six surfaces that drift apart start looking
// like six companies." So the website creates a real trip and calls the same
// callable the app calls, and not one line of money logic is written here.
//
// What that buys, beyond correctness: commission, the FX snapshot taken at
// charge time, the bookingRequest, the payout ledger and the operator's
// statement all happen server-side exactly as they do for the app, and a
// multi-item web basket is already possible the day someone wants one.
//
// WHAT THIS FILE WILL NOT DO. It does not compute a fee, a split or a total.
// bookingDetails.totalPrice is what the operator set; the server takes it
// from there and is the only thing that decides what Sabię keeps.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, ensureAnonymousAuth } from "./firebase";

export class PayError extends Error {}

export interface PayIntent {
  clientSecret: string;
  paymentIntentId: string;
  bookingRequestId: string;
  totalCents: number;
  platformFeeCents: number;
}

/**
 * A trip of one, so the web booking is the same object as an app booking.
 *
 * Written by the guest's own (anonymous) account, which the trips rule
 * allows: `create` needs `createdBy.id == request.auth.uid`, and an anonymous
 * sign-in is a real uid as far as that rule is concerned.
 */
async function createTripOfOne(uid: string, name: string, destination: string): Promise<string> {
  const ref = await addDoc(collection(db, "trips"), {
    tripName: name,
    createdBy: { id: uid, name: "Guest" },
    memberIds: [uid],
    selectedUsers: [uid],
    primaryDestination: destination || "",
    destinations: destination ? [destination] : [],
    travelType: "solo",
    startDate: null,
    endDate: null,
    imageUrl: null,
    createdAt: serverTimestamp(),
    // Where this trip came from, so a trip of one booked from a shared link
    // is tellable from a trip planned in the app. Nothing branches on it
    // today; it is here so the question is answerable later.
    source: "web",
  });
  return ref.id;
}

/**
 * Ask the server for a payment intent. Returns the client secret Stripe
 * Elements needs, and the bookingRequest the operator will see.
 */
export async function startPayment(opts: {
  listing: Record<string, unknown>;
  offer: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  contact: string;
  note: string;
  totalPrice: number;
  /** The currency the guest was SHOWN. The server converts and charges it. */
  currency: string;
}): Promise<PayIntent> {
  if (!(opts.totalPrice > 0)) throw new PayError("There is no price on this to pay.");

  let uid: string;
  try {
    uid = await ensureAnonymousAuth();
  } catch {
    throw new PayError("Could not reach Sabię just now. Please try again in a moment.");
  }

  const l = opts.listing as { businessName?: string; title?: string; city?: string; id?: string; userId?: string };
  const business = l.businessName || l.title || "Booking";

  let tripId: string;
  try {
    tripId = await createTripOfOne(uid, business, l.city || "");
  } catch {
    throw new PayError("Could not start your booking. Nothing has been charged.");
  }

  try {
    const fn = httpsCallable(functions, "createSingleItemPaymentIntent");
    const res = await fn({
      tripId,
      listing: opts.listing,
      bookingDetails: {
        // THE OPERATOR'S PRICE, passed through untouched. The server treats
        // totalPrice as authoritative and works the fee out from it, so
        // anything invented here would be inventing money.
        totalPrice: opts.totalPrice,
        selectedPackage: opts.offer || null,
        date: opts.date || null,
        time: opts.time || null,
        guests: opts.guests || 1,
        userName: opts.name,
        userContact: opts.contact,
        note: opts.note || "",
      },
      // The currency they were shown. payTrip converts per operator and
      // falls back to the operator's own currency if it cannot, rather than
      // charging a number it is unsure of.
      currency: (opts.currency || "GBP").toUpperCase(),
    });
    const d = res.data as Partial<PayIntent>;
    if (!d?.clientSecret) throw new PayError("Sabię could not start the payment. Nothing has been charged.");
    return d as PayIntent;
  } catch (e) {
    if (e instanceof PayError) throw e;
    const msg = (e as { message?: string })?.message;
    // NOTHING HAS BEEN CHARGED is the half of this the guest needs. A failure
    // here is before any card is touched, and saying so stops them trying
    // again on another card and double-paying.
    throw new PayError(msg || "Sabię could not start the payment. Nothing has been charged.");
  }
}
