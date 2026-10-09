// The web profile decides its shape the way the app does.
//
// A VERBATIM PORT of sectionRouter.js in sabie-v53-main, with the
// subcategory sets extracted from that file rather than retyped. If the two
// drift, a traveller sees a menu on one surface and a service list on the
// other for the same business.
//
// Run: npx tsx src/lib/profile-sections.test.mjs

import { resolveProfileSections } from "./profile-sections.ts";
import { serviceGroups } from "./shop-window.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

// ── the three shapes ────────────────────────────────────────────────────
is(resolveProfileSections({ role: "ExperienceProviders" }).services, "nested-services",
  "an experience shows services with tiers");
is(resolveProfileSections({ role: "FoodBeverageManager" }).services, "menu",
  "a cafe shows a menu");
is(resolveProfileSections({ subCategory: "hotel" }).services, "rooms",
  "a hotel shows rooms");

for (const sub of ["hotel", "resort", "hostel", "bed_and_breakfast", "glamping", "bnb", "unique_stay"]) {
  is(resolveProfileSections({ subCategory: sub }).services, "rooms", `${sub} is lodging`);
}
for (const sub of ["restaurant", "cafe", "bar", "bakery", "catering_service"]) {
  is(resolveProfileSections({ subCategory: sub }).services, "menu", `${sub} is food`);
}

// THE CARVE-OUT, carried over verbatim: a hospitality role renting a venue
// for an event is not a stay.
is(resolveProfileSections({ role: "hospitality_manager", subCategory: "event_rental" }).services,
  "nested-services", "a hospitality venue rented for an event is NOT rooms");
is(resolveProfileSections({ role: "hospitality_manager" }).services, "rooms",
  "but the same role with no subcategory is");

// ── the button ──────────────────────────────────────────────────────────
is(resolveProfileSections({ subCategory: "hotel" }).bookCta, "rooms", "a stay says see rooms");
is(resolveProfileSections({ role: "FoodBeverageManager" }).bookCta, "reserve", "a cafe reserves");
is(resolveProfileSections({ role: "Landlord", subCategory: "event_rental" }).bookCta, "inquire",
  "a landlord takes enquiries");
is(resolveProfileSections({ role: "ExperienceProviders" }).bookCta, "book", "everything else books");

// role as an array, which mobile documents sometimes carry
is(resolveProfileSections({ role: ["food_beverage_manager"] }).services, "menu",
  "a role stored as an array is read");
is(resolveProfileSections(null).services, "nested-services", "and nothing known falls back safely");

// ── two levels, locked ──────────────────────────────────────────────────
const NAILS = {
  services: [
    { name: "Acrylic, plain short", tiers: [{ label: "Single", price: "17000" }] },
    { name: "Gel nails, plain", tiers: [{ label: "Short", price: "12000" }, { label: "Medium", price: "14000" }] },
    { name: "Pedicure", price: 15000 },
  ],
};
const g = serviceGroups(NAILS);
is(g.length, 3, "one row per service, not one per price");
is(g[1].hasChoices, true, "a service with two real prices expands");
is(g[1].tiers.map((t) => t.label), ["Short", "Medium"], "into its tiers");
is(g[1].fromPrice, 12000, "and collapsed it shows the cheapest");

// A SINGLE TIER IS NOT A CHOICE. "Acrylic / Single" is the same row said
// twice, and the app collapses it the same way.
is(g[0].hasChoices, false, "a single tier does not expand");
is(g[0].fromPrice, 17000, "it just shows its price");
is(g[2].fromPrice, 15000, "and a row priced on itself needs no tiers at all");

is(serviceGroups({ packages: [{ name: "Only a package", price: 500 }] }).length, 1,
  "packages are used when there are no services");
is(serviceGroups({}).length, 0, "and nothing means nothing");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
