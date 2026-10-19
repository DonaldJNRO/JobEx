// The basket, which is a trip with things in it.
//
// THERE IS NO CART COLLECTION, AND THERE SHOULD NOT BE. The product model is
// already this: "one record with a line per operator. A basket paid once can
// hold several businesses." A trip holds bookingRequests; the unpaid ones are
// the basket. Inventing a parallel cart would mean a second place that knows
// what somebody is buying, and a second total to keep in step with the first.
//
// AND THE SERVER ALREADY SUPPORTS IT. createTripPaymentIntent reads a trip's
// CONFIRMED requests, groups them per operator, and charges once
// (payTrip.js:411). Commission, the FX snapshot, the ledger and each
// operator's statement all happen there. The website never asked, which is
// why it could take a card for one listing at a time and no more.
//
// WHAT "READY" MEANS, AND WHY SOME ITEMS ARE NOT. An instant listing is
// confirmed the moment the request lands, so it is payable immediately. A
// request listing waits for the operator. The app's cart shows both and pays
// what is ready; so does this. Hiding the unready ones would make a basket
// quietly cheaper than the trip it belongs to.

import {
  collection, getDocs, query, where, orderBy, limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { createTrip } from "./trips";
import { sendBookingRequest } from "./book";

/** Statuses that are paid for and done with, as far as a basket is concerned. */
const SETTLED = ["confirmed_paid", "partially_paid", "refunded", "partially_refunded", "cancelled_by_user", "declined", "expired", "cancelled_split_expired"];

/** Confirmed and unpaid: the operator has said yes and the money has not moved. */
const READY = ["confirmed"];

export interface CartItem {
  id: string;
  businessName: string;
  package: string;
  date: string | null;
  time: string | null;
  guests: number;
  totalPrice: number | null;
  currency: string | null;
  status: string;
  /** True when this can be paid for right now. */
  ready: boolean;
}

export interface Cart {
  tripId: string;
  items: CartItem[];
  /** What pressing Pay would charge, in the listings' own currency. */
  total: number;
  currency: string | null;
  /** Items still waiting on an operator. */
  waiting: number;
}

function toItem(id: string, d: Record<string, unknown>): CartItem {
  const bd = (d.bookingDetails || {}) as Record<string, unknown>;
  const status = String(d.status || "");
  return {
    id,
    businessName: String(d.businessName || "Booking"),
    package: String(bd.package || ""),
    date: typeof bd.date === "string" ? bd.date : null,
    time: typeof bd.time === "string" ? bd.time : null,
    guests: Number(bd.guests) || 1,
    totalPrice: typeof bd.totalPrice === "number" ? bd.totalPrice : null,
    currency: typeof bd.currency === "string" ? bd.currency : (typeof d.currency === "string" ? d.currency : null),
    status,
    ready: READY.includes(status),
  };
}

/**
 * Everything in this trip that has not been paid for.
 *
 * Read once rather than subscribed: a basket that rearranges itself while
 * somebody is reading the total is worse than one they refresh.
 */
export async function loadCart(tripId: string): Promise<Cart> {
  const snap = await getDocs(query(
    collection(db, "bookingRequests"),
    where("tripId", "==", tripId),
    orderBy("requestedAt", "desc"),
  ));

  const items = snap.docs
    .map((d) => toItem(d.id, d.data() as Record<string, unknown>))
    .filter((i) => !SETTLED.includes(i.status));

  const ready = items.filter((i) => i.ready);
  return {
    tripId,
    items,
    // ONLY WHAT IS READY. Totalling the whole basket would quote a number the
    // Pay button is not going to charge, and the gap would be invisible.
    total: ready.reduce((sum, i) => sum + (i.totalPrice || 0), 0),
    currency: ready.find((i) => i.currency)?.currency || items.find((i) => i.currency)?.currency || null,
    waiting: items.length - ready.length,
  };
}

export interface CartIntent {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Pay for everything that is ready, in one charge.
 *
 * Hands the whole job to createTripPaymentIntent: it groups per operator,
 * takes the commission and writes each statement. Not one line of money
 * logic belongs on this side of the wire.
 */
export async function payCart(cart: Cart, currency: string): Promise<CartIntent> {
  const ids = cart.items.filter((i) => i.ready).map((i) => i.id);
  if (ids.length === 0) throw new Error("Nothing in your trip is ready to pay for yet.");

  const call = httpsCallable<
    { tripId: string; currency: string; bookingRequestIds: string[] },
    { clientSecret?: string; paymentIntentId?: string }
  >(functions, "createTripPaymentIntent");

  const res = await call({ tripId: cart.tripId, currency: currency.toLowerCase(), bookingRequestIds: ids });
  if (!res?.data?.clientSecret) throw new Error("Sabię could not start that payment. Nothing has been charged.");
  return { clientSecret: res.data.clientSecret, paymentIntentId: String(res.data.paymentIntentId || "") };
}

/**
 * Put a listing in somebody's basket.
 *
 * A basket item IS a bookingRequest with a tripId on it, so this writes the
 * same document the Send button writes and attaches it to a trip. There is no
 * separate cart to keep in step, which is the whole reason the basket is a
 * trip in the first place.
 *
 * REUSES THE MOST RECENT TRIP, rather than starting one per listing.
 * Somebody adding three places is planning one trip; three baskets of one
 * would be three payments and three chats, which is the thing a basket exists
 * to avoid. Starting a new one is a deliberate act on the trips page.
 */
export async function addToTrip(
  uid: string,
  profile: Parameters<typeof createTrip>[1],
  displayName: string | null | undefined,
  listing: Parameters<typeof sendBookingRequest>[0],
  ask: Parameters<typeof sendBookingRequest>[1],
): Promise<string> {
  const mine = await getDocs(query(
    collection(db, "trips"),
    where("memberIds", "array-contains", uid),
    orderBy("createdAt", "desc"),
    limit(1),
  ));

  const tripId = mine.docs[0]?.id
    ?? await createTrip(
      { uid, displayName: displayName ?? null, photoURL: profile?.profileImage ?? null },
      profile,
      // Named after the place, because "New trip" tells somebody nothing
      // about which of their trips this is.
      (listing as { businessName?: string; title?: string }).businessName
        || (listing as { title?: string }).title
        || "My trip",
    );

  // A fresh key per add, or the second thing somebody adds is swallowed as a
  // duplicate of the first.
  await sendBookingRequest(listing, ask, `web-cart-${uid}-${Date.now()}`, tripId);
  return tripId;
}
