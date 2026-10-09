// The file Android fetches to believe the Sabię app owns sabieapp.com.
//
// 404s UNTIL THE FINGERPRINT IS SET, on purpose. app.config.js declares
// `autoVerify: true` on its sabieapp.com intent filters, so Android has been
// trying to verify this domain and failing silently since the day it shipped.
//
// WHY NOT A PLACEHOLDER. Serving this file with a wrong or example
// fingerprint is WORSE than serving nothing: Android fetches it, finds no
// match, records the domain as unverified and backs off. A 404 is an honest
// "not configured yet" and costs a retry; a wrong file teaches the OS that
// the claim is false.
//
// THE FINGERPRINT IS NOT IN THIS REPO OR ON EAS. Checked 9 Oct 2026:
// androidAppCredentials is empty on the Expo project, so the app is signed by
// Google Play App Signing and the SHA-256 lives only in Play Console, under
// Release > Setup > App signing.
//
// To turn Android App Links on:
//   vercel env add SABIE_ANDROID_SHA256 production
//   (paste the SHA-256 certificate fingerprint, colons and all)
// then redeploy. Nothing else changes.

export const dynamic = "force-dynamic";

const PACKAGE = "com.sabie.app";

export function GET() {
  const sha256 = (process.env.SABIE_ANDROID_SHA256 || "").trim();
  if (!sha256) {
    return new Response("Not configured", {
      status: 404,
      headers: { "content-type": "text/plain" },
    });
  }
  return Response.json(
    [
      {
        relation: [
          "delegate_permission/common.handle_all_urls",
          // Paired with webcredentials on the iOS side: this is what lets
          // Android offer a saved sabieapp.com password inside the app.
          "delegate_permission/common.get_login_creds",
        ],
        target: {
          namespace: "android_app",
          package_name: PACKAGE,
          // More than one is legitimate and common: the upload key and the
          // Play App Signing key differ, and a debug build differs again.
          sha256_cert_fingerprints: sha256.split(",").map((s) => s.trim()).filter(Boolean),
        },
      },
    ],
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}
