// The bookingRequests contract, from the web.
//
// This is the test that matters most on this ticket. A wrong key name here
// does not error and does not look wrong: the write succeeds, the guest is
// told "Request sent, they have 12 hours", and the operator's Studio inbox
// stays empty forever. Nobody finds out until somebody does not turn up.
//
// The keys asserted below are the ones Studio and convertRequestToBooking
// actually read, quoted from sabie-v53-main/utils/bookingRequestPayload.js.
//
// Run: node --experimental-strip-types src/lib/booking-request.test.mjs

import { buildBookingRequestPayload, validateBookingForm } from './booking-request.ts'
import { buildDisplayPrice, guestCurrency, formatPriceWithCurrency } from './display-price.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// ── the keys Studio filters and sorts on ────────────────────────────────
const p = buildBookingRequestPayload({
  userId: 'anon-uid-1',
  userName: 'Chioma',
  userEmail: 'chioma@example.com',
  itemId: 'ad123',
  businessOwnerId: 'owner-9',
  businessName: 'Elroise Wellness Center',
  businessImageUrl: 'https://example.com/a.jpg',
  currency: 'ngn',
  role: 'ExperienceProviders',
  bookingDetails: { package: 'Full body massage', date: '2026-10-02', guests: 2, totalPrice: 16000 },
})

is(p.status, 'pending', "status is 'pending', which is what Studio's inbox filters on")
is(p.businessOwnerId, 'owner-9', 'businessOwnerId, the other half of that filter')
is(p.requestedAt, null, 'requestedAt is null here and serverTimestamp() at write')
is(p.userId, 'anon-uid-1', 'userId, read by convertRequestToBooking')

// THE SLOT, LIFTED OUT OF bookingDetails. onBookingRequestCreated counts a
// slot from the top-level pair first, and until 22 Oct 2026 this copy wrote
// neither: every website booking was riding the nested fallback, and anything
// reading the obvious name would have missed all of them without a word.
is(p.bookingDate, '2026-10-02', 'bookingDate is lifted to the top level, as the app does')
is(p.bookingTime, null, 'bookingTime is null, not undefined, when no time was chosen')

const timed = buildBookingRequestPayload({
  bookingDetails: { date: '2026-10-02', time: '11:00' },
})
is(timed.bookingTime, '11:00', 'and carries the time up when there is one')
is(p.itemId, 'ad123', 'itemId, same')
is(p.adId, 'ad123', 'adId falls back to itemId so both readers agree')
is(p.bookingDetails.date, '2026-10-02', 'bookingDetails.date')
is(p.bookingDetails.guests, 2, 'bookingDetails.guests')
is(p.bookingDetails.package, 'Full body massage', 'the offer, as Studio renders it')

// The naira-labelled-as-pounds bug, guarded in the original and here.
is(p.currency, 'NGN', 'currency is upper-cased at the top level')
is(p.bookingDetails.currency, 'NGN', 'and mirrored into bookingDetails')

// requestedBy mirrors the flat fields so a query on either shape finds it.
is(p.requestedBy.userId, 'anon-uid-1', 'requestedBy.userId mirrors userId')
is(p.requestedBy.userEmail, 'chioma@example.com', 'requestedBy.userEmail mirrors userEmail')

// An empty build must still be shaped right rather than throw.
const empty = buildBookingRequestPayload()
is(empty.status, 'pending', 'an empty build is still a pending request')
is(empty.userName, 'Traveler', 'with the same default name the app uses')
is(empty.currency, null, 'and no invented currency')

// ── what we refuse to send ──────────────────────────────────────────────
const ok = { offer: 'Massage', date: '2026-10-02', time: '2:00 PM', guests: 2, name: 'Chioma', contact: 'c@example.com' }
is(validateBookingForm(ok), null, 'a complete request passes')
is(validateBookingForm({ ...ok, name: '  ' }) !== null, true, 'no name is refused')
is(validateBookingForm({ ...ok, time: '' }) !== null, true, 'no time is refused')
// A browser on yesterday's bundle posts without the field at all. That must
// be a sentence, not a crash: a throwing validator takes the sheet down.
is(typeof validateBookingForm({ ...ok, time: undefined }), 'string', 'a missing time is a message, not a crash')
is(validateBookingForm({ ...ok, contact: '' }) !== null, true, 'no way to reply is refused')
is(validateBookingForm({ ...ok, contact: '+234 803 123 4567' }), null, 'a phone number is a way to reply')
is(validateBookingForm({ ...ok, contact: '0803' }) !== null, true, 'but four digits is not')
is(validateBookingForm({ ...ok, contact: 'chioma@' }) !== null, true, 'nor half an email')
is(validateBookingForm({ ...ok, guests: 0 }) !== null, true, 'nor a party of nobody')
is(validateBookingForm({ ...ok, date: '' }) !== null, true, 'nor no date')

