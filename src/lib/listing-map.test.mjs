// 50 of 60 live listings carry real coordinates and this site has never
// drawn a map. MapPin appears four times on the listing page as decoration.
//
// Run: tsx src/lib/listing-map.test.mjs

import { readFileSync } from "node:fs";
import { coordsOf, mapFor } from "./listing-map.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\ncoordinates, from wherever the document keeps them");
ok(coordsOf({ latitude: 6.5, longitude: 3.3 })?.lat === 6.5, "at the root, which is where 50 of them are");
ok(coordsOf({ location: { latitude: 6.5, longitude: 3.3 } })?.lng === 3.3, "or nested under location");
ok(coordsOf({ coordinates: { lat: 6.5, lng: 3.3 } })?.lat === 6.5, "under either spelling");
ok(coordsOf({ latitude: "6.5", longitude: "3.3" })?.lat === 6.5, "and as strings, since writers differ");

console.log("\nand nothing that is not a place");
// 0,0 is in the Atlantic off Ghana. It is what an uninitialised pair looks
// like, and a map centred there is worse than no map because it looks like
// an answer.
ok(coordsOf({ latitude: 0, longitude: 0 }) === null, "null island is not a place");
ok(coordsOf({ latitude: 91, longitude: 3 }) === null, "nor is a latitude past the pole");
ok(coordsOf({ latitude: 6.5, longitude: 181 }) === null, "nor a longitude past the line");
ok(coordsOf({}) === null && coordsOf({ latitude: 6.5 }) === null, "half a pair is no pair");
ok(coordsOf({ latitude: NaN, longitude: 3 }) === null, "NaN is not a coordinate");

console.log("\nthe section renders nothing rather than an empty frame");
// The same rule the dashboard shapes follow: an empty grey card is the bug,
// rendering nothing is the fix.
ok(mapFor({}, "Lagos") === null, "no coordinates, no map");
const m = mapFor({ latitude: 6.4474, longitude: 3.3903 }, "Lagos");
ok(m !== null, "and a real pair gives one");
ok(m.embedSrc.includes("openstreetmap.org"), "OpenStreetMap, so there is no API key to leak and no quota to exhaust");
ok(m.embedSrc.includes("marker=6.44740"), "with the pin on the place");
ok(m.mapsHref.includes("mlat=6.44740"), "and a link out to a real map");
ok(m.label === "Lagos", "labelled with where it is");

// A PRECISE PIN. Airbnb blurs a HOME to a radius because it is somebody's
// house. These are businesses, and being findable is the point.
ok(!/circle|radius|approx/i.test(m.embedSrc), "the pin is exact, because a business wants to be found");

console.log("\nthe bounding box is centred on the pin");
const box = decodeURIComponent(m.embedSrc.match(/bbox=([^&]+)/)[1]).split(",").map(Number);
ok(box[0] < m.lng && box[2] > m.lng, "the pin is inside its own box horizontally");
ok(box[1] < m.lat && box[3] > m.lat, "and vertically");

console.log("\nand the page draws it");
const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
ok(/mapFor\(/.test(PAGE), "the listing page asks for a map");
ok(/<iframe/.test(PAGE), "and renders one");
ok(/loading="lazy"/.test(PAGE), "lazily, since it is below the fold on every listing");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
