/**
 * The link an operator puts in their Instagram bio.
 *
 * A Firebase document id is not a link you hand to a person:
 * /listing/1tLlMNPeeF49o30zSh8V is unreadable, untypeable and unmemorable, and
 * it leaks our storage layout into a public URL. This makes
 * /listing/arrows-den instead.
 *
 * Shared by the website, admin and Studio deliberately: three implementations
 * of "make a slug" is three sets of rules, and the moment they disagree the
 * link in somebody's bio 404s.
 */

/** Strip accents so Sabię-style names transliterate rather than vanish. */
function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Lowercase words, accents stripped, punctuation gone. The unit both the
    slug and the "is the city already in the name?" test are built from. */
function words(s: string): string[] {
  return deaccent(String(s || ""))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Does the city appear in the name as whole words, in order? Whole words
    matter: "Port" must not match inside "Portharcourt", and a substring test
    would silently drop the city from a name that never contained it. */
function contains(haystack: string[], needle: string[]): boolean {
  if (!needle.length || needle.length > haystack.length) return false;
  return haystack.some((_, i) =>
    needle.every((w, j) => haystack[i + j] === w),
  );
}

/**
 * A name and a city become one lowercase, hyphenated token.
 *
 * City is included because "Central Park" is a name several operators will
 * reasonably use, and "central-park-abuja" stays honest about which one it is.
 * It is omitted when the name already names the city ANYWHERE, not just at the
 * end: "Lagos Kitchen" in Lagos is "lagos-kitchen", never "lagos-kitchen-lagos".
 * The end-only test was the first thing written here and it was wrong, because
 * operators put the city at the front at least as often as the back.
 */
export function makeSlug(name: string, city?: string | null): string {
  const nameWords = words(name);
  const cityWords = words(city || "");
  const joined = (
    contains(nameWords, cityWords) ? nameWords : [...nameWords, ...cityWords]
  ).join(" ");
  // words() already removed everything that is not a-z0-9, so the only join
  // left to do is spaces to hyphens. 60 characters keeps a link readable when
  // it is spoken aloud or printed on a card; the trailing trim is because the
  // cut can land mid-hyphen.
  return joined.replace(/ /g, "-").slice(0, 60).replace(/-+$/g, "") || "listing";
}

/**
 * Could this path segment be a slug at all?
 *
 * Firebase document ids are 20 characters of mixed case with no hyphens, so a
 * lowercase token that contains a hyphen is unambiguously ours. Anything else
 * we try as a document id first. This is a cheap test that saves a wasted
 * Firestore round trip on every listing view.
 */
export function looksLikeSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value);
}

/**
 * The slugs this listing could reasonably own, best first.
 *
 * The founder's two examples are the whole specification here: Arrows Den is
 * "arrows-den" and Central Park is "central-park-abuja". The difference is not
 * the kind of business, it is that "Central Park" is a name the world already
 * uses and "Arrows Den" is not. So the city is not decoration appended to
 * everything, it is the FIRST disambiguator, reached for only when the plain
 * name is already spoken for.
 *
 * Returning the list rather than picking inside this function keeps it pure and
 * lets the resolver accept any of them: an operator who was handed
 * "central-park-abuja" before the plain name freed up must not hit a 404 when
 * the canonical slug is "central-park".
 */
export function slugCandidates(name: string, city?: string | null): string[] {
  const plain = makeSlug(name);
  const withCity = makeSlug(name, city);
  return plain === withCity ? [plain] : [plain, withCity];
}

/**
 * The first free slug for this listing. `taken` answers "does this exist?".
 *
 * Tries the plain name, then the name with its city, then numbers off the most
 * specific candidate, because "central-park-abuja-2" tells a human more than
 * "central-park-3" does.
 */
export async function uniqueSlug(
  name: string,
  city: string | null | undefined,
  taken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const candidates = slugCandidates(name, city);
  for (const candidate of candidates) {
    if (!(await taken(candidate))) return candidate;
  }
  const stem = candidates[candidates.length - 1];
  // Starts at 2 because the first collision is the SECOND thing with this name.
  for (let n = 2; n < 100; n++) {
    const candidate = `${stem}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  throw new Error(`Could not find a free slug for "${stem}" after 99 tries`);
}
