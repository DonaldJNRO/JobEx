// What a bookingRequest turns into, and the four fields rule 5 demands.
//
// Two things here would hurt a real traveller and neither would look wrong in
// a screenshot: a date read as UTC puts a booking on the day before anywhere
// west of Greenwich, so somebody turns up on the wrong day; and a code that
// silently falls back to something else is a code that fails at the door.
//
// Run: node --experimental-strip-types src/lib/booking-shape.test.mjs

import { normaliseBookingRequest, formatBookingDate } from './booking-shape.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// A Firestore Timestamp, as the SDK hands it over.
const ts = (iso) => ({ toDate: () => new Date(iso), seconds: Date.parse(iso) / 1000 })

// ── the four fields ──────────────────────────────────────────────────────
const paid = normaliseBookingRequest('br1', {
  businessName: 'Arrows Den',
  publicCode: 'SAB-R-000212',
  status: 'confirmed_paid',
  adId: 'ARHiIBWZVpKyhuzO8dqk',
  role: 'ExperienceProviders',
  bookingDetails: {
    date: '2026-09-20',
    package: 'Day pass',
    totalPrice: 7000,
    currency: 'ngn',
  },
  requestedAt: ts('2026-09-01T10:00:00Z'),
})

is(paid.name, 'Arrows Den', 'name is the business')
is(paid.code, 'SAB-R-000212', 'code is the publicCode, verbatim')
is(paid.packageName, 'Day pass', 'package is what was booked')
is(paid.currency, 'NGN', 'currency is upper-cased for the symbol lookup')
is(paid.totalPrice, 7000, 'total price comes off bookingDetails')
is(paid.listingId, 'ARHiIBWZVpKyhuzO8dqk', 'the listing is carried so we can link back')

// ── the date, which is the one that bites ────────────────────────────────
// A bare ISO date is UTC midnight. Rendered in Lagos (UTC+1) that is still the
// 20th; rendered anywhere west of Greenwich it becomes the 19th. Sabię's
// travellers are in Nigeria and its company is in London, so this has to hold
// on both sides of the meridian. The assertion is on the DAY we parsed, which
// is what the page then formats.
is(paid.date?.toISOString().slice(0, 10), '2026-09-20', 'a bare ISO date keeps its day')
is(formatBookingDate(paid.date).includes('2026'), true, 'the formatted date carries the year')
is(formatBookingDate(null), '', 'no date formats to nothing, never to "Invalid Date"')

// experienceDateOf in functions/publicCode.js tries date, then checkIn, then
// the first room's checkIn, in that order. The payout date is derived from the
// same field, so a disagreement here is a disagreement about money.
is(
  normaliseBookingRequest('br2', { bookingDetails: { checkIn: '2026-12-01' } }).date?.toISOString().slice(0, 10),
  '2026-12-01',
  'checkIn is used when there is no date',
)
is(
  normaliseBookingRequest('br3', { bookingDetails: { rooms: [{ checkIn: '2027-01-15' }] } }).date?.toISOString().slice(0, 10),
  '2027-01-15',
  "the first room's checkIn is the last resort",
)
is(
  normaliseBookingRequest('br4', { bookingDetails: { date: '2026-05-05', checkIn: '2026-06-06' } }).date?.toISOString().slice(0, 10),
  '2026-05-05',
  'date wins over checkIn, matching the Cloud Function',
)
is(normaliseBookingRequest('br5', { bookingDetails: {} }).date, null, 'no usable date is null, not today')
is(normaliseBookingRequest('br6', { bookingDetails: { date: 'soon' } }).date, null, 'an unparseable date is null, not Invalid Date')

// ── what it refuses to invent ────────────────────────────────────────────
const unpaid = normaliseBookingRequest('br7', {
  businessName: 'Central Park',
  status: 'pending',
  bookingDetails: { date: '2026-10-02' },
})
is(unpaid.code, null, 'an unpaid booking has no code, and we do not invent one')
is(unpaid.packageName, null, 'no package is null, never the business name repeated back')
is(unpaid.name, 'Central Park', 'the name still resolves')
is(normaliseBookingRequest('br8', {}).name, 'Booking', 'a nameless request still renders something')

// ── package precedence, matching the app's own normaliser ────────────────
is(
  normaliseBookingRequest('br9', { bookingDetails: { rooms: [{ name: 'Deluxe suite' }], services: [{ name: 'Spa' }], package: 'Bundle' } }).packageName,
  'Deluxe suite',
  'a room wins',
)
is(
  normaliseBookingRequest('br10', { bookingDetails: { services: [{ name: 'Spa' }], package: 'Bundle' } }).packageName,
  'Spa',
  'then a service',
)
is(
  normaliseBookingRequest('br11', { bookingDetails: { package: 'Bundle' } }).packageName,
  'Bundle',
  'then a named package',
)

// ── rule 5, asserted against the component that renders it ───────────────
const fields = (await import('node:fs')).readFileSync(
  new URL('../components/BookingFields.tsx', import.meta.url), 'utf8',
)
const order = [...fields.matchAll(/label: "(Name|Code|Package|Date)"/g)].map((m) => m[1])
is(order.join(' '), 'Name Code Package Date', 'the four fields render in the one order')
is(order.length, 4, 'four fields, no fifth between them')

console.log(fails ? `\n${fails} FAILED` : '\nall passed')
process.exit(fails ? 1 : 0)
