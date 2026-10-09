// The hour is the booking, and the form never asked for it.
//
// onBookingRequestCreated counts an allocation per listing per day AND TIME:
//
//   const slotTime = data.bookingTime || data.bookingDetails?.time || ...
//
// The web form collected a date and nothing else, so every web request
// arrived with no time, could not be placed against a slot, and left the
// operator to agree an hour by message. For a nail studio or a spa that is
// the whole booking.
//
// Run: npx tsx src/lib/booking-time.test.mjs

import { slotsFor } from "./shop-window.ts";
import { validateBookingForm } from "./booking-request.ts";

let fails = 0;
const is = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

// Teedeluxelash's real slots, on the hour from 10.
const LASH = {
  services: [
    { name: "Classic set", timeSlots: ["10:00 AM", "11:00 AM", "12:00 PM"] },
    { name: "Refill", timeSlots: ["2:00 PM", "3:00 PM"] },
  ],
};

is(slotsFor(LASH, "Classic set"), ["10:00 AM", "11:00 AM", "12:00 PM"],
  "the chosen service's own hours, not the listing's");
is(slotsFor(LASH, "Refill"), ["2:00 PM", "3:00 PM"],
  "and they differ per service, which is why this is not a listing-level list");

// No match: show everything the operator offers rather than nothing. A
// request is a question either way, and real hours beat an empty box.
is(slotsFor(LASH, "Something else"), ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM"],
  "an unmatched offer falls back to every hour the listing has");

// 32 of 49 live listings have set none. Those must not get an invented grid.
is(slotsFor({ services: [{ name: "A", price: 100 }] }, "A"), [],
  "a listing with no slots returns none, and the form asks in plain words");
is(slotsFor({}, "A"), [], "and so does a listing with no services at all");

// Shapes seen in the wild: plain strings, and objects carrying `time`.
is(slotsFor({ services: [{ name: "A", timeSlots: [{ time: "9:00 AM" }, "10:00 AM"] }] }, "A"),
  ["9:00 AM", "10:00 AM"], "both the string and the object shape are read");

// Same hour on two services is one choice, not two identical rows.
is(slotsFor({ services: [{ name: "A", timeSlots: ["10:00 AM"] }, { name: "B", timeSlots: ["10:00 AM"] }] }, "C"),
  ["10:00 AM"], "the fallback union does not repeat an hour");

is(slotsFor({ services: [{ name: "A", timeSlots: ["", "  ", null, 42] }] }, "A"), [],
  "rubbish in the slot list is dropped, not rendered");

// THE FORM REFUSES A REQUEST WITH NO TIME, which is the point of all of it.
const ok = { offer: "Classic set", date: "2026-10-20", time: "10:00 AM", guests: 1, name: "Ada", contact: "a@b.co" };
is(validateBookingForm(ok), null, "a request with a time passes");
is(validateBookingForm({ ...ok, time: "" }), "Pick a time.", "one without is refused, in those words");
is(typeof validateBookingForm({ ...ok, time: undefined }), "string",
  "and a stale browser that omits the field gets a sentence, not a crash");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
