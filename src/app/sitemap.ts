import type { MetadataRoute } from "next";
import { getAllListings, isPublicListing, listingSlug } from "@/lib/listings";

const BASE_URL = "https://www.sabieapp.com";

// Rebuilt hourly. A listing published this morning should be findable this
// afternoon, and the read is thirty-odd documents, not a crawl.
export const revalidate = 3600;

// /blog is IN now, and the comment it replaces said to put it back "the day it
// has something to read". 15 Nov 2026 is that day: it carries one post, the 91
// live businesses and the 68 of them no global platform can book. One post is
// the whole design rather than a soft launch, so there is no empty second slot
// waiting to age.
//
// /sources is deliberately absent too, and for the opposite reason: it is the
// investor deck's evidence page and it carries noindex. This list is an
// allowlist, so leaving a route out of it IS the exclusion. Do not add it.
//
// /model and /why are absent for the same reason and must stay absent. Both
// are deck detail carrying noindex: /model is three years of cash position,
// and /why names four other companies. Neither is what a search for Sabie
// should return, and adding either here would fight the noindex rather than
// honour it.
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  // Second only to the home page. It is the page that converts a stranger:
  // it answers whether anybody visited and what happens to their money.
  { url: `${BASE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/blog`, changeFrequency: "monthly", priority: 0.6 },
  // The post itself, and above the index on purpose: the index is a list of
  // one, and the thing worth ranking is the count inside it.
  { url: `${BASE_URL}/blog/nowhere-to-list`, changeFrequency: "yearly", priority: 0.7 },
  { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
];

/**
 * The listings belong in here now that they have addresses worth indexing.
 *
 * Before slugs there was nothing to submit: a sitemap full of
 * /listing/1tLlMNPeeF49o30zSh8V is a sitemap of URLs no search result would
 * ever show and no person would ever click. Seven static pages was the whole
 * site as far as Google was concerned, while every business on the platform sat
 * invisible.
 *
 * A listing with no image is left out on purpose. The page would be a name over
 * an empty grey rectangle, and asking to be indexed for that earns the domain
 * nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = STATIC_PAGES.map((page) => ({ ...page, lastModified: now }));

  let listings: MetadataRoute.Sitemap = [];
  try {
    const all = await getAllListings();
    const seen = new Set<string>();
    listings = all
      // The SAME filter the grids use, not a fresh guess at one. The first
      // version of this file wrote its own status check and put
      // /listing/sabie-founder-test in the sitemap, because the founder's dev
      // listings are excluded by owner uid rather than by status and only
      // isPublicListing knows that.
      .filter(isPublicListing)
      .filter((l) => (l.imageUrls?.length ?? 0) > 0 || Boolean(l.coverImage))
      .flatMap((l) => {
        const slug = listingSlug(l);
        // Two listings can still compute the same slug until the backfill
        // writes the field. Submitting a duplicate URL is worse than omitting
        // one, so the first wins and the other waits for its real slug.
        if (!slug || slug === "listing" || seen.has(slug)) return [];
        seen.add(slug);
        return [{
          url: `${BASE_URL}/listing/${slug}`,
          lastModified: l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }];
      });
  } catch {
    // Firestore unreachable at build time. Ship the static pages rather than
    // failing the build: a smaller sitemap is a setback, no site is an outage.
  }

  return [...staticPages, ...listings];
}
