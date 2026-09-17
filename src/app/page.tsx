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
 * THE STORY DID NOT DIE, IT MOVED. "Plan the trip back home, with the crew" is
 * the sharpest thing Sabię says and the only line that separates it from a
 * directory. It sits below the listings, where somebody who has already scrolled
 * past real places is the right person to hear it. The App Store is one
 * dismissible strip at the top and a link in the footer, instead of the three
 * separate asks it used to be.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, MapPin } from "lucide-react";
import AppStrip from "@/components/AppStrip";
import ListingRow from "@/components/ListingRow";
import { getFeaturedListings, listingPlace, categoryOf, categoryLabelOf, CATEGORY_IDS, CATEGORY_LABELS, Listing } from "@/lib/listings";
import { rowsFrom } from "@/lib/home-rows";
import { useReveal } from "@/lib/useReveal";

// Built from the one table, not typed out again. A pill whose id no filter
// recognises is the same failure as a row heading that leads nowhere.
const CATEGORIES = [
  { id: "all", label: "All" },
  ...CATEGORY_IDS.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

// Real beta-user testimonials, tightened from raw transcripts. `photo` is
// optional and falls back to an initial avatar. Their dashes stay: these are
// quotes from real people, and editing somebody's words to fit a style guide
// is worse than the style miss.
const TESTIMONIALS: { name: string; role: string; text: string; avatar: string; photo?: string }[] = [
  {
    name: "Tolu O.",
    role: "London · originally from Lagos",
    text: "Chatted with Bie, planned my whole trip, booked a place, and set up a shared wallet with the crew. UI's clean too — easy on the eye.",
    avatar: "T",
    photo: "/images/testimonials/tolu-omidan.jpg",
  },
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

  // The place is resolved here, so home-rows.ts imports nothing and stays
  // loadable by plain node for its test.
  const rows = useMemo(() => {
    const placed = listings.map((l) => {
      const place = listingPlace(l);
      return {
        ...l,
        city: place.city,
        citySlug: place.citySlug,
        // Resolved here for the same reason the place is: home-rows.ts imports
        // nothing, so plain node can load it for its test. It also means the
        // row heading and the filter it links to read the one table.
        category: categoryOf(l.role, l.subCategory),
        categoryLabel: categoryLabelOf(l.role, l.subCategory),
      };
    });
    return rowsFrom(placed).map((r) => ({
      ...r,
      items: r.items as unknown as Listing[],
    }));
  }, [listings]);

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
      </div>

      {/* Same pills as explore, and they go to explore. The home page shows
          what is here; explore is where you narrow it down.

          FILLED, NOT OUTLINED. Once the cards lost their borders these were the
          only drawn edges above the fold, and a row of outlined pills over a
          page of borderless photographs looks like two designs meeting. A
          filled pill still reads as tappable without drawing a line to say so. */}
      <div className="flex justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 px-4 sm:px-6 lg:px-8 pb-10">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={c.id === "all" ? "/explore" : `/explore?category=${c.id}`}
            className="snap-start shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap bg-surface-sunken text-ink-muted hover:bg-line/40 hover:text-ink transition-colors"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {loading ? (
        // THREE ROWS, NOT ONE. The listings are fetched in the browser, so the
        // first paint is always this. A single skeleton row meant the page
        // stood at one row tall and then grew to six the moment the data
        // landed, shoving the story and the testimonials down the screen. That
        // jump is the other half of "it glitches a bit when it loads". Three is
        // the honest middle: close to what usually arrives, and never a promise
        // of rows that do not exist, because it carries no headings.
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} className="mb-14 sm:mb-16">
              <div className="h-6 w-40 rounded-lg bg-surface-sunken animate-pulse mb-5" />
              <div className="flex gap-5 sm:gap-6 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[70%] sm:w-[45%] lg:w-[23%] animate-pulse">
                    <div className="aspect-[4/3] rounded-2xl bg-surface-sunken" />
                    <div className="pt-3 space-y-2">
                      <div className="h-4 w-3/4 rounded-lg bg-surface-sunken" />
                      <div className="h-3 w-1/2 rounded-lg bg-surface-sunken" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : rows.length ? (
        rows.map((r) => <ListingRow key={r.key} title={r.title} href={r.href} items={r.items} />)
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
            <h2 className="text-3xl sm:text-4xl text-ink leading-tight">
              Plan the trip back home, with the crew.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-body leading-relaxed">
              Booking one place is the easy part. Sabię is where the whole group plans it:
              vote on where to go, split what it costs, and keep it in one place instead of
              six group chats.
            </p>
            <Link
              href="/explore"
              className="mt-7 inline-flex items-center gap-2.5 bg-secondary hover:bg-secondary-dark text-neutral-dark font-bold px-7 py-3.5 rounded-full transition-colors"
            >
              Start with somewhere to go <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl text-ink mb-8">What people say</h2>
          <div className="grid md:grid-cols-3 gap-5 stagger-children">
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
