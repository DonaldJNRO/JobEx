// Where a listing is, read off two different stored shapes.
//
// The failure this guards is invisible. A listing whose location is an object
// simply did not match a city typed into the explore search, and a listing
// whose location is a string had no city key at all, so neither appeared under
// a filter. Nothing errors, nothing logs: the listing is just absent, and the
// operator is the one who notices, eventually, that nobody found them.
//
// Run: node --experimental-strip-types src/lib/listing-place.test.mjs

import { listingPlace, citiesOf, inCity, parentCity, areaIndexFrom } from './listing-place.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// ── the modern shape, as Studio's LocationInput writes it ────────────────
const studio = listingPlace({
  citySlug: 'jos',
  areaSlug: 'kabong',
  location: { address: "Chuwang Botsha's Street, Kabong, Jos", city: 'Jos', area: 'Kabong', areaSlug: 'kabong' },
})
is(studio.city, 'Jos', 'object: the human city')
is(studio.citySlug, 'jos', 'object: the key')
is(studio.area, 'Kabong', 'object: the area')
is(studio.areaSlug, 'kabong', 'object: the area key')
is(studio.label, 'Jos', 'object: the card line')

// ── the old shape, one string, most specific first ───────────────────────
const legacy = listingPlace({ location: 'Rayfield, Jos, Plateau' })
is(legacy.label, 'Rayfield', 'string: the card shows the most specific part')
// "Rayfield" is NOT the city, and reading the first segment as one is the
// mistake this exists to prevent. Without a citySlug there is simply no key.
is(legacy.citySlug, '', 'string: no city key is invented from the first segment')

const legacyKeyed = listingPlace({ citySlug: 'jos', location: 'Rayfield, Jos, Plateau' })
is(legacyKeyed.citySlug, 'jos', 'string + citySlug: the document key wins')
is(legacyKeyed.city, 'Jos', 'string + citySlug: and gives a readable city')
is(legacyKeyed.label, 'Rayfield', 'string + citySlug: the card line is unchanged')

// ── the two shapes must agree, or one city becomes two filters ───────────
const a = listingPlace({ citySlug: 'port-harcourt' })
const b = listingPlace({ location: { city: 'Port Harcourt' } })
is(a.citySlug, b.citySlug, 'a slug and a written name key the same')
is(a.city, 'Port Harcourt', 'a slug alone still reads as a name')
is(b.city, 'Port Harcourt', 'and a written name is preferred over unslugging')

// Case and spacing must not split a place.
is(listingPlace({ location: { city: '  PORT   HARCOURT ' } }).citySlug, 'port-harcourt',
  'case and spacing do not make a second city')

// ── nothing recorded is not a place called "" ────────────────────────────
const empty = listingPlace({})
is(empty.city, '', 'empty: no city')
is(empty.citySlug, '', 'empty: no key')
is(empty.label, '', 'empty: nothing to show')
is(listingPlace({ location: null }).label, '', 'null location is empty, not a crash')

// A real name containing a hyphen survives, because a stored name always beats
// unslugging: "Gut-Fwi" must not come back as "Gut Fwi".
is(listingPlace({ areaSlug: 'gut-fwi', location: { area: 'Gut-Fwi' } }).area, 'Gut-Fwi',
  'a stored name beats unslugging, hyphen and all')

// ── the label falls back rather than showing nothing ─────────────────────
is(listingPlace({ location: { name: 'Rayfield Resort' } }).label, 'Rayfield Resort',
  'no city, so the place name carries the line')
is(listingPlace({ location: { address: '2095 Rayfield Road' } }).label, '2095 Rayfield Road',
  'no city or name, so the address does')

// ── which cities get offered as a filter ─────────────────────────────────

const deep = (got, want, label) => is(JSON.stringify(got), JSON.stringify(want), label)

const catalogue = [
  { citySlug: 'jos', location: { city: 'Jos' } },
  { location: { city: 'Lagos' } },
  { citySlug: 'jos', location: 'Rayfield, Jos' },
  { location: { city: 'JOS' } },
  { location: { city: 'Abuja' } },
  { location: 'Somewhere nobody recorded properly' },
  {},
]

deep(citiesOf(catalogue).map((c) => `${c.name}:${c.count}`), ['Jos:3', 'Abuja:1', 'Lagos:1'],
  'commonest city first, and one Jos however it was stored')

// The two below are the whole point. A city offered with nothing in it always
// returns "No listings found", which reads as a broken site rather than an
// empty one, so only cities actually present are offered at all.
deep(citiesOf([]), [], 'nothing in the catalogue offers no cities')
deep(citiesOf([{ location: 'Rayfield, Jos' }, {}]).length, 0,
  'a listing with no city key offers no filter, though it still shows')

