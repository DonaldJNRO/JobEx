// The /model page has to agree with the PDF somebody is already holding.
//
// Run:  npx tsx src/lib/model.test.mjs
//
// WHY THIS EXISTS. Three slides of the investor deck link to /model, and two
// of them print year-end figures. The deck is out. So these seven rows are
// not "what the code currently produces", they are a FIXED external
// contract: if a change to model.ts moves one of them, the page and the PDF
// disagree in front of an investor and nobody finds out from the page.
//
// So the targets below are copied from the deck and never adjusted to fit the
// code. If this file fails, the arithmetic is wrong, not the targets.
//
// THE SEASONALITY MEAN IS THE SUBTLE ONE. Twelve multipliers that average
// anything other than 1.00 are a growth assumption wearing a seasonality
// label: a set averaging 1.1 quietly adds ten percent to every year, and a
// reader comparing the page to the inputs would never see where it came from.
// Asserted here so that raising December has to be paid for somewhere else.

import { inputsFor, runModel, byYear, SEASON, basketOf, seasonFor, monthLabel } from './model.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
// The deck prints whole pounds, so whole pounds is the comparison. One pound
// of slack absorbs float, and nothing more: two pounds of drift is a bug.
const near = (got, want, label) => {
  const ok = Math.abs(got - want) <= 1
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${Math.round(got)} want ${want}`}`)
}

// ── the seasonality is seasonality, not growth ────────────────────────────
near(SEASON.reduce((a, b) => a + b, 0) / 12, 1, 'the twelve multipliers average exactly 1.00')
is(SEASON.length, 12, 'and there are twelve of them')

// ── month 1 is December 2026, which is what makes Dec the first month ─────
is(monthLabel(1), 'Dec 26', 'month 1 is December 2026')
is(seasonFor(1), 2.2, 'so month 1 takes the December multiplier')
is(monthLabel(2), 'Jan 27', 'month 2 crosses the year')
is(seasonFor(2), 1.6, 'and takes January')
is(monthLabel(36), 'Nov 29', 'month 36 is November 2029')

// ── THE DECK'S FIGURES. High scenario, £500,000 raise. ────────────────────
const high = byYear(runModel(inputsFor('high')))
const YEARS = ['year 1', 'year 2', 'year 3']

const DECK = {
  bizEnd:      { name: 'businesses live at year end', want: [1403, 4161, 6933] },
  gmv:         { name: 'gross booking value',         want: [238050, 709036, 1437800] },
  commission:  { name: 'commission revenue',          want: [23805, 70904, 143780] },
  grossProfit: { name: 'gross profit',                want: [16902, 50342, 102084] },
  totalCosts:  { name: 'total operating costs',       want: [-129536, -203940, -211318] },
  operating:   { name: 'operating loss',              want: [-112634, -153599, -109234] },
  cashEnd:     { name: 'cash at year end',            want: [385999, 226742, 111409] },
}

for (const [key, { name, want }] of Object.entries(DECK)) {
  want.forEach((w, idx) => near(high[idx][key], w, `High, ${YEARS[idx]}: ${name}`))
}

// ── and the two Base figures the deck also prints ─────────────────────────
const base = byYear(runModel(inputsFor('base')))
near(base[2].commission, 9332, 'Base, year 3: commission revenue')
near(base[2].cashEnd, -20149, 'Base, year 3: cash at year end, which is negative')

// ── the basket is DERIVED from the mix, never typed in ────────────────────
// A typed basket is the figure that silently stops matching the stay share
// above it the first time somebody edits one and not the other.
const h = inputsFor('high')
near(basketOf(h).basketNgn, 0.25 * 587000 + 0.75 * 18000, 'the basket is worked out from the mix')
near(basketOf(h).takeRate, 0.1, 'and the take rate is the value weighted commission')
// Both commissions are ten percent today, so the weighting is invisible. It
// stops being invisible the moment they differ, so prove it with a mix that
// does: a 50/50 basket of a £100 item at 20% and a £100 item at 10% is 15%.
near(
  basketOf({ ...h, stayShare: 0.5, tripWithStayNgn: 100, activityOnlyNgn: 100, stayCommission: 0.2, activityCommission: 0.1 }).takeRate,
  0.15,
  'a value weighted rate across two different commissions',
)

// ── the guards that stop a divide by zero reaching the page ───────────────
const noCac = runModel({ ...h, demandCac: 0 })
is(noCac.every((r) => Number.isFinite(r.gmv)), true, 'a zero acquisition cost buys nothing rather than dividing by zero')
is(noCac[0].travellers, 0, 'and acquires no travellers')
const noBasket = runModel({ ...h, stayShare: 0, tripWithStayNgn: 0, activityOnlyNgn: 0 })
is(noBasket.every((r) => Number.isFinite(r.commission)), true, 'an empty basket earns nothing rather than NaN')

// ── the shape of the run ──────────────────────────────────────────────────
is(runModel(h).length, 36, 'thirty-six months')
is(byYear(runModel(h)).length, 3, 'in three years')
// Reps are capped, and the cap has to BIND: 4 at start plus 2 a month would
// pass 30 inside the window, so an unenforced cap would show up as year 3
// field payroll nobody budgeted.
is(runModel(h).every((r) => r.repsEnd <= h.maxReps), true, 'the rep cap binds in every month')
// VAT is off by default, and "off" has to mean zero rather than a rate of zero
// applied to something.
is(runModel(h).every((r) => r.vat === 0), true, 'VAT is zero while we are not registered')
near(byYear(runModel({ ...h, vatRegistered: true }))[0].vat, -23805 * 0.2, 'and bites commission once we are')

console.log()
console.log(fails === 0 ? 'ALL PASSED' : `${fails} FAILED`)
process.exit(fails > 0 ? 1 : 0)
