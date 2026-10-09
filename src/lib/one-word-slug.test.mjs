// A business whose name is one word must still have a page.
//
// resolveListing gated its whole slug branch on looksLikeSlug, which is
// /^[a-z0-9]+(?:-[a-z0-9]+)+$/ — note the `+` on the group, so it demands at
// least one hyphen. "arrows-den" passed. "naileditbyd" did not.
//
// A name with no space produces a slug with no hyphen, so those listings were
// never looked up by slug at all. They fell through to the document id
// lookups, matched nothing, and the page rendered "Listing not found" while
// generateMetadata returned {} and the share card showed the Sabię homepage.
//
// Seven live listings were unreachable: Naileditbyd, Teedeluxelash, Simmer,
// Orllycooks, Kruiseyard, Varlaine, Kapadoccia.
//
// Run: npx tsx src/lib/one-word-slug.test.mjs

import { readFileSync } from "node:fs";
import { looksLikeSlug } from "./slug.ts";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

// The shared helper is unchanged on purpose: slug.ts is a verbatim copy in
// four repos and is also what the WRITERS validate against. This pins the
// behaviour so the next reader knows the hyphen rule is deliberate there.
ck(looksLikeSlug("arrows-den") === true, "looksLikeSlug still accepts a hyphenated slug");
ck(looksLikeSlug("naileditbyd") === false, "and still rejects a single word, unchanged");

// The resolver carries its own, looser test.
const SRC = readFileSync(new URL("./listings.ts", import.meta.url), "utf8");
ck(/const slugShaped = \/\^\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*\$\/\.test\(value\)/.test(SRC),
  "the resolver uses * so one word is slug shaped");
ck(!/if \(looksLikeSlug\(value\)\)/.test(SRC),
  "and no longer gates the slug branch on the hyphen rule");

// Falling through matters: accepting one word means an all lowercase document
// id now enters the slug branch, and it must still resolve as an id.
const branch = SRC.slice(SRC.indexOf("if (slugShaped)"), SRC.indexOf("const byId"));
ck(!/return null;/.test(branch), "a slug miss falls through to the id lookups, it does not give up");
ck(/getListingById\(value\)/.test(SRC), "the id lookup is still reached");
ck(/getListingByIdPrefix/.test(SRC), "and so is the prefix lookup");

// The real names that were broken, as the regex sees them.
const RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const s of ["naileditbyd", "teedeluxelash", "simmer", "orllycooks", "kruiseyard", "varlaine", "kapadoccia"]) {
  if (!RE.test(s)) { fails++; console.log(`FAIL  ${s} should be slug shaped`); }
}
console.log("PASS  all seven previously unreachable listings are slug shaped");

// And nothing that is plainly not a slug sneaks in.
for (const s of ["", "Has Capitals", "has space", "trailing-", "-leading", "has_underscore"]) {
  if (RE.test(s)) { fails++; console.log(`FAIL  "${s}" should not be slug shaped`); }
}
console.log("PASS  rubbish is still not slug shaped");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
