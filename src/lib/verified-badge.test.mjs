// Does the "Visited by Sabię" badge say anything the record does not?
//
// Run:  node --experimental-strip-types src/lib/verified-badge.test.mjs
//
// WHY THIS EXISTS. The listing page rendered three trust badges as a hardcoded
// array: "Verified listing", "Instant confirmation" and "Free cancellation".
// None of the three was read from anything. Two were flatly false, and the code
// already knew it, because the shop-window branch right beside them dropped
// exactly those two on the grounds that the real model is a request the
// business has 12 hours to accept. 36 of the 38 live listings took the other
// branch, so the false pair is what almost everybody saw.
//
// The third was subtler and is what this file guards. "Verified listing" looked
// harmless because every public listing does carry isVerifiedBusiness. But the
// badge's claim is that somebody from Sabię WENT, and measured against
// production on 2026-09-27: 38 of 38 carry the flag, only 32 carry
// verifiedMethod 'visited'. So the flag alone distinguishes nothing and the
// badge was wrong on six real listings.
//
// The failure mode is silent in both directions, which is the whole argument
// for a test: too loose and we claim visits that never happened, too strict and
// a business that did get visited loses its badge, and neither shows up as an
// error anywhere.

import { visitedBySabie } from './verified.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// ── the badge is earned by a VISIT, not by the flag ───────────────────────
is(visitedBySabie({ isVerifiedBusiness: true, verifiedMethod: 'visited' }), true,
  'flag plus a visit earns the badge')

// THE SIX. This is the exact shape of the listings the old hardcoded badge got
// wrong: verified, but never visited.
is(visitedBySabie({ isVerifiedBusiness: true }), false,
  'the flag ALONE is not a visit, which is the bug the hardcoded badge had')
is(visitedBySabie({ isVerifiedBusiness: true, verifiedMethod: 'documents' }), false,
  'verified by paperwork is not a visit')
is(visitedBySabie({ isVerifiedBusiness: true, verifiedMethod: 'remote' }), false,
  'nor is any other method we have not named')

// ── and a visit with no flag is not enough either ─────────────────────────
is(visitedBySabie({ verifiedMethod: 'visited' }), false,
  'a visit on an unverified business does not earn it')
is(visitedBySabie({ isVerifiedBusiness: false, verifiedMethod: 'visited' }), false,
  'an explicitly false flag is respected, not ignored')

// ── the legacy spelling is load-bearing ───────────────────────────────────
// sabie-admin records verificationMethod as a legacy alias still in the data.
// A listing carrying only the alias WAS genuinely visited, so dropping it would
// silently strip the badge from real visits.
is(visitedBySabie({ isVerifiedBusiness: true, verificationMethod: 'visited' }), true,
  'the legacy verificationMethod spelling still counts as a visit')

// ── case sensitivity is deliberate, not an oversight ──────────────────────
// The mobile app's gate is case sensitive and exact. A website that disagrees
// with the app about who is verified is worse than one that says nothing.
is(visitedBySabie({ isVerifiedBusiness: true, verifiedMethod: 'Visited' }), false,
  'the comparison is exact, matching the mobile gate rather than being friendlier than it')

// ── nothing at all ────────────────────────────────────────────────────────
is(visitedBySabie({}), false, 'an empty listing claims nothing')

console.log()
console.log(fails === 0 ? 'ALL PASSED' : `${fails} FAILED`)
process.exit(fails > 0 ? 1 : 0)
