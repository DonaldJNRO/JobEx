// A CITY WITH ONE LISTING SHOWS THAT LISTING.
//
// The home page narrowed by city, and the thing it narrowed was a SAMPLE.
// getFeaturedListings(40) reads ceil(40 / 6) * 2 = 14 documents per role
// against 30 food listings, shuffles what survives and slices to 40.
//
// So Nottingham, whose only listing is Nita Cocktails, appeared when the
// sample happened to include it and read as empty when it did not. Same for
// Bamako, Nouakchott, and London's two: every thin city on the platform,
// which is every city except Lagos, Abuja and Jos.
//
// Nothing errored. The city picker said "1 place" and the feed said nothing
// here, and both were reading the same database.
//
// This is the family's recurring bug: filter a capped read and report the
// result as a fact about the data. A users list of 200 against a cap of 100
// did it, and a search that read 100 rows and said "No Results Found" did it.
//
// Run: tsx src/lib/thin-city.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const LISTINGS = code("src/lib/listings.ts");
const HOME = code("src/app/page.tsx");

console.log("\nthe page that filters reads everything");
ok(/export async function getPublicCatalogue/.test(LISTINGS), "there is a catalogue read that does not sample");
ok(/getPublicCatalogue\(\)/.test(HOME), "and the home page uses it");
ok(!/getFeaturedListings\(\d+\)/.test(HOME), "rather than a sampled featured read");

console.log("\nand the catalogue read genuinely does not cap");
const body = LISTINGS.slice(LISTINGS.indexOf("export async function getPublicCatalogue"));
const fn = body.slice(0, body.indexOf("\n}"));
ok(/getAllListings\(\)/.test(fn), "it goes through getAllListings, which has no limit()");
ok(!/limit\(/.test(fn), "and adds no limit of its own");
ok(!/slice\(/.test(fn), "and no slice, which is the other half of the same bug");
ok(/isPublicListing/.test(fn), "while still hiding founder, test and hidden listings");

console.log("\nand getFeaturedListings still samples, for the strip that wants one");
ok(/export async function getFeaturedListings/.test(LISTINGS), "it still exists");
const feat = LISTINGS.slice(LISTINGS.indexOf("export async function getFeaturedListings"));
ok(/limit\(/.test(feat.slice(0, feat.indexOf("\n}"))), "and still caps its read, which is right for featured");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
