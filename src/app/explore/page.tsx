// /explore is the home page, and was for a while before anybody noticed.
//
// It carried the same listings, the same category pills, the same cards and
// the same city filter; its only addition was a search box, which now lives
// on the home page. Two addresses for one screen is two places to keep right,
// and a visitor choosing between Home and Explore is choosing between a thing
// and itself.
//
// A REDIRECT RATHER THAN A DELETE. /explore is in the sitemap, in the nav
// people have bookmarked, and in every category link the home page used to
// emit (/explore?category=stays). Deleting it would 404 all of them. This
// keeps them working and tells search engines where the page went, which a
// client-side router push would not.
//
// The category carries over, so an old link lands on the feed already
// filtered rather than on a fresh one.

import { redirect, permanentRedirect } from "next/navigation";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>;
}) {
  const { category } = await searchParams;
  // 307 for a filtered link, because where it goes depends on what was asked
  // for. 308 for the bare address, which is genuinely permanent and worth
  // consolidating into "/" for search.
  if (category && category !== "all") redirect(`/?category=${encodeURIComponent(category)}`);
  permanentRedirect("/");
}
