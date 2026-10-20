// "IT SHOWS YOU NOTHING. NOTHING AT ALL."
//
// Tapping a room on the website went straight to payment with no picture,
// where the app shows photos and video. The cause was not the sheet: the
// website was reading the wrong place. A stay's rooms live in a
// SUBCOLLECTION, roomTypes or stayUnits, and this site read services[],
// where Scout also writes the room NAMES. So every row was a stub with a
// price and nothing behind it, and some pages drew the rooms twice.
//
// Measured: 10 listings carry a room subcollection, 30 room documents, ALL
// 30 carrying media, 195 photos and 45 videos between them.
//
// Run: tsx src/lib/rooms.test.mjs

import { readFileSync } from "node:fs";
import {
  deriveRoomSections, toRoom, roomPhotos, roomVideos, roomCover, hasMedia, stayFacts,
} from "./rooms.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nthe web reads where the rooms actually are");
const SRC = readFileSync("src/lib/rooms.ts", "utf8");
ok(/"roomTypes"/.test(SRC), "roomTypes, for a Landlord, Host or HospitalityManager");
ok(/"stayUnits"/.test(SRC), "and stayUnits, for a hybrid beach listing");
ok(/Promise\.allSettled/.test(SRC), "both read, so a recategorised listing keeps its rooms");

console.log("\nsections mirror the app's own derivation");
// Same rule as components/stay/roomSections.js, including the legacy
// fallback, or a room looks different on a phone and in a browser.
const real = deriveRoomSections({
  mediaSections: [
    { id: "walkthrough", photos: [], videos: ["v1"] },
    { id: "bedroom", photos: ["p1"], videos: ["v2"] },
  ],
});
ok(real.length === 2, "a section with only a film still counts");
ok(real[0].id === "walkthrough", "and keeps its order");

const dropped = deriveRoomSections({
  mediaSections: [
    { id: "full", photos: ["p1"], videos: [] },
    { id: "empty", photos: [], videos: [] },
  ],
});
// A heading over nothing is a broken promise, and worse, it shifts the
// index: the tile at N must open the section at N.
ok(dropped.length === 1 && dropped[0].id === "full", "an empty section is dropped, not rendered as a heading over nothing");

console.log("\nand the legacy shape still lights up");
const legacy = deriveRoomSections({ images: ["a", "b"], videoUrl: "v" });
ok(legacy.length === 1 && legacy[0].id === "gallery", "flat images become one synthetic gallery");
ok(legacy[0].photos.length === 2 && legacy[0].videos.length === 1, "carrying both");
ok(deriveRoomSections({ videoUrls: ["v1", "v2"] })[0].videos.length === 2, "videoUrls too");
ok(deriveRoomSections({}).length === 0, "and a room with nothing has no sections, rather than one empty one");
ok(deriveRoomSections({ mediaSections: [{ photos: [], videos: [] }], images: ["x"] })[0].photos[0] === "x",
  "sections that are all empty fall back to the legacy images");

console.log("\nnothing malformed reaches the page");
ok(deriveRoomSections({ mediaSections: "nope" }).length === 0, "a non-array mediaSections is not iterated");
ok(deriveRoomSections({ images: [null, "", "ok", 7] })[0].photos.length === 1, "blanks and numbers are not urls");
ok(deriveRoomSections({ mediaSections: [{ photos: ["p"] }] })[0].videos.length === 0, "a missing videos key is empty, not undefined");

console.log("\na room carries what the row needs");
const room = toRoom("r1", {
  name: "Lighthouse Cabin",
  description: "On the point",
  basePrice: { amount: 125, currency: "GBP" },
  quantity: 2, maxGuests: 3,
  mediaSections: [{ id: "a", photos: ["p1", "p2"], videos: ["v1"] }],
});
ok(room.name === "Lighthouse Cabin" && room.priceAmount === 125, "name and price");
ok(room.priceCurrency === "GBP", "in the currency the room states, not the listing's");
ok(roomPhotos(room).length === 2 && roomVideos(room).length === 1, "its media, flattened in section order");
ok(roomCover(room) === "p1", "and a cover for the row");
ok(hasMedia(room) === true, "which is how the row knows to show one");

const bare = toRoom("r2", {});
ok(bare.name === "Room", "an unnamed room is still a room, never blank");
ok(roomCover(bare) === null && hasMedia(bare) === false, "and one with no media says so rather than rendering a broken image");
ok(toRoom("r3", { basePrice: {} }).priceAmount === null, "a price that is not a number is absent, not NaN");

