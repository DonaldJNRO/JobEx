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
ck(/input\[type="date"\]\[data-empty="true"\]::-webkit-datetime-edit \{ opacity: 0/.test(CSS),
  "so the native placeholder is hidden and both platforms match");
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
ck((SHEET.match(/className="w-full min-w-0 h-12/g) || []).length >= 3,
  "and so can the date input, the time select and the time input");
ck(/input\[type="date"\], input\[type="time"\] \{ min-width: 0/.test(CSS),
  "with a CSS backstop, because iOS gives them an intrinsic width w-full does not beat");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
