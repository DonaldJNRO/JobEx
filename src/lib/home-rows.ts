/**
 * The home page as rows, not a grid.
 *
 * WHY ROWS. Twenty-eight listings laid out as one grid reads as "everything we
 * have". The same twenty-eight in four named rows reads as "chosen for you",
 * and a row that runs off the right edge implies there is more. Airbnb cannot
 * show you its whole catalogue and so has no choice; we can, and showing it all
 * at once is the one thing that would make a young marketplace look empty.
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
  createdAt?: { seconds: number };
}

export interface HomeRow {
  key: string;
  title: string;
  items: RowSource[];
}

/** The four category groupings, in the words the site already uses. */
const CATEGORY_OF: Record<string, string> = {
  Landlord: "Stays",
  Host: "Stays",
  HospitalityManager: "Stays",
  ExperienceProviders: "Experiences",
  EventOrganizer: "Events",
  FoodBeverageManager: "Food & Drink",
};

/**
 * A row needs enough in it to look deliberate. Two cards under a heading looks
 * like a gap where a row should be, so anything thinner is folded into the
 * catch-all rather than shown as its own.
 */
const MIN_ROW = 3;

export function rowsFrom(listings: RowSource[], max = 6): HomeRow[] {
  const rows: HomeRow[] = [];
  const used = new Set<string>();

  // Newest first, so the top row is always the freshest thing on the platform
  // and an operator captured this week sees themselves near the top.
  const byNew = [...listings].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
  );
  const newest = byNew.slice(0, 12);
  // Below the minimum there is no New row, so nothing it would have held can
  // be counted as already shown. Marking them used anyway was a bug: with two
  // listings in total the page came out with no rows at all.
  const hasNewRow = newest.length >= MIN_ROW;
  if (hasNewRow) rows.push({ key: "new", title: "New on Sabię", items: newest });

  // City and category together, which is how somebody actually thinks: not
  // "stays", not "Lagos", but "somewhere to stay in Lagos".
  const groups = new Map<string, { title: string; items: RowSource[]; city: string }>();
  for (const l of listings) {
    const category = CATEGORY_OF[l.role ?? ""] ?? "";
    if (!l.city || !category) continue;
    const key = `${l.citySlug || l.city}:${category}`;
    const hit = groups.get(key);
    if (hit) hit.items.push(l);
    else groups.set(key, { title: `${category} in ${l.city}`, items: [l], city: l.city });
  }

  const ranked = [...groups.entries()]
    .filter(([, g]) => g.items.length >= MIN_ROW)
    .sort((a, b) => b[1].items.length - a[1].items.length || a[1].title.localeCompare(b[1].title));

  // Counted separately from the New row, which is always there and is not one
  // of the themed rows this cap is about.
  let themed = 0;
  for (const [key, g] of ranked) {
    if (themed >= max) break;
    themed++;
    rows.push({ key, title: g.title, items: g.items.slice(0, 12) });
    for (const l of g.items) if (l.id) used.add(l.id);
  }

  // Whatever no row claimed, INCLUDING the New row. A listing in a city with
  // only one or two others must still appear somewhere, or it is a real
  // operator paying us to be invisible.
  if (hasNewRow) for (const l of newest) if (l.id) used.add(l.id);
  const rest = listings.filter((l) => l.id && !used.has(l.id));

  if (rest.length >= MIN_ROW) {
    rows.push({ key: "everywhere", title: "Everywhere else on Sabię", items: rest.slice(0, 12) });
  } else if (rest.length) {
    // One or two leftovers do not get a heading of their own: a lone card
    // under a title reads as a broken row, which is the same rule the themed
    // rows follow. They join the New row instead, where they are visible and
    // the row does not look like it failed to load.
    const first = rows.find((r) => r.key === "new");
    if (first) first.items = [...first.items, ...rest].slice(0, 14);
    else rows.push({ key: "everywhere", title: "On Sabię", items: rest });
  }

  return rows;
}
