// Is the website armed to take a card?
//
// WHY THIS EXISTS. Whether payment is on comes down to one Vercel
// environment variable, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, which Next
// inlines at build time into a lazily loaded client chunk. That chunk is not
// referenced in the page HTML, so it cannot be read from outside, and an
// expired CLI token meant the dashboard could not be read either. The honest
// answer to "is it on" was "I cannot tell", which is the wrong answer to a
// question about money.
//
// NEVER RETURNS THE KEY. Booleans and a mode word only. A publishable key is
// not a secret, but this endpoint is public and has no business handing out
// configuration just because it can.
//
// The mode matters as much as the presence: the Cloud Functions run on
// STRIPE_MODE=live, so a pk_test_ key here would fail against a live secret.
// "mismatch" is the state worth catching, and it is the one a human reading
// a dashboard would most easily miss.

export const dynamic = "force-dynamic";

export function GET() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const armed = key.startsWith("pk_");
  const mode = key.startsWith("pk_live_") ? "live"
    : key.startsWith("pk_test_") ? "test"
    : "none";

  return Response.json({
    armed,
    mode,
    // The functions are deployed on the live secret. Anything other than
    // "live" here means a card would be refused.
    expects: "live",
    ok: armed && mode === "live",
    checkedAt: new Date().toISOString(),
  });
}
