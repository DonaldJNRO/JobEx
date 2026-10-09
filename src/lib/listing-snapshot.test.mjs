// A listing, flattened so it can cross from the server render to the client.
//
// page.tsx already resolves the listing for the share card. ListingClient
// then resolved it AGAIN in the browser before it could draw anything, so a
// visitor on a Lagos connection waited for two round trips to see a business
// they had already tapped.
//
// THE REASON THIS IS NOT OBVIOUS: a Firestore document holds Timestamps, and
// Next throws when one is serialised into a client component. The original
// author chose the second fetch rather than "keeping two shapes in
// agreement". So this whitelists plain fields and LEAVES BEHIND anything it
// cannot carry, rather than guessing.
//
// Run: npx tsx src/lib/listing-snapshot.test.mjs

import { toListingSnapshot } from "./listing-snapshot.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

// What a Firestore Timestamp looks like to this function: an object with a
// prototype that is not Object's.
class FakeTimestamp { constructor() { this.seconds = 1; this.nanoseconds = 0; } }

const LISTING = {
  id: "abc123",
  businessName: "Naileditbyd",
  currency: "NGN",
  services: [{ name: "Acrylic", tiers: [{ label: "Single", price: "17000" }] }],
  location: { address: "2 Bolajide Avenue", latitude: 6.55 },
  createdAt: new FakeTimestamp(),
  updatedAt: new FakeTimestamp(),
  somethingUnknown: "dropped because it is not on the list",
};

const snap = toListingSnapshot(LISTING);

is(snap.businessName, "Naileditbyd", "the name crosses");
is(snap.services[0].tiers[0].price, "17000", "and so does a nested price list");
is(snap.location.address, "2 Bolajide Avenue", "and a nested plain object");

// THE WHOLE POINT. A Timestamp here throws at render in Next.
is("createdAt" in snap, false, "A TIMESTAMP IS LEFT BEHIND, not stringified");
is("updatedAt" in snap, false, "every one of them");
is("somethingUnknown" in snap, false, "and a field not on the whitelist is dropped");

// Serialisable is the actual contract, so assert it directly.
is(typeof JSON.stringify(snap), "string", "the result survives JSON, which is what Next requires");

// A snapshot with no id cannot seed anything, and a half-seeded page is worse
// than a skeleton.
is(toListingSnapshot({ businessName: "No id" }), null, "no id means no snapshot");
is(toListingSnapshot(null), null, "and rubbish does not throw");
is(toListingSnapshot("nope"), null, "whatever shape the rubbish takes");
is(toListingSnapshot([]), null, "including an array");

// An array containing a Timestamp must be refused whole: half an image list
// is not better than none.
const withBadArray = toListingSnapshot({ id: "x", images: [{ url: "a" }, new FakeTimestamp()] });
is("images" in withBadArray, false, "an array holding one bad value is left behind entirely");

// Nulls are fine and common: Firestore writes them.
const withNulls = toListingSnapshot({ id: "x", coverImage: null, description: "hi" });
is(withNulls.coverImage, null, "a null crosses, because Firestore writes them");
is(withNulls.description, "hi", "beside the fields that matter");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
