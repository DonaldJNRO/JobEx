/**
 * The listing page as the operator's shop window.
 *
 * A guest arriving from an Instagram bio should see that operator and nobody
 * else, understand what the price is for, and be able to ask for a booking in
 * the browser. Not a second Sabię homepage, and not a poster for the App Store.
 *
 * ROLLED OUT TO EVERY LISTING, 9 Oct 2026. It was gated to Elroise and Arrows
 * Den so the founder could see it on two real businesses first. He has, and
 * the gate was then left closed for twelve days, which cost more than the
 * caution saved:
 *
 *   - 42 of 44 listings served the SITE's title and image as their share card,
 *     and `og:url` of the homepage. An operator pasting their own link into a
 *     WhatsApp status advertised Sabię, not their business. That is the exact
 *     complaint this file was written to answer, still true for everyone
 *     except two.
 *   - Those same 42 are in the sitemap, so Google was offered 42 pages with
 *     one title between them, each declaring itself the homepage.
 *   - And Book sent them to the App Store, so a guest arriving from a bio had
 *     to install an app before asking a question.
 *
 * The set is kept rather than deleted because it is the mechanism, not the
 * decision: a future staged rollout puts slugs back in it.
 */
const FIRST: ReadonlySet<string> = new Set<string>([]);

export function isShopWindow(slug: string | null | undefined): boolean {
  if (!FIRST.size) return true;
  return FIRST.has((slug || "").trim().toLowerCase());
}

/** One offer a guest can ask for, off the listing's existing services or
 *  packages. Nothing new is invented: if an operator has not named any, the
 *  listing's own headline price is the single offer. */
export interface Offer {
  name: string;
  price?: number;
}

interface RawTier { label?: unknown; price?: unknown }
interface RawOfferRow { name?: string; price?: unknown; tiers?: unknown }

export interface OfferSource {
  services?: { name?: string; price?: number }[];
  packages?: { name?: string; price?: number }[];
  customPrice?: { price?: number };
  pricingUnit?: string;
}

/**
 * Does this listing confirm on the spot, or does somebody have to say yes?
 *
 * MIRRORS canSellInstantly IN onBookingRequestCreated, which is the function
 * that actually decides. It confirms a request immediately, inside a
 * transaction that counts against the slot, when the listing takes payment,
 * is not a cafe, and has an allocation. That has fired 14 times already,
 * under confirmedBy: 'instant_allocation'.
 *
 * The web never knew. Every listing's form said "has 12 hours to accept. You
 * pay after they do", including the ones the server confirms before the
 * operator has even looked. Telling somebody to wait for a yes they have
 * already been given is how an instant booking becomes a cancelled one.
 *
 * Re-derived here rather than stamped on the listing, for the same reason the
 * cafe rule is re-checked everywhere: a value written weeks ago is not a
 * promise about today.
 */
export function confirmsInstantly(l: unknown): boolean {
  const d = l as {
    acceptsInAppPayment?: unknown;
    sabieAllocationPerSlot?: unknown;
    role?: unknown;
  } | null;
  if (!d) return false;
  if (d.acceptsInAppPayment !== true) return false;
  const role = String(d.role ?? "").toLowerCase();
  // A CAFE IS NEVER INSTANT, because a cafe is never payable. Locked rule,
  // re-checked rather than trusted.
  if (role.includes("food_beverage") || role.includes("foodbeverage") || role.includes("restaurant")) {
    return false;
  }
  const alloc = Number(d.sabieAllocationPerSlot);
  return Number.isFinite(alloc) && alloc > 0;
}

/**
 * The operator's own terms, in their own words.
 *
 * ASKED FOR, AND THEN NOT SHOWN. The founder asked for policies on captures
 * "to protect us and also the operators as well", and Naileditbyd carries six
 * lines including "All appointments require advance booking, which is non
 * refundable". None of it reached the one screen where a guest commits.
 *
 * Shown at the point of commitment rather than buried on the page, because a
 * cancellation term a guest has not read is not a term, it is an argument
 * later.
 */
