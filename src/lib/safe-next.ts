// Where to send somebody after they sign in.
//
// The app shell sends a signed-out visitor to /auth/login?next=/trips when
// they reach for a tab that needs an account, so the detour returns them to
// what they pointed at rather than dropping them on the home page.
//
// ONLY A PATH ON THIS SITE. Taking the parameter at its word makes an OPEN
// REDIRECT: a link to sabieapp.com/auth/login?next=https://… that bounces
// somebody somewhere else while wearing our domain in the address bar, which
// is how a phishing page borrows a brand's credibility. The rule is a single
// leading slash and no second one, which rules out "//evil.com" as well as
// "https://evil.com" — and a backslash, because browsers have historically
// treated "/\evil.com" as protocol-relative too.

export function safeNext(raw: string | null | undefined): string {
  if (typeof raw !== "string" || !raw) return "/";
  if (raw[0] !== "/") return "/";
  if (raw[1] === "/" || raw[1] === "\\") return "/";
  return raw;
}
