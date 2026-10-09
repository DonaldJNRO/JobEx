/**
 * The operator's shop window, and the card it becomes when they share it.
 *
 * WHY THIS FILE EXISTS. The listing page is a client component, and a client
 * component cannot export generateMetadata. So every listing inherited the
 * site-wide title and description from layout.tsx: an operator pasting their
 * own link into a WhatsApp status got "Sabię · Plan the trip back home, with
 * the crew" and no image. They were being asked to market a travel app to
 * their own customers.
 *
 * A server wrapper fixes it without touching the page. This file resolves the
 * listing once for its metadata; ListingClient still fetches its own copy for
 * the interactive view, which is a second read and worth it: the alternative
 * is threading a serialised document through props and keeping two shapes in
 * agreement.
 *
 * The 31 listings in the sitemap all carried identical titles, which is one of
 * the surer ways to be ignored by a search engine. This ends that too.
 */
import type { Metadata } from "next";
import {
  resolveListing,
  getListingImage,
  getListingPrice,
  listingPlace,
  type Listing,
} from "@/lib/listings";
import { isShopWindow } from "@/lib/shop-window";
import ListingClient from "./ListingClient";
import { toListingSnapshot } from "@/lib/listing-snapshot";

export const revalidate = 3600;

const SITE = "https://www.sabieapp.com";

function describe(l: Listing): string {
  const place = listingPlace(l);
  const where = place.city ? ` in ${place.city}` : "";
  const price = getListingPrice(l);
  const own = (l.description || "").trim().replace(/\s+/g, " ");
  // The operator's own words first when they wrote any. A description they
  // typed about their spa sells it better than anything generated here.
  if (own) return own.length > 200 ? `${own.slice(0, 197).trimEnd()}…` : own;
  const name = l.businessName || l.title || "This listing";
  return price && price !== "Contact host"
    ? `${name}${where}. From ${price} on Sabię.`
    : `${name}${where}. Book on Sabię.`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  let resolved: { listing: Listing; slug: string } | null = null;
  try {
    resolved = await resolveListing(id);
  } catch {
    // A card is worth having and never worth a 500. If the lookup fails the
    // page still renders; it just previews as the site rather than the shop.
    resolved = null;
  }

  if (!resolved || !isShopWindow(resolved.slug || id)) return {};
  const listing = resolved.listing;

  const name = listing.businessName || listing.title || "Listing";
  const place = listingPlace(listing);
  const title = place.city ? `${name} · ${place.city}` : name;
  const image = getListingImage(listing);
  // The canonical slug, not whatever was typed: a card shared from a document
  // id should still point at the human address.
  const url = `${SITE}/listing/${resolved.slug || id}`;

  return {
    title,
    description: describe(listing),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: describe(listing),
      url,
      siteName: "Sabię",
      type: "website",
      // WhatsApp and Instagram will not render a card without one. This is the
      // difference between a naked URL and the operator's own photograph.
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: describe(listing),
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * ONE FEWER ROUND TRIP BEFORE ANYTHING IS DRAWN.
 *
 * generateMetadata above already resolves this listing, for the share card.
 * ListingClient then resolved it AGAIN in the browser before it could draw
 * anything, so a visitor on a Lagos connection waited for two trips to see a
 * business they had already tapped.
 *
 * The snapshot is a first paint and nothing more: the client still resolves
 * the listing itself and overwrites this the moment it answers. If the
 * resolve fails here, the prop is null and the page behaves exactly as it did
 * before.
 */
export default async function ListingPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let snapshot = null;
  try {
    const resolved = await resolveListing(id);
    snapshot = resolved ? toListingSnapshot({ ...resolved.listing, slug: resolved.slug }) : null;
  } catch {
    // A first paint is never worth a 500. The client will fetch it.
    snapshot = null;
  }
  return <ListingClient snapshot={snapshot} />;
}
