// Which rows the home page offers.
//
// The failure to avoid is a heading over an almost empty row. "Stays in Jos"
// above one card does not read as a small catalogue, it reads as a broken
// site, and it is the same mistake as offering a city filter for a city with
// nothing in it.
//
// Run: node --experimental-strip-types src/lib/home-rows.test.mjs

import { rowsFrom } from './home-rows.ts'
import { categoryOfRole, categoryLabelOfRole } from './categories.ts'

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
const make = (id, role, city, seconds = 0) => ({
  id,
  role,
  createdAt: { seconds },
  city,
  citySlug: city.toLowerCase(),
  category: categoryOfRole(role),
  categoryLabel: categoryLabelOfRole(role),
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
is(rows[0].title, 'New on Sabię', 'the newest things lead')
is(rows[0].items[0].id, 'jos-1', 'and newest really means newest')

const titles = rows.map((r) => r.title)
is(titles.includes('Stays in Lagos'), true, 'a city and category with enough in it gets a row')
is(titles.includes('Experiences in Lagos'), true, 'and so does the next one')
is(titles.includes('Food & Drink in Abuja'), true, 'three is enough to be a row')
is(titles.includes('Experiences in Jos'), false, 'one listing never gets a heading of its own')

// A listing too thin for its own row must still be REACHABLE. An operator
// paying us to be invisible is worse than an untidy row.
// With 13 listings the New row already carries both thin ones, so there is
// nothing left over and no catch-all row is needed.
const everywhere = rows.find((r) => r.key === 'everywhere')
is(Boolean(everywhere), false, 'nothing is left over, so no catch-all row appears')
const newRow = rows.find((r) => r.key === 'new')
is(newRow.items.some((l) => l.id === 'jos-1'), true, 'the single Jos listing is still on the page')
is(newRow.items.some((l) => l.id === 'bamako-1'), true, 'and so is Bamako')

// A LONE CARD UNDER A HEADING is the defect this guards. With more than twelve
// listings the New row cannot hold everything, and one straggler must not get
// a title and an empty row beside it.
const wide = [
  ...Array.from({ length: 14 }, (_, i) => make(`lag-${i}`, 'Host', 'Lagos', 500 + i)),
  make('kano-1', 'Host', 'Kano', 1),
]
const wideRows = rowsFrom(wide)
is(wideRows.find((r) => r.key === 'everywhere'), undefined, 'one straggler never gets a row of its own')
is(wideRows.find((r) => r.key === 'new').items.some((l) => l.id === 'kano-1'), true,
  'it joins the New row instead, so it is still reachable')

// Three or more IS enough for the catch-all to stand on its own.
const three = [
  ...Array.from({ length: 12 }, (_, i) => make(`lag-${i}`, 'Host', 'Lagos', 500 + i)),
  make('k1', 'Host', 'Kano', 3), make('k2', 'Host', 'Kaduna', 2), make('k3', 'Host', 'Enugu', 1),
]
is(rowsFrom(three).find((r) => r.key === 'everywhere')?.items.length, 3,
  'three leftovers do get their own row')

// Busiest first, so the strongest row is the first real one after New.
const real = rows.filter((r) => r.key !== 'new' && r.key !== 'everywhere')
is(real[0].title, 'Stays in Lagos', 'the fullest row comes first')

// THE HEADING LEADS WHERE IT SAYS. A row called "Stays in Lagos" whose link
// asks the filter for something else is the bug that started this: hotels were
// headed Stays, the Stays filter queried Landlord and Host, and the tap landed
// on an empty page.
const staysLagos = rows.find((r) => r.title === 'Stays in Lagos')
is(staysLagos.href, '/explore?category=stays&city=lagos', 'the row links to its own filter')
const foodAbuja = rows.find((r) => r.title === 'Food & Drink in Abuja')
is(foodAbuja.href, '/explore?category=food&city=abuja', 'and so does the next one, ampersand and all')
is(rows.find((r) => r.key === 'new').href, undefined, 'New has no single filter, so it gets no link')

// A HOTEL IS FOOD & DRINK HERE. Not because that is obvious, but because the
// mobile app's BUSINESS_TYPE_MAP says so, and a row heading that disagrees with
// the app about what a business IS sends people to an empty filter.
const hotels = rowsFrom(Array.from({ length: 3 }, (_, i) => make(`h${i}`, 'HospitalityManager', 'Lagos', i)))
is(hotels.some((r) => r.title === 'Stays in Lagos'), false, 'hotels are never headed Stays')
is(hotels.some((r) => r.href === '/explore?category=food&city=lagos'), true,
  'they are headed Food & Drink, which is the filter that actually returns them')

// A role nobody recognises has no filter behind it, so it gets no heading, but
// it must still reach the page.
const odd = [...Array.from({ length: 3 }, (_, i) => make(`l${i}`, 'Host', 'Lagos', 9)), make('weird', 'Astronaut', 'Lagos', 1)]
const oddRows = rowsFrom(odd)
is(oddRows.every((r) => !r.title.includes('Astronaut')), true, 'an unknown role never invents a heading')
is(oddRows.some((r) => r.items.some((l) => l.id === 'weird')), true, 'and it still appears somewhere')

// ── what it refuses to do ───────────────────────────────────────────────
deep(rowsFrom([]), [], 'an empty catalogue offers no rows at all, not empty ones')
is(rowsFrom([make('a', 'Host', 'Lagos'), make('b', 'Host', 'Lagos')]).length, 1,
  'two listings is one row of leftovers, not a heading over a pair')
is(rowsFrom(many, 1).filter((r) => r.key !== 'new' && r.key !== 'everywhere').length, 1,
  'the row cap is respected')

// A listing with no city cannot be grouped, and must not vanish.
const noCity = rowsFrom([...Array.from({ length: 3 }, (_, i) => make(`l${i}`, 'Host', 'Lagos')), { id: 'x', role: 'Host' }])
is(noCity.some((r) => r.items.some((l) => l.id === 'x')), true,
  'a listing with no recorded city still appears somewhere')

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
