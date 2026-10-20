// NIGHTS, AND WHAT THEY COST.
//
// The booking sheet asks for one date and a time, because it was built for a
// haircut and a skate night. A room got handed to the same form, so a room
// at 84 a night produced a request with no checkout, no night count and no
// total. offer-total.ts says so itself: it refuses to total a nightly rate
// because "the form has a date and no checkout, so there is no stay length".
//
// Every room document already carries what this needs: basePrice, minStay,
// maxStay, checkInTime, checkOutTime and cautionFee.
//
// Pure and dependency free, and it deals in "YYYY-MM-DD" strings rather than
// Date objects on purpose. A stay is a calendar fact, not an instant: two
// nights in Lagos is two nights whatever time zone the browser thinks it is
// in, and building Dates from these strings is how an arrival date ends up a
// day early for somebody west of the meridian.

const DAY = 86400000;

/** Is this a real calendar date, written the way a date input writes one? */
export function isDay(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Rejects 31 February, which passes the range check above.
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** Midnight UTC for a calendar day, which is only ever used to subtract. */
function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Nights between two days. THE CHECKOUT DAY IS NOT A NIGHT: arriving on the
 * 8th and leaving on the 10th is two nights, not three. Getting that wrong
 * overcharges every stay by one night.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!isDay(checkIn) || !isDay(checkOut)) return 0;
  const n = Math.round((utc(checkOut) - utc(checkIn)) / DAY);
  return n > 0 ? n : 0;
}

/** Today, as a calendar day in the viewer's own zone. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The day after a given day, for the checkout field's minimum. */
export function dayAfter(day: string): string {
  if (!isDay(day)) return "";
  const t = new Date(utc(day) + DAY);
  return t.toISOString().slice(0, 10);
}

export interface StayTerms {
  rate: number | null;
  minStay?: number | null;
  maxStay?: number | null;
}

export interface StayQuote {
  nights: number;
  /** nights × rate, before any fee. Null when it cannot be known. */
  subtotal: number | null;
  /** Why this cannot be booked yet, in words a guest can act on. */
  problem: string | null;
  ok: boolean;
}

/**
 * What a stay costs, and whether it is allowed.
 *
 * The deposit is deliberately NOT in here. No Cloud Function reads
 * cautionFee, so Sabię never charges it: it is money the property takes and
 * gives back, and adding it to a total would take it off a card nobody
 * intended to. It is disclosed beside the total, never inside it.
 */
export function quoteStay(checkIn: string, checkOut: string, terms: StayTerms): StayQuote {
  const none = (problem: string | null): StayQuote => ({ nights: 0, subtotal: null, problem, ok: false });

  if (!isDay(checkIn) || !isDay(checkOut)) return none(null);
  if (utc(checkOut) <= utc(checkIn)) return none("Check out has to be after check in.");

  const nights = nightsBetween(checkIn, checkOut);
  const min = terms.minStay && terms.minStay > 0 ? terms.minStay : 1;
  const max = terms.maxStay && terms.maxStay > 0 ? terms.maxStay : null;

  if (nights < min) {
    return { nights, subtotal: null, ok: false, problem: `This room takes ${min} ${min === 1 ? "night" : "nights"} at a time.` };
  }
  if (max && nights > max) {
    return { nights, subtotal: null, ok: false, problem: `This room can be booked for up to ${max} nights.` };
  }
  if (typeof terms.rate !== "number" || !Number.isFinite(terms.rate) || terms.rate <= 0) {
    // A room with no rate can still be REQUESTED; it just cannot be totalled.
    return { nights, subtotal: null, ok: true, problem: null };
  }

  return {
    nights,
    subtotal: Math.round(terms.rate * nights * 100) / 100,
    problem: null,
    ok: true,
  };
}

/** "2 nights · 8 to 10 Jan", for a summary line. */
export function stayLine(checkIn: string, checkOut: string): string {
  const n = nightsBetween(checkIn, checkOut);
  if (!n) return "";
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(undefined, {
      day: "numeric", month: "short", timeZone: "UTC",
    });
  };
  return `${n} ${n === 1 ? "night" : "nights"} · ${fmt(checkIn)} to ${fmt(checkOut)}`;
}
