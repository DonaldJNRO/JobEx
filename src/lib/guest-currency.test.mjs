// A price is shown in the GUEST'S currency, never the operator's.
//
// "Why is it showing me the local currency? Why not my own currency?"
//
// The site has had the answer since the start: buildDisplayPrice, reading the
// same rate source as the mobile app so the two cannot disagree about what
// ₦35,000 is worth. The services section shipped with
// `currency === "GBP" ? "£" : "₦"` written into it and walked straight past
// all of it, which is how a guest in London got asked to pay ₦35,000.
//
// So this fails on a hardcoded symbol in any component that renders a price,
// rather than trusting the next component to remember.

import { readFileSync, readdirSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

const liveOf = (src) => src.split("\n")
  .filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"))
  .join("\n");

// Where a price symbol is legitimate: the formatter itself, and the currency
// tables it reads. Everything else must go through it.
const FORMATTERS = new Set(["display-price.ts", "listing-price.ts", "currency.ts", "useRates.ts"]);

const roots = [["src/components", readdirSync("src/components")], ["src/lib", readdirSync("src/lib")]];
let checked = 0;
for (const [dir, files] of roots) {
  for (const f of files) {
    if (!/\.(tsx|ts)$/.test(f) || f.endsWith(".test.mjs") || FORMATTERS.has(f)) continue;
    const live = liveOf(readFileSync(`${dir}/${f}`, "utf8"));
    // A ternary picking a symbol by currency code is the exact shape of the bug.
    const hardcoded = /currency\s*===\s*["'][A-Z]{3}["']\s*\?\s*["'][£$₦€]/.test(live);
    if (hardcoded) ck(false, `${dir}/${f} picks a currency symbol by hand instead of using buildDisplayPrice`);
    checked++;
  }
}
ck(checked > 10, `swept ${checked} components and lib files`);

// And the two that had the bug now go through the converter.
for (const [name, path] of [
  ["ProfileServices", "src/components/ProfileServices.tsx"],
  ["ListingClient", "src/app/listing/[id]/ListingClient.tsx"],
]) {
  const live = liveOf(readFileSync(path, "utf8"));
  ck(/buildDisplayPrice\(/.test(live), `${name} converts through buildDisplayPrice`);
  ck(!/\?\s*"£"\s*:\s*"₦"/.test(live), `${name} has no hardcoded symbol left`);
}

// THE HYDRATION RULE, which is the reason useMoney exists at all. navigator
// does not exist on the server, so reading it during render makes the server
// and client markup differ. The first fix for this bug did exactly that.
for (const [name, path] of [
  ["ProfileServices", "src/components/ProfileServices.tsx"],
  ["ListingClient", "src/app/listing/[id]/ListingClient.tsx"],
]) {
  const live = liveOf(readFileSync(path, "utf8"));
  ck(!/guestCurrency\(navigator\.language\)/.test(live),
    `${name} does not read navigator during render, it uses the hook that reads it in an effect`);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
