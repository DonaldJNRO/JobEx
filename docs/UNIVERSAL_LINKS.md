# Universal links: why a sabieapp.com link does not open the app

Written 2026-09-18, from reading the three places that have to agree. None of
them currently do, and the fix is not one switch.

## First, the thing people get wrong

**Safari has never opened an app from a URL typed into the address bar.**
Apple turned that off deliberately, years ago, to stop sites hijacking
navigation. So the Airbnb behaviour of "I searched www.airbnb.com and it opened
the app" is one of two different mechanisms depending on what actually happened:

- **Tapped a link** (a Google result, a message, another app): that is a
  universal link, and it is what this document is about.
- **Typed the address**: that is Apple's **Smart App Banner**, a native strip at
  the top of the Safari page that says OPEN when the app is installed and VIEW
  when it is not.

We ship the Smart App Banner as of the commit that added this file. It is one
meta tag in `src/app/layout.tsx` and needs no new build. Universal links are the
rest of this document, and they do need one.

## The three-way mismatch

**1. The app claims the wrong domain.**
`sabie-v53-main/app.config.js` declares:

    associatedDomains: ['applinks:link.sabieapp.com', 'webcredentials:sabieapp.com']

It claims `link.sabieapp.com`, a subdomain. It does not claim `sabieapp.com` or
`www.sabieapp.com`, which is where the website actually is. iOS will therefore
never hand a www.sabieapp.com link to the app, whatever the website serves.

`App.js` agrees with the config and disagrees with reality: its linking
`prefixes` are `sabie://` and `https://link.sabieapp.com`.

Whether `link.sabieapp.com` resolves at all could not be checked from the build
container, which is blocked from reaching it by egress policy. Worth confirming
before anything else: if it was never set up, this has never worked at all.

**2. The website serves no association file.**
iOS fetches `https://<domain>/.well-known/apple-app-site-association` to confirm
a site agrees to be opened by an app. There is no `public/.well-known/` here. It
must be served over HTTPS, as `application/json`, with no redirect and no auth,
from BOTH the apex and the www host.

The values it needs, confirmed in `sabie-v53-main/eas.json`:

    appleTeamId   9RJHZ729SB
    bundleId      com.sabie.app        (production; dev and preview differ)
    appID         9RJHZ729SB.com.sabie.app

**3. The app has no screen for the website's listing URL.**
The website's listing address is `/listing/:slug`. The app's linking config maps
`business/:businessId`, `stay/:itemId`, `event/:eventId` and a set of short
forms `/v/:id`, `/p/:id`, `/b/:id`. Nothing matches `/listing/:slug`.

This matters more than it looks. If 1 and 2 are fixed and 3 is not, a tapped
listing link opens the app and lands on the home tab, having thrown away the
listing the person was trying to look at. **That is worse than the website**,
which would have shown them the place. Do not ship 1 and 2 without 3.

## What it costs

`associatedDomains` and the linking config are **native configuration**. They
are baked in at build time and cannot be changed by an OTA push. So this needs a
new App Store build, which is the real price, and it is why the Smart App Banner
went in first: it gets most of the behaviour today for no build at all.

Order, when the appetite is there:

1. Confirm what `link.sabieapp.com` is, if anything.
2. Serve the association file from sabieapp.com and www.sabieapp.com.
3. Add `applinks:sabieapp.com` and `applinks:www.sabieapp.com` to
   `associatedDomains`, keeping the existing entry so old links still work.
4. Add `listing/:slug` to the linking config, pointing at whichever screen shows
   a business, and make that screen able to resolve a slug rather than an id.
5. Build, submit, and test with a real tapped link. `link.sabieapp.com` links
   must keep working throughout.

## Android

Not started. The equivalent is `/.well-known/assetlinks.json` plus
`intentFilters` in `app.config.js`, and it needs the SHA-256 fingerprint of the
release signing certificate, which is held by EAS and is not in any repo. There
is no Android build shipping yet, so this is not blocking anything.
