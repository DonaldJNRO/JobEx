/**
 * What we can say about the business behind a listing.
 *
 * THE LISTING PAGE KNEW ALMOST NOTHING. It showed a name, a description and a
 * price, while the ad documents carry far more that nobody was reading.
 * Measured across the 38 public listings on 2026-09-27:
 *
 *   openingHours        100%      selectedAmenities    47%
 *   verifiedMethod      100%      menuPdfUrl           50%
 *   businessModel        47%      verifiedRepName      53%
 *
 * WHAT IS DELIBERATELY NOT HERE. phone (95%), whatsapp (84%) and instagram
 * (79%) are on the documents and are NOT surfaced, at the founder's call.
 * Publishing an operator's direct line turns a marketplace into a directory:
 * the guest rings them, there is no booking record, and the 10% commission
 * that pays for the visit and the film is never earned. The booking request
 * stays the only route. If that decision is ever revisited, it is a business
 * decision, not a display one.
 *
 * THIS FILE IMPORTS NOTHING, the same arrangement as listing-price.ts and
 * categories.ts, so plain node can load it for its test.
 */

/** One day's hours as Studio writes them. */
export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface OperatorListing {
  openingHours?: Record<string, DayHours> | null;
  selectedAmenities?: string[] | null;
  amenities?: string[] | null;
  menuPdfUrl?: string | null;
  businessModel?: string | null;
  verifiedRepName?: string | null;
  verifiedAt?: { seconds?: number } | string | number | null;
  isVerifiedBusiness?: boolean;
  verifiedMethod?: string;
  verificationMethod?: string;
}

// Monday first, which is how the operator filled the form in and how every
// other surface lists them. Object key order is not guaranteed for a document
// read back from Firestore, so the order is stated rather than assumed.
export const DAY_ORDER = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export type DayName = (typeof DAY_ORDER)[number];

const LABEL: Record<DayName, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

/** "09:00" to "9am", "13:30" to "1.30pm". Empty for anything unparseable. */
export function prettyTime(value?: string | null): string {
  if (!value) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return "";
  let h = Number(m[1]);
  const mins = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mins) || h > 23 || mins > 59) return "";
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  // No dashes as punctuation anywhere a person reads, so the minutes use a
  // full stop: "1.30pm", not "1-30pm".
  return mins === 0 ? `${h}${suffix}` : `${h}.${String(mins).padStart(2, "0")}${suffix}`;
}

export interface OpeningRow {
  day: DayName;
  label: string;
  closed: boolean;
  /** "9am to 10pm", or "Closed". Never an empty string. */
  hours: string;
}

/**
 * The week, in order, as rows a page can print.
 *
 * Returns [] when there is nothing worth showing, so a caller can decide not
 * to draw the section at all rather than drawing an empty heading. A day with
 * no times and no closed flag is skipped rather than guessed at: "we do not
 * know" and "closed" are different facts and printing one as the other sends
 * somebody to a locked door.
 */
export function openingRows(listing: OperatorListing): OpeningRow[] {
  const hours = listing.openingHours;
  if (!hours || typeof hours !== "object") return [];
  const rows: OpeningRow[] = [];
  for (const day of DAY_ORDER) {
    const entry = hours[day];
    if (!entry || typeof entry !== "object") continue;
    if (entry.closed) {
      rows.push({ day, label: LABEL[day], closed: true, hours: "Closed" });
      continue;
    }
    const open = prettyTime(entry.open);
    const close = prettyTime(entry.close);
    if (!open || !close) continue;
    rows.push({ day, label: LABEL[day], closed: false, hours: `${open} to ${close}` });
  }
  return rows;
}

/**
 * Is it open right now?
 *
 * `now` is injected so a test is not clock-dependent. Returns null when we
 * cannot tell, which the page renders as nothing rather than as "Closed": a
 * business shown as closed when we simply have no hours for that day loses a
 * booking it should have had.
 *
 * DELIBERATELY NOT TIMEZONE-AWARE, and this is a real limitation rather than
 * an oversight. The hours are stored as bare strings with no zone, and a
 * visitor in London reading a Lagos listing is an hour behind. Saying "Open
 * now" to the wrong hour is a small error; inventing a timezone the data does
 * not carry would be a larger one. The right fix is a zone on the document,
 * which is a Studio change. Until then this is only rendered beside the full
 * week, so the reader can always check the row for themselves.
 */
export function openNow(listing: OperatorListing, now: Date = new Date()): boolean | null {
  const hours = listing.openingHours;
  if (!hours || typeof hours !== "object") return null;
  const day = DAY_ORDER[(now.getDay() + 6) % 7]; // JS weeks start on Sunday
  const entry = hours[day];
  if (!entry || typeof entry !== "object") return null;
  if (entry.closed) return false;
  const toMinutes = (v?: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec((v || "").trim());
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const open = toMinutes(entry.open);
  const close = toMinutes(entry.close);
  if (open === null || close === null) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  // A close time BEFORE the open time means it runs past midnight, which a
  // bar or a club genuinely does. Treating it as a normal range would report
  // a place open until 2am as closed all day.
  if (close <= open) return mins >= open || mins < close;
  return mins >= open && mins < close;
}

// Amenity keys come from Studio as snake_case. Anything not named here is
// title-cased from its key rather than dropped, because a listing carrying an
// amenity we have no label for still tells the guest something true.
const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wifi",
  free_wifi: "Free wifi",
  parking: "Parking",
  free_parking: "Free parking",
  pool: "Pool",
  air_conditioning: "Air conditioning",
  kitchen: "Kitchen",
  gym: "Gym",
  spa: "Spa",
  restaurant: "Restaurant",
  bar: "Bar",
  security: "Security",
  generator: "Backup power",
  vegan_options: "Vegan options",
  vegetarian_options: "Vegetarian options",
  halal: "Halal",
  outdoor_seating: "Outdoor seating",
  wheelchair_accessible: "Step free access",
  live_music: "Live music",
  pet_friendly: "Pets welcome",
  card_payment: "Card accepted",
};

export function amenityLabel(key: string): string {
  const k = String(key || "").trim();
  if (!k) return "";
  if (AMENITY_LABELS[k]) return AMENITY_LABELS[k];
  const words = k.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Every amenity worth printing, deduped and labelled. */
export function amenityList(listing: OperatorListing): string[] {
  const raw = [
    ...(listing.selectedAmenities || []),
    ...(listing.amenities || []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of raw) {
    const label = amenityLabel(key);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

/**
 * How the business takes custom, in the guest's words.
 *
 * `businessModel` is "online", "physical" or "both" on the document. "online"
 * on a restaurant means there is no room to walk into, which is exactly the
 * thing somebody planning a trip needs to know before they plan around it.
 */
export function serviceStyle(listing: OperatorListing): string {
  const model = (listing.businessModel || "").toLowerCase().trim();
  if (model === "online") return "Delivery and collection only";
  if (model === "physical") return "Walk in";
  if (model === "both") return "Walk in, delivery and collection";
  return "";
}

/**
 * Who verified it, and how, in one honest sentence.
 *
 * Returns "" rather than a vague claim when the visit did not happen. The
 * listing page used to print "Verified listing" on every listing with nothing
 * behind it; the rule is now that a badge is read, never asserted.
 */
export function verificationLine(listing: OperatorListing): string {
  if (!listing.isVerifiedBusiness) return "";
  const method = listing.verifiedMethod || listing.verificationMethod;
  if (method !== "visited") return "";
  const rep = (listing.verifiedRepName || "").trim();
  return rep
    ? `Visited by ${rep} from Sabię`
    : "Visited by someone from Sabię";
}
