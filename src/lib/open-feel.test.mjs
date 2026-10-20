// WHAT HAPPENS WHEN YOU TAP SOMETHING.
//
// "When we click on different things, like from the grid card to the shop,
// how does it open, nice or naa?" It was naa, and for a structural reason
// rather than a slow one:
//
//   this app had NO loading.tsx on any route, and the listing route awaits a
//   Firestore read in generateMetadata. In the App Router a client-side
//   navigation into that SUSPENDS, and with no boundary to fall back to Next
//   holds the previous page on screen until the server answers. So tapping a
//   grid card did nothing at all, then the page swapped whole and showed a
//   SECOND skeleton from inside the client component.
//
// Two loading phases with a dead period between them. These assert the shape
// of the fix, not its wording.
//
// Run: tsx src/lib/open-feel.test.mjs

import { readFileSync, existsSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const LOADING = "src/app/listing/[id]/loading.tsx";

console.log("\nthe tap paints something immediately");
ok(existsSync(LOADING), "the listing route has a loading boundary");
const L = existsSync(LOADING) ? readFileSync(LOADING, "utf8") : "";
ok(/animate-shimmer/.test(L), "which shimmers rather than sitting blank");
ok(/aria-busy="true"/.test(L) && /sr-only/.test(L), "and says what it is doing");

console.log("\nand it is the shape of the page that replaces it");
// The old in-component skeleton used 2.2/1 against a hero of 4/3 on a phone,
// so the page visibly reflowed at the moment content arrived. A skeleton
// that is the wrong shape is worse than none: it moves the thing you are
// already looking at.
const CLIENT = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
const heroAspect = CLIENT.match(/aspect-\[4\/3\] sm:aspect-\[2\.5\/1\]/g) || [];
ok(heroAspect.length >= 2, `the hero's aspect appears ${heroAspect.length} times in the page, hero and skeleton`);
ok(/aspect-\[4\/3\]/.test(L) && /sm:aspect-\[2\.5\/1\]/.test(L), "and loading.tsx uses the same one");
ok(!/aspect-\[2\.2\/1\]/.test(CLIENT), "the mismatched 2.2/1 placeholder is gone");

console.log("\nthe card answers the finger");
const CARD = readFileSync("src/components/ListingCard.tsx", "utf8");
ok(/active:scale-/.test(CARD), "a press state, so the tap is acknowledged before the server is");
ok(/transition-transform/.test(CARD), "and it is animated rather than snapping");

console.log("\nand a failure is not Next's own error screen");
ok(existsSync("src/app/error.tsx"), "there is an error boundary");
const E = readFileSync("src/app/error.tsx", "utf8");
ok(/"use client"/.test(E), "a client component, as Next requires");
ok(/reset/.test(E), "offering a retry");
// A boundary that can itself throw replaces one blank screen with another.
ok(!/useEffect|useState|fetch\(|watch[A-Z]/.test(E), "and it reads nothing, so it cannot throw on its own");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
