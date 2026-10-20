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

// src/app WAS NEVER SWEPT, and that is how two pages kept their own money
// formatting. The cart printed the operator's currency on the trip total,
// the Pay label and every line while charging in the guest's; the bookings
// page carried a private four-entry symbol table with no rate lookup at
// all. Both read correct in isolation and both showed a London traveller
// naira. A rule that covers two of three directories is not a rule.
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory()) out.push(...walk(`${dir}/${name.name}`));
    else out.push([dir, name.name]);
  }
  return out;
}
const roots = [
  ...walk("src/components"),
  ...walk("src/lib").map(([d, f]) => [d, f]),
  ...walk("src/app"),
].reduce((acc, [d, f]) => {
  const bucket = acc.find((x) => x[0] === d);
  if (bucket) bucket[1].push(f); else acc.push([d, [f]]);
  return acc;
}, []);
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

// THE TWO THAT ESCAPED, named so they cannot quietly revert.
for (const [f, label] of [["src/app/cart/page.tsx", "the cart"], ["src/app/bookings/page.tsx", "the bookings page"]]) {
  const live = liveOf(readFileSync(f, "utf8"));
  ck(/buildDisplayPrice\(/.test(live), `${label} converts into the guest's money`);
  ck(!/symbols: Record<string, string>/.test(live), `${label} keeps no symbol table of its own`);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
