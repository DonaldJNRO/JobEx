// The class strings, as DATA.
//
// This is here rather than inside the components for one reason: a guard
// cannot import a .tsx file under plain node, so every check of a button's
// appearance would degrade into grepping source text for a spelling. This
// repo has been burned five times by exactly that. Exported as data, the
// recipes can be imported and asserted ON: that a variant declares a
// background and not only a text colour, that exactly one variant uses the
// action fill, that every size is a 44px target.
//
// Pure and dependency free. No React, no clsx.

/** Join class names, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ONE FOCUS TREATMENT, SHARED. globals.css carries a :focus-visible outline
// for everything, and these add the offset colour where a control sits on a
// surface that is not the page.
export const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

// ONE RADIUS PER MEANING, which is the whole 19-to-1 collapse.
// A button is xl, a pill is full, a card is 2xl. Three shapes, three
// meanings, no overlap. The old site used rounded-full for seven buttons and
// rounded-xl for nine, so a pill and a button were the same object.
export const RADIUS = {
  control: "rounded-xl",
  pill: "rounded-full",
  card: "rounded-2xl",
} as const;

// DISABLED IS NOT OPTIONAL. Thirteen of twenty-one buttons had no disabled
// treatment at all, so a submitting form looked identical to a ready one.
// 4.60:1, still readable, because a disabled control still has to be legible
// to the person wondering why it will not move.
const DISABLED = "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-faint disabled:border-line disabled:shadow-none";

export const BUTTON = {
  base: cx(
    "inline-flex items-center justify-center gap-2 font-semibold",
    RADIUS.control,
    "transition-colors select-none",
    FOCUS,
    DISABLED,
  ),

  // EXACTLY ONE VARIANT CARRIES THE ACTION FILL, and a test asserts it. That
  // is what keeps one gold control on screen at a time, which is the rule
  // globals.css has claimed since before it was true.
  variant: {
    primary: "bg-action text-action-ink border border-action-edge hover:bg-action-hover active:bg-action-press",
    secondary: "bg-card text-ink border border-line-strong hover:bg-surface-sunken",
    // GHOST CARRIES AN UNDERLINE, and that is not decoration. A control with
    // no fill and no border, distinguished from the sentence beside it only
    // by colour, is the twelve-pixel "Book" that started all of this. An
    // underline is the third way to be an affordance, and the only one left
    // once the fill and the border are gone. On an icon-only ghost it draws
    // nothing, which is correct: there the icon is the affordance.
    ghost: "bg-transparent text-ink border border-transparent underline decoration-line-strong underline-offset-4 hover:bg-surface-sunken hover:decoration-ink",
    danger: "bg-alarm-bg text-alarm-ink border border-alarm-line hover:bg-alarm-bg/70",
  },

  // SIZES ARE TOUCH TARGETS, not tastes. The old site had eleven size
  // recipes between py-2.5 and h-13, several of them under 40px.
  size: {
    sm: "h-9 px-3 text-small",   /* 36px: inside a row only, never a page action */
    md: "h-11 px-4 text-small",  /* 44px */
    lg: "h-13 min-h-[52px] px-5 text-body",
  },

  block: "w-full",
} as const;

export const PILL = {
  base: cx("inline-flex items-center gap-1.5 whitespace-nowrap font-semibold", RADIUS.pill),
  // A pill is a STATEMENT, not a control. None of these is the action fill:
  // a gold pill would compete with the one gold button on the page.
  tone: {
    neutral: "bg-ink-wash text-ink",
    gold: "bg-action-wash text-secondary-ink",
    settled: "bg-settled-bg text-settled-ink",
    alarm: "bg-alarm-bg text-alarm-ink",
    // CHARCOAL IS THE SELECTION. A chosen filter is not something you press,
    // it is something that is true, so it never takes the action's gold.
    selected: "bg-primary text-white",
  },
  size: { sm: "px-2.5 py-1 text-caption", md: "px-3.5 py-1.5 text-small" },
} as const;

export const CARD = {
  base: RADIUS.card,
  tone: {
    card: "bg-card border border-line",
    sunken: "bg-surface-sunken border border-line",
    outline: "bg-transparent border border-line",
  },
  pad: { none: "", sm: "p-4", md: "p-5", lg: "p-7" },
  elevated: "shadow-lg shadow-black/5",
} as const;

