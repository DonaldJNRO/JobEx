// What does the page say about a business, and is any of it invented?
//
// Run:  node --experimental-strip-types src/lib/operator-info.test.mjs
//
// The listing page used to show a name, a description and a price, while the
// ad documents carried far more nobody read. Measured across the 38 public
// listings on 2026-09-27: openingHours on 100%, selectedAmenities on 47%,
// menuPdfUrl on 50%, businessModel on 47%.
//
// THE FAILURE THAT MATTERS HERE IS NOT A CRASH. It is telling somebody a
// place is open when it is not, or closed when it is. Either sends a real
// person to a locked door in a city they flew to. So the rule throughout is
// that "we do not know" and "closed" are DIFFERENT facts, and the code must
// never print one as the other.
//
// The shapes below are copied from real documents, not imagined.

import {
  prettyTime, openingRows, openNow, amenityLabel, amenityList,
  serviceStyle, verificationLine,
} from './operator-info.ts';

let fails = 0;
const is = (got, want, label) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  const ok = a === b;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${a} want ${b}`}`);
};

// ── times a person reads ──────────────────────────────────────────────────
is(prettyTime('09:00'), '9am', 'morning');
is(prettyTime('11:00'), '11am', 'late morning');
is(prettyTime('12:00'), '12pm', 'noon is pm, not 0pm');
is(prettyTime('00:00'), '12am', 'midnight is 12am, not 0am');
is(prettyTime('13:30'), '1.30pm', 'afternoon with minutes, and a full stop not a dash');
is(prettyTime('22:00'), '10pm', 'evening');
is(prettyTime('23:59'), '11.59pm', 'the last minute of the day');
is(prettyTime(''), '', 'nothing in, nothing out');
is(prettyTime(null), '', 'null does not throw');
is(prettyTime('nonsense'), '', 'unparseable is empty, never a guess');
is(prettyTime('25:00'), '', 'an impossible hour is refused');
is(prettyTime('09:75'), '', 'and impossible minutes too');

// ── the week ──────────────────────────────────────────────────────────────
// Tomzi Kitchen's real shape, abbreviated.
const tomzi = {
  openingHours: {
    monday: { open: '11:00', close: '22:00', closed: false },
    tuesday: { open: '11:00', close: '22:00', closed: false },
    sunday: { open: '', close: '', closed: true },
  },
};

console.log();
console.log('the week reads in order and says only what it knows');
{
  const rows = openingRows(tomzi);
  is(rows.length, 3, 'only the days the document actually carries');
  is(rows[0], { day: 'monday', label: 'Monday', closed: false, hours: '11am to 10pm' },
    'Monday first, because object key order from Firestore is not guaranteed');
  is(rows[2], { day: 'sunday', label: 'Sunday', closed: true, hours: 'Closed' },
    'a closed day says Closed rather than an empty range');

  // THE DISTINCTION THIS FILE EXISTS FOR. A day with no times and no closed
  // flag is UNKNOWN, and printing it as "Closed" sends somebody to a locked
  // door on a day the place was open.
  const partial = { openingHours: { monday: { open: '', close: '' } } };
  is(openingRows(partial), [], 'a day with no times and no closed flag is skipped, not called Closed');

  is(openingRows({}), [], 'no hours at all is an empty list, so the page can omit the section');
  is(openingRows({ openingHours: null }), [], 'null does not throw');
  is(openingRows({ openingHours: 'weekdays' }), [], 'a string where an object belongs does not throw');
}

