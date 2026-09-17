import type { Metadata } from "next";
import localFont from "next/font/local";
import { Parkinsans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

/**
 * Parkinsans, because the brand guideline says so.
 *
 * This slot held Fraunces, a serif, which is why every page title on the site
 * was set in a face that appears nowhere in the guideline and shares nothing
 * with the wordmark. The wordmark is a geometric sans with a bee drawn into
 * the bowl of its b; a Georgia-ish serif underneath it is two brands on one
 * page.
 *
 * DISPLAY ONLY, and Instrument Sans keeps the body. Parkinsans has a lot of
 * personality in its lowercase, which is exactly what you want at 36px on a
 * page title and exactly what tires a reader at 14px down a column of copy.
 * One face doing both jobs would mean losing one of them. That is also the
 * rule Scout already follows: a display face earns about three lines a screen
 * and nowhere else.
 *
 * LATIN-EXT IS NOT OPTIONAL. "Sabię" needs U+0119, which is not in the latin
 * subset, and a missing glyph means the name renders as a fallback box or in
 * another typeface entirely. The one rule that never moves is that Sabię is
 * spelled with the ogonek, so the subset that contains it ships.
 *
 * next/font/google, not a <link>. It downloads at BUILD time and self-hosts
 * the result, so there is still no third-party request on the critical path,
 * which was the whole objection to the Google Fonts stylesheet this site used
 * to carry.
 */
const parkinsans = Parkinsans({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display-local",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
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
    <html lang="en" className={`${instrumentSans.variable} ${parkinsans.variable}`}>
      <head>
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
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
