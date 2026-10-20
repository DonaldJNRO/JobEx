// THE TRAVELLER'S SERVICE FEE, MIRRORED FOR DISPLAY ONLY.
//
// The website showed "Total £3" and the card was charged £3.30.
//
// createSingleItemPaymentIntent, which is the function this site calls, adds
// the fee server-side through functions/travellerFee.js. So the fee was real
// and arriving on every web booking; the only thing missing was telling
// anybody about it. An undisclosed 10 percent at the moment somebody commits
// their card is worse than no fee at all.
//
// THE SERVER STAYS AUTHORITATIVE. This recomputes nothing that matters: it
// exists so the sheet can show a line before the intent is created, and the
// intent's own totals win the moment they come back. traveller-fee.test.mjs
// holds these constants identical to the function's, byte for byte, the same
// arrangement region-currency already uses across these repos.
//
// Pure and dependency free, so a plain-node guard can import it.

/** functions/travellerFee.js: TRAVELLER_FEE_PERCENT */
export const TRAVELLER_FEE_PERCENT = 5;

// The floor may never make the fee absurd. On the NGN 300 listing in the
// catalogue a NGN 300 floor would DOUBLE the price. Capped at three times the
// base rate, so the floor still does its job on a NGN 4,000 booking and stops
// being a floor long before it becomes a joke.
/** functions/travellerFee.js: FEE_MAX_PERCENT */
export const FEE_MAX_PERCENT = 15;

// Each roughly the fixed processing cost in that money. A currency with no
// entry gets NO floor rather than a wrong one.
/** functions/travellerFee.js: FEE_FLOOR */
export const FEE_FLOOR: Record<string, number> = {
  NGN: 300,
  GBP: 0.3,
  USD: 0.4,
  EUR: 0.35,
};

/**
 * The fee to add, in MINOR units, in the same currency as the subtotal.
 * Byte-for-byte the rule in functions/travellerFee.js.
 */
export function travellerFeeMinor(subtotalMinor: number, currency: string): number {
  const base = Number(subtotalMinor);
  if (!Number.isFinite(base) || base <= 0) return 0;

  const pct = base * (TRAVELLER_FEE_PERCENT / 100);
  const code = String(currency || "").toUpperCase();
  const floorMinor = Object.prototype.hasOwnProperty.call(FEE_FLOOR, code)
    ? Math.round(FEE_FLOOR[code] * 100)
    : 0;

  const ceiling = base * (FEE_MAX_PERCENT / 100);
  const fee = Math.round(Math.min(Math.max(pct, floorMinor), ceiling));
  return Math.max(0, fee);
}

/** The same rule in MAJOR units, which is what the sheet has in hand. */
export function travellerFeeMajor(subtotalMajor: number, currency: string): number {
  const n = Number(subtotalMajor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return travellerFeeMinor(Math.round(n * 100), currency) / 100;
}

/** functions/travellerFee.js: feeLabel() */
export function feeLabel(): string {
  return "Sabię service fee";
}

/** Subtotal, fee and total together, so no surface can show two of the three. */
export interface FeeBreakdown {
  subtotal: number;
  fee: number;
  total: number;
  /** True where the fixed floor beat the percentage, which is most small bookings. */
  atFloor: boolean;
}

export function breakdownOf(subtotalMajor: number, currency: string): FeeBreakdown {
  const subtotal = Number(subtotalMajor) || 0;
  const fee = travellerFeeMajor(subtotal, currency);
  const code = String(currency || "").toUpperCase();
  const floor = FEE_FLOOR[code] ?? 0;
  return {
    subtotal,
    fee,
    total: Math.round((subtotal + fee) * 100) / 100,
    atFloor: fee > 0 && floor > 0 && Math.abs(fee - floor) < 0.005,
  };
}