export function policyLines(l: unknown): string[] {
  const pol = (l as { policy?: { lines?: unknown } })?.policy;
  const lines = Array.isArray(pol?.lines) ? pol.lines : [];
  return lines
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

/**
 * Where to actually go. A booking with no address is a question by another
 * name, and the listing has carried one all along.
 */
export function addressOf(l: unknown): string {
  const loc = (l as { location?: unknown })?.location;
  if (typeof loc === "string") return loc.trim();
  const m = loc as { address?: unknown } | undefined;
  return typeof m?.address === "string" ? m.address.trim() : "";
}

/**
 * The times this operator actually offers, for the thing being booked.
 *
 * WHY IT MATTERS. The web form asked for a date and never a time, while the
 * server counts an allocation per listing per DAY AND TIME
 * (onBookingRequestCreated, slotTime). So a request arrived with no time, the
 * counter could not place it, and an operator got "Tuesday" and had to message
 * the customer to agree an hour. For a nail studio or a spa the hour IS the
 * booking.
 *
 * Per service, because they differ: 17 of 49 live listings carry timeSlots and
 * they hang off each service, not the listing. Teedeluxelash runs on the hour
 * from 10, Central Park every fifteen minutes.
 *
 * Returns [] when this operator has not set any, and the form then asks for a
 * time in plain words rather than inventing a grid nobody agreed to.
 */
export function slotsFor(l: OfferSource, offerName?: string): string[] {
  const rows = (l as { services?: { name?: string; timeSlots?: unknown }[] }).services ?? [];
  const wanted = (offerName ?? "").trim().toLowerCase();
  const pick = wanted
    ? rows.find((r) => (r?.name ?? "").trim().toLowerCase() === wanted)
    : undefined;
  // The chosen service's own times. With no match, fall back to the union of
  // everything the listing offers: better to show the operator's real hours
  // than nothing, and a request is a question either way.
  const source = pick ? [pick] : rows;
  const out: string[] = [];
  for (const r of source) {
    if (!Array.isArray(r?.timeSlots)) continue;
    for (const t of r.timeSlots) {
      const v = typeof t === "string" ? t : (t as { time?: string })?.time;
      if (typeof v === "string" && v.trim() && !out.includes(v.trim())) out.push(v.trim());
    }
  }
  return out;
}

/**
 * The offers, in the order an operator entered them.
 *
 * Deliberately does NOT merge, rename or price anything. A guest picking
 * "Full body massage" must be picking the row the operator typed, because
 * that row is what they will read back in Studio when they accept.
 */
export function offersOf(l: OfferSource): Offer[] {
  const services = (l as { services?: RawOfferRow[] }).services ?? [];
  const packages = (l as { packages?: RawOfferRow[] }).packages ?? [];

  // SERVICES FIRST, AND NEVER BOTH. These two arrays are the same list twice:
  // `packages` is a flat mirror of `services` that the assemble path writes.
  // Concatenating them gave Naileditbyd 36 rows for 17 services, 15 of them
  // the same name listed twice, which is a guest choosing between two
  // identical lines and an operator reading a request for one of them.
  const rows = services.length ? services : packages;

  const out: Offer[] = [];
  for (const r of rows) {
    const name = (r?.name ?? "").trim();
    if (!name) continue;
    const own = typeof r.price === "number" ? r.price : Number(r.price);
    const tiers = Array.isArray(r.tiers) ? r.tiers : [];
    const priced = tiers
      .map((t) => ({ label: String((t as RawTier)?.label ?? "").trim(), price: Number((t as RawTier)?.price) }))
      .filter((t) => Number.isFinite(t.price) && t.price > 0);

    // A PRICE ON THE TIER, NOT THE ROW. A listing built from a Scout capture
    // with tiers leaves the row's own price undefined, so reading only
    // `r.price` left all seventeen of Naileditbyd's services with no price in
    // the dropdown: the guest picked "plain short" and was shown nothing, and
    // the request reached the operator with totalPrice undefined.
    if (priced.length > 1) {
      // Genuinely different choices at different prices, so they are
      // different offers. Gel nails are 12,000 short and 14,000 medium.
      for (const t of priced) out.push({ name: t.label ? `${name} (${t.label})` : name, price: t.price });
    } else if (priced.length === 1) {
      out.push({ name, price: priced[0].price });
    } else if (Number.isFinite(own) && own > 0) {
      out.push({ name, price: own });
    } else {
      // Named but unpriced. Still bookable: the operator says what it costs
      // when they accept, which is what "ask to book" means.
      out.push({ name });
    }
  }
  if (out.length) return out;

  // No named offers. The headline price is still something a guest can ask
  // for, and an operator with one service should not have to invent a menu.
  const price = l.customPrice?.price;
  if (typeof price === "number") {
    const unit = (l.pricingUnit || "").toLowerCase();
    const name = unit.includes("night") ? "Per night"
      : unit.includes("person") ? "Per person"
      : unit.includes("ticket") ? "Ticket"
      : "Booking";
    return [{ name, price }];
  }
  return [];
}