/**
 * The card, as a STRING, for the elements that are not worth rewriting.
 *
 * A <Card> component is right where a card is its own box. Half the cards on
 * this site are a <section>, an <li> or a wrapper that already carries
 * layout, and turning those into components means rewriting JSX trees by
 * hand for no behaviour change, which is how a migration breaks a page.
 *
 * What actually mattered was that there were SEVEN radius and shadow
 * variants and ELEVEN paddings for one idea. One definition fixes that
 * whether it arrives as a component or a class.
 */
export function cardClass(opts: { tone?: keyof typeof CARD.tone; pad?: keyof typeof CARD.pad; elevated?: boolean } = {}): string {
  return cx(
    CARD.base,
    CARD.tone[opts.tone ?? "card"],
    CARD.pad[opts.pad ?? "md"],
    opts.elevated && CARD.elevated,
  );
}

export const FIELD = {
  label: "block text-small font-semibold text-ink mb-1.5",
  input: cx(
    "w-full min-w-0 h-11 px-3 text-body text-ink",
    RADIUS.control,
    "bg-card border border-line placeholder:text-ink-faint",
    "transition-colors",
    FOCUS,
    "disabled:bg-surface-sunken disabled:text-ink-faint",
  ),
  textarea: cx(
    "w-full min-w-0 px-3 py-2.5 text-body text-ink resize-none",
    RADIUS.control,
    "bg-card border border-line placeholder:text-ink-faint",
    FOCUS,
  ),
  hint: "mt-1.5 text-caption text-ink-muted",
  error: "mt-1.5 text-caption font-semibold text-alarm-ink",
  invalid: "border-alarm-line",
} as const;

// A ROW'S ACTION MARKER, which is NOT a nested button.
//
// The whole row is already the control, and a button inside a button is
// invalid markup where the inner one stops receiving the tap. But the marker
// still has to READ as the way in: it shipped as a twelve-pixel word in the
// same colour as the price beside it, under a comment saying "A ROW HAS TO
// LOOK LIKE THE WAY IN", and that is the single thing the founder pointed at.
//
// So it wears the secondary button's clothes on a span. It never wears the
// action's gold, because seventeen services would then be seventeen gold
// buttons and the one real action at the top of the page would be lost among
// them.
/**
 * A field, as a string, for the same reason cardClass is one: most inputs
 * sit inside a label that already carries layout, and the padding varies
 * because some have an icon in the gutter.
 *
 * FOURTEEN TREATMENTS existed for one control. Radius rounded-2xl nine
 * times, rounded-xl eleven, rounded-lg four. Background bg-card ten times
 * and bg-surface fourteen. A focus ring on fourteen of twenty-four and
 * ABSENT ON TEN, which is the part that was not cosmetic: a keyboard user
 * could not see where they were in half the forms on the site.
 */
export function fieldClass(opts: { icon?: boolean; trailing?: boolean; invalid?: boolean; area?: boolean } = {}): string {
  return cx(
    "w-full min-w-0 text-ink placeholder:text-ink-faint bg-card",
    RADIUS.control,
    "border",
    opts.invalid ? "border-alarm-line" : "border-line",
    opts.area ? "px-3 py-2.5 resize-none" : "h-12",
    !opts.area && (opts.icon ? "pl-11" : "pl-3"),
    !opts.area && (opts.trailing ? "pr-12" : "pr-3"),
    "transition-colors",
    FOCUS,
  );
}

export const ROW_ACTION = cx(
  "inline-flex items-center gap-1 shrink-0",
  RADIUS.control,
  "border border-line-strong bg-card px-2.5 py-1.5 text-caption font-semibold text-ink",
  "transition-colors group-hover:bg-surface-sunken group-hover:border-ink-muted",
);

export const ROW = {
  base: "flex items-start gap-3 w-full text-left px-4 py-3 transition-colors",
  interactive: cx("hover:bg-surface-sunken", FOCUS),
  active: "bg-surface-sunken",
  // ONE SEPARATION MECHANIC. The old site used four for the same job:
  // border-b with a last: reset, border-b without one, divide-y, and space-y.
  group: "divide-y divide-line",
} as const;

// THE GUTTER FINALLY GETS A CONSUMER. --spacing-gutter has existed unused
// while the side padding it exists for was written as px-4 forty-nine times.
export const CONTAINER = {
  base: "mx-auto w-full px-gutter sm:px-6 lg:px-8",
  width: { narrow: "max-w-2xl", page: "max-w-5xl", wide: "max-w-7xl" },
} as const;
