import { REGION_CURRENCY } from "./region-currency";

/** What a listing is assumed to be priced in when it does not say. The
 *  whole family assumes NGN; a surface that assumes otherwise shows a
 *  traveller a price that is wrong by three orders of magnitude. */
export const DEFAULT_CURRENCY = "NGN";
/**
 * What a price says, and in whose money.
 *
 * A VERBATIM COPY of the rule in `sabie-v53-main/utils/displayPrice.js`
 * (`buildDisplayPrice`) and the formatter in `utils/formatPrice.js`. The app
 * and the web must not disagree about what ₦8,000 is worth, because a guest
 * can see both. Change one, change both.
 *
 * THE PART WORTH KEEPING, quoted from the original: "Rates not in yet: show
 * native only (don't lie)." Every failure here falls back to the operator's
 * own price in their own currency, which is always true, rather than a
 * conversion that might not be.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh",
  GHS: "GH₵", XOF: "CFA", MRU: "UM", CAD: "CA$", AUD: "A$",
};

export function getSymbolForCurrency(code?: string | null): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code] || code + " ";
}

/**
 * How many decimals a figure needs to stay TRUE, not how many look tidy.
 *
 * Whole units are right for a price: nobody wants "£11.00". They are a lie
 * for a figure under a unit. A fee of £0.55 printed as "£1" is an 82 percent
 * overstatement, and it appeared on a line LABELLED "(5%)" beside an £11
 * price, so the website showed its own fee as nine percent. The charge was
 * exactly 5.00 percent; only the rendering was wrong.
 *
 * Under a hundred units, a decimal currency shows its decimals when the
 * figure HAS any: £50 stays "£50", £3.20 stops being "£3". A hundred is not
 * a new boundary, it is the one listing-price.ts already uses, written when
 * a 300 naira gate fee displayed as "from £0" and read as free. Two
 * formatters on one site disagreeing about the same number is its own bug,
 * and this is the half that was never brought in line.
 *
 * NGN and the other no-subunit currencies never show decimals.
 */
export function decimalsFor(amount: number, currencyCode?: string | null): number {
  const code = String(currencyCode || "").toUpperCase();
  if (NO_SUBUNIT.has(code)) return 0;
  const n = Math.abs(Number(amount));
  if (!Number.isFinite(n) || n === 0) return 0;
  if (Math.round(n) === n) return 0;
  return n < 100 ? 2 : 0;
}

/** Currencies nobody quotes in fractions, whatever the arithmetic says. */
const NO_SUBUNIT = new Set(["NGN", "JPY", "KRW", "VND", "XOF", "XAF", "CLP", "ISK", "UGX", "RWF"]);

export function formatPriceWithCurrency(
  amount: number | string | null | undefined,
  currencyCode?: string | null,
  /** Force a precision, so every line of one bill shares it and they add up. */
  decimals?: number,
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "";
  const symbol = currencyCode ? (CURRENCY_SYMBOLS[currencyCode] || currencyCode + " ") : "";
  const dp = decimals ?? decimalsFor(Number(amount), currencyCode);
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

/**
 * THE PRECISION ONE BILL SHARES. Rounding each line on its own is how a
 * breakdown stops adding up: £11.40 and £0.57 become "£11" and "£1" over a
 * total of "£12", and the reader is asked to believe 11 + 1 = 12 while the
 * fee looks like nine percent of the price. One precision for every line,
 * chosen by whichever line needs the most.
 */
export function billDecimals(amounts: number[], currencyCode?: string | null): number {
  return amounts.reduce((most, a) => Math.max(most, decimalsFor(a, currencyCode)), 0);
}

export interface DisplayPrice {
  /** Primary, large: the guest's own currency when we can be sure of it. */
  display: string;
  /** Secondary, small: "≈ ₦8,000 NGN". Empty when there is nothing to add. */
  original: string;
  isConverted: boolean;
  ready: boolean;
  nativeFormatted: string;
}

export function buildDisplayPrice({
  amount, nativeCurrency, selectedCurrency, exchangeRates, ratesReady, decimals,
}: {
  amount: number | string | null | undefined;
  nativeCurrency?: string | null;
  selectedCurrency?: string | null;
  exchangeRates?: Record<string, number> | null;
  ratesReady?: boolean;
  /** Forced precision, so every line of one bill shares it and they add up. */
  decimals?: number;
}): DisplayPrice {
  // NGN, NOT USD, when a listing does not say. Seven live listings carry no
  // currency and every one is a Lagos café, so "USD" meant a ₦3,000 plate
  // of jollof displayed as £3,000 — not a rounding error, a 1500x one, on
  // the page a traveller actually reads. Every other surface in the family
  // assumes NGN; this one did not.
  const from = nativeCurrency || DEFAULT_CURRENCY;
  const to = selectedCurrency || DEFAULT_CURRENCY;
  const nativeFormatted = formatPriceWithCurrency(amount, from, decimals);
  if (amount == null || isNaN(Number(amount))) {
    return { display: "", original: "", isConverted: false, ready: true, nativeFormatted: "" };
  }
  if (from === to || !ratesReady) {
    return { display: nativeFormatted, original: "", isConverted: false, ready: Boolean(ratesReady), nativeFormatted };
  }
  // THE TABLE IS GBP-BASED, so GBP is the unit, not USD. This hardcoded
  // USD as 1 against a table of "how many X per 1 GBP", which made every
  // USD amount convert as though a dollar were a pound: $100 showed as
  // £100 instead of £75. The rate feed is currencies/gbp.json and always
  // has been; useRates.ts says so in its first line.
  const fromRate = exchangeRates?.[from];
  const toRate = exchangeRates?.[to];
  if (!fromRate || !toRate) {
    return { display: nativeFormatted, original: "", isConverted: false, ready: true, nativeFormatted };
  }
  const converted = (Number(amount) / fromRate) * toRate;
  return {
    display: formatPriceWithCurrency(converted, to, decimals),
    original: `≈ ${nativeFormatted} ${from}`,
    isConverted: true,
    ready: true,
    nativeFormatted,
  };
}

/**
 * The guest's own currency, from the browser.
 *
 * The app reads the device's REGION rather than its language, because a UK
 * user with Language=English was being read as en_US and shown dollars. The
 * browser equivalent is the region subtag of navigator.language, so the same
 * bug is avoided the same way.
 *
 * Returns "" when the region is unknown, which means no conversion is
 * attempted and the operator's own price stands.
 */

export function guestCurrency(locale?: string | null): string {
  const tag = (locale || "").trim();
  if (!tag) return "";
  const region = tag.split(/[-_]/)[1];
  if (!region) return "";
  return REGION_CURRENCY[region.toUpperCase()] || "";
}