// A FILM WITHOUT A STILL. 45 videos live in these rooms and some sections
// carry only video, so a cover of "the first photo" can legitimately be null
// on a room that definitely has media.
const filmOnly = toRoom("r4", { mediaSections: [{ id: "w", photos: [], videos: ["v"] }] });
ok(hasMedia(filmOnly) === true && roomCover(filmOnly) === null,
  "a room with only a film has media but no cover, and both facts are true at once");

console.log("\nthe page shows them, with their pictures");
const PAGE = readFileSync("src/app/listing/[id]/ListingClient.tsx", "utf8");
const LIST = readFileSync("src/components/RoomList.tsx", "utf8");
ok(/<RoomList/.test(PAGE), "the listing page mounts the room list");
ok(/fetchRooms\(role, docId\)/.test(LIST), "which reads the subcollection");
ok(/<Image/.test(LIST), "and every row carries a picture");
ok(/RoomGallery/.test(LIST), "tapping one opens the gallery rather than going to payment");

const GAL = readFileSync("src/components/RoomGallery.tsx", "utf8");
ok(/<video/.test(GAL) && /<Image/.test(GAL), "which shows films as well as photos");
// CASE SENSITIVE, and on the JSX prop rather than the word. The first
// version of this was /autoPlay/i and it failed against the COMMENT
// explaining why there is no autoplay. Seventh time in this repo that a
// guard matched a spelling instead of the thing.
ok(!/\bautoPlay\b/.test(GAL.replace(/\/\/[^\n]*/g, "")), "and does not start a film talking at somebody unasked");
ok(/aria-modal="true"/.test(GAL), "announced as a dialog");

// THE ONE THAT MADE IT STUCK. `position: fixed` is NOT relative to the
// viewport when an ancestor carries a transform: that ancestor becomes the
// containing block. Every section on the listing page wears .reveal, which
// animates translateY, so a fixed overlay inside one rendered as a black box
// wedged into the scroll and clipped by the bottom bar. A portal is the only
// fix; z-index cannot touch it, because it is not a stacking problem.
const OVERLAY = readFileSync("src/components/Overlay.tsx", "utf8");
ok(/<Overlay>/.test(GAL), "the gallery goes through the shared overlay");
ok(/createPortal\(children, document\.body\)/.test(OVERLAY), "which portals to the body, so no transformed ancestor can trap it");
// It bit twice on one page, so the sweep is part of the guard: every
// full-screen layer goes through the same door.
for (const f of ["src/components/CityPicker.tsx", "src/components/RoomGallery.tsx"]) {
  const src = readFileSync(f, "utf8");
  if (!/fixed inset-0/.test(src)) continue;
  ok(/<Overlay>/.test(src), `${f.split("/").pop()} covers the screen rather than its own section`);
}
ok(/transform/.test(readFileSync("src/app/globals.css", "utf8").match(/html\.reveal-ready \.reveal \{[^}]*\}/)?.[0] || ""),
  "and .reveal really does carry the transform that caused it, so this is not guarding a ghost");

// On a phone the first thing anybody does to dismiss a full-screen layer is
// press back. Without a history entry that leaves the listing entirely.
ok(/pushState/.test(GAL), "opening pushes a history entry");
ok(/popstate/.test(GAL), "so the back button closes it");
ok(/history\.back\(\)/.test(GAL), "and closing any other way takes that entry back off the stack");

// Eleven photos one at a time behind arrows is a slideshow. Airbnb gives you
// the set in a column, which is how somebody actually decides on a room.
// A COLUMN YOU SCROLL WAS THE WRONG REFERENCE, and this guard defended it
// for an afternoon. Airbnb's photo COLUMN is a second screen you open FROM
// a carousel; the first look at a room on a phone is a swipe. Stacking two
// photos just made you scroll past the first to find the second.
//
// CSS scroll snapping, so the swipe is the browser's own: it has the right
// momentum and the right rubber band, which no amount of touch handling
// reproduces.
ok(/snap-x snap-mandatory/.test(GAL), "the set snaps, so a swipe lands on one photo");
ok(/overflow-x-auto/.test(GAL), "sideways");
ok(/w-full shrink-0 snap-center/.test(GAL), "each item filling the frame");
ok(!/onTouchStart|onTouchMove/.test(GAL), "and no hand-rolled touch handling competing with the browser's");
ok(/Escape/.test(GAL), "with a keyboard way out, since it covers the whole page");
ok(/document\.body\.style\.overflow/.test(GAL), "and the page behind does not scroll under it");

