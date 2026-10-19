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

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, MapPin } from "lucide-react";
import AppStrip from "@/components/AppStrip";
import MasonryFeed from "@/components/MasonryFeed";
import { getFeaturedListings, listingPlace, categoryOf, categoryLabelOf, getListingImage, getListingPriceParts, CATEGORY_IDS, CATEGORY_LABELS, Listing } from "@/lib/listings";
import { getKnownCities, inCity, areaIndexFrom, type KnownCity } from "@/lib/listings";
import CityPicker from "@/components/CityPicker";
import { useReveal } from "@/lib/useReveal";

// Built from the one table, not typed out again. A pill whose id no filter
// recognises is the same failure as a row heading that leads nowhere.
const CATEGORIES = [
  { id: "all", label: "All" },
  ...CATEGORY_IDS.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

// Real beta-user testimonials, tightened from raw transcripts. `photo` is
// optional and falls back to an initial avatar.
//
// THEIR WORDS ARE NOT OURS TO EDIT, and that rule decided what happened here.
// Everything else on this page is copy we can make truer by rewriting it. A
// testimonial is a different object: it is a claim that a NAMED person, under
// their own photo, said a specific thing. Trimming a quote to fit the
// positioning makes them say something they did not say, in public, and it is
// the one thing on this page a reader could never check. So a quote that no
// longer fits gets CUT, never shortened.
//
// CUT ON 2026-09-27: Tolu O. ("Chatted with Bie, planned my whole trip, booked
// a place, and set up a shared wallet with the crew. UI's clean too, easy on
// the eye."). It is a good quote and it is true of the iOS app. It came out
// because it named the shared wallet three cards below a section that had just
// stopped offering one, so the page contradicted itself in a reader's own
// words. Put it back the day the website does wallets, or ask Tolu for a line
// about finding and asking a place.
//
// KEPT DELIBERATELY: Seb's "plan a Croatia trip" survives although Croatia is
// not a city we serve and "plan" is a word this site no longer uses. He is
// describing the PROBLEM he had before Sabię, checking two sites and messaging
// six friends, which is the same problem the section above now describes. He
// is not claiming we sell Croatia.
//
// Their dashes stay for the same reason the quotes do: these are real people's
// words, and editing them to fit a style guide is worse than the style miss.
const TESTIMONIALS: { name: string; role: string; text: string; avatar: string; photo?: string }[] = [
  {
    name: "Maureen N.",
    role: "Birmingham · originally from Nigeria",
    text: "Honestly the app's amazing. Everything that needs to be done is done. Insane potential — feels like the start of something.",
    avatar: "M",
  },
  {
    name: "Seb F.",
    role: "London",
    text: "Trying to plan a Croatia trip in August, I had to check Airbnb and Booking.com, then message six friends about prices and dates. Sabię puts it all in one place. I was literally thinking 'someone should build this' a few weeks ago — and here it is.",
    avatar: "S",
    photo: "/images/testimonials/seb-finlan.jpg",
  },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const revealRef = useReveal();

  useEffect(() => {
    getFeaturedListings(40)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

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
  const [cities, setCities] = useState<KnownCity[]>([]);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => { getKnownCities().then(setCities).catch(() => {}); }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sabie.city");
      if (saved) setCity(saved);
    } catch { /* private window, or storage blocked */ }
  }, []);

  const pickCity = (id: string | null) => {
    setCity(id);
    try {
      if (id) window.localStorage.setItem("sabie.city", id);
      else window.localStorage.removeItem("sabie.city");
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

    // "FOR YOU" IS NOT A SHUFFLE. The app ranks it by how complete a listing
    // is (useForYouData.js:382), the point being that a listing with a price
    // and photos is a better first impression than one without. This is that
    // idea in its simplest honest form: a price, a photo and a place each
    // count, newest breaks the tie. No pretend personalisation.
    const score = (l: Listing) =>
      (getListingPriceParts(l, { rates: {}, ready: false, to: "" }).amount ? 2 : 0) +
      (getListingImage(l) ? 2 : 0) +
      (listingPlace(l).city ? 1 : 0);

    return [...forTab].sort((a, b) => score(b) - score(a));
  }, [listings, city, cities, tab]);

  return (
    <div ref={revealRef} className="min-h-screen bg-surface">
      <AppStrip />

      {/* One line saying what this is, and then out of the way. It replaces a
          92vh hero whose height was set by the viewport rather than by having
          anything that tall to say. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6">
        <h1 className="text-[28px] sm:text-4xl text-ink leading-tight">Places worth the trip</h1>
        <p className="mt-2.5 text-[15px] sm:text-base text-ink-muted max-w-md leading-relaxed">
          Stays, experiences and places to eat, from the people who run them.
        </p>
        {/* THE CITY, where the app puts it. The feed leans toward one place
            rather than pretending to cover everywhere, and the sheet says so
            in Sabię's own words. Rendered only once the cities have loaded,
            so there is no control that answers "Everywhere" for a moment and
            then changes its mind. */}
        {cities.length > 0 && (
          <div className="mt-5 flex items-center gap-2 text-ink-muted">
            <span className="text-sm">Showing</span>
            <CityPicker cities={cities} selected={city} onSelect={pickCity} />
          </div>
        )}
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
      <div className="flex justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 px-4 sm:px-6 lg:px-8 sm:scroll-pl-0 pb-10">
        {CATEGORIES.map((c) => {
          const active = tab === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setTab(c.id)}
              aria-pressed={active}
              className={`snap-start shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "bg-surface-sunken text-ink-muted hover:bg-line/40 hover:text-ink"
              }`}
            >
              {c.id === "all" ? "For you" : c.label}
            </button>
          );
        })}
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
        <div className="mx-auto flex max-w-7xl gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
          {[[1.33, 0.75, 1.5, 1.0], [0.75, 1.33, 1.21, 1.75]].map((column, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5">
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
      ) : feed.length ? (
        <MasonryFeed listings={feed} />
      ) : (
        // Nothing to show is a thing to say plainly, not a thing to hide behind
        // an empty row with a heading over it.
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <MapPin size={26} className="text-primary/50" />
          </div>
          <h2 className="text-xl text-ink mb-2">Nothing here yet</h2>
          <p className="text-sm text-ink-muted max-w-sm mx-auto">
            We are adding places every week. Try again shortly.
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
          See everything <ArrowRight size={16} />
        </Link>
      </div>

      {/* ── The crew story, below the listings rather than instead of them ── */}
      <section className="mt-6 bg-surface-sunken border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.18em] mb-4">
              <Sparkles size={13} /> Going with people
            </p>
            {/* "BACK HOME" IS GONE, at the founder's call. It scoped the
                whole section to the diaspora trip, and the same sentence is
                true of anybody going anywhere. The headline also stopped
                saying "plan": this section used to promise "vote on where to
                go, split what it costs", and neither exists anywhere on this
                website, with the button underneath going to /explore, which
                is a list of places.

                What replaces it names where the good spots actually come from
                today, which is the honest version of the problem: Instagram
                and somebody's chat. */}
            <h2 className="text-3xl sm:text-4xl text-ink leading-tight">
              Keep the whole trip in one place.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-body leading-relaxed">
              The good spots live on Instagram and in someone&apos;s chat. Find them here,
              ask the business, and stop running the trip across six group chats.
            </p>
            <Link
              href="/explore"
              className="mt-7 inline-flex items-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-bold px-7 py-3.5 rounded-full transition-colors"
            >
              See what&apos;s live <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl text-ink mb-8">What people say</h2>
          {/* The column count follows the DATA, not a fixed three. Cutting a
              quote left a hardcoded md:grid-cols-3 with two cards in it, so
              desktop showed an empty third column: a visible hole where a
              testimonial used to be, which advertises the removal. Two cards
              now fill a two-column grid. */}
          <div className={`grid gap-5 stagger-children ${TESTIMONIALS.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="reveal bg-card p-6 rounded-2xl border border-line">
                {/* The five identical gold stars are gone. Three perfect ratings
                    in a row read as manufactured even when every word is true,
                    and the words are the convincing part. */}
                <blockquote className="text-sm text-ink-body leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  {t.photo ? (
                    <Image src={t.photo} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {t.avatar}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink truncate">{t.name}</span>
                    <span className="block text-xs text-ink-muted truncate">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Backed by ── */}
      <section className="py-12 bg-card border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
          <p className="text-center text-[10px] font-bold text-ink-faint uppercase tracking-[0.3em] mb-7">Backed by</p>
          <div className="flex items-center justify-center gap-12 sm:gap-16 opacity-50">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={140} height={36} />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={104} height={36} />
          </div>
        </div>
      </section>
    </div>
  );
}
