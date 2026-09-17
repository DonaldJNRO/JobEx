// Which rows the home page offers.
//
// The failure to avoid is a heading over an almost empty row. "Stays in Jos"
// above one card does not read as a small catalogue, it reads as a broken
// site, and it is the same mistake as offering a city filter for a city with
// nothing in it. The catch-all is the one exception, and it is deliberate:
// see the note beside it in home-rows.ts.
//
// There is no "New on Sabię" row any more. The tests that used to lean on it
// to keep thin listings reachable now lean on the catch-all instead, which is
// the whole point of the change: nothing may go missing.
//
// Run: node --experimental-strip-types src/lib/home-rows.test.mjs

import { rowsFrom } from './home-rows.ts'
import { categoryOf, categoryLabelOf } from './categories.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
const deep = (got, want, label) => is(JSON.stringify(got), JSON.stringify(want), label)

// The page resolves the place AND the category before calling, so the fixtures
// carry both. The table is imported rather than copied: a fixture that keeps
// its own idea of which category a role is in would let exactly the drift this
// change removes come back, silently and with a green suite.
const make = (id, role, city, seconds = 0, sub = null) => ({
  id,
  role,
  createdAt: { seconds },
  city,
  citySlug: city.toLowerCase(),
  category: categoryOf(role, sub),
  categoryLabel: categoryLabelOf(role, sub),
})

const many = [
  ...Array.from({ length: 5 }, (_, i) => make(`lagos-stay-${i}`, 'Host', 'Lagos', 100 + i)),
  ...Array.from({ length: 4 }, (_, i) => make(`lagos-exp-${i}`, 'ExperienceProviders', 'Lagos', 200 + i)),
  ...Array.from({ length: 3 }, (_, i) => make(`abuja-food-${i}`, 'FoodBeverageManager', 'Abuja', 50 + i)),
  // Too few to be a row of their own.
  make('jos-1', 'ExperienceProviders', 'Jos', 300),
  make('bamako-1', 'Host', 'Bamako', 10),
]

const rows = rowsFrom(many)
is(rows.some((r) => r.title.includes('New on')), false, 'there is no New row')

const titles = rows.map((r) => r.title)
is(titles.includes('Stays in Lagos'), true, 'a city and category with enough in it gets a row')
is(titles.includes('Experiences in Lagos'), true, 'and so does the next one')
is(titles.includes('Food & Drink in Abuja'), true, 'three is enough to be a row')
is(titles.includes('Experiences in Jos'), false, 'one listing never gets a heading of its own')

// A listing too thin for its own row must still be REACHABLE. An operator
// paying us to be invisible is worse than an untidy row.
const everywhere = rows.find((r) => r.key === 'everywhere')
is(Boolean(everywhere), true, 'the stragglers get the catch-all row')
is(everywhere.items.some((l) => l.id === 'jos-1'), true, 'the single Jos listing is still on the page')
is(everywhere.items.some((l) => l.id === 'bamako-1'), true, 'and so is Bamako')
is(everywhere.href, undefined, 'the catch-all names no filter, so it links to none')
is(rows[rows.length - 1].key, 'everywhere', 'and it comes last, under the rows that were chosen')

// ONE STRAGGLER STILL APPEARS. It used to join the New row; with that gone
// the catch-all takes it, one card and all. Thin, but never missing.
const wide = [
  ...Array.from({ length: 14 }, (_, i) => make(`lag-${i}`, 'Host', 'Lagos', 500 + i)),
  make('kano-1', 'Host', 'Kano', 1),
]
const wideRows = rowsFrom(wide)
is(wideRows.find((r) => r.key === 'everywhere')?.items.length, 1,
  'a single straggler gets the catch-all rather than disappearing')
is(wideRows.find((r) => r.key === 'everywhere').items[0].id, 'kano-1', 'and it is the right one')

// Three or more, the same row, no special case.
const three = [
  ...Array.from({ length: 12 }, (_, i) => make(`lag-${i}`, 'Host', 'Lagos', 500 + i)),
  make('k1', 'Host', 'Kano', 3), make('k2', 'Host', 'Kaduna', 2), make('k3', 'Host', 'Enugu', 1),
]
const threeRows = rowsFrom(three)
is(threeRows.find((r) => r.key === 'everywhere')?.items.length, 3, 'three leftovers, same row')
is(threeRows.find((r) => r.key === 'everywhere').items[0].id, 'k1', 'newest first inside it')

