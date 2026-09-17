import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_STRIP_KEY } from "@/lib/app-links";

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
  title: "Sabię · Plan the trip back home, with the crew",
  description: "Sabię is the group travel app for the diaspora. Plan, vote, split and book trips together, from the UK to Lagos, Accra, and everywhere in between.",
  keywords: ["diaspora travel", "group travel", "trip planning", "Lagos travel", "Accra travel", "African diaspora", "Detty December", "travel with friends"],
  openGraph: {
    title: "Sabię · Plan the trip back home, with the crew",
    description: "The group travel app for the diaspora. UK to Lagos, Accra, and everywhere in between.",
    siteName: "Sabię",
    type: "website",
    url: "https://www.sabieapp.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${fraunces.variable}`}>
      <head>
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        {/* NO LAYOUT SHIFT ON LOAD. The app strip used to start hidden and
            appear in an effect, which pushed the whole page down a beat after
            it drew. So the strip is always in the markup, and this runs before
            the first paint to hide it for somebody who has already dismissed
            it. Blocking on purpose: it is one localStorage read, and the whole
            point is that it finishes before anything is painted. Wrapped
            because localStorage throws in a private window, in which case the
            strip simply shows. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem(${JSON.stringify(APP_STRIP_KEY)}))document.documentElement.dataset.appstrip='off'}catch(e){}`,
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
