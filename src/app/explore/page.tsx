"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, MapPin, Sparkles, ChevronDown } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getListingsByCategory, getFeaturedListings, listingPlace, citiesOf, inCity, areaIndexFrom, getKnownCities, CATEGORY_IDS, CATEGORY_LABELS, Listing, type KnownCity } from "@/lib/listings";
import { useReveal } from "@/lib/useReveal";

// Built from the one table in categories.ts, not typed out again. A pill whose
// id no filter recognises is the same failure as a row heading leading nowhere.
const CATEGORY_ICONS: Record<string, typeof Sparkles> = { stays: MapPin };

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  ...CATEGORY_IDS.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    icon: CATEGORY_ICONS[id] ?? Sparkles,
  })),
];

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreLoading />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreLoading() {
  return (
    <div className="min-h-screen bg-surface pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden bg-card border border-line">
              <div className="aspect-[4/3] bg-surface-sunken" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 rounded-lg bg-surface-sunken" />
                <div className="h-3 w-1/2 rounded-lg bg-surface-sunken" />
                <div className="h-4 w-1/3 rounded-lg bg-surface-sunken" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialCity = searchParams.get("city") || "all";
  const router = useRouter();
  const revealRef = useReveal();

  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [listings, setListings] = useState<Listing[]>([]);
  const [knownCities, setKnownCities] = useState<KnownCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchListings = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const data = cat === "all"
        ? await getFeaturedListings(40)
        : await getListingsByCategory(cat, 40);
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(category);
  }, [category, fetchListings]);

  // Fetched once, never blocking: with no list the filter simply does not fold
  // areas onto their cities, which is how it behaved before this existed.
  useEffect(() => {
    void getKnownCities().then(setKnownCities);
  }, []);

  /**
   * Put the filters back in the address bar.
   *
   * `category` was already READ from the URL and never written to it, so a
   * link into a category worked while a link OUT of one did not: a person who
   * filtered to Jos could not send anyone what they were looking at. Sharing a
   * filtered view is the whole reason this is a query string and not state.
   *
   * replace, not push, so the back button leaves the page rather than walking
   * back through every filter tap. Defaults are omitted so a plain /explore
   * stays a plain /explore.
   */
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (city !== "all") params.set("city", city);
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }, [category, city, router]);

  /**
   * The cities on offer are the cities that are HERE, counted from the
   * listings themselves. A hardcoded list, or one read from the `cities`
   * collection, would offer a city with nothing in it, and an option that
   * always returns "No listings found" is worse than no option: it reads as a
   * broken site rather than an empty one.
   *
   * Recomputed per category, so switching to Events does not leave a city
   * selected that has no events in it.
   */
  const cities = useMemo(() => citiesOf(listings, knownCities), [listings, knownCities]);
  // The same evidence citiesOf uses, so the options and the filtering agree.
  const areaIndex = useMemo(() => areaIndexFrom(listings), [listings]);

  // A city that vanished with the category must not keep filtering invisibly.
  useEffect(() => {
    if (city !== "all" && !loading && !cities.some((c) => c.slug === city)) setCity("all");
  }, [cities, city, loading]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((l) => {
      const place = listingPlace(l);
      // Folded the same way the options are, or a listing that recorded Ikeja
      // vanishes the moment somebody picks Lagos.
      if (!inCity(l, city, knownCities, areaIndex)) return false;
      if (!q) return true;
      const name = (l.businessName || l.title || "").toLowerCase();
      const desc = (l.description || "").toLowerCase();
      // Searching location used to read `location` only when it was a STRING,
      // so a listing Studio created could not be found by typing its city.
      // Every part of the place is searchable now, in both stored shapes.
      const where = [place.label, place.city, place.area].join(" ").toLowerCase();
      return name.includes(q) || where.includes(q) || desc.includes(q);
    });
  }, [listings, searchQuery, city, knownCities, areaIndex]);

  return (
    <div ref={revealRef} className="min-h-screen bg-surface">
      {/* Hero header.
          THE RATIO, NOT THE PALETTE. This was a full-bleed saturated purple
          gradient over the top third of the page with a bright gold pill on
          it, and the colours were never wrong: #44366D and #FFD369 are the
          brand. The proportions were. Count the guideline's own fills and it
          leads with the off-white 27 times, gold 22, charcoal 21, and the deep
          purple 8. Purple is an accent there. Using it as the field inverted
          the brand's own ratio, which is why the page read as "yellow and
          purple" rather than as Sabię.

          So the field is the off-white, the words are charcoal, and the two
          brand colours do the job they are for: purple marks where you are,
          gold marks the thing to press. One meaning per colour, kept.

          The two blurred blobs went with it. They existed to give a dark
          gradient some depth; on a near-white ground they are smudges, and
          they were animating forever on every visit for nothing. */}
      <div className="relative bg-surface-sunken border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl text-ink mb-3">Explore Listings</h1>
            {/* Was "anywhere in the world", over a catalogue that is Nigeria
                plus a little London. Same class of thing as the hint that said
                three when six was allowed: a sentence the page cannot keep. */}
            <p className="text-ink-muted max-w-md mx-auto">Stays, experiences and places to eat, from the people who run them</p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className={`relative transition-all duration-300 ${searchFocused ? "scale-[1.02]" : ""}`}>
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              {/* An accessible NAME, not a visible label. A hero search bar
                  with a magnifier in it explains itself to anyone who can see
                  it, so a label above would be noise; a screen reader still got
                  an unnamed edit box, which is the part that was broken.
                  type="search" also gets the platform's clear affordance and
                  the right keyboard. */}
              <input
                type="search"
                aria-label="Search destinations, stays and experiences"
                placeholder="Search destinations, stays, experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-13 pr-12 py-4 rounded-2xl bg-card border border-line text-ink placeholder:text-ink-faint text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center text-ink-faint hover:text-ink transition-colors rounded-xl"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Category pills.
              justify-center on an overflowing flex row centres the overflow,
              which clips BOTH ends and leaves no way to scroll back to the
              start. At 390px that pushed "All" off the left edge entirely, so
              the filter that clears the others could not be reached on a
              phone, and "Food & Drink" was sliced on the right with nothing to
              say the row scrolled. Start-aligned while it overflows, centred
              once there is room for the whole row; the negative margin lets it
              bleed to the screen edge while the padding keeps a gutter, which
              is what makes a half-visible chip read as "there is more".
              snap-x so a flick lands on a chip rather than between two, with
              scroll-pl-4 because scroll-snap-align: start snaps to the
              SCROLLPORT edge and ignores padding: without it the row silently
              scrolled itself 14px on load and ate the gutter it had just been
              given. */}
          <div
            className="flex justify-start sm:justify-center gap-2 mt-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:scroll-pl-0 pb-1 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                // Purple for the selected one, not gold. The pill says WHERE
                // YOU ARE, and gold is spoken for: it is the colour of the
                // thing to press, on the Sign up button and on a Book button.
                // One meaning per colour is what stops a palette becoming
                // decoration. Purple on white also holds its edge against its
                // neighbours in a way a pale gold does not, and state is the
                // one thing that must never be ambiguous.
                className={`snap-start shrink-0 px-6 py-2.5 rounded-full text-small font-semibold whitespace-nowrap transition-colors duration-200 ${
                  category === c.id
                    ? "bg-primary text-white"
                    : "bg-card border border-line text-ink-muted hover:text-ink hover:border-line-strong"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-text-muted">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span><strong className="text-ink">{filtered.length}</strong> listing{filtered.length !== 1 ? "s" : ""} found</span>
            )}
          </p>

          {/* A native <select>, deliberately. It is a SECOND filter and must
              not compete with the category pills on the hero, the list grows
              as cities do, and the platform picker beats anything we would
              build for a thumb. It gets our own chevron because the browser's
              differs on every OS. Hidden entirely until there is a real choice
              to make: one city is not a filter. */}
          {cities.length > 1 && (
            <div className="relative shrink-0">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" aria-hidden="true" />
              <select
                aria-label="Filter by city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="appearance-none bg-card border border-line rounded-xl h-11 pl-9 pr-9 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              >
                <option value="all">Everywhere</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name} ({c.count})</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" aria-hidden="true" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl overflow-hidden bg-card border border-line">
                <div className="aspect-[4/3] bg-surface-sunken animate-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-3/4 rounded-lg bg-surface-sunken" />
                  <div className="h-3 w-1/2 rounded-lg bg-surface-sunken" />
                  <div className="h-4 w-1/3 rounded-lg bg-surface-sunken" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">No listings found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              {city !== "all"
                ? "Nothing here in that city yet. Try everywhere, or another category."
                : "Try a different search term or browse another category"}
            </p>
            <button onClick={() => { setSearchQuery(""); setCategory("all"); setCity("all"); }} className="mt-6 text-sm font-semibold text-primary hover:underline underline-offset-4">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
            {filtered.map((listing, i) => (
              <div key={listing.id} className="reveal">
                <ListingCard listing={listing} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
