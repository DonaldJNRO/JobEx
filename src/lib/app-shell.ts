// Which chrome each route gets.
//
// THREE SEPARATE QUESTIONS, and conflating them is what put a footer under
// the chat and scrolled the whole page instead of the thread:
//
//   the RAIL     where you can go. LinkedIn keeps its nav on Messaging and
//                so does this: losing it on /trips left no way back to the
//                feed or the basket from inside a conversation.
//   the BAR      the phone's version of the rail. It steps aside on /trips
//                because the composer is pinned to the same sixty pixels.
//   the FOOTER   a sitemap. It belongs on the pages that are a website and
//                nowhere near a list you scroll for ever.
//
// They used to be one boolean, so /trips dropping the rail also GAVE it the
// footer, and a full-height chat with a footer under it means the page
// scrolls rather than the thread — which reads as the message jumping away
// when you tap it.

/** Routes that are a website, not the app. */
export const MARKETING_PREFIXES = ["/about", "/contact", "/terms", "/privacy", "/blog", "/auth"];

export function isMarketingRoute(pathname: string): boolean {
  const p = pathname || "/";
  return MARKETING_PREFIXES.some((m) => p === m || p.startsWith(m + "/"));
}

/** The trips screen: two panes, full height, its own composer. */
export function isChatRoute(pathname: string): boolean {
  return (pathname || "") === "/trips";
}

/** The rail, on every app surface. */
export function showsShell(pathname: string): boolean {
  return !isMarketingRoute(pathname);
}

/** A listing: the page carries its own price and action at the bottom. */
export function isListingRoute(pathname: string): boolean {
  const p = pathname || "";
  return p === "/listing" || p.startsWith("/listing/");
}

/**
 * The phone bar, everywhere the rail is except where the bottom of the
 * screen is already spoken for.
 *
 * A chat has its composer there. A listing has its price and its one
 * action there, which is what Airbnb does and for the same reason: the two
 * questions a person is holding the whole way down a listing are what does
 * it cost and how do I get it, and tab bars do not answer either. Two bars
 * stacked would also push the real one up off the thumb.
 */
export function showsBottomBar(pathname: string): boolean {
  return showsShell(pathname) && !isChatRoute(pathname) && !isListingRoute(pathname);
}

/** The footer, on the website pages only. */
export function showsFooter(pathname: string): boolean {
  return isMarketingRoute(pathname);
}
