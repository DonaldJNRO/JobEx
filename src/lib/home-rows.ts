/**
 * The home page as rows, not a grid.
 *
 * WHY ROWS. Twenty-eight listings laid out as one grid reads as "everything we
 * have". The same twenty-eight in four named rows reads as "chosen for you",
 * and a row that runs off the right edge implies there is more. Airbnb cannot
 * show you its whole catalogue and so has no choice; we can, and showing it all
 * at once is the one thing that would make a young marketplace look empty.
 *
 * THERE IS NO "NEW ON SABIĘ" ROW. It was the top row and it was the wrong
 * thing to lead with: recency is our fact about ourselves, not a reason for
 * anybody to want a place. A row of things whose only quality is that we added
 * them recently tells a visitor how small the catalogue is. The rows that
 * remain are about where somebody wants to go and what they want to do there.
 *
 * NO ROW IS INVENTED. Every row is a real grouping of listings that exist, with
 * a heading that describes what is in it. A heading promising something the row
 * cannot fill is worse than no row, which is the same rule as the city filter:
 * never offer somewhere with nothing in it.
 */
/**
 * A listing with its place ALREADY RESOLVED. This file deliberately imports
 * nothing: the caller runs listingPlace() and hands the result in. That keeps
 * it a leaf, which is what lets plain node load it for the test, the same
 * arrangement as slug.ts and booking-shape.ts.
 */
export interface RowSource {
  id?: string;
  role?: string;
  city?: string;
  citySlug?: string;
  /**
   * THE CATEGORY IS HANDED IN, NOT DECIDED HERE. This file used to keep its
   * own role-to-category table, which drifted from the one the explore filter
   * queries with: the home page headed a row of hotels "Stays in Lagos" and
   * the Stays filter, asking for Landlord and Host only, came back empty. A
   * heading that leads somewhere empty is worse than no heading.
   *
   * There is now one table, in listings.ts, and the caller reads it. `category`
   * is the id the filter uses, `categoryLabel` is the words a person reads.
   */
  category?: string;
  categoryLabel?: string;
  createdAt?: { seconds: number };
}

export interface HomeRow {
  key: string;
  title: string;
  items: RowSource[];
  /** Where the heading goes, when the row is a real filter. The New row and
   *  the catch-all have no single filter that means them, so they have none. */
  href?: string;
}

/**
 * A row that NAMES a city and a category has to fill itself. "Stays in Jos"
 * over one card does not read as a small catalogue, it reads as a broken site,
 * and it is the same mistake as offering a city filter for a city with nothing
 * in it. The catch-all is held to a different bar, for the reason given where
 * it is built.
 */
const MIN_ROW = 3;

export function rowsFrom(listings: RowSource[], max = 6): HomeRow[] {
  const rows: HomeRow[] = [];
  const used = new Set<string>();

  // City and category together, which is how somebody actually thinks: not
  // "stays", not "Lagos", but "somewhere to stay in Lagos".
  const groups = new Map<string, { title: string; items: RowSource[]; href: string }>();
  for (const l of listings) {
    const label = l.categoryLabel ?? "";
    // Both halves or neither: an unknown role has no filter to link to, so it
    // gets no row rather than a heading pointing at an empty category.
    if (!l.city || !label || !l.category) continue;
    const citySlug = l.citySlug || l.city;
    const key = `${citySlug}:${label}`;
    const hit = groups.get(key);
    if (hit) hit.items.push(l);
    else
      groups.set(key, {
        title: `${label} in ${l.city}`,
        items: [l],
        // The heading and the link it leads to are built from the same two
        // values, so the row can only ever point at itself.
        href: `/explore?category=${encodeURIComponent(l.category)}&city=${encodeURIComponent(citySlug)}`,
      });
  }

  const ranked = [...groups.entries()]
    .filter(([, g]) => g.items.length >= MIN_ROW)
    .sort((a, b) => b[1].items.length - a[1].items.length || a[1].title.localeCompare(b[1].title));

  let themed = 0;
  for (const [key, g] of ranked) {
    if (themed >= max) break;
    themed++;
    rows.push({ key, title: g.title, items: g.items.slice(0, 12), href: g.href });
    for (const l of g.items) if (l.id) used.add(l.id);
  }

  // Whatever no row claimed. A listing in a city with only one or two others
  // must still appear somewhere, or it is a real operator paying us to be
  // invisible.
  //
  // ONE CARD IS ENOUGH HERE, and only here. There used to be a "New on Sabię"
  // row at the top, and stragglers joined it when there were too few of them
  // to stand alone. With that row gone they have nowhere else to go, so the
  // bar drops to one. That is not the themed rows' rule being bent: a heading
  // that names a city and a category makes a promise this row does not make.
  // "More on Sabię" over a single card is thin. It is not wrong.
  const rest = listings
    .filter((l) => l.id && !used.has(l.id))
    // Newest first, so an operator captured this week is at the front of the
    // one row that carries everybody the themed rows missed.
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

  if (rest.length) {
    rows.push({
      key: "everywhere",
      // It only reads as "everywhere ELSE" when there is something for it to
      // be else to.
      title: rows.length ? "Everywhere else on Sabię" : "On Sabię",
      items: rest.slice(0, 12),
    });
  }

  return rows;
}
