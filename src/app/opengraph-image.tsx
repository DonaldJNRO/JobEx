// opengraph-image.tsx — the picture that shows when somebody shares the site.
//
// There was no og:image at all, so every share of sabieapp.com on WhatsApp,
// iMessage, LinkedIn or Twitter rendered as a bare text link with no picture.
// For a product whose entire proposition is places worth seeing, filmed by us,
// that was the most expensive omission on the site: the link travels, and it
// arrived looking like nothing.
//
// GENERATED, not a static file, on purpose. A PNG in /public has to be
// re-exported by hand every time the line changes. Next prerenders this once
// at build and serves it as a static asset.
//
// NO `export const runtime = "edge"` HERE, deliberately. It was on the first
// cut, and `next build` answers: "Using edge runtime on a page currently
// disables static generation for that page." The card is identical bytes for
// every visitor, so edge meant re-rendering the same PNG on every crawler hit.
// WhatsApp and iMessage give an unfurl a short budget, and a cold function
// that misses it shows the bare link this file exists to prevent.
//
// Deliberately typographic rather than a photograph. A share card is read at
// thumbnail size in a chat list, where a room or a beach becomes mush; a short
// line in the brand's own colours and type survives that.

import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "Sabię. Places worth the trip.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// From globals.css, not picked by eye. True Purple is the ground and the gold
// carries the one line that matters.
const PURPLE = "#44366d";
const PURPLE_DARK = "#352a56";
const CREAM = "#f8f7f4";
const GOLD = "#FFD369";

// REAL FONT FILES, read off disk, not `fontFamily: "sans-serif"`.
//
// The first cut of this card set fontWeight 700 and trusted the renderer's
// default family. Opening the generated PNG showed the headline rendering at
// regular weight with uneven word spacing, because there was no bold face for
// the weight to bind to and satori had silently fallen back. It built clean
// and looked wrong, which no build step would ever have reported.
//
// These are the two faces the site itself renders, from src/fonts. Satori
// cannot read woff2, so these are the TTF cuts of the same families, and both
// were checked for U+0119 before being committed: the wordmark is "Sabię" and
// a font missing the ogonek would misspell the brand on the single most
// forwarded surface it has.
const FONT_DIR = join(process.cwd(), "src/app/_og-fonts");

export default async function OpengraphImage() {
  const [display, body] = await Promise.all([
    readFile(join(FONT_DIR, "Fraunces-SemiBold.ttf")),
    readFile(join(FONT_DIR, "InstrumentSans-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)`,
          fontFamily: "Instrument Sans",
        }}
      >
        {/* The wordmark set as type, not the PNG artwork. The drawn wordmark is
            purple on light and would need a light plate behind it here, which
            is a second brand object on a card that needs one. Type cannot
            half-load either. The bee is NOT placed beside it: the wordmark
            already contains the bee, and that rule does not bend. */}
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 42,
            color: CREAM,
            letterSpacing: "-0.01em",
          }}
        >
          Sabię
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 76,
              color: CREAM,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            Places worth the trip
          </div>
          {/* Names only cities we are actually live in. Checked against the
              `cities` collection and the ads collections on 2026-09-27. */}
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 31,
              color: GOLD,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Stays, experiences and places to eat in Lagos, Abuja and Jos.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 25,
            color: "rgba(248,247,244,0.62)",
          }}
        >
          sabieapp.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: display, weight: 600, style: "normal" },
        { name: "Instrument Sans", data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
