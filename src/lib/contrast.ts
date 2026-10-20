// WCAG contrast, so a colour decision can be checked rather than argued.
//
// This exists because the site shipped with --color-primary and --color-ink
// set to the SAME HEX. Nobody caught it in review, on four separate passes,
// because two identical hexes look like two different tokens in a diff. A
// ratio does not: 1.00:1 is impossible to read as acceptable.
//
// Pure and dependency free, so a plain-node guard can import it.

/** #RGB or #RRGGBB to [r, g, b], each 0..255. */
export function parseHex(hex: string): [number, number, number] {
  const h = String(hex).trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The ratio between two opaque colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// THE ONE THAT MATTERS FOR TAILWIND. `bg-primary/10 text-primary` is the
// recipe behind fourteen chips on this site, and its failure mode is
// invisible in the markup: the class names read as correct while the text
// sits on a wash of itself. Compositing is the only way a guard can see it.
/** A colour at `alphaPercent` over an opaque background, flattened. */
export function mixOver(hex: string, alphaPercent: number, bgHex: string): string {
  const a = Math.max(0, Math.min(100, alphaPercent)) / 100;
  const fg = parseHex(hex);
  const bg = parseHex(bgHex);
  const out = fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** AA: 4.5 for body, 3 for large text and for a component boundary. */
export const AA_BODY = 4.5;
export const AA_LARGE = 3;
