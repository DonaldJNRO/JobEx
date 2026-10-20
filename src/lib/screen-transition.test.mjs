// "THEY TAP ON IT, IT COMES OUT AT THE TOP, IT'S LIKE ANOTHER SCREEN."
//
// Airbnb's listing does not replace the feed, it arrives over it, and the
// photo you tapped is the photo at the top. Ours swapped one page for
// another, which is why the flow read as flat next to theirs.
//
// A view transition is the browser API for exactly that: it photographs the
// page before and after and animates between them, and two elements sharing
// a view-transition-name are treated as ONE element that moved.
//
// Run: tsx src/lib/screen-transition.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const CONFIG = readFileSync("next.config.ts", "utf8");
const CARD = readFileSync("src/components/ListingCard.tsx", "utf8");
const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
const LOADING = readFileSync("src/app/listing/[id]/loading.tsx", "utf8");
const CSS = readFileSync("src/app/globals.css", "utf8");

console.log("\nthe navigation is a transition at all");
ok(/viewTransition:\s*true/.test(CONFIG), "Next wraps client navigations in startViewTransition");

console.log("\nthe photo you tapped is the photo at the top");
// Both ends must carry the SAME name or the browser has nothing to pair,
// and the morph silently degrades to a cross-fade that looks like nothing.
const NAME = "listing-hero";
ok(CARD.includes(`"${NAME}"`), "the card names its photo");
ok(PAGE.includes(`viewTransitionName: "${NAME}"`), "the hero carries the same name");
ok(LOADING.includes(`viewTransitionName: "${NAME}"`), "and so does the loader, so the photo lands before the page does");

console.log("\nand only one card can own that name at a time");
// A view-transition-name must be unique in the document. This wall renders
// sixty cards: naming them all would name none of them.
ok(/onClick=\{\(e\)/.test(CARD), "the name is applied on tap, not at render");
ok(/viewTransitionName = ""/.test(CARD), "and taken off again, or the next tap collides with it");
ok(!/view-transition-name:/.test(CARD), "it is never set statically on every card");

console.log("\nthe screen arrives rather than replacing");
ok(/::view-transition-new\(root\)/.test(CSS), "the incoming page is animated");
ok(/translateY\(18px\)/.test(CSS), "from below, which is what reads as a screen arriving");
ok(/::view-transition-group\(listing-hero\)/.test(CSS), "and the photo's travel has its own timing");

console.log("\nthe photo moves rather than dissolving");
// Two photos cross-fading through each other WHILE moving reads as a
// glitch. One photo moving reads as the same photo.
const heroRule = CSS.slice(CSS.indexOf("::view-transition-old(listing-hero)"));
ok(/animation:\s*none/.test(heroRule.slice(0, 260)), "the old and new frames do not cross-fade during the move");
ok(/object-fit:\s*cover/.test(heroRule.slice(0, 260)), "and keep their crop, or the photo stretches mid-flight");

console.log("\nmotion is a preference");
// A full-screen slide is exactly what somebody who turned motion off was
// turning off. The morph can stay: a photo moving between two positions is
// not the kind of motion that causes trouble.
const reduced = CSS.slice(CSS.lastIndexOf("prefers-reduced-motion"));
ok(/::view-transition-new\(root\)[\s\S]{0,120}animation: none/.test(reduced), "the page slide is dropped");

console.log("\nand a browser without the API is unharmed");
// Every selector here is inert where the API is absent, so there is nothing
// to feature-detect and no fallback path to keep working.
ok(!/startViewTransition/.test(CARD), "no hand-rolled call that would need guarding");
ok(!/navigator\.|userAgent/i.test(CSS.slice(CSS.indexOf("THE SCREEN COMES OUT"))), "and no sniffing");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
