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
// THE RULE, not the argument list. The handler grew a slot so an hour
// chosen on the offer screen is not asked for again in a dropdown.
ck(/setPickedOffer\(name\);/.test(live(PAGE)) && /setBooking\(true\)/.test(live(PAGE)),
  "tapping a row opens the sheet on that row");
// WHEREVER THE TIERS ARE SHOWN. They used to expand inline on the row and
// now open on the offer screen, because worthAScreen counts tiers: the
// inline branch became unreachable the moment a tiered row started opening
// a screen, so "Choose" sat above a chevron that never rotated over a list
// that never opened. The rule is unchanged, and it is the rule that
// matters: a tier books under its OWN label, or the wrong price is charged.
const TIER_PICK = /onPick\(`\$\{group\.name\} \(\$\{t\.label\}\)`/;
ck(
  TIER_PICK.test(live(SECTION)) || TIER_PICK.test(readFileSync("src/components/OfferScreen.tsx", "utf8")),
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
ck(/return "Ask";/.test(live(SECTION)), "an unpriced row reads Ask rather than a made-up number");

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
// THE PROPERTY, not the expression. This matched the literal text
// `{pickedPrice ?? price}` and broke the moment the fallback grew a branch
// to stop rendering "from from £4.50". What it means is that a chosen
// row's price WINS over the listing's floor, wherever that is written.
ck(/pickedPrice \?\?/.test(live(PAGE)),
  "and shows that price instead of the cheapest of everything");
ck((live(PAGE).match(/pickedPrice \?\?/g) || []).length === 2,
  "on the card and on the sticky bar, or one of them still quotes the floor after you have chosen");
ck(/const ctaWord = CTA_LABEL\[/.test(live(PAGE)),
  "the top button uses the same word as the rows");

// A café never says Book: it requests a table. Same resolver on both.
ck(/resolveProfileSections\(listing \?\? \{\}\)\.bookCta/.test(live(PAGE)),
  "and the word comes from the shape, so a cafe cannot say Book");


// ── one way in, never two ───────────────────────────────────────────────
// "Why are we saying book? They have so many services. Get rid of that
//  whole section."
//
// A single Book button above a list of seventeen services cannot say which
// one it means. Where there is a list, the list IS the booking.
//
// It cannot just be deleted though: of 49 live listings, 29 have nothing to
// pick, most of them cafés whose menu items are not loaded. For those a
// single action is the only action there could be.

// THE REMEDY WAS WRONG, AND THIS TEST HELD IT IN PLACE.
//
// The rule above is right. What the page did with it was suppress its own
// price card entirely whenever a list existed, so on arrival at any listing
// with services there was no price anywhere and no filled button anywhere.
// What the founder reported seeing was "it just says Open now. Solo book
// now", on both of the listings he opened.
//
// And the assertion here was a SPELLING, /\{\(!pickable \|\| pickedOffer\)/,
// so it guaranteed the mechanism rather than the goal and went green while
// the page showed nothing to buy. Sixth time this repo has been bitten by a
// guard matching text instead of behaviour.
//
// The goal was never "hide the price". It was "one way in". So:

ck(/const pickable = hasPickableList\(/.test(live(PAGE)),
  "the page asks whether there is anything to pick");
ck(/export function hasPickableList/.test(live(SECTION)),
  "the answer comes from the component that does the rendering, not a second guess");

// A PRICE IS NEVER CONDITIONAL ON HAVING PICKED SOMETHING. Found by checking
// that no JSX gate mentioning pickable wraps the booking block, rather than
// by matching whatever today's gate happens to say.
ck(!/\{\([^)]*pickable[^)]*\) && \(\s*\n\s*<div[^>]*>\s*\n\s*<div[^>]*>\s*\n\s*\{bookingBlock\}/.test(live(PAGE)),
  "the phone's price card is not gated on a pick");
ck(!/\{\([^)]*pickable[^)]*\) && \(\s*\n\s*<div className="hidden lg:block">/.test(live(PAGE)),
  "and neither is the desktop sidebar's");
ck((live(PAGE).match(/\{bookingBlock\}/g) || []).length === 2,
  "both surfaces still render it, so a phone and a desktop see the same offer");

// ONE ACTION, WHICH DELEGATES. With a list and nothing chosen the button
// carries the list's own words and goes to the list; choose a row and the
// same button becomes that row's booking. That is "one way in" without a
// page that refuses to show its price.
ck(/const delegating = hasList && !pickedOffer;/.test(live(PAGE)),
  "the page knows when its action should delegate");
// AND IT ASKS ABOUT THE WHOLE LIST. hasPickableList reads services[], which
// is where this page's list used to come from. The real rooms arrive from a
// roomTypes subcollection, so on a resort with seven rooms and no services
// the button said "See rooms" and opened a booking sheet instead of going
// to them: there WAS a list, and the button was asking the wrong thing
// whether there was one.
ck(/const hasList = pickable \|\| roomNames\.length > 0;/.test(live(PAGE)),
  "and counts the rooms as a list, not only services[]");
ck(/delegating \? jumpToMenu\(\) : setBooking\(true\)/.test(live(PAGE)),
  "and the one button either opens the list or opens the booking, never both");
ck(/delegating \? chooseWord : ctaWord/.test(live(PAGE)),
  "wearing the list's words when it delegates, so it cannot promise a booking it is not making");
ck(/ref=\{menuRef\}/.test(live(PAGE)) && /const menuRef = useRef/.test(live(PAGE)),
  "there is somewhere for it to go");

// AND EVERY ROW LOOKS LIKE A WAY IN. The complaint was "the Book is same
// colour, doesn't show any different colours": the row's action was a
// twelve-pixel span in the same colour as the price beside it.
ck(/className=\{ROW_ACTION\}/.test(live(SECTION)),
  "a row's action goes through the shared recipe");
ck(!/text-xs font-semibold text-primary/.test(live(SECTION)),
  "and is no longer a bare word in the body colour");
ck(/border border-line-strong/.test(readFileSync("src/lib/ui-recipes.ts", "utf8")),
  "which carries a border, so it is not distinguished by colour alone");
ck(!/bg-action/.test(readFileSync("src/lib/ui-recipes.ts", "utf8").split("export const ROW_ACTION")[1].split(");")[0]),
  "and never the action's gold, or seventeen services would be seventeen gold buttons");

ck(/if \(shape === "menu"\) return false;/.test(live(SECTION)),
  "a cafe keeps its card, because its menu is not tappable and the card is its only action");

console.log("\nevery category gets a screen, not just rooms");
// Rooms got one first and nothing else did, which made it a special case
// rather than how the product works. 136 experience services exist, 85 with
// a photo and 116 carrying their own hours, and all of it reached a
// traveller as a name and a price on one line.
const SHOP = readFileSync("src/lib/shop-window.ts", "utf8");
const OFFER = readFileSync("src/components/OfferScreen.tsx", "utf8");
ck(/export function worthAScreen/.test(SHOP), "a row knows whether it has anything to show");
ck(/g\.imageUrl \|\| g\.videoUrl \|\| g\.description/.test(SHOP),
  "a photo, a film, text, times or tiers counts; a bare name and price does not");
ck(/worthAScreen\(group\)/.test(live(SECTION)), "and the row asks before opening one");
ck(/openAsScreen\(thumb, OFFER_HERO/.test(live(SECTION)), "which comes out of the row it was tapped on");
ck(/imageUrl: typeof \(r as \{ imageUrl\?: unknown \}\)\.imageUrl/.test(SHOP),
  "the photo is carried through the group, or nothing downstream can read it");
ck(/timeSlots/.test(SHOP) && /When it runs/.test(OFFER),
  "and the hours, which 116 experiences carry and nothing had ever shown");

// A CAFE'S MENU IS A MENU. You read it; you do not tap a jollof rice to
// open its screen. hasPickableList already refuses a menu shape, so this
// stays true by construction rather than by a rule in the screen.
ck(/if \(shape === "menu"\) return false;/.test(live(SECTION)),
  "food and drink keeps a flat menu, with nothing to tap into");

ck(/group\.tiers\.length === 0 &&/.test(OFFER),
  "a tiered offer has no second Book button, since it could not say which tier it meant");

console.log("\nwhat you can book comes with what the place has");
// It sat below the map and the opening hours, so somebody reading down the
// page met the address and the Tuesday hours before they met a single
// room. Amenities answer what is here; the list answers what you can have.
const order = (needle) => live(PAGE).indexOf(needle);
ck(order("What this place offers") > 0, "the amenities section is still there");
ck(order("ref={menuRef}") > order("What this place offers"),
  "and what you can book follows it");
ck(order("ref={menuRef}") < order("Where you will be"),
  "before the map");
ck(order("ref={menuRef}") < order("Good to know"),
  "and before the opening hours");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
