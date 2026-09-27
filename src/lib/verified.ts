/**
 * Did somebody from Sabię actually go to this place?
 *
 * ONE FILE DECIDES, because the listing page used to decide by hardcoding
 * "Verified listing" onto every listing it rendered. That is the difference
 * between a badge and a decoration: a badge is read from the record, and this
 * is the read.
 *
 * BOTH HALVES ARE REQUIRED, and the measurement is why. Against production on
 * 2026-09-27: all 38 public listings carry isVerifiedBusiness, but only 32
 * carry verifiedMethod 'visited'. So the flag on its own distinguishes
 * nothing, the visit is the claim the badge actually makes, and the old
 * hardcoded badge was wrong on six real listings.
 *
 * THE ALIAS IS LOAD-BEARING, not defensive padding. sabie-admin records
 * verificationMethod as a legacy spelling still present in the data, and a
 * listing carrying only the alias was genuinely visited. Dropping it would
 * silently strip the badge from real visits.
 *
 * THE COMPARISON IS CASE SENSITIVE ON PURPOSE. The mobile app's gate in
 * VerificationInfoSheet.js is exact and lowercase, and a website that is
 * friendlier than the app about who counts as verified is a website that
 * disagrees with the app in front of the same traveller.
 *
 * THIS FILE IMPORTS NOTHING, the same arrangement as categories.ts, slug.ts
 * and listing-place.ts. listings.ts pulls in Firebase, so a test could not
 * load this through it; as a leaf, plain node can.
 */

/** Only the fields the badge reads. Listing satisfies this structurally. */
export interface VerifiableListing {
  isVerifiedBusiness?: boolean;
  verifiedMethod?: string;
  verificationMethod?: string;
}

export function visitedBySabie(listing: VerifiableListing): boolean {
  if (!listing.isVerifiedBusiness) return false;
  const method = listing.verifiedMethod || listing.verificationMethod;
  return method === "visited";
}
