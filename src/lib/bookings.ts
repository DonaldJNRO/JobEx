/**
 * A traveller's bookings.
 *
 * WHERE FROM. `bookingRequests`, filtered to this traveller. NOT the
 * `bookings` collection, which is scoped in the rules to the operator and the
 * platform; the traveller app reads bookingRequests and receipts, and this
 * follows it rather than inventing a third answer.
 *
 * There are two filters because there are two generations of document:
 * `requestedBy.userId` is current, and a small number of older requests carry
 * a top-level `userId` instead. MyBookingsScreen.js runs both subscriptions
 * for exactly this reason. Dropping the legacy one would quietly hide a
 * traveller's oldest bookings, which are the ones they are most likely to be
 * hunting for.
 *
 * THE CODE. `publicCode` is minted in functions/payTrip.js on the write that
 * marks a booking paid, and stamped onto the bookingRequest. Every other
 * surface on the platform can read it and none of them show it: it appears in
 * Cloud Functions and in the operator's statement, and in no screen or
 * component anywhere. So the code a guest is meant to say at the door has
 * never been shown to the guest. This is the first surface that does.
 */

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { normaliseBookingRequest, type TravellerBooking } from "./booking-shape";

export type { TravellerBooking } from "./booking-shape";
export { formatBookingDate } from "./booking-shape";

export async function getTravellerBookings(uid: string): Promise<TravellerBooking[]> {
  const ref = collection(db, "bookingRequests");

  // Both generations, in parallel, merged by id. A document that matches both
  // filters is one booking, not two.
  const [current, legacy] = await Promise.all([
    getDocs(query(ref, where("requestedBy.userId", "==", uid))).catch(() => null),
    getDocs(query(ref, where("userId", "==", uid))).catch(() => null),
  ]);

  const byId = new Map<string, TravellerBooking>();
  for (const snap of [current, legacy]) {
    snap?.forEach((d) => {
      if (!byId.has(d.id)) byId.set(d.id, normaliseBookingRequest(d.id, d.data() as Record<string, unknown>));
    });
  }

  // Soonest experience first, so the booking a traveller needs at a door this
  // week is at the top rather than buried under last year's. Bookings with no
  // date yet sort after the dated ones, newest request first.
  return Array.from(byId.values()).sort((a, b) => {
    if (a.date && b.date) return a.date.getTime() - b.date.getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return (b.requestedAt?.getTime() || 0) - (a.requestedAt?.getTime() || 0);
  });
}
