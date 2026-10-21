"use client";

/**
 * The home page is the listings now.
 *
 * WHAT CHANGED AND WHY. This was a marketing site: a full-height hero selling
 * an iOS app, then features, then how it works, then an App Store CTA, with the
 * actual listings on a page almost nobody visited. Sabię is a two-sided
 * marketplace, so the listings ARE the product, and a page that describes the
 * product instead of showing it is a brochure for a shop you are standing in.
 *
 * ROWS, NOT A GRID. Twenty-eight listings in one grid reads as "everything we
 * have". The same twenty-eight in named rows reads as chosen, and a row running
 * off the right edge implies more without claiming it. Airbnb cannot show its
 * whole catalogue and so leads with search; we can, so we lead with the things.
 * Search starts beating a scroll somewhere past a hundred listings, and Scout
 * will get us there, but not this month.
 *
 * THE STORY DID NOT DIE, IT MOVED, and then it changed. It sits below the
 * listings, where somebody who has already scrolled past real places is the
 * right person to hear it. It used to read "Plan the trip back home, with the
 * crew"; "back home" scoped it to the diaspora trip when the sentence is true
 * of anyone going anywhere, and "plan" described a tool this site is not. The
 * App Store is one dismissible strip at the top and a link in the footer,
 * instead of the three separate asks it used to be.
 */

import Link from "next/link";
import { pillClass } from "@/lib/ui-recipes";
import EmptyState from "@/components/ui/EmptyState";
import LoadError from "@/components/ui/LoadError";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MapPin, Search, X } from "lucide-react";
import AppStrip from "@/components/AppStrip";
import MasonryFeed from "@/components/MasonryFeed";
import { getPublicCatalogue, listingPlace, categoryOf, categoryLabelOf, getListingImage, getListingPriceParts, CATEGORY_IDS, CATEGORY_LABELS, Listing } from "@/lib/listings";
import { getKnownCities, inCity, areaIndexFrom, type KnownCity } from "@/lib/listings";
import CityPicker from "@/components/CityPicker";
import { matchesSearch } from "@/lib/listing-search";
import { useReveal } from "@/lib/useReveal";
import { DEFAULT_CITY_ID } from "@/lib/listing-place";

// Built from the one table, not typed out again. A pill whose id no filter
// recognises is the same failure as a row heading that leads nowhere.
const CATEGORIES = [
  { id: "all", label: "All" },
  ...CATEGORY_IDS.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];


