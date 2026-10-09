// A visitor sees their own money, wherever they are.
//
// "If someone is in Mexico or all these other places, I hope it shows their
//  own currency, not just the currency you hardcoded."
//
// It did not. The web table had 18 regions and the mobile app's had 32, so
// the two already disagreed — a guest in Brazil saw BRL on the phone and ₦ on
// the website — and Mexico, India, Japan, the UAE, Egypt, China, Turkey and
// Saudi Arabia were in neither, so those visitors got no conversion at all.
//
// Both are now generated from Unicode CLDR. This holds them there.

import { readFileSync, existsSync } from "node:fs";
import { REGION_CURRENCY } from "./region-currency.ts";
import { guestCurrency } from "./display-price.ts";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

const n = Object.keys(REGION_CURRENCY).length;
ck(n > 200, `${n} regions, not a handful`);

// The ones that were missing, and the ones that must never break.
for (const [locale, want] of [
  ["es-MX", "MXN"], ["pt-BR", "BRL"], ["hi-IN", "INR"], ["ja-JP", "JPY"],
  ["ar-AE", "AED"], ["ar-EG", "EGP"], ["zh-CN", "CNY"], ["tr-TR", "TRY"],
  ["ar-SA", "SAR"], ["th-TH", "THB"], ["vi-VN", "VND"], ["es-CO", "COP"],
  ["en-NG", "NGN"], ["en-GB", "GBP"], ["en-US", "USD"], ["en-ZA", "ZAR"],
  ["sw-KE", "KES"], ["en-GH", "GHS"], ["fr-SN", "XOF"], ["en-CA", "CAD"],
]) ck(guestCurrency(locale) === want, `${locale} sees ${want}`);

// A locale with no region tells us nothing, and guessing would be worse than
// showing the operator's own price.
ck(guestCurrency("en") === "", "a bare language is not guessed at");
ck(guestCurrency("") === "", "and neither is nothing");

// ── THE TWO SURFACES AGREE ──────────────────────────────────────────────
// This is the failure that caused the bug: both tables existed, both were
// hand-written, and nothing compared them.
const APP = "/tmp/v53fix/utils/formatPrice.js";
if (!existsSync(APP)) {
  console.log("SKIP  the mobile app is not checked out beside this repo");
} else {
  const src = readFileSync(APP, "utf8");
  const app = Object.fromEntries([...src.matchAll(/([A-Z]{2}):\s*'([A-Z]{3})'/g)].map((m) => [m[1], m[2]]));
  ck(Object.keys(app).length === n, `the app carries the same ${n} regions`);
  const differ = Object.keys(REGION_CURRENCY).filter((k) => app[k] !== REGION_CURRENCY[k]);
  ck(differ.length === 0,
    differ.length ? `web and app disagree on ${differ.slice(0, 5).join(", ")}` : "and agrees on every one");
}

// Every currency we can map a visitor to must be one we can convert into.
// Mapping someone to a currency with no rate gives buildDisplayPrice a target
// and nothing to do with it.
ck(/have\.has\(current\)/.test(readFileSync("scripts/gen-region-currency.mjs", "utf8")),
  "the generator only emits a region whose currency the rate feed carries");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
