// A headline price that is the cheapest of many has to say "from".
//
// Naileditbyd's card read "£2". That is her gel on natural toes, 4,000 naira,
// converted. It is true and it is read by anybody glancing at the card as what
// a set of nails costs, when her acrylics start at 17,000 and her signature
// work is higher again. A bare number is a different claim from a floor.
//
// Run: npx tsx src/lib/from-price.test.mjs

import { priceParts } from "./listing-price.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

// Her real list, shortened: many services, many different prices.
const NAILS = {
  customPrice: { price: 4000 },
  currency: "NGN",
  services: [
    { name: "Gel on natural toes", tiers: [{ price: "4000" }], price: 4000 },
    { name: "Acrylic, plain short", price: 17000 },
    { name: "Acrylic, basic long design", price: 27000 },
  ],
};

is(priceParts(NAILS).from, true, "a listing with several prices says from");
is(priceParts(NAILS).amount, "₦4,000", "and the amount is still the cheapest");

// One service, one price: the number IS the price, and "from" would be a
// hedge that makes it look like there is more to pay.
is(priceParts({ customPrice: { price: 50000 }, currency: "NGN",
  services: [{ name: "The only thing", price: 50000 }] }).from, false,
  "a single price does not say from");

is(priceParts({ customPrice: { price: 50000 }, currency: "NGN" }).from, false,
  "and neither does a listing with no service list at all");

// Several rows at the SAME price is one price, not a range.
is(priceParts({ customPrice: { price: 55000 }, currency: "NGN",
  services: [{ name: "Facial A", price: 55000 }, { name: "Facial B", price: 55000 }] }).from, false,
  "the same price twice is not a range");

// Packages count too: Naileditbyd's prices live there as well as on services.
is(priceParts({ customPrice: { price: 4000 }, currency: "NGN",
  packages: [{ name: "A", price: 4000 }, { name: "B", price: 17000 }] }).from, true,
  "packages count as well as services");

// A free or unpriced row is not a price, so it cannot create a range on its
// own. Same rule the rest of the platform follows.
is(priceParts({ customPrice: { price: 9000 }, currency: "NGN",
  services: [{ name: "Consult", price: 0 }, { name: "The service", price: 9000 }] }).from, false,
  "a zero priced row does not make a range");

// The flag must survive every unit branch, since each one returns separately.
for (const unit of ["per_night", "per_person", "per_ticket", "per_hour", "per_day", ""]) {
  const r = priceParts({ customPrice: { price: 100 }, currency: "GBP", pricingUnit: unit,
    services: [{ name: "a", price: 100 }, { name: "b", price: 300 }] });
  if (r.from !== true) { fails++; console.log(`FAIL  the flag survives unit "${unit}"`); }
}
console.log(`PASS  the flag survives every pricing unit`);

// Nothing priced at all is still not a price.
is(priceParts({ customPrice: { price: 0 } }), { amount: null, unit: "", from: false },
  "no price is still no price");


// ── PRICED ON THE TIER, NOT THE ROW ───────────────────────────────────────
//
// 25 of the 26 live listings that have services leave the row price
// undefined and put the figure on a tier; anything Scout captured does.
// hasRange read the row only, so "from" never appeared on a listing that
// genuinely had a range — Rayfield Resort shows a ₦300 gate fee as if it
// were the price of the whole resort. The app fixed exactly this in
// GridCard.js:407 and its note says the bug reached three separate surfaces.
console.log("\na range on the tiers counts as a range");
{
  // Rayfield's real shape, measured.
  const rayfield = {
    customPrice: { price: 300 },
    currency: "NGN",
    services: [
      { name: "Gate fee adult", price: undefined, tiers: [{ price: 500 }] },
      { name: "Gate fee child", price: undefined, tiers: [{ price: 300 }] },
      { name: "Boat ride", price: undefined, tiers: [{ price: 1000 }] },
    ],
  };
  is(priceParts(rayfield).from, true, "three tier prices is a range, so it says from");

  is(priceParts({
    customPrice: { price: 500 },
    services: [{ name: "One thing", tiers: [{ price: 500 }] }],
  }).from, false, "a single tier price is not a range");

  is(priceParts({
    customPrice: { price: 500 },
    services: [{ name: "A", price: 500 }, { name: "B", tiers: [{ price: 900 }] }],
  }).from, true, "a row price and a tier price together still make a range");

  is(priceParts({
    customPrice: { price: 500 },
    services: [{ name: "A", tiers: [{ price: 0 }, { price: null }] }],
  }).from, false, "zero and null tiers are not prices");
}

console.log("\npence matter when the number is small");
{
  // ₦300 at the real rate is about £0.14. Rounded to whole pounds it reads
  // "from £0", which is the worst thing a price can say.
  const money = { ready: true, to: "GBP", rates: { NGN: 2100, GBP: 1 } };
  const out = priceParts({ customPrice: { price: 300 }, currency: "NGN" }, money);
  is(out.amount !== "£0", true, `a 300 naira fee is not £0 (got ${out.amount})`);
  is(/£0\.\d\d/.test(out.amount), true, `it keeps its pence (got ${out.amount})`);

  const big = priceParts({ customPrice: { price: 440000 }, currency: "NGN" }, money);
  is(/\./.test(big.amount), false, `a large figure drops the decimals (got ${big.amount})`);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