// Busiest first, so the strongest row leads the page now that New does not.
const real = rows.filter((r) => r.key !== 'everywhere')
is(real[0].title, 'Stays in Lagos', 'the fullest row leads')
is(rows[0].title, 'Stays in Lagos', 'and it is genuinely the top of the page')

// THE HEADING LEADS WHERE IT SAYS. A row called "Stays in Lagos" whose link
// asks the filter for something else is the bug that started this: hotels were
// headed Stays, the Stays filter queried Landlord and Host, and the tap landed
// on an empty page.
const staysLagos = rows.find((r) => r.title === 'Stays in Lagos')
is(staysLagos.href, '/explore?category=stays&city=lagos', 'the row links to its own filter')
const foodAbuja = rows.find((r) => r.title === 'Food & Drink in Abuja')
is(foodAbuja.href, '/explore?category=food&city=abuja', 'and so does the next one, ampersand and all')
is(rows.find((r) => r.key === 'everywhere').href, undefined, 'the catch-all names no filter, so it gets no link')

// A HOTEL IS A STAY. Studio's roleConfig.ts, the screen an operator signs up
// through, has hospitality_manager as category "stay" and describes it as
// "Hotels, resorts, lodges & boutique stays". An earlier pass had these under
// Food & Drink, on the strength of a map that decides how to PRICE a business
// rather than what it is.
const hotels = rowsFrom(Array.from({ length: 3 }, (_, i) => make(`h${i}`, 'HospitalityManager', 'Lagos', i)))
is(hotels.some((r) => r.title === 'Stays in Lagos'), true, 'hotels are headed Stays')
is(hotels.some((r) => r.href === '/explore?category=stays&city=lagos'), true,
  'and the heading leads to the filter that returns them')

// A LANDLORD IS A STAY TOO. Studio calls it "rental", a fifth category the
// website does not have. Folding it into Stays is deliberate: the alternative
// is a real listing that no filter on the site can reach.
const rentals = rowsFrom(Array.from({ length: 3 }, (_, i) => make(`r${i}`, 'Landlord', 'Abuja', i)))
is(rentals.some((r) => r.title === 'Stays in Abuja'), true, 'a long-term rental is reachable under Stays')

// AND A HOST LISTING CAN BE AN EVENT. subCategory event_rental reclassifies it,
// which is categoryFromRole() in Studio and a product decision made there.
const venues = rowsFrom(Array.from({ length: 3 }, (_, i) => make(`v${i}`, 'Host', 'Lagos', i, 'event_rental')))
is(venues.some((r) => r.title === 'Events in Lagos'), true, 'an event rental is an Event, not a Stay')
is(venues.some((r) => r.title === 'Stays in Lagos'), false, 'and it is not in both')

// The older docs store subCategory as { id, name } rather than a string, and
// the two have to mean the same thing.
const objVenues = rowsFrom(Array.from({ length: 3 }, (_, i) =>
  make(`o${i}`, 'Host', 'Jos', i, { id: 'event_rental', name: 'Event rental' })))
is(objVenues.some((r) => r.title === 'Events in Jos'), true, 'the object shape of subCategory reads the same')

// A role nobody recognises has no filter behind it, so it gets no heading, but
// it must still reach the page.
const odd = [...Array.from({ length: 3 }, (_, i) => make(`l${i}`, 'Host', 'Lagos', 9)), make('weird', 'Astronaut', 'Lagos', 1)]
const oddRows = rowsFrom(odd)
is(oddRows.every((r) => !r.title.includes('Astronaut')), true, 'an unknown role never invents a heading')
is(oddRows.some((r) => r.items.some((l) => l.id === 'weird')), true, 'and it still appears somewhere')

// ── what it refuses to do ───────────────────────────────────────────────
deep(rowsFrom([]), [], 'an empty catalogue offers no rows at all, not empty ones')
const pair = rowsFrom([make('a', 'Host', 'Lagos'), make('b', 'Host', 'Lagos')])
is(pair.length, 1, 'two listings is one row, not a heading over a pair')
is(pair[0].title, 'On Sabię', 'with nothing above it, it is not "everywhere ELSE"')
is(rowsFrom(many, 1).filter((r) => r.key !== 'everywhere').length, 1, 'the row cap is respected')

// A listing with no city cannot be grouped, and must not vanish.
const noCity = rowsFrom([...Array.from({ length: 3 }, (_, i) => make(`l${i}`, 'Host', 'Lagos')), { id: 'x', role: 'Host' }])
is(noCity.some((r) => r.items.some((l) => l.id === 'x')), true,
  'a listing with no recorded city still appears somewhere')

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
