import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_STORE_ID, APP_STRIP_KEY } from "@/lib/app-links";

/**
 * The same two faces Scout, admin and Studio render.
 *
 * The site was on Inter, pulled from a Google Fonts <link> in <head>. Two
 * problems with that, and the smaller one is that it was the wrong typeface:
 * a stylesheet link in <head> is a render-blocking round trip to a third party
 * before a single word appears, and nothing preloads the font files it then
 * asks for. next/font inlines the CSS, self-hosts the files and preloads them,
 * so there is no third-party request on the critical path at all.
 *
 * Variable woff2, copied from sabie-scout/public/fonts so all four surfaces
 * render byte-identical type. 97KB for both, once, then cached forever.
 */
const instrumentSans = localFont({
  src: "../fonts/instrument-sans.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-sans-local",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

// Page titles and money only. A display face earns its place on about three
// lines a screen and nowhere else, which is the rule Scout already follows.
//
// Parkinsans went in here on 17 Sep, because the brand guideline names it, and
// came straight back out at the founder's call. Recorded rather than quietly
// reverted: the guideline and the code disagree on the display face, and
// somebody reading the guideline later will expect to find Parkinsans.
const fraunces = localFont({
  src: "../fonts/fraunces.woff2",
  weight: "500 700",
  display: "swap",
  variable: "--font-display-local",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  // metadataBase is what lets Next resolve the generated OG image below into an
  // absolute URL. Without it the image is emitted as a relative path, which
  // every share target ignores.
  metadataBase: new URL("https://www.sabieapp.com"),
  title: "Sabię · Places worth the trip",
  // ACCRA CAME OUT, three times. The `cities` collection holds Lagos, Abuja,
  // Jos and London live, and Nouakchott as soon; there is no Accra, and the
  // 38 public listings are 20 Lagos, 7 Jos, 6 Abuja, 2 London, 1 Bamako.
  // Naming a city we cannot serve sends somebody to a search that returns
  // nothing, which is a worse first visit than never having been named.
  //
  // The description also now leads with what the site SHOWS. The home page is
  // the listings, so a description promising a planning app describes a
  // different page than the one that loads.
  description: "Stays, experiences and places to eat in Lagos, Abuja, Jos and London, from the people who run them. Sabię is where you find them and go with the crew.",
  keywords: ["Lagos travel", "Abuja travel", "Jos travel", "Nigeria travel", "diaspora travel", "group travel", "Detty December", "travel with friends"],
  // A SHARED LINK SHOWED NOTHING. There was no og:image at all, so every share
  // of sabieapp.com on WhatsApp, iMessage or LinkedIn rendered as a bare text
  // link. For a product whose proposition is places worth seeing, that was the
  // most expensive omission on the site. opengraph-image.tsx beside this file
  // generates one at build.
  openGraph: {
    title: "Sabię · Places worth the trip",
    description: "Stays, experiences and places to eat in Lagos, Abuja, Jos and London, from the people who run them.",
    siteName: "Sabię",
    type: "website",
    url: "https://www.sabieapp.com",
    locale: "en_GB",
  },
  // summary renders a small square thumbnail. summary_large_image is the wide
  // card, which is what a 1200x630 image is for.
  twitter: {
    card: "summary_large_image",
    title: "Sabię · Places worth the trip",
    description: "Stays, experiences and places to eat in Lagos, Abuja, Jos and London, from the people who run them.",
  },
  // The apex redirects to www, and without this both can be indexed as separate
  // pages with the ranking split between them.
  alternates: {
    canonical: "https://www.sabieapp.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${fraunces.variable}`}>
      <head>
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        {/* APPLE'S OWN BANNER, on the one browser that has it.
            In Safari on iOS this renders the native strip at the top of the
            page: OPEN if Sabię is installed, which hands the person straight
            to the app, and VIEW if it is not, which is the App Store. That is
            the behaviour people expect from a real app's website, and it
            costs one tag and no new build.

            It is NOT a universal link and does not replace one. Safari has
            never opened an app from a URL typed into the address bar; Apple
            turned that off deliberately. A tapped link is the case universal
            links handle, and ours are not wired up yet. See
            docs/UNIVERSAL_LINKS.md for what is missing and what it costs. */}
        <meta name="apple-itunes-app" content={`app-id=${APP_STORE_ID}`} />

        {/* NO LAYOUT SHIFT ON LOAD, and never two app banners at once.
            The strip used to start hidden and appear in an effect, which
            pushed the whole page down a beat after it drew. So it is always in
            the markup and this runs before the first paint, setting the
            attribute that globals.css hides it on.

            Two reasons to hide it. The person dismissed it, or Safari on iOS
            is already showing Apple's banner above it: two asks for the same
            thing, stacked, is the exact thing the strip replaced. The check
            excludes the browsers that only LOOK like Safari in a user agent
            string, Chrome, Firefox, Edge and the in-app browsers Instagram and
            Facebook open links in, because none of them render Apple's banner
            and in those our strip is the only ask there is.

            Blocking on purpose: it is one localStorage read and one string
            test, and the whole point is that both finish before anything is
            painted. Wrapped because localStorage throws in a private window,
            where the strip simply shows. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.documentElement;try{if(localStorage.getItem(${JSON.stringify(APP_STRIP_KEY)})){h.dataset.appstrip='off';return}}catch(e){}var u=navigator.userAgent;if(/iPhone|iPad|iPod/.test(u)&&/Safari/.test(u)&&!/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|MicroMessenger/.test(u))h.dataset.appstrip='off'})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-ink-body antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
