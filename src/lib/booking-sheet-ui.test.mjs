// The booking sheet, as a guest on a phone actually sees it.
//
// From a screenshot, not from reading the code: the dropdown said
// "Lymphatic drainage massage · ₦35,000" and the total underneath said
// "£20", the Date field was an empty box beside a Time field that said
// "Pick a time", and "How many" sat at half width beside nothing.

import { readFileSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };
const live = (p) => readFileSync(p, "utf8").split("\n")
  .filter((l) => { const t = l.trimStart(); return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*"); })
  .join("\n");

const SHEET = live("src/components/BookingRequest.tsx");
const CSS = readFileSync("src/app/globals.css", "utf8");

// ── ONE CURRENCY IN ONE FORM ────────────────────────────────────────────
// Two currencies in the same sheet is how a guest decides they do not
// understand what they are paying.
ck(/const priceFor = \(n: number\)/.test(SHEET),
  "every figure in the sheet goes through one formatter");
ck(/\$\{priceFor\(o\.price\)\}/.test(SHEET),
  "the offer dropdown uses it");
ck(!/formatPriceWithCurrency\(o\.price/.test(SHEET),
  "and no longer formats the dropdown in the operator's currency while the total is in the guest's");
ck(/buildDisplayPrice\(\{[\s\S]{0,200}selectedCurrency: to/.test(SHEET),
  "which converts to the currency the guest is shown everywhere else");

// ── THE DATE FIELD LOOKS LIKE A FIELD ───────────────────────────────────
// Desktop Chrome draws dd/mm/yyyy in an empty date input; mobile Safari
// draws nothing at all, so it read as broken beside "Pick a time".
ck(/data-empty=\{date \? undefined : "true"\}/.test(SHEET),
  "an empty date input is marked as empty");
// BOTH CONTROLS, not just the date. An empty time input is blank on iOS
// too, and a filled date beside a blank rectangle reads as broken. I fixed
// the date this morning and left its neighbour.
ck(/input\[type="date"\]\[data-empty="true"\]::-webkit-datetime-edit,\s*\n?input\[type="time"\]\[data-empty="true"\]::-webkit-datetime-edit \{ opacity: 0/.test(CSS),
  "so the native placeholder is hidden and both platforms match");
ck(/Add a time/.test(SHEET), "and the time field says what it wants, as the date does");
ck(/Pick a date/.test(SHEET), "and the form draws its own hint, like the Time field does");
ck(/pointer-events-none/.test(SHEET),
  "which does not swallow the tap that opens the native picker");

// ── THE GRID ────────────────────────────────────────────────────────────
ck((SHEET.match(/className="block min-w-0"/g) || []).length === 2,
  "date and time can shrink to their grid track instead of overflowing it");
const gridStart = SHEET.indexOf('grid grid-cols-2');
const gridEnd = SHEET.indexOf("</div>", gridStart);
ck(!/How many/.test(SHEET.slice(gridStart, gridEnd)),
  "and 'How many' is out of the two-column grid, not stranded at half width beside nothing");


// ── THE TWO BOXES MUST NOT TOUCH ────────────────────────────────────────
// min-w-0 on the label was not enough: the wrapper span and the control
// itself each needed it too, or the input's intrinsic width pushes through
// and the cell grows past its grid track.
ck(/relative block w-full min-w-0/.test(SHEET),
  "the date wrapper can shrink to its track");
// THROUGH THE SHARED RECIPE NOW. This counted a literal class string, and
// fourteen spellings of one input is exactly what that recipe exists to
// end. The rule is unchanged and it is the rule that matters: these
// controls must be able to shrink below their grid track, or Safari's
// intrinsic width pushes them through it.
const RECIPE = readFileSync("src/lib/ui-recipes.ts", "utf8");
ck(/export function fieldClass/.test(RECIPE), "there is one definition of a field");
ck(/"w-full min-w-0 text-ink/.test(RECIPE), "and it can shrink to its track");
ck((SHEET.match(/fieldClass\(/g) || []).length >= 3,
  "and so can the date input, the time select and the time input");
ck(/input\[type="date"\], input\[type="time"\], select \{[\s\S]{0,900}min-width: 0;/.test(CSS),
  "with a CSS backstop, because iOS gives them an intrinsic width w-full does not beat");
ck(/input\[type="date"\], input\[type="time"\], select \{[\s\S]{0,900}box-sizing: border-box;/.test(CSS),
  "and a pinned width, so a native control cannot widen its own grid track");
// A SELECT IS SIZED BY ITS LONGEST OPTION, and the Time control IS a select
// on the 17 listings carrying their own hours. The backstop covered the
// two inputs and not the dropdown.
ck(/, select \{/.test(CSS), "including the dropdown, which is what Time is when a listing has slots");

// THE BOX INSIDE THE BOX. ::-webkit-date-and-time-value holds the date
// TEXT inside the control and carries its own width on iOS, so min-width,
// max-width and width on the INPUT were all honoured while the thing drawn
// inside it pushed the borders apart anyway. Three rounds of pinning the
// outside changed nothing; the room screen's pair looked right the whole
// time because its inputs happened to set text-align on this.
ck(/::-webkit-date-and-time-value \{[\s\S]{0,260}text-align: left;/.test(CSS),
  "the value inside the control is pinned left, not centred");
ck(/::-webkit-date-and-time-value \{[\s\S]{0,260}width: 100%;/.test(CSS),
  "and no wider than the control that holds it");
ck(/-webkit-appearance: none;/.test(CSS), "and the control does not size itself natively");

// THE DAY DECIDES THE HOURS. Which slots are open depends on the date, so
// offering the list first let somebody pick 10pm for no day at all.
ck(/disabled=\{!date\}/.test(SHEET), "the time cannot be chosen before the day");
ck(/date \? "Pick a time" : "Pick a date first"/.test(SHEET), "and says so rather than sitting there greyed");


// ── THE SHEET SAYS WHAT THE BUTTON DOES ─────────────────────────────────
// `instant` means the server would take money for this listing. willCharge
// means this site actually can, which is false until the publishable key
// is set. While they differ the sheet promised "confirmed straight away"
// under a button that only sent a request.
ck(/\{willCharge\s*\n?\s*\? "Confirmed as soon as you pay/.test(SHEET),
  "when it will charge, it says so");
ck(/holds your slot and confirms it\. You pay them at the studio\./.test(SHEET),
  "when it cannot charge yet, it does not promise a payment");
ck(!/\{instant\s*\n?\s*\? "Confirmed straight away/.test(SHEET),
  "and the old two-state copy is gone");

// ── the review step reads like a sentence ───────────────────────────────
// This is the one screen somebody checks before paying, and it was showing
// a stored value, a floating comma and a unit that was not one.
// EVERY date a person reads, not just the one I was shown. A sweep,
// because spot-fixing one and missing its sibling is the mistake I made
// six times today.
{
  // value={date} is the input's OWN value and has to be the stored form;
  // everything else here is text somebody reads.
  const rawShown = [...SHEET.matchAll(/\{date\}/g)]
    .filter((m) => SHEET.slice(Math.max(0, m.index - 6), m.index) !== "value=");
  ck(rawShown.length === 0,
    `no screen on this sheet prints the stored date value (${rawShown.length} left)`);
}
ck(/value: \[date && readableDate\(date\), time\]/.test(SHEET),
  'the date is readable, not "2026-10-20 at 8:00 PM"');
ck(/name\.trim\(\) \? `\$\{name\.trim\(\)\}/.test(SHEET),
  'the name is trimmed, or a trailing space gives "Donald Jnr , 5 people"');
// A total of "£12 skate nights" is not a unit and not a sentence: the
// offer's NAME was being appended to the figure.
ck(/isRate && stayNights === 0 && priceUnit/.test(SHEET),
  "a rate says its unit only while it is still a rate");
ck(/per \$\{m\[1\]\}/.test(SHEET),
  "and the unit comes from a recognised rate, not from whatever the offer is called");

// A HEADCOUNT BESIDE A PRICE THAT DOES NOT SAY WHAT IT COVERS.
// Measured 20 Oct 2026: 159 services carry a price and NOT ONE carries a
// unit, nor says "per person" in its name. So "5 people" over "Total 12"
// is a figure nobody can look up. Multiplying would overcharge a flat
// session fee; silence sends a per head booking up short at the door.
ck(/guests > 1 && !priceUnitShort/.test(SHEET),
  "a party with no unit on the price gets told where the headcount goes");
ck(/goes to the operator with the booking/.test(SHEET),
  "which is the one thing about it that is certain");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
