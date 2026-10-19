// Which routes are the app, and which are a website.
//
// Pulled out of the component so it can be tested. The rule is easy to break
// by adding a route and easy not to notice: a marketing page that sprouts a
// bottom bar looks odd, and a chat page with one has two bars and a composer
// fighting for the same 60 pixels.

/** Routes that are a website, not the app. */
export const MARKETING_PREFIXES = ["/about", "/contact", "/terms", "/privacy", "/blog", "/auth"];

/** One trip's chat. Full height, own composer, no room for a bar under it. */
export function isChatRoute(pathname: string): boolean {
  return /^\/trips\/[^/]+$/.test(pathname || "");
}

export function isMarketingRoute(pathname: string): boolean {
  const p = pathname || "/";
  return MARKETING_PREFIXES.some((m) => p === m || p.startsWith(m + "/"));
}

/** Does this route get the rail and the bottom bar? */
export function showsShell(pathname: string): boolean {
  return !isMarketingRoute(pathname) && !isChatRoute(pathname);
}
