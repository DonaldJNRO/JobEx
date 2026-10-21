// THE CODE ON THE SCREEN IS THE CODE AT THE DOOR.
//
// The confirmation screen printed the first eight characters of the
// bookingRequest's Firestore document id, upper-cased, and called it "your
// booking reference". The operator's till and the app's My Bookings both
// read `publicCode`, minted as SAB-R-XXXXX, so a traveller arrived with
// 1U2BO0BF while the operator looked for SAB-R-DEMO1. Two strings with
// nothing to do with each other, on the one screen somebody trusts.
//
// It also broke the platform's own rule, that every booking shows the same
// four fields in the same order everywhere: name, code, package, date.
//
// Run: tsx src/lib/booking-code.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const LIB = code("src/lib/booking-code.ts");
const SHEET = code("src/components/BookingRequest.tsx");

console.log("\nno screen invents a booking reference");
ok(!/bookingRequestId\?\.slice\(0, 8\)/.test(SHEET),
  "the document id is not shown as a reference");
ok(!/bookingRequestId.{0,20}toUpperCase/.test(SHEET),
  "nor any upper-cased slice of it");

console.log("\nit reads the code the rest of the platform reads");
ok(/d\.publicCode/.test(LIB), "publicCode");
ok(/bookingDetails as Record<string, unknown> \| undefined\)\?\.publicCode/.test(LIB),
  "and bookingDetails.publicCode, which is where some bookings keep it");

console.log("\nand waits for it, because the webhook mints it after Stripe confirms");
ok(/onSnapshot\(/.test(LIB), "it watches the booking document");
ok(/watchBookingCode\(id, setCodeState\)/.test(SHEET), "the screen subscribes once paid");
ok(/status: "waiting"/.test(LIB) && /being issued/.test(SHEET),
  "says the code is coming rather than showing a blank");
ok(/status: "unavailable"/.test(LIB) && /already has your booking/.test(SHEET),
  "and if it never lands, says so instead of inventing one");

// AND IT DOES NOT PROMISE AN EMAIL TO A PHONE NUMBER. The first real web
// booking left userEmail empty because the guest typed 07838286994, and the
// screen still said we had emailed them. The only copy of that code was in
// our database.
ok(/contact\.includes\("@"\)/.test(SHEET), "the copy checks what they actually gave us");
ok(/we will send your code to/.test(SHEET), "a phone number is told something true");

// AND THE CODE IS ASKED FOR, not only watched. firestore.rules:613 refuses
// an anonymous read of bookingRequests, and the website signs every visitor
// in anonymously, so the listener is refused for exactly the person who
// needs it. A callable runs as the server.
ok(/httpsCallable/.test(LIB), "it asks a callable as well as watching");
ok(/getBookingCode/.test(LIB), "by name");
ok(/setInterval\(/.test(LIB), "and keeps asking until the webhook has written it");
ok(/REFUSED IS ORDINARY HERE/.test(readFileSync("src/lib/booking-code.ts", "utf8")),
  "a refused listener no longer reports unavailable, because the callable is still running");

console.log("\nand a dropped listener is not a reason to make something up");
ok(/\(\) => \{[\s\S]{0,220}status: "unavailable"/.test(LIB),
  "the error path reports unavailable");

console.log("\nthe four fields, in the platform's order");
for (const [label, re] of [
  ["name", /\{business\}/],
  ["code", /Booking code/],
  ["date", /readableDate\(date\)/],
]) ok(re.test(SHEET), `${label} is on the confirmation`);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
