/**
 * The listing page as the operator's shop window.
 *
 * A guest arriving from an Instagram bio should see that operator and nobody
 * else, understand what the price is for, and be able to ask for a booking in
 * the browser. Not a second Sabię homepage, and not a poster for the App Store.
 *
 * GATED TO TWO LISTINGS ON PURPOSE. The founder asked to see it working on
 * Elroise and Arrows Den before it reaches all 31, which is right: this
 * changes what a live page does for a real business's customers. Everything
 * else renders exactly as it did this morning.
 *
 * To roll it out, empty this set: `isShopWindow` then answers true for every
 * listing. One line, and that is the whole switch.
 */
const FIRST: ReadonlySet<string> = new Set([
  "elroise-wellness-center",
  "arrows-den",
]);

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
