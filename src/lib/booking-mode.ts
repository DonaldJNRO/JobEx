// How this listing takes a booking, decided from what the operator has
// actually told us.
//
// THE IDEA. Rather than one platform-wide rule about deposits and instant
// booking, each listing answers for itself. The founder put it as "a system
// that understands when someone needs instant booking or so", which is right:
// a rink selling a timed slot and a café taking a table are not the same
// transaction and should not wear the same button.
//
// WHAT IS INFERRED, AND WHAT IS NOT. Measured across all 49 live listings on
// 9 Oct 2026:
//
//   acceptsInAppPayment, sabieAllocationPerSlot, role   present on all 49
//   externalBookingUrl                                  1 listing
//   a written policy                                    1 listing
//
// So mode is inferred from the first group, which every listing has. Deposit
// is NOT inferred: reading "balance is due before leaving the studio" out of
// policy prose would be a classifier trained on one business's wording, and
// it would be wrong the first time somebody phrased it differently. A deposit
// is a number an operator sets, so it is a field, and a listing without one
// is simply not on deposit.
//
// Pure, and imports nothing, so booking-mode.test.mjs runs it without
// Firebase.

export type BookingMode =
  /** Booked on the operator's own system. Sabię never takes this money. */
  | "external"
  /** Confirmed on the spot, paid in full. */
  | "instant"
  /** Confirmed on the spot, part paid now and the rest at the venue. */
  | "deposit"
  /** Somebody has to say yes. The operator has 12 hours. */
  | "request";

export interface BookingModeResult {
  mode: BookingMode;
  /** Said plainly, for the button and for anyone debugging a surprise. */
  why: string;
  /**
   * What to charge now, as a fraction of the price. 1 for instant, the
   * operator's own figure for a deposit, 0 when nothing is taken yet.
   */
  payNowFraction: number;
}

interface ModeInput {
  acceptsInAppPayment?: unknown;
  sabieAllocationPerSlot?: unknown;
  role?: unknown;
  externalBookingUrl?: unknown;
  /**
   * Percent of the price taken at booking, 1 to 99. Set per listing by the
   * office from the operator's own stated terms; absent means pay in full.
   * Naileditbyd's policy says the balance is due before leaving the studio,
   * which is exactly what this field is for.
   */
  depositPercent?: unknown;
}

const isCafe = (role: string) =>
  role.includes("food_beverage") || role.includes("foodbeverage") || role.includes("restaurant");

export function bookingMode(listing: unknown): BookingModeResult {
  const l = (listing ?? {}) as ModeInput;

  // A SERVICE BOOKED ELSEWHERE IS NEVER OURS TO SELL. Two diaries over one
  // chair is the clash this field exists to prevent, so it outranks
  // everything below it.
  if (typeof l.externalBookingUrl === "string" && l.externalBookingUrl.trim()) {
    return { mode: "external", why: "They take bookings on their own system.", payNowFraction: 0 };
  }

  const role = String(l.role ?? "").toLowerCase();
  if (isCafe(role)) {
    // Locked rule. A café is discovery and a reservation request, never a
    // payment, and re-checked here rather than trusted from a stamp.
    return { mode: "request", why: "Cafés take a reservation, not a payment.", payNowFraction: 0 };
  }

  const alloc = Number(l.sabieAllocationPerSlot);
  const payable = l.acceptsInAppPayment === true && Number.isFinite(alloc) && alloc > 0;
  if (!payable) {
    return {
      mode: "request",
      why: l.acceptsInAppPayment === true
        ? "No slots are allocated to Sabię yet, so a person confirms this one."
        : "This operator takes enquiries rather than payments.",
      payNowFraction: 0,
    };
  }

  // MIRRORS canSellInstantly IN onBookingRequestCreated from here down. That
  // function is what actually confirms the request, and if these two ever
  // disagree the page promises something the server will not do.
  const deposit = Number(l.depositPercent);
  if (Number.isFinite(deposit) && deposit > 0 && deposit < 100) {
    return {
      mode: "deposit",
      why: `Pay ${deposit}% now to hold it, and the rest at the venue.`,
      payNowFraction: deposit / 100,
    };
  }

  return { mode: "instant", why: "Confirmed on the spot.", payNowFraction: 1 };
}

/** What to charge now, in whole currency units. Never computed client-side
 *  for the ledger: this is for DISPLAY, so a guest knows before they commit. */
export function payNowAmount(listing: unknown, total: number | null | undefined): number | null {
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) return null;
  const f = bookingMode(listing).payNowFraction;
  if (f <= 0) return null;
  // Rounded to a whole unit. Nobody is charged ₦1,133.33.
  return Math.round(total * f);
}
