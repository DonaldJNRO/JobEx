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

export function formatPriceWithCurrency(amount: number | string | null | undefined, currencyCode?: string | null): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "";
  const symbol = currencyCode ? (CURRENCY_SYMBOLS[currencyCode] || currencyCode + " ") : "";
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
  amount, nativeCurrency, selectedCurrency, exchangeRates, ratesReady,
}: {
  amount: number | string | null | undefined;
  nativeCurrency?: string | null;
  selectedCurrency?: string | null;
  exchangeRates?: Record<string, number> | null;
  ratesReady?: boolean;
}): DisplayPrice {
  const from = nativeCurrency || "USD";
  const to = selectedCurrency || "USD";
  const nativeFormatted = formatPriceWithCurrency(amount, from);
  if (amount == null || isNaN(Number(amount))) {
    return { display: "", original: "", isConverted: false, ready: true, nativeFormatted: "" };
  }
  if (from === to || !ratesReady) {
    return { display: nativeFormatted, original: "", isConverted: false, ready: Boolean(ratesReady), nativeFormatted };
  }
  const fromRate = from === "USD" ? 1 : exchangeRates?.[from];
  const toRate = to === "USD" ? 1 : exchangeRates?.[to];
  if (!fromRate || !toRate) {
    return { display: nativeFormatted, original: "", isConverted: false, ready: true, nativeFormatted };
  }
  const converted = (Number(amount) / fromRate) * toRate;
  return {
    display: formatPriceWithCurrency(converted, to),
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
const REGION_CURRENCY: Record<string, string> = {
  GB: "GBP", US: "USD", NG: "NGN", ZA: "ZAR", KE: "KES", GH: "GHS",
  CA: "CAD", AU: "AUD", ML: "XOF", SN: "XOF", MR: "MRU",
  IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", PT: "EUR",
};

export function guestCurrency(locale?: string | null): string {
  const tag = (locale || "").trim();
  if (!tag) return "";
  const region = tag.split(/[-_]/)[1];
  if (!region) return "";
  return REGION_CURRENCY[region.toUpperCase()] || "";
}
