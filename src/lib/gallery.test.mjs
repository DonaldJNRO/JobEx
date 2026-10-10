// The hero gallery works on a phone.
//
// The arrows are hidden below sm, to keep a chevron off the business name.
// That left the dots as the only way through seven photos on the surface
// where almost everyone is, and a gallery you cannot swipe reads as broken.

import { readFileSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };
const src = readFileSync(new URL("../app/listing/[id]/ListingClient.tsx", import.meta.url), "utf8");
const live = src.split("\n").filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("{/*") && !l.trimStart().startsWith("*")).join("\n");

ck(/onTouchStart=\{onTouchStart\}/.test(live) && /onTouchEnd=\{onTouchEnd\}/.test(live),
  "the hero listens for a swipe");
ck(/Math\.abs\(dx\) < 40/.test(live),
  "with a threshold, so a shaky tap does not change the photo");
ck(/go\(dx < 0 \? 1 : -1\)/.test(live),
  "and swiping left goes forward, which is the direction every gallery uses");
ck(/if \(images\.length < 2\) return;/.test(live),
  "a single photo cannot be swiped off the end");
ck((live.match(/const go = /g) || []).length === 1 && /onClick=\{\(\) => go\(-1\)\}/.test(live),
  "the arrows and the swipe share one mover, so they cannot disagree");

// ── the heart and share are gone, and so is everything behind them ──────
ck(!/<Heart\b/.test(live), "no heart");
ck(!/<Share2\b/.test(live), "no share button");
for (const dead of ["toggleLike", "copyLink", "savingLike", "setLiked", "bookingLink", "saveListing"]) {
  ck(!new RegExp(`\\b${dead}\\b`).test(live), `${dead} deleted, not left dangling`);
}
ck(/AMENITY_ICONS\[a\.toLowerCase\(\)\] \|\| Check/.test(live),
  "but Check stays: it is the amenity fallback icon, not share furniture");
ck(/<Link href="\/explore"/.test(live), "and the back button survives");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
