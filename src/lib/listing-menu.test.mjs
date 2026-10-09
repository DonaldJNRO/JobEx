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

ck(/offers\.length > 0 && \(/.test(live(PAGE)), "the page renders the offer list");
ck(/What they offer/.test(live(PAGE)), "under a heading that says what it is");
ck(/const offers = offersOf\(listing \?\? \{\}\)/.test(live(PAGE)),
  "from the same offersOf the sheet uses, so the two cannot disagree");

// A MENU, NOT A PRICE LIST. Tapping a row has to carry the choice through.
ck(/setPickedOffer\(o\.name\); setBooking\(true\)/.test(live(PAGE)),
  "tapping a row opens the sheet on that row");
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
ck(/: "Ask"/.test(live(PAGE)), "an unpriced row reads Ask rather than a made-up number");

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

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
