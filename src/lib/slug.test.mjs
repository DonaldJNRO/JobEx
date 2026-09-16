import { makeSlug, looksLikeSlug, slugCandidates, uniqueSlug, slugForListing, bookingLink } from './slug.ts'
let fails = 0
const is = (got, want, label) => { const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`) }

is(makeSlug('Arrows Den', 'Lagos'), 'arrows-den-lagos', 'name and city')
is(makeSlug('Central Park', 'Abuja'), 'central-park-abuja', 'the ticket example')
is(makeSlug('Milk & Honey', 'Lagos'), 'milk-and-honey-lagos', 'ampersand becomes and')
is(makeSlug('Sabię Lounge', 'Lagos'), 'sabie-lounge-lagos', 'the ogonek transliterates rather than vanishing')
is(makeSlug("Mama's Kitchen", 'Jos'), 'mamas-kitchen-jos', 'apostrophes are dropped, not hyphenated')
is(makeSlug('Lagos Kitchen', 'Lagos'), 'lagos-kitchen', 'city not repeated when the name starts with it')
is(makeSlug('Kitchen Lagos', 'Lagos'), 'kitchen-lagos', 'city not repeated when the name ends with it')
is(makeSlug('The Lagos Kitchen', 'Lagos'), 'the-lagos-kitchen', 'city not repeated when the name has it in the middle')
is(makeSlug('Portharcourt Grill', 'Port'), 'portharcourt-grill-port', 'a city is matched as a whole word, never inside a longer one')
is(makeSlug('Harbour Point', 'Port Harcourt'), 'harbour-point-port-harcourt', 'a two word city survives intact')
is(makeSlug('Port Harcourt Grill', 'Port Harcourt'), 'port-harcourt-grill', 'a two word city is not repeated either')
is(makeSlug('  Spaced   Out  ', ''), 'spaced-out', 'runs of whitespace collapse')
is(makeSlug('!!!', ''), 'listing', 'a name with nothing usable still yields a slug')
is(makeSlug('Arrows Den'), 'arrows-den', 'city is optional')

is(looksLikeSlug('arrows-den'), true, 'a hyphenated lowercase token is a slug')
is(looksLikeSlug('1tLlMNPeeF49o30zSh8V'), false, 'a firebase id is not')
is(looksLikeSlug('ARH'), false, 'a short code is not')
is(looksLikeSlug('arrowsden'), false, 'no hyphen means we cannot be sure, so treat it as an id')

const eq = (got, want, label) => is(JSON.stringify(got), JSON.stringify(want), label)
eq(slugCandidates('Arrows Den', 'Lagos'), ['arrows-den', 'arrows-den-lagos'], 'plain name first, city second')
eq(slugCandidates('Lagos Kitchen', 'Lagos'), ['lagos-kitchen'], 'one candidate when the city adds nothing')
eq(slugCandidates('Arrows Den'), ['arrows-den'], 'one candidate when there is no city')

const free = async () => false
const taken = names => { const s = new Set(names); return async c => s.has(c) }
is(await uniqueSlug('Arrows Den', 'Lagos', free), 'arrows-den', 'the ticket: a free name needs no city')
is(await uniqueSlug('Central Park', 'Abuja', taken(['central-park'])), 'central-park-abuja', 'the ticket: the city is the first disambiguator')
is(await uniqueSlug('Central Park', 'Abuja', taken(['central-park', 'central-park-abuja'])), 'central-park-abuja-2', 'numbers come after the city, not instead of it')
is(await uniqueSlug('Central Park', 'Abuja', taken(['central-park', 'central-park-abuja', 'central-park-abuja-2'])), 'central-park-abuja-3', 'and they count up past the ones taken')
is(await uniqueSlug('Lagos Kitchen', 'Lagos', taken(['lagos-kitchen'])), 'lagos-kitchen-2', 'with no city to add, numbering starts straight away')

is(slugForListing({ slug: 'arrows-den' }), 'arrows-den', 'a stored slug wins')
is(slugForListing({ businessName: 'Arrows Den', citySlug: 'lagos' }), 'arrows-den', 'no stored slug computes the plain name, not the city form')
is(slugForListing({ listingName: 'Pause Cafe' }), 'pause-cafe', 'listingName is accepted when businessName is absent')
is(bookingLink('arrows-den'), 'https://www.sabieapp.com/listing/arrows-den', 'the link an operator is given')

console.log(fails ? `\n${fails} FAILED` : '\nall passed')
process.exit(fails ? 1 : 0)