export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const revealRef = useReveal();
  const [failed, setFailed] = useState(false);

  // AN OUTAGE IS NOT AN EMPTY MARKETPLACE. This caught into [], so a
  // Firestore failure or a dropped connection told EVERY visitor "Nothing
  // here yet, we are adding places every week" on the front page.
  const load = useCallback(() => {
    setFailed(false);
    setLoading(true);
    getPublicCatalogue()
      .then(setListings)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  // THE CITY, like the app's header.
  //
  // Read from the shared `cities` collection, the same source Scout's area
  // picker and the app's sheet read, so a city going live is one edit in one
  // place and never a deploy here.
  //
  // Remembered per browser: somebody who picks Lagos should not have to pick
  // it again every visit, which is the first thing that makes this read as an
  // app rather than a page. localStorage can throw in a private window, so
  // both ends are wrapped and the feed simply starts everywhere.
  const [tab, setTab] = useState<string>("all");
  const [term, setTerm] = useState("");

  // ?category= comes from /explore, which redirects here and keeps its filter
  // so an old bookmark lands on the feed already narrowed rather than on a
  // fresh one. Read once on mount: after that the tabs own it.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c) setTab(c);
  }, []);
  // The sentinel for a deliberate "everywhere", so it survives a reload.
  const ALL_CITIES = "__all__";
  const [cities, setCities] = useState<KnownCity[]>([]);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => { getKnownCities().then(setCities).catch(() => {}); }, []);

  // LAGOS UNLESS SOMEBODY HAS SAID OTHERWISE, which is what the app does
  // and the website did not. This opened on every city at once, so the two
  // front doors sold different products.
  //
  // The saved choice still wins, and "All cities" is a real saved choice:
  // it is stored as a sentinel rather than by removing the key, or somebody
  // who deliberately chose to see everything would be put back in Lagos on
  // their next visit.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sabie.city");
      if (saved === ALL_CITIES) { setCity(null); return; }
      setCity(saved || DEFAULT_CITY_ID);
    } catch {
      // A private window cannot remember, so it gets the default rather
      // than the whole catalogue.
      setCity(DEFAULT_CITY_ID);
    }
  }, []);

  // WHAT IS ACTUALLY IN EACH CITY, counted from the feed we already hold
  // rather than fetched again. A city row that says "2 places" is the
  // cheapest possible version of the uncovered-country honesty: it is said
  // BEFORE somebody picks, not after.
  const cityCounts = useMemo(() => {
    const idx = areaIndexFrom(listings);
    const out: Record<string, number> = {};
    for (const c of cities) {
      out[c.id] = listings.filter((l) => inCity(l, c.id, cities, idx)).length;
    }
    return out;
  }, [listings, cities]);

  const pickCity = (id: string | null) => {
    setCity(id);
    try {
      window.localStorage.setItem("sabie.city", id ?? ALL_CITIES);
    } catch { /* the choice still applies to this visit */ }
  };

  // The place and the category are resolved here so the feed can be filtered
  // and ranked without every card working it out again.
  const feed = useMemo(() => {
    // inCity understands that Lekki and Ikeja are Lagos, but ONLY when it is
    // given the city list and the learned area index. Called with neither it
    // compares bare slugs, so every listing stored by its neighbourhood drops
    // out of its own city's feed: Lagos would lose most of its 31. Explore
    // passes both and so does this.
    const forCity = city
      ? listings.filter((l) => inCity(l, city, cities, areaIndexFrom(listings)))
      : listings;
    const placed = forCity.map((l) => {
      const place = listingPlace(l);
      return {
        ...l,
        city: place.city,
        citySlug: place.citySlug,
        // From the one role-to-category table, so the tab a visitor presses
        // and the category a card belongs to can never disagree.
        category: categoryOf(l.role, l.subCategory),
        categoryLabel: categoryLabelOf(l.role, l.subCategory),
      };
    });
    // THE TAB, applied where you stand.
    //
    // These used to be links to /explore: a page load, and a scroll position
    // lost. The app filters in place and so does this.
    const forTab = tab === "all" ? placed : placed.filter((l) => l.category === tab);
    // /explore was this page with a search box on it, so the box moved here
    // and /explore now points at it. One feed, one place to look.
    const found = term.trim() ? forTab.filter((l) => matchesSearch(l, term)) : forTab;

    // "FOR YOU" IS NOT A SHUFFLE. The app ranks it by how complete a listing
    // is (useForYouData.js:382), the point being that a listing with a price
    // and photos is a better first impression than one without. This is that
    // idea in its simplest honest form: a price, a photo and a place each
    // count, newest breaks the tie. No pretend personalisation.
    const score = (l: Listing) =>
      (getListingPriceParts(l, { rates: {}, ready: false, to: "" }).amount ? 2 : 0) +
      (getListingImage(l) ? 2 : 0) +
      (listingPlace(l).city ? 1 : 0);

    return [...found].sort((a, b) => score(b) - score(a));
  }, [listings, city, cities, tab, term]);

  return (
    <div ref={revealRef} className="min-h-screen bg-surface">
      <AppStrip />

      {/* ONE BAR, NOT A HERO.
          This was a 28px headline, a subtitle, a city row and a search box
          stacked down the page: the whole first screen spent saying what the
          site is to somebody who is already on it. Amazon opens on products
          and TikTok opens on video; neither pitches itself above the fold to
          a visitor who has already arrived. The pitch lives on /about.

          Sticky, because the city and the search are how you steer a feed and
          steering it should not mean scrolling back up to find the controls. */}
      <div data-sticky-filters className="sticky top-16 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {cities.length > 0 && (
            <CityPicker cities={cities} selected={city} onSelect={pickCity} counts={cityCounts} />
          )}

          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search places, food, experiences"
              aria-label="Search places"
              className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-9 text-body text-ink placeholder:text-ink-faint"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

      {/* THE TABS FILTER WHERE YOU STAND.
          These were links to /explore: a page load, and the scroll position
          gone. The app filters the feed in place, and the first tab is "For
          you" rather than "All" because it is not everything in no order, it
          is everything with the most complete listings first.

          Scrolling behaviour is explore's, which worked it out first:
          snap-mandatory so a flick lands on a chip rather than between two,
          and scroll-pl-4 because scroll-snap-align: start snaps to the
          SCROLLPORT edge and ignores padding.

          FILLED, NOT OUTLINED, and the active one is PURPLE. globals.css is
          explicit that purple is the action and gold is an accent that never
          fills something you press. */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 px-4 pb-3 sm:px-6 lg:px-8">
        {CATEGORIES.map((c) => {
          const active = tab === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setTab(c.id)}
              aria-pressed={active}
              className={`snap-start whitespace-nowrap ${pillClass({ size: "md", chosen: active })}`}
            >
              {c.id === "all" ? "For you" : c.label}
            </button>
          );
        })}
        </div>
      </div>

      {loading ? (
        // THREE ROWS, NOT ONE. The listings are fetched in the browser, so the
        // first paint is always this. A single skeleton row meant the page
        // stood at one row tall and then grew to six the moment the data
        // landed, shoving the story and the testimonials down the screen. That
        // jump is the other half of "it glitches a bit when it loads". Three is
        // the honest middle: close to what usually arrives, and never a promise
        // of rows that do not exist, because it carries no headings.
        // A SKELETON THE SHAPE OF THE WALL, with varied heights, because a
        // grid of identical rectangles that resolves into a ragged wall is
        // its own small jump. The ratios are the app's own skeleton pair
        // (GridSkeleton.js:33), so both surfaces wait in the same shape.
        <div className="flex gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          {[[1.33, 0.75, 1.5, 1.0], [0.75, 1.33, 1.21, 1.75]].map((column, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
              {column.map((ratio, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-2xl bg-surface-sunken" style={{ aspectRatio: `1 / ${ratio}` }} />
                  <div className="space-y-2 pt-3">
                    <div className="h-4 w-3/4 rounded-lg bg-surface-sunken" />
                    <div className="h-3 w-1/2 rounded-lg bg-surface-sunken" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : failed ? (
        <LoadError what="the places" onRetry={load} />
      ) : feed.length ? (
        <MasonryFeed listings={feed} />
      ) : (
        // Nothing to show is a thing to say plainly, not a thing to hide behind
        // an empty row with a heading over it.
        <EmptyState
          bare
          icon={<MapPin size={26} />}
          title="Nothing here yet"
          body="We are adding places every week. Try again shortly."
        />
      )}


      {/* THE STORY, THE TESTIMONIALS AND THE PARTNER LOGOS HAVE MOVED.
          They sat under the feed, which meant a visitor had to scroll past
          every listing to reach them and anybody browsing hit a wall of
          marketing in the middle of what they were doing. A feed does not end
          in a pitch. They live on /about, which exists and is linked from the
          footer on every page that has one. */}
    </div>
  );
}
