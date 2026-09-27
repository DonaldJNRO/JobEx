/**
 * What a listing costs, and in whose money.
 *
 * THIS FILE IMPORTS NOTHING, the same arrangement as categories.ts, slug.ts,
 * listing-place.ts and verified.ts, and for the same reason: listings.ts pulls in Firebase, so a test could not
 * load this through it. As a leaf, plain node can.
 *
 * WHY THE CONVERSION LIVES IN ONE PLACE. Four surfaces draw a price (the card,
 * the row, the listing page, the booking form) and they used to format it four
 * ways, with a comment in listings.ts saying locale conversion was "a future
 * add". That is how a visitor in London came to browse Lagos listings priced in
 * naira with no way to tell what anything cost. One function converts, so all
 * four agree, and the app and the web agree too because display-price.ts is a
 * verbatim copy of the app's rule.
 *
 * THE RULE THAT MATTERS, quoted from the app: "Rates not in yet: show native
 * only (don't lie)." Every failure path here falls back to the operator's own
 * price in the operator's own currency, which is always true. A missing rate is
 * never a reason to show a zero, a dash, or a guess.
 */

export type Rates = Record<string, number>;

/** Only the fields a price needs. Listing satisfies this structurally. */
export interface PriceableListing {
  customPrice?: { price?: number; model?: string } | null;
  pricingUnit?: string;
  currency?: string;
  country?: string;
}

/** What the visitor's own money is, when we can be sure of it. */
export interface MoneyContext {
  rates: Rates | null;
  ready: boolean;
  /** ISO code for the visitor's region, or "" when unknown. */
  to?: string;
}

// Keyed by ISO 4217. Falls back to the raw code, which is safer than showing
// a dollar sign for a currency we have no symbol for.
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", NGN: "₦", ZAR: "R",
  GHS: "GH₵", KES: "KSh", UGX: "USh", TZS: "TSh",
  RWF: "RWF", XOF: "CFA", XAF: "FCFA", MAD: "DH",
  EGP: "E£", ETB: "Br", CAD: "C$", AUD: "A$", JPY: "¥",
  INR: "₹", CNY: "¥", MRU: "UM",
};

export function symbolForCurrency(code: string): string {
  return CURRENCY_SYMBOLS[code] || code + " ";
}

/**
 * WHICH CURRENCY THE OPERATOR ACTUALLY PRICED IN.
 *
 * This picks the CODE a conversion divides by, and symbolForCurrency picks the
 * SYMBOL drawn beside it. They are driven off the same value here on purpose:
 * when they were two independent decisions, the failure mode was a naira sign
 * against a number converted out of pounds. Nothing errors, nothing looks
 * broken, and the figure is wrong by a factor of about 1,760.
 *
 * 82% of public listings carry `currency`. The rest fall back to `country`,
 * which is written two ways in the real data ("Nigeria" and "GB") because two
 * different tools wrote it, so both shapes are handled rather than assumed.
 */
export function nativeCurrencyOf(listing: PriceableListing): string {
  const code = listing.currency?.toUpperCase();
  if (code) return code;
  const country = (listing.country || "").toLowerCase().trim();
  if (country.includes("nigeria") || country === "ng") return "NGN";
  if (country.includes("united kingdom") || country === "gb" || country === "uk") return "GBP";
  if (country.includes("mali") || country.includes("senegal")) return "XOF";
  if (country.includes("mauritania")) return "MRU";
  // The platform default, and the base the rates are quoted in.
  return "GBP";
}

/**
 * The price a visitor sees, and the unit beneath it.
 *
 * `money` is optional: a caller with no rates (a server component, a failed
 * fetch, a first render) gets the operator's own price.
 */
export function priceParts(
  listing: PriceableListing,
  money?: MoneyContext,
): { amount: string | null; unit: string } {
  const price = listing.customPrice?.price;
  // NOT A PRICE, and it must not be typeset as one. One real listing carries
  // {price: 0}, which would otherwise render "£0" and read as free.
  if (!price) return { amount: null, unit: "" };

  const native = nativeCurrencyOf(listing);
  const target = money?.to || "";
  let amount = `${symbolForCurrency(native)}${price.toLocaleString("en-US")}`;

  // CONVERT ONLY WHEN EVERY PART IS KNOWN, and invent nothing when it is not.
  //
  // The arithmetic is the same as buildDisplayPrice in display-price.ts, which
  // is itself a verbatim copy of the app's rule: divide out of the source
  // currency into the GBP base, multiply into the target. It is repeated here
  // rather than imported so this file stays a leaf that imports NOTHING, which
  // is what lets plain node load it for its test. display-price.ts remains the
  // canonical statement of the rule and the currency.test.mjs cases pin this
  // copy to the same answers.
  if (money?.ready && money.rates && target && target !== native) {
    const fromRate = native === "GBP" ? 1 : money.rates[native];
    const toRate = target === "GBP" ? 1 : money.rates[target];
    // A MISSING RATE IS NOT A ZERO. Without this guard the division yields
    // NaN or Infinity and the page prints "£NaN" or a wildly wrong figure,
    // both of which look like real prices.
    if (fromRate && toRate && Number.isFinite(fromRate) && Number.isFinite(toRate)) {
      const converted = (price / fromRate) * toRate;
      amount = `${symbolForCurrency(target)}${converted.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
  }

  const raw = `${listing.pricingUnit || ""} ${listing.customPrice?.model || ""}`.toLowerCase();
  if (raw.includes("night")) return { amount, unit: "per night" };
  if (raw.includes("person") || raw.includes("guest")) return { amount, unit: "per person" };
  if (raw.includes("ticket")) return { amount, unit: "per ticket" };
  if (raw.includes("hour")) return { amount, unit: "per hour" };
  if (raw.includes("day")) return { amount, unit: "per day" };
  return { amount, unit: "" };
}

/** The one-line version, for callers that want a string. */
export function priceLine(listing: PriceableListing, money?: MoneyContext): string {
  const { amount, unit } = priceParts(listing, money);
  // "Contact host" was wrong twice over: host is Airbnb's word and Sabię's is
  // operator, and it sat in the price slot at price weight, so it read as a
  // price. This says what it is.
  if (!amount) return "Price on request";
  return unit ? `${amount} ${unit}` : amount;
}