console.log("\nand the rooms are not drawn twice");
// Scout writes a stay's rooms into services[] as well as roomTypes, so a
// page rendering both lists showed every room twice: once with a photograph
// and once as a bare stub.
const SECTION = readFileSync("src/components/ProfileServices.tsx", "utf8");
ok(/hideNames/.test(SECTION), "the services list can drop names already shown as rooms");
ok(/trim\(\)\.toLowerCase\(\)/.test(SECTION), "matched case-insensitively, since the two writers disagree on capitalisation");
ok(/hideNames=\{roomNames\}/.test(PAGE), "and the page passes what the room list found");
// It is a de-duplicate, not a way to hide the section: a bonfire is not a
// room and must survive.
ok(/\.filter\(\(g\) => !drop\.has/.test(SECTION), "only the duplicates go, never the whole list");

console.log("\nthe price and the action never leave the screen");
// Airbnb keeps "£466 total" and Reserve pinned the whole way down a
// listing, because the two questions somebody holds while scrolling are
// what does it cost and how do I get it. This page answered both only at
// the very top.
ok(/priceGone/.test(PAGE), "the page knows when its price card has scrolled away");
ok(/IntersectionObserver/.test(PAGE), "watched rather than measured on every scroll event");
ok(/fixed inset-x-0 bottom-0/.test(PAGE), "and a bar takes over when it has");
ok(/aria-hidden=\{!priceGone\}/.test(PAGE), "hidden from a screen reader while it is off screen");
ok(/tabIndex=\{priceGone \? undefined : -1\}/.test(PAGE), "and out of the tab order, or there are two Book buttons to tab through");

// Two bars stacked would push the real one off the thumb, so the tab bar
// steps aside exactly where the page carries its own action.
const SHELL = readFileSync("src/lib/app-shell.ts", "utf8");
ok(/isListingRoute/.test(SHELL), "a listing route is named");
ok(/!isListingRoute\(pathname\)/.test(SHELL), "and the phone's tab bar stands down on one");

console.log("\nand the facts come before the prices");
ok(stayFacts([]).length === 0, "no rooms, no line, rather than an empty bullet list");
const facts = stayFacts([
  toRoom("a", { name: "Cabin", maxGuests: 4, mediaSections: [{ id: "g", photos: ["p"], videos: [] }] }),
  toRoom("b", { name: "Suite", maxGuests: 2, mediaSections: [{ id: "g", photos: ["q"], videos: ["v"] }] }),
]);
ok(facts[0] === "Sleeps up to 4", "the largest room answers will we fit");
ok(facts[1] === "2 rooms", "and how many there are to choose between");
ok(facts.some((f) => /film/.test(f)), "films are named where there are any, since a walkthrough is the draw");
// An invented bedroom or bathroom count is worse than a shorter line, and
// these documents carry neither.
ok(!facts.join(" ").match(/bedroom|bathroom|bed\b/), "nothing is claimed that the data does not hold");
ok(stayFacts([toRoom("c", { maxGuests: 0 })])[0] === "1 room", "a room with no guest count does not say Sleeps up to 0");

console.log("\nthe caution fee is a FIELD, not prose");
// Four rooms say "20k for refundable caution fee" in their description AND
// carry settings.cautionFee: 20000 with cautionFeeRefundable: true. The
// operator entered it properly and the website read neither, so a traveller
// met the figure only as an untranslated "20k" inside a sentence, beside a
// price shown in pounds. That is why the answer was never a regex over
// everybody's writing.
const stay = toRoom("r9", {
  name: "Lighthouse Cabin",
  basePrice: { amount: 84, currency: "GBP" },
  settings: { cautionFee: 20000, cautionFeeRefundable: true, checkInTime: "14:00", checkOutTime: "12:00", minStay: 2 },
});
ok(stay.cautionFee === 20000, "the deposit is read as a number");
ok(stay.cautionRefundable === true, "and whether it comes back");
ok(stay.checkIn === "14:00" && stay.checkOut === "12:00", "check in and out are read");
ok(stay.minStay === 2, "and the minimum stay");

const none = toRoom("r10", { settings: { cautionFee: 0, minStay: 0 } });
ok(none.cautionFee === null, "a zero deposit is no deposit, not a line saying zero");
ok(none.minStay === null, "and a zero minimum is none");
ok(toRoom("r11", {}).cautionFee === null, "a room with no settings has no terms rather than undefined ones");
ok(toRoom("r12", { settings: { cautionFee: "20000" } }).cautionFee === null,
  "a deposit that is not a number is absent, because a string reaching the money formatter is how NaN gets onto a price");

ok(/room\.cautionFee/.test(GAL), "the room screen shows the deposit");
ok(/money\(room\.cautionFee, room\.priceCurrency\)/.test(GAL),
  "through the same converter as the price, so it is in the viewer's money and never a bare 20000");
ok(/refundable deposit/.test(GAL), "and says whether it comes back");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
