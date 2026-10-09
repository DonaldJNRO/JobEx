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

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
