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
const ok = { offer: 'Massage', date: '2026-10-02', guests: 2, name: 'Chioma', contact: 'c@example.com' }
is(validateBookingForm(ok), null, 'a complete request passes')
is(validateBookingForm({ ...ok, name: '  ' }) !== null, true, 'no name is refused')
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
is(conv.display, '£3', 'converted large, in the guest’s money')
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

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
