// WHAT HAPPENS IF YOU CANCEL, SAID BEFORE YOU PAY.
//
// Sabię has a cancellation ladder and the website never mentioned it. A
// traveller handed over money with no idea whether any of it came back, and
// the operator had no agreed terms to point at when somebody asked.
//
// THE NUMBERS ARE NOT THIS FILE'S TO CHOOSE. They mirror
// functions/cancellationPolicy.js, which is the authority the refund
// actually runs on:
//
//   FULL_REFUND_HOURS = 48   more than 48 hours before: everything back
//   HALF_REFUND_HOURS = 24   inside 48: half back
//                            inside 24: the operator keeps it
//
// A copy that drifts from the server is worse than no copy, so a test
// PARSES those constants out of the functions file and fails if this
// disagrees, the same arrangement the traveller fee already uses.
//
// NOT per-listing. Zero of the 63 live listings carry cancellation terms of
// their own, and the platform floor is true for every one of them. An
// operator may only ever be MORE generous than the floor, so quoting the
// floor can never overstate what a traveller gets back.

export const FULL_REFUND_HOURS = 48;
export const HALF_REFUND_HOURS = 24;

export interface Rung {
  /** The headline, as a traveller reads it. */
  when: string;
  /** What comes back. */
  outcome: string;
  percent: 100 | 50 | 0;
}

/** The ladder, most generous first, which is the order somebody reads it in. */
export const LADDER: Rung[] = [
  {
    when: `More than ${FULL_REFUND_HOURS} hours before`,
    outcome: "Everything comes back",
    percent: 100,
  },
  {
    when: `Inside ${FULL_REFUND_HOURS} hours`,
    outcome: "Half comes back",
    percent: 50,
  },
  {
    when: `Inside ${HALF_REFUND_HOURS} hours`,
    outcome: "The operator keeps it",
    percent: 0,
  },
];

/**
 * The one line worth saying on a checkout, where there is no room for three.
 *
 * Leads with the generous end because that is the true and useful part: a
 * booking made weeks out is fully refundable, and that is what somebody
 * deciding whether to pay needs to know.
 */
export function oneLine(): string {
  // ONE LITERAL, NOT TWO JOINED WITH `+`.
  //
  // This was two template literals concatenated across a line break, and the
  // PRODUCTION BUILD dropped the text between the interpolation and the
  // closing backtick. Live on sabieapp.com it read:
  //
  //   "Free to cancel up to 48Inside that, half comes back."
  //
  // The source was right the whole time. Running oneLine() under tsx returns
  // the correct sentence, and cancellation.test.mjs asserts it and passes.
  // Only the built bundle was wrong, which is why a source test could never
  // have caught it: see scripts/built-copy-check.mjs, which reads the chunks
  // `next build` actually emits.
  //
  // It was on the checkout, under the total, telling somebody about to pay
  // £1,050 what happens if they cancel.
  return `Free to cancel up to ${FULL_REFUND_HOURS} hours before. Inside that, half comes back. Inside ${HALF_REFUND_HOURS} hours, the operator keeps it.`;
}

/**
 * If the operator cancels, everything comes back, whenever it happens.
 * Kept as its own sentence because it is the half travellers never ask
 * about and the half that makes the rest fair.
 */
export const OPERATOR_CANCELS = "If the operator cancels, you get everything back.";