// ── open right now ────────────────────────────────────────────────────────
console.log();
console.log('open now is never guessed');
{
  // 2026-09-28 is a Monday. Local time, matching how the strings are stored.
  const mondayAt = (h, m = 0) => new Date(2026, 8, 28, h, m);

  is(openNow(tomzi, mondayAt(12)), true, 'midday on a Monday, open');
  is(openNow(tomzi, mondayAt(9)), false, 'before opening, closed');
  is(openNow(tomzi, mondayAt(22)), false, 'the close time itself is closed, not open');
  is(openNow(tomzi, mondayAt(21, 59)), true, 'a minute before close is still open');

  // Sunday 2026-10-04.
  is(openNow(tomzi, new Date(2026, 9, 4, 12)), false, 'a day marked closed is closed');

  // Saturday, which this document does not mention at all.
  is(openNow(tomzi, new Date(2026, 9, 3, 12)), null,
    'a day the document says nothing about is null, NOT false: unknown is not closed');
  is(openNow({}, mondayAt(12)), null, 'no hours at all is unknown');

  // PAST MIDNIGHT, which a bar genuinely does. Treating close <= open as a
  // normal range would report a place open until 2am as shut all day.
  const club = { openingHours: { monday: { open: '20:00', close: '02:00', closed: false } } };
  is(openNow(club, mondayAt(23)), true, '11pm, inside a run that crosses midnight');
  is(openNow(club, mondayAt(1)), true, '1am, still inside it');
  is(openNow(club, mondayAt(12)), false, 'midday, outside it');
}

// ── amenities ─────────────────────────────────────────────────────────────
console.log();
console.log('amenities are labelled, never dropped');
{
  is(amenityLabel('vegan_options'), 'Vegan options', 'a known key gets its written label');
  is(amenityLabel('wheelchair_accessible'), 'Step free access', 'and the label can differ from the key');
  // AN UNKNOWN KEY IS STILL TRUE. Dropping it loses something the operator
  // told us; title-casing it is worse than a written label and better than
  // silence.
  is(amenityLabel('rooftop_terrace'), 'Rooftop terrace', 'an unknown key is title-cased rather than dropped');
  is(amenityLabel(''), '', 'an empty key yields nothing');
  is(amenityLabel('   '), '', 'and so does whitespace');

  is(amenityList({ selectedAmenities: ['vegan_options'] }), ['Vegan options'], 'the real single-item case');
  is(amenityList({ selectedAmenities: [] }), [], 'an empty array is empty');
  is(amenityList({}), [], 'absent is empty');
  // Both fields exist in the data and a listing can carry either.
  is(amenityList({ selectedAmenities: ['wifi'], amenities: ['parking'] }), ['Wifi', 'Parking'],
    'both amenity fields are read');
  is(amenityList({ selectedAmenities: ['wifi'], amenities: ['wifi'] }), ['Wifi'],
    'and the same thing twice is listed once');
}

// ── how they take custom ──────────────────────────────────────────────────
console.log();
console.log('the service style says something useful or says nothing');
{
  // "online" on a restaurant means there is no room to walk into, which is
  // exactly what somebody planning a trip needs before they plan around it.
  is(serviceStyle({ businessModel: 'online' }), 'Delivery and collection only', 'online');
  is(serviceStyle({ businessModel: 'physical' }), 'Walk in', 'physical');
  is(serviceStyle({ businessModel: 'both' }), 'Walk in, delivery and collection', 'both');
  is(serviceStyle({}), '', 'absent says nothing rather than assuming a walk in');
  is(serviceStyle({ businessModel: 'franchise' }), '', 'an unrecognised value says nothing');
}

// ── who verified it ───────────────────────────────────────────────────────
console.log();
console.log('the visit line is read, never asserted');
{
  is(verificationLine({ isVerifiedBusiness: true, verifiedMethod: 'visited', verifiedRepName: 'Jemimah' }),
    'Visited by Jemimah from Sabię', 'the rep is named when we have the name');
  is(verificationLine({ isVerifiedBusiness: true, verifiedMethod: 'visited' }),
    'Visited by someone from Sabię', 'and the claim still stands without it');
  is(verificationLine({ isVerifiedBusiness: true, verificationMethod: 'visited' }),
    'Visited by someone from Sabię', 'the legacy field spelling counts');

  // THE SIX. Measured: 38 of 38 carry the flag, only 32 carry the visit.
  is(verificationLine({ isVerifiedBusiness: true }), '',
    'the flag alone is not a visit, so it claims nothing');
  is(verificationLine({ isVerifiedBusiness: true, verifiedMethod: 'documents' }), '',
    'verified by paperwork is not a visit');
  is(verificationLine({ verifiedMethod: 'visited' }), '',
    'a visit on an unverified business claims nothing');
  is(verificationLine({}), '', 'an empty listing claims nothing');
}

console.log();
console.log(fails === 0 ? 'ALL PASSED' : `${fails} FAILED`);
process.exit(fails > 0 ? 1 : 0);
