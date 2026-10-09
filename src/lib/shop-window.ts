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

export interface OfferSource {
  services?: { name?: string; price?: number }[];
  packages?: { name?: string; price?: number }[];
  customPrice?: { price?: number };
  pricingUnit?: string;
}

/**
 * The offers, in the order an operator entered them.
 *
 * Deliberately does NOT merge, rename or price anything. A guest picking
 * "Full body massage" must be picking the row the operator typed, because
 * that row is what they will read back in Studio when they accept.
 */
export function offersOf(l: OfferSource): Offer[] {
  const rows = [...(l.services ?? []), ...(l.packages ?? [])]
    .filter((r) => (r?.name ?? "").trim())
    .map((r) => ({ name: (r.name as string).trim(), price: typeof r.price === "number" ? r.price : undefined }));
  if (rows.length) return rows;
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