// ── the price never lies ────────────────────────────────────────────────
const noRates = buildDisplayPrice({ amount: 8000, nativeCurrency: 'NGN', selectedCurrency: 'GBP', ratesReady: false })
is(noRates.display, '₦8,000', 'with no rates the operator’s own price stands')
is(noRates.isConverted, false, 'and nothing claims to be converted')

const same = buildDisplayPrice({ amount: 8000, nativeCurrency: 'NGN', selectedCurrency: 'NGN', ratesReady: true })
is(same.original, '', 'a Nigerian guest is not shown naira twice')

const conv = buildDisplayPrice({
  amount: 8000, nativeCurrency: 'NGN', selectedCurrency: 'GBP',
  exchangeRates: { NGN: 2000, GBP: 0.8 }, ratesReady: true,
})
// £3.20, NOT "£3". This pinned a rounding that threw away 20p on a £3.20
// price, the same rounding that printed a 55p service fee as "£1" on a line
// labelled 5 percent. listing-price.ts fixed this for listings when a 300
// naira gate fee displayed as "from £0"; display-price.ts was never brought
// in line, and this assertion is why.
is(conv.display, '£3.20', 'converted, to the penny, in the guest’s money')
is(conv.original, '≈ ₦8,000 NGN', 'and the operator’s price underneath, marked approximate')

const unknown = buildDisplayPrice({
  amount: 8000, nativeCurrency: 'NGN', selectedCurrency: 'XXX',
  exchangeRates: { NGN: 2000 }, ratesReady: true,
})
is(unknown.display, '₦8,000', 'an unknown currency falls back rather than guessing')

is(formatPriceWithCurrency(8000, 'NGN'), '₦8,000', 'naira gets its symbol')
is(formatPriceWithCurrency(null, 'NGN'), '', 'no amount is no price, not ₦0')

// The app reads the device REGION, not its language, because a UK user with
// Language=English was being shown dollars. Same rule here.
is(guestCurrency('en-GB'), 'GBP', 'en-GB is pounds')
is(guestCurrency('en-NG'), 'NGN', 'en-NG is naira')
is(guestCurrency('en'), '', 'a language with no region buys nothing')
is(guestCurrency(''), '', 'and neither does nothing at all')


// ── PARITY WITH THE APP'S CURRENCY CHAIN ──────────────────────────────────
//
// This file calls itself a verbatim copy of
// sabie-v53-main/utils/bookingRequestPayload.js. Its currency fallback had
// drifted a leg short, dropping bookingDetails.rooms[0].currency, while
// keeping the comment about the naira-labelled-as-pounds bug that leg exists
// to prevent. Nothing noticed, because nothing read the other side.
import { readFileSync } from "node:fs";
import { readSibling, skipNote } from "./sibling.mjs";

const APP_SRC = readSibling("sabie-v53-main", "utils", "bookingRequestPayload.js");
const appSrc = APP_SRC;

if (!appSrc) {
  console.log("\n  skip  the app repo is not checked out beside this one");
} else {
  console.log("\nthe currency chain matches the app, leg for leg");
  const squash = (t) => t.replace(/\s+/g, " ");
  const webSrc = readFileSync(new URL("./booking-request.ts", import.meta.url), "utf8");
  const appChain = squash(appSrc).match(/const resolvedCurrency = \([^;]+;/)?.[0] || "";
  const webChain = squash(webSrc).match(/const resolvedCurrency = \([^;]+;/)?.[0] || "";
  is(appChain.length > 0, true, "the app still resolves a currency this way");
  for (const leg of ["currency", "bookingDetails?.currency", "bookingDetails?.rooms?.[0]?.currency"]) {
    is(appChain.includes(leg) ? webChain.includes(leg) : true, true, `falls back to ${leg}, as the app does`);
  }

  // ── THE SAME TOP-LEVEL KEYS ────────────────────────────────────────────
  //
  // The currency check above caught one leg of one field. What it could not
  // see was a whole field missing: this copy wrote no bookingDate and no
  // bookingTime for months, and the only reason nothing broke is that
  // onBookingRequestCreated reads a five-rung ladder that happens to find
  // the date nested under bookingDetails. A reader of the obvious name would
  // have missed every booking made on the website, silently.
  //
  // So compare the SHAPE, not one field. The app's payload is a whitelist by
  // its own description: anything not named in it is dropped without a word.
  // A key it names and this one does not is the same bug again.
  console.log("\nand the same top-level keys the app writes");
  const topKeys = (src) => {
    const body = src.slice(src.lastIndexOf("return {"));
    const out = new Set();
    for (const line of body.split("\n")) {
      const m = line.match(/^ {4}([A-Za-z_$][\w$]*):/);
      if (m) out.add(m[1]);
    }
    return out;
  };
  const appKeys = topKeys(appSrc);
  const webKeys = topKeys(webSrc);
  is(appKeys.size > 10, true, `the app's payload still parses (${appKeys.size} keys)`);
  const missing = [...appKeys].filter((k) => !webKeys.has(k));
  is(missing.join(",") || "none", "none",
    "every top-level key the app writes, this copy writes too");
}

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
