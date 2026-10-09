// A sentence must not be said twice in a row.
//
// The listing page rendered "Confirmed on the spot. Confirmed on the spot."
// because it prefixed the server's `why` with the same words the server
// already returns. The sheet did the same thing one sentence longer. Made
// twice, so it is worth a check rather than another careful read.

import { readFileSync, existsSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

// What the server actually returns, so the test cannot drift from it.
// Needs the v53 checkout beside this one, like the other cross-repo checks.
// Skipped rather than failed when it is absent, which is every CI run.
const TERMS_PATH = "/tmp/v53fix/functions/bookingTerms.js";
if (!existsSync(TERMS_PATH)) {
  console.log("SKIP  bookingTerms.js not checked out beside this repo");
  process.exit(0);
}
const TERMS = readFileSync(TERMS_PATH, "utf8");
const serverSentences = [...TERMS.matchAll(/'([A-Z][^']{10,80}\.)'/g)].map((m) => m[1]);
ck(serverSentences.includes("Confirmed on the spot."), "the server's instant sentence is known");

for (const [file, path] of [
  ["ListingClient", "/tmp/web/src/app/listing/[id]/ListingClient.tsx"],
  ["BookingRequest", "/tmp/web/src/components/BookingRequest.tsx"],
]) {
  const src = readFileSync(path, "utf8");
  const live = src.split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  // A template that hardcodes a sentence the server also returns, and then
  // interpolates that same value, says it twice.
  for (const sentence of serverSentences) {
    const doubled = new RegExp(`${sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\$\\{(bookMode\\.)?why\\}`);
    ck(!doubled.test(live), `${file} does not say "${sentence}" and then append why`);
  }
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
