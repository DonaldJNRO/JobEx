// Which rows the home page offers.
//
// The failure to avoid is a heading over an almost empty row. "Stays in Jos"
// above one card does not read as a small catalogue, it reads as a broken
// site, and it is the same mistake as offering a city filter for a city with
// nothing in it.
//
// Run: node --experimental-strip-types src/lib/home-rows.test.mjs

import { rowsFrom } from './home-rows.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
const deep = (got, want, label) => is(JSON.stringify(got), JSON.stringify(want), label)

// The page resolves the place before calling, so the fixtures carry it too.
const make = (id, role, city, seconds = 0) => ({
  id, role, createdAt: { seconds }, city, citySlug: city.toLowerCase(),
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
const everywhere = rows.find((r) => r.key === 'everywhere')
is(Boolean(everywhere), true, 'the thin ones get a row together')
is(everywhere.items.some((l) => l.id === 'jos-1'), true, 'the single Jos listing is still on the page')
is(everywhere.items.some((l) => l.id === 'bamako-1'), true, 'and so is Bamako')

// Busiest first, so the strongest row is the first real one after New.
const real = rows.filter((r) => r.key !== 'new' && r.key !== 'everywhere')
is(real[0].title, 'Stays in Lagos', 'the fullest row comes first')

// ── what it refuses to do ───────────────────────────────────────────────
deep(rowsFrom([]), [], 'an empty catalogue offers no rows at all, not empty ones')
is(rowsFrom([make('a', 'Host', 'Lagos'), make('b', 'Host', 'Lagos')]).length, 1,
  'two listings is one row of leftovers, not a heading over a pair')
is(rowsFrom(many, 1).filter((r) => r.key !== 'new' && r.key !== 'everywhere').length, 1,
  'the row cap is respected')

// A listing with no city cannot be grouped, and must not vanish.
const noCity = rowsFrom([...Array.from({ length: 3 }, (_, i) => make(`l${i}`, 'Host', 'Lagos')), { id: 'x', role: 'Host' }])
is(noCity.find((r) => r.key === 'everywhere')?.items.some((l) => l.id === 'x'), true,
  'a listing with no recorded city still appears')

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED')
process.exit(fails ? 1 : 0)
