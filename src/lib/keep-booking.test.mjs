// A BOOKING A GUEST CAN STILL FIND TOMORROW.
//
// The website signs every visitor in anonymously so they can browse and buy
// without an account. Right at the front of the funnel; wrong the moment
// money moves. The booking is keyed to an anonymous uid that lives in ONE
// browser's storage, so clearing Safari, switching to the laptop, or iOS
// evicting the data takes the booking off the traveller's side while the
// operator still expects them.
//
// Measured 21 Oct 2026: one paid booking is owned by an anonymous account
// AND carries no email on the document, so neither the traveller nor we can
// reach it. One out of seven paid bookings is a rate, not an anecdote.
//
// Run: tsx src/lib/keep-booking.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (c, l) => { if (!c) { console.error("  FAIL " + l); fails++; } else console.log("  ok   " + l); };
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const KEEP = code("src/components/KeepThisBooking.tsx");
const SHEET = code("src/components/BookingRequest.tsx");
const AUTH = code("src/contexts/AuthContext.tsx");

console.log("\nasked after the money, never before");
ok(/\{paid \?[\s\S]{0,4000}<KeepThisBooking/.test(SHEET),
  "it appears on the confirmation, not in front of the checkout");

console.log("\nand only to somebody who needs it");
ok(/!user \|\| !user\.isAnonymous/.test(KEEP), "a real account sees nothing");
ok(/\|\| done\) return null/.test(KEEP), "and it goes away once kept");

console.log("\nit LINKS the guest account rather than replacing it");
ok(/linkWithCredential\(guest/.test(AUTH), "signup links an anonymous guest");
ok(/linkWithPopup\(guest/.test(AUTH), "and so does Google");
ok(/signup\(mail\.trim\(\), password, name\.trim\(\)\)/.test(KEEP), "the prompt uses that same path");
// Replacing the uid would orphan the booking it is trying to save, which
// would be a worse bug than the one being fixed.
ok(!/signInWithEmailAndPassword/.test(KEEP), "it never signs in fresh, which would orphan the booking");

console.log("\nand a failure does not frighten anybody");
ok(/already has a Sabi\\u0119 account/.test(KEEP) || /already has a Sabi/.test(KEEP),
  "an email that already exists is explained, not treated as an error");
ok(/Your booking is safe either way/.test(KEEP), "and the booking is never implied to be at risk");

console.log("\nthe operator still gets what they need");
const BOOK = code("src/lib/book.ts");
ok(/note: \[ask\.note/.test(BOOK), "a guest's note reaches the booking");
ok(/Phone: \$\{contact\}/.test(BOOK), "and a phone number has somewhere to go");
ok(/guests: ask\.guests/.test(BOOK), "with the headcount");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