// Ties break by name, so the order does not wobble between loads.
deep(citiesOf([{ citySlug: 'lagos' }, { citySlug: 'abuja' }]).map((c) => c.slug), ['abuja', 'lagos'],
  'equal counts sort by name, so the list is stable')

// ── an area is not a city ───────────────────────────────────────────────

// As the shared `cities` collection holds it.
const KNOWN = [
  { id: 'lagos', name: 'Lagos', areas: ['Ikeja', 'Lekki', 'Victoria Island'] },
  { id: 'jos', name: 'Jos', areas: ['Rayfield', 'Kabong'] },
  { id: 'bamako', name: 'Bamako', areas: [] },
]

is(parentCity('ikeja', KNOWN), 'lagos', 'Ikeja folds onto Lagos')
is(parentCity('lekki', KNOWN), 'lagos', 'and so does every other Lagos area')
is(parentCity('lagos', KNOWN), 'lagos', 'a real city stays itself')
is(parentCity('bamako', KNOWN), 'bamako', 'including one with no areas listed')
// A city nobody has added yet is far more likely to be real than a mistake, so
// it is left alone rather than swallowed.
is(parentCity('kaduna', KNOWN), 'kaduna', 'an unknown place is left exactly as it is')
is(parentCity('ikeja', []), 'ikeja', 'with no list, nothing is folded and nothing breaks')

const split = [
  { citySlug: 'lagos', location: { city: 'Lagos' } },
  { citySlug: 'ikeja', location: { city: 'Ikeja' } },
  { citySlug: 'jos', location: { city: 'Jos' } },
]
deep(citiesOf(split, KNOWN).map((c) => `${c.name}:${c.count}`), ['Lagos:2', 'Jos:1'],
  'so the filter offers Lagos once, counting the Ikeja listing in it')
deep(citiesOf(split).map((c) => `${c.name}:${c.count}`), ['Ikeja:1', 'Jos:1', 'Lagos:1'],
  'and without the list it splits, which is the bug this fixes')

// The options and the filtering must fold the SAME way, or picking Lagos hides
// the very listing that put Lagos in the list.
is(inCity({ citySlug: 'ikeja' }, 'lagos', KNOWN), true, 'picking Lagos keeps the Ikeja listing')
is(inCity({ citySlug: 'jos' }, 'lagos', KNOWN), false, 'and still excludes Jos')
is(inCity({ citySlug: 'ikeja' }, 'all', KNOWN), true, 'Everywhere keeps everything')
is(inCity({}, 'lagos', KNOWN), false, 'a listing with no city is not silently in one')

// The collection's spelling wins, so one city is named one way.
deep(citiesOf([{ location: { city: 'LAGOS' } }], KNOWN).map((c) => c.name), ['Lagos'],
  "the collection's spelling wins over however a listing stored it")

// ── learning the areas when `cities` cannot be read ──────────────────────
//
// firestore.rules lets only a SIGNED-IN account read `cities`, and most people
// arrive at sabieapp.com signed out, so on the page where this matters the
// list comes back empty. A listing stored properly is evidence in its own
// right: citySlug "lagos" with areaSlug "ikeja" says where Ikeja is.

const mixed = [
  { citySlug: 'lagos', areaSlug: 'ikeja', location: { city: 'Lagos', area: 'Ikeja' } },
  { citySlug: 'lagos', location: { city: 'Lagos' } },
  // The badly stored one: its AREA is in the city field.
  { citySlug: 'ikeja', location: { city: 'Ikeja' } },
]

deep(areaIndexFrom(mixed), { ikeja: 'lagos' }, 'a well-stored listing teaches where Ikeja is')
is(parentCity('ikeja', [], areaIndexFrom(mixed)), 'lagos', 'and folds the badly stored one, with no cities list')
deep(citiesOf(mixed).map((c) => `${c.name}:${c.count}`), ['Lagos:3'],
  'so signed out, the filter still offers Lagos once')
is(inCity({ citySlug: 'ikeja' }, 'lagos', [], areaIndexFrom(mixed)), true,
  'and picking Lagos keeps the Ikeja listing')

// It must never learn that a place contains itself, or the listing being
// corrected would teach that Ikeja is a city.
deep(areaIndexFrom([{ citySlug: 'ikeja', areaSlug: 'ikeja' }]), {},
  'a listing never teaches that a place is inside itself')
deep(areaIndexFrom([{ citySlug: 'lagos' }, { areaSlug: 'ikeja' }, {}]), {},
  'and nothing is learned from half a pair')

// The collection still wins when it IS readable: it is the real source, and
// what is learned is only ever a stand-in for it.
is(parentCity('ikeja', KNOWN, { ikeja: 'abuja' }), 'lagos',
  'the cities collection beats anything inferred')

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
