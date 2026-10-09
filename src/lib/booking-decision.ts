// Asking the server how a booking works, instead of working it out again.
//
// THIS FILE REPLACES booking-mode.ts, which I wrote this morning and which
// was the 118th place to re-derive the same rule. Its own comment said
// "mirrors canSellInstantly", which is an honest way of saying it would
// drift. Measured the same day: 117 files across four repos re-derive "is
// this a café" and 19 decide payability for themselves, and one tier-priced
// bug had already reached three of them.
//
// See sabie-admin/docs/BOOKING_DECISION.md.

import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export type BookingMode = "instant" | "deposit" | "request" | "external";

export interface BookingDecision {
  mode: BookingMode;
  why: string;
  payNow: number;
  balanceAtVenue: number;
  fullPrice: number;
  currency: string;
  terms: {
    tier: string;
    tierLabel: string;
    freeCancelHours: number;
    responseHours: number;
  };
  ifCancelledNow: { refund: number; toOperator: number; why: string };
}

/**
 * THE FALLBACK IS "ASK", NEVER A GUESSED PRICE.
 *
 * If the callable cannot be reached, the honest thing is the slower path: the
 * operator confirms, nobody is charged, and nothing is promised that the
 * server has not agreed to. Showing "confirmed on the spot" because a network
 * call failed would be the worst possible direction to fail in.
 */
export const ASK: BookingDecision = {
  mode: "request",
  why: "",
  payNow: 0,
  balanceAtVenue: 0,
  fullPrice: 0,
  currency: "NGN",
  terms: { tier: "flexible", tierLabel: "Flexible", freeCancelHours: 24, responseHours: 12 },
  ifCancelledNow: { refund: 0, toOperator: 0, why: "" },
};

export async function fetchBookingDecision(
  listingId: string,
  offer: string,
): Promise<BookingDecision> {
  if (!listingId) return ASK;
  try {
    const call = httpsCallable<{ listingId: string; offer: string }, BookingDecision>(
      functions,
      "bookingDecision",
    );
    const res = await call({ listingId, offer });
    return res.data ?? ASK;
  } catch {
    return ASK;
  }
}
