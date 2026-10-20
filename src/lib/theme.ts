// The theme as data, and a map of which token plays which ROLE.
//
// THE ROLES ARE THE POINT. A guard cannot assert anything useful about a hex
// ("is #2C2C2A correct?" has no answer) or about a class name (a spelling,
// which this repo has been burned by five times when a guard kept passing
// after the thing it guarded was deleted). It CAN assert that the colour
// playing the action's role is not the colour playing the body text's role.
//
// That is the property that was false this morning, and it is false in a way
// no amount of reading the CSS reveals.
//
// Pure and dependency free: the guard reads globals.css as text and parses it
// here, so nothing needs a bundler or a browser.

export type Tokens = Record<string, string>;

/** Every `--color-*: #hex` inside the @theme block. */
export function readThemeTokens(cssText: string): Tokens {
  const out: Tokens = {};
  for (const m of cssText.matchAll(/--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

/** A chip: a tinted background with text on it. `alpha` means a /N Tailwind tint. */
export interface ChipRecipe {
  name: string;
  bg: string;
  fg: string;
  alpha?: number;
  over?: string;
}

/**
 * Which token plays which role. Adding a role here is how a new colour
 * decision becomes checkable; the test asserts properties of these names and
 * never of the hexes behind them.
 */
export const ROLES = {
  action: {
    fill: "action",
    label: "action-ink",
    hover: "action-hover",
    edge: "action-edge",
  },
  text: {
    body: "ink-body",
    heading: "ink",
    muted: "ink-muted",
  },
  surface: {
    page: "surface",
    card: "card",
    sunken: "surface-sunken",
  },
  focus: { ring: "focus" },
} as const;

/** Every tinted-background-with-text pair the design claims is readable. */
export const CHIPS: ChipRecipe[] = [
  { name: "gold chip, not pressable", bg: "action-wash", fg: "secondary-ink" },
  { name: "neutral chip", bg: "ink-wash", fg: "ink" },
  { name: "open now", bg: "settled-bg", fg: "settled-ink" },
  { name: "declined", bg: "alarm-bg", fg: "alarm-ink" },
];
