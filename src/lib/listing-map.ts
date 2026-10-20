// WHERE YOU'LL BE.
//
// Airbnb gives a listing a map, and it is one of the few sections on their
// page that Sabię can fill honestly today: 50 of 60 live listings carry real
// coordinates, and this website has never drawn one. MapPin is imported four
// times on the listing page purely as decoration.
//
// A PRECISE PIN, NOT AN APPROXIMATE CIRCLE. Airbnb blurs a home's location
// to a radius and says the exact address comes after booking, because a home
// is somebody's house. These are BUSINESSES: a café, a resort, a skate rink.
// Being findable is the entire point, and a vague circle would be a worse
// answer to "where is it" than no map at all.
//
// OpenStreetMap, so there is no API key to leak, no quota to exhaust and no
// new dependency. The embed is an iframe, which is why the logic that
// decides WHETHER to render one lives here, in a module a test can import,
// rather than inside the component.

export interface ListingMap {
  lat: number;
  lng: number;
  /** The iframe src. */
  embedSrc: string;
  /** Opens the place in whatever map app the person has. */
  mapsHref: string;
  label: string;
}

/** Latitude and longitude, from wherever this document happens to keep them. */
export function coordsOf(listing: Record<string, unknown>): { lat: number; lng: number } | null {
  const nested = (listing.coordinates || listing.location || listing.geo || {}) as Record<string, unknown>;
  const pick = (...keys: string[]): number | null => {
    for (const k of keys) {
      for (const src of [listing, nested]) {
        const v = (src as Record<string, unknown>)[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        // Some writers store them as strings.
        if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
      }
    }
    return null;
  };

  const lat = pick("latitude", "lat");
  const lng = pick("longitude", "lng", "lon", "long");
  if (lat === null || lng === null) return null;

  // NULL ISLAND IS NOT A PLACE. 0,0 is what an uninitialised pair looks like,
  // and it is in the Atlantic off Ghana: a map centred there is worse than
  // no map, because it looks like an answer.
  if (lat === 0 && lng === 0) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** How wide a box to draw around the pin, in degrees. */
const SPAN = 0.012;

/**
 * Everything the section needs, or null when there is nothing to draw.
 *
 * Returning null rather than an empty frame is the rule the dashboard shapes
 * already follow: an empty grey card is the bug, rendering nothing is the fix.
 */
export function mapFor(listing: Record<string, unknown>, label: string): ListingMap | null {
  const c = coordsOf(listing);
  if (!c) return null;
  const { lat, lng } = c;
  const bbox = [lng - SPAN, lat - SPAN / 2, lng + SPAN, lat + SPAN / 2].map((n) => n.toFixed(5)).join("%2C");
  return {
    lat,
    lng,
    embedSrc: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`,
    // geo: hands off to the map app somebody actually uses, and falls back
    // to OpenStreetMap in a browser that does not know the scheme.
    mapsHref: `https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lng.toFixed(5)}#map=16/${lat.toFixed(5)}/${lng.toFixed(5)}`,
    label,
  };
}
