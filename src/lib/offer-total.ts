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

/** Offers whose price is per head. */
const PER_HEAD = /person|ticket|guest|head|pax/i;

/** Offers whose price is per unit of time, which this form cannot total. */
const PER_TIME = /night|hour|day|week|month/i;

export interface OfferTotal {
  /** What to show. undefined when the offer carries no usable price. */
  amount: number | undefined;
  /** True when `amount` is a rate rather than what the guest will pay. */
  isRate: boolean;
}

export function offerTotal(
  offerName: string | undefined | null,
  unitPrice: number | undefined | null,
  guests: number | undefined | null,
): OfferTotal {
  const name = offerName || "";
  const perHead = PER_HEAD.test(name);
  // Checked after per-head, so "Per person per night" scales by heads rather
  // than being refused as untotallable.
  const isRate = !perHead && PER_TIME.test(name);

  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice)) {
    return { amount: undefined, isRate };
  }
  const heads = Math.max(1, Math.floor(Number(guests) || 1));
  return { amount: perHead ? unitPrice * heads : unitPrice, isRate };
}
