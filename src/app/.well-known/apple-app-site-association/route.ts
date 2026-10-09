// The file iOS fetches to believe the Sabię app owns sabieapp.com.
//
// WITHOUT IT, UNIVERSAL LINKS CANNOT WORK AT ALL. It was 404 on this domain,
// so every sabieapp.com link a traveller or an operator shared opened Safari,
// never the app, however the app was configured.
//
// Served from a route rather than public/ so the Content-Type is
// application/json. Apple requires that and a file with no extension in
// public/ is served as octet-stream, which is the classic way this ends up
// looking configured and still not working.
//
// THE APP MUST ALSO CLAIM THIS DOMAIN. app.config.js listed
// `applinks:link.sabieapp.com`, a domain being retired, so iOS was asking the
// wrong host for this file. Changed alongside, and that half needs a native
// build: associatedDomains is baked into the binary and an OTA cannot move it.

export const dynamic = "force-static";

const TEAM_ID = "9RJHZ729SB";
const BUNDLE_ID = "com.sabie.app";

export function GET() {
  return Response.json(
    {
      applinks: {
        details: [
          {
            appIDs: [`${TEAM_ID}.${BUNDLE_ID}`],
            components: [
              // THE PATH PEOPLE ACTUALLY SHARE. The app's intent filters claim
              // /b/, /v/, /p/ and so on, but the address in everybody's bar is
              // /listing/<slug>: that is what the cards link to, what the
              // sitemap lists and what an operator pastes in a bio. Claiming
              // only the short routes would have left the common link opening
              // a browser.
              { "/": "/listing/*", comment: "a business, as the website addresses it" },
              { "/": "/b/*", comment: "a business, short form" },
              { "/": "/v/*", comment: "a video" },
              { "/": "/p/*", comment: "a post" },
              { "/": "/u/*", comment: "a person" },
              { "/": "/e/*", comment: "an event" },
              { "/": "/s/*", comment: "a stay" },
              { "/": "/f/*", comment: "a film" },
              { "/": "/t/*", comment: "a trip invitation" },
            ],
          },
        ],
      },
      // Lets iOS offer the app's saved password on the website, and the
      // website's on the app. The app already declares webcredentials for
      // this domain, and the claim has to be mutual.
      webcredentials: { apps: [`${TEAM_ID}.${BUNDLE_ID}`] },
    },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}
