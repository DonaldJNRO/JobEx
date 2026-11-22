import type { Metadata } from "next";
import ModelStudio from "@/components/ModelStudio";

/**
 * THE LIVE MODEL, LINKED FROM THREE SLIDES OF THE DECK.
 *
 * /model was a 404 while the deck was already out, which is the worst state
 * for a link to be in: an investor taps it, gets nothing, and the thing they
 * learn is about us rather than about the model.
 *
 * NO GATE. No sign up, no email capture, no analytics wall, by instruction
 * and by sense: this is opened from a QR code on a phone, and anything
 * between the tap and the numbers is a reason to put the phone away.
 *
 * NOT IN THE SITEMAP AND CARRYING noindex, the same arrangement as /sources
 * and for the same reason. src/app/sitemap.ts is an allowlist, so leaving
 * this route out of STATIC_PAGES IS the exclusion, and its comment says not
 * to add /sources back. This page is the stronger case of the two: three
 * years of cash position and operating losses should not be what a search
 * for Sabię returns, and it must never outrank a page that sells a booking.
 *
 * "Public" in the brief means no gate, which is honoured. It does not mean
 * indexed, and the two are separate decisions. Reversing this is one line in
 * the robots block below plus one row in STATIC_PAGES.
 *
 * THE CHROME COMES FROM THE LAYOUT. Navbar, Footer and AppShell are mounted
 * in src/app/layout.tsx, so this page renders content only, exactly as
 * /how-it-works does, and the header, footer and bottom nav match by
 * construction rather than by being copied.
 */

export const metadata: Metadata = {
  title: "The model",
  description:
    "Three years of the Sabię operating model, with every assumption editable and every figure marked for where it came from.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.sabieapp.com/model" },
};

export default function ModelPage() {
  return <ModelStudio />;
}
