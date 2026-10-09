// A listing, flattened so it can cross from the server render to the client.
//
// WHY. page.tsx already resolves the listing once, for the share card.
// ListingClient then resolves it AGAIN in the browser before it can draw
// anything, so a visitor on a Lagos connection waits for two round trips to
// see a business they have already tapped. The page.tsx comment chose that
// deliberately: "the alternative is threading a serialised document through
// props and keeping two shapes in agreement". This is that thread, made safe.
//
// WHAT MAKES IT SAFE. A Firestore document holds Timestamps, and Next cannot
// serialise one into a client component: it throws at render. So this
// WHITELISTS plain fields rather than passing the document, and anything it
// does not recognise is dropped rather than guessed at.
//
// PURELY AN OPTIMISATION. The client still resolves the listing itself and
// overwrites this the moment it answers. If the snapshot is absent, wrong
// shaped, or missing a field, the page behaves exactly as it did before: a
// skeleton for a moment, then the real thing. Nothing here is the only copy
// of anything.

export interface ListingSnapshot {
  id: string;
  role?: string;
  businessName?: string;
  title?: string;
  description?: string;
  currency?: string;
  slug?: string;
  imageUrls?: unknown;
  images?: unknown;
  coverImage?: string;
  logoUrl?: string;
  services?: unknown;
  packages?: unknown;
  customPrice?: unknown;
  location?: unknown;
  city?: string;
  areaSlug?: string;
  policy?: unknown;
  menuPdfUrl?: string;
  isVerifiedBusiness?: boolean;
}

/** Only these, and only when they are already JSON. */
const FIELDS = [
  "id", "role", "businessName", "title", "description", "currency", "slug",
  "imageUrls", "images", "coverImage", "logoUrl", "services", "packages",
  "customPrice", "location", "city", "areaSlug", "policy", "menuPdfUrl",
  "isVerifiedBusiness",
] as const;

/** Is this value safe to hand to a client component? */
function plain(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(v)) return v.every(plain);
  if (t === "object") {
    // A Timestamp, a DocumentReference or a GeoPoint all land here and all
    // throw when Next tries to serialise them. Anything with a prototype
    // other than Object's is refused rather than inspected further.
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) return false;
    return Object.values(v as Record<string, unknown>).every(plain);
  }
  return false;
}

export function toListingSnapshot(listing: unknown): ListingSnapshot | null {
  if (!listing || typeof listing !== "object") return null;
  const src = listing as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) {
    const v = src[k];
    if (v === undefined) continue;
    // A FIELD THAT CANNOT CROSS IS LEFT BEHIND, not stringified. The client
    // fetch supplies it a moment later, and a half-converted Timestamp is a
    // worse answer than no answer.
    if (plain(v)) out[k] = v;
  }
  return typeof out.id === "string" && out.id ? (out as unknown as ListingSnapshot) : null;
}
