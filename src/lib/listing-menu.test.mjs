// The page has to show what they sell.
//
// It showed a hero, a from-price and a Book button and nothing else: a
// traveller could not see what was on offer without opening the booking
// sheet. Naileditbyd has seventeen services and the page named none of them.
// The mobile app has shown this list all along.
//
// Run: npx tsx src/lib/listing-menu.test.mjs

import { readFileSync } from "node:fs";
import { offersOf } from "./shop-window.ts";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

const PAGE = readFileSync(new URL("../app/listing/[id]/ListingClient.tsx", import.meta.url), "utf8");
const SHEET = readFileSync(new URL("../components/BookingRequest.tsx", import.meta.url), "utf8");
const live = (s) => s.split("\n").filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*")).join("\n");

// The flat list this file first tested was replaced by ProfileServices,
// which mirrors the app: three shapes, and services collapsed over their
// tiers rather than one row per price.
const SECTION = readFileSync(new URL("../components/ProfileServices.tsx", import.meta.url), "utf8");

ck(/<ProfileServices/.test(live(PAGE)), "the page renders the services section");
ck(/Pick what you want/.test(live(SECTION)), "under a heading that says what it is");
ck(/resolveProfileSections\(listing\)/.test(live(SECTION)),
  "whose shape is decided the same way the app decides it");

// A MENU, NOT A PRICE LIST. Tapping a row has to carry the choice through.
ck(/setPickedOffer\(name\); setBooking\(true\)/.test(live(PAGE)),
  "tapping a row opens the sheet on that row");
ck(/onPick\(`\$\{group\.name\} \(\$\{t\.label\}\)`\)/.test(live(SECTION)),
  "and a tier carries its own label, so the right price is booked");
ck(/initialOffer=\{pickedOffer\}/.test(live(PAGE)), "and hands it over");
ck(/initialOffer \|\| offers\[0\]\?\.name \|\| ""/.test(live(SHEET)),
  "the sheet starts on it");

// useState reads its initial value ONCE. Without the effect, closing the
// sheet, tapping Pedicure and reopening would still show Acrylic.
ck(/if \(initialOffer && offers\.some\(\(o\) => o\.name === initialOffer\)\) setOffer\(initialOffer\)/.test(live(SHEET)),
  "and follows a different row on reopen");
ck(/o\.name === initialOffer/.test(live(SHEET)),
  "only when that row actually exists on this listing");

// An unpriced row is still offerable: "ask to book" means the operator says
// what it costs when they accept.
ck(/\? "Ask" :/.test(live(SECTION)), "an unpriced row reads Ask rather than a made-up number");

// Naileditbyd's real shape: priced on the tier, mirrored into packages.
const NAILS = {
  services: [
    { name: "Acrylic, plain short", tiers: [{ label: "Single", price: "17000" }] },
    { name: "Gel nails, plain", tiers: [{ label: "Short", price: "12000" }, { label: "Medium", price: "14000" }] },
  ],
  packages: [{ name: "Acrylic, plain short", price: 17000 }],
};
const o = offersOf(NAILS);
ck(o.length === 3, "a tiered service becomes one row per real price");
ck(o.every((x) => typeof x.price === "number"), "and every row the page shows has a price");
ck(new Set(o.map((x) => x.name)).size === o.length, "with no row listed twice");


// ── one booking, not two competing ones ──────────────────────────────────
// "At the top it says Book, and at the bottom it says what they offer.
//  Which is which?"
//
// A big "from" price with a Book button at the top, and a list of services
// with their own prices below, and nothing connecting them.

ck(/Pick what you want|Pick a room/.test(live(SECTION)),
  "the heading says the list IS the booking, not a brochure");
ck(/\{cta\}/.test(live(SECTION)),
  "and every bookable row carries the action word");
ck(/Choose/.test(live(SECTION)),
  "a row with tiers says Choose rather than the action word, because it opens first");

ck(/\{pickedOffer\}/.test(live(PAGE)),
  "the top card names what they picked");
ck(/\{pickedPrice \?\? price\}/.test(live(PAGE)),
  "and shows that price instead of the cheapest of everything");
ck(/const ctaWord = CTA_LABEL\[/.test(live(PAGE)),
  "the top button uses the same word as the rows");

// A café never says Book: it requests a table. Same resolver on both.
ck(/resolveProfileSections\(listing \?\? \{\}\)\.bookCta/.test(live(PAGE)),
  "and the word comes from the shape, so a cafe cannot say Book");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
