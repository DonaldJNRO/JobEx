// What a guest is quoted and charged, for an offer priced by the night, the
// person, the ticket or the booking.
//
// THE BUG. BookingRequest computed `unit * guests` for every offer. offersOf
// in shop-window.ts names an offer from the listing's own pricingUnit — "Per
// night", "Per person", "Ticket", "Booking" — so three guests in one room
// were quoted three nights.
//
// It is not only a display problem now that this site takes cards.
// BookingRequest sends `totalPrice: dueNow ?? total`, so when the server has
// not set a payNow the multiplied figure is what gets charged, and when it
// has, the guest agrees to one number on the button and is charged another.
//
// Per person and per ticket genuinely scale with heads. A nightly, hourly or
// weekly rate scales with TIME, and this form collects a date and no
// checkout, so there is nothing to multiply by: the honest answer is the rate
// itself, labelled as a rate, with the operator confirming the stay. A
// guessed total is worse than an obvious rate, because the guess is what
// ends up on the card.
//
// Lives out of the component so it can be tested. The component cannot be
// imported into a node test without pulling in Next.

/**
 * AN OPERATOR CAN NOW SAY IT, rather than having to name the service "Per
 * person" and hope.
 *
 * Measured 21 Oct 2026: 159 services carry a price and NOT ONE says what
 * that price covers. No unit field existed, and not one name contained
 * "per person", so every price on the platform was being read as per
 * booking by the rule below. That default is the safe one and it stays: a
 * service whose unit nobody has set is charged as listed, so adding this
 * field changes no existing charge.
 *
 * It is read FIRST and the name is the fallback, because a field somebody
 * set deliberately beats a word that happens to be in a title. "Spa day for
 * two people" is a per booking price with the word "people" in it.
 */
export type PricingUnit = "booking" | "person" | "night" | "hour" | "day";

/** The unit an operator set, where they set one. */
function declaredUnit(unit: string | null | undefined): PricingUnit | null {
  const u = String(unit || "").trim().toLowerCase().replace(/^per[\s_-]*/, "");
  if (!u) return null;
  if (/person|guest|head|pax|ticket/.test(u)) return "person";
  if (/night/.test(u)) return "night";
  if (/hour/.test(u)) return "hour";
  if (/day/.test(u)) return "day";
  if (/booking|flat|total|session/.test(u)) return "booking";
  return null;
}

/** Offers whose price is per head. */
const PER_HEAD = /person|ticket|guest|head|pax/i;

/** Offers whose price is per unit of time, which this form cannot total. */
const PER_TIME = /night|hour|day|week|month/i;

export interface OfferTotal {
  /** What to show. undefined when the offer carries no usable price. */
  amount: number | undefined;
  /** True when `amount` is a rate rather than what the guest will pay. */
  isRate: boolean;
  /** What the price covers, for saying so on the screen. null when nobody
   *  has said and the name does not imply one. */
  unit: PricingUnit | null;
}

export function offerTotal(
  offerName: string | undefined | null,
  unitPrice: number | undefined | null,
  guests: number | undefined | null,
  /** What the operator SAID it covers, where they said anything. */
  pricingUnit?: string | null,
): OfferTotal {
  const name = offerName || "";
  const declared = declaredUnit(pricingUnit);
  // A deliberate field beats a word in a title.
  const perHead = declared ? declared === "person" : PER_HEAD.test(name);
  // Checked after per-head, so "Per person per night" scales by heads rather
  // than being refused as untotallable.
  const isRate = !perHead && (declared
    ? declared === "night" || declared === "hour" || declared === "day"
    : PER_TIME.test(name));

  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice)) {
    return { amount: undefined, isRate, unit: declared };
  }
  const heads = Math.max(1, Math.floor(Number(guests) || 1));
  return { amount: perHead ? unitPrice * heads : unitPrice, isRate, unit: declared };
}
