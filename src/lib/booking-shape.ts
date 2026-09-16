/**
 * Turning a bookingRequest document into the four fields, and nothing else.
 *
 * Separated from the Firestore calls because this is the part that can be
 * wrong in a way nobody notices: a date read as UTC renders a booking on the
 * wrong day, and somebody turns up on the wrong day. A pure function of the
 * document body can be tested without a database, and it is.
 */

export interface TravellerBooking {
  id: string;
  /** Rule 5, field 1. The business the traveller booked. */
  name: string;
  /** Rule 5, field 2. Null until payment mints one. */
  code: string | null;
  /** Rule 5, field 3. The room, service or package chosen. */
  packageName: string | null;
  /** Rule 5, field 4. The day it happens, not the day it was booked. */
  date: Date | null;
  status: string;
  image: string | null;
  listingId: string | null;
  role: string | null;
  totalPrice: number | null;
  currency: string | null;
  /** When the request was made. Used for ordering, never shown as "the date". */
  requestedAt: Date | null;
}

type Raw = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Firestore Timestamp, ISO string, or millis. Anything else is not a date. */
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "object" && v !== null) {
    const ts = v as { toDate?: () => Date; seconds?: number };
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  }
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const parsed = Date.parse(v);
    if (Number.isFinite(parsed)) return new Date(parsed);
  }
  return null;
}

/**
 * The day the experience happens.
 *
 * Mirrors experienceDateOf in functions/publicCode.js field for field and in
 * the same order, because that function is what decides the booking's payout
 * date. If this page and the ledger disagree about which day a booking is on,
 * one of them is lying to somebody about money.
 */
function experienceDate(details: Raw): Date | null {
  const rooms = Array.isArray(details.rooms) ? (details.rooms as Raw[]) : [];
  const candidates = [details.date, details.checkIn, rooms.length ? rooms[0]?.checkIn : null];
  for (const candidate of candidates) {
    const parsed = toDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * What was booked: a room, a service, or a named package.
 *
 * Same precedence the app's own normaliser uses. It deliberately does NOT fall
 * back to the business name: "Arrows Den, Arrows Den" reads as a rendering
 * fault, and an absent package is honest.
 */
function packageOf(details: Raw): string | null {
  const rooms = Array.isArray(details.rooms) ? (details.rooms as Raw[]) : [];
  const services = Array.isArray(details.services) ? (details.services as Raw[]) : [];
  return (
    str(rooms[0]?.name) ||
    str(services[0]?.name) ||
    str(details.package) ||
    null
  );
}

function firstImage(details: Raw, raw: Raw): string | null {
  const rooms = Array.isArray(details.rooms) ? (details.rooms as Raw[]) : [];
  const images = Array.isArray(rooms[0]?.images) ? (rooms[0].images as unknown[]) : [];
  for (const entry of images) {
    if (typeof entry === "string" && entry) return entry;
    if (entry && typeof entry === "object") {
      const url = (entry as Raw).url ?? (entry as Raw).downloadURL;
      if (typeof url === "string" && url) return url;
    }
  }
  return str(raw.businessImageUrl) || null;
}

function normalise(id: string, raw: Raw): TravellerBooking {
  const details = (raw.bookingDetails && typeof raw.bookingDetails === "object"
    ? raw.bookingDetails
    : {}) as Raw;

  return {
    id,
    name: str(raw.businessName) || "Booking",
    code: str(raw.publicCode) || null,
    packageName: packageOf(details),
    date: experienceDate(details),
    status: str(raw.status) || "pending",
    image: firstImage(details, raw),
    listingId: str(raw.adId) || str(raw.itemId) || null,
    role: str(raw.role) || null,
    totalPrice: Number(details.totalPrice) || null,
    currency: (str(details.currency) || str(raw.currency)).toUpperCase() || null,
    requestedAt: toDate(raw.respondedAt) || toDate(raw.requestedAt) || null,
  };
}


export function normaliseBookingRequest(id: string, raw: Raw): TravellerBooking {
  return normalise(id, raw);
}

/**
 * The booking date, written out.
 *
 * Built from the local date parts, never from toLocaleDateString on a bare
 * ISO string: "2026-09-20" parses as UTC midnight, which renders as the 19th
 * anywhere west of Greenwich. A booking shown on the wrong day is somebody
 * turning up on the wrong day.
 */
export function formatBookingDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
