import Image from "next/image";
import { Globe, Users, Sparkles, Shield } from "lucide-react";
import { cardClass } from "@/lib/ui-recipes";

// THE PAIN, IN THE ORDER IT ACTUALLY HAPPENS.
//
// Four beats, and the order is the argument: a date that is not a date, a
// price that moves, money one person fronts, and then the silence. Each one
// is the step where a group LOSES the decision it had just made, which is why
// the section ends on "nothing in that chat is a booking" rather than on us.
//
// Everything here is recognisable rather than measured, deliberately. The
// measured version of this page is sabieapp.com/sources and it is about the
// market, not about a reader's own group chat. What is behind these four, and
// not printed here because a visitor did not ask for our internals: of our own
// group trips, 15 of 43 never agreed a date at all, and the median one that
// never produced a booking has been open 210 days.
const PAIN = [
  {
    lead: "Somebody picks a weekend.",
    rest: "Three people react to it. Nobody has opened their calendar, so the date is still not a date.",
  },
  {
    lead: "Somebody sends a link.",
    rest: "By the time the fourth person opens it the price has moved, and the screenshot in the chat is already wrong.",
  },
  {
    lead: "Somebody pays to hold it.",
    rest: "Then spends the next few weeks asking five people for their share.",
  },
  {
    lead: "Somebody goes quiet.",
    rest: "Then everybody does. Months later the most organised one books their own flight, and the trip quietly becomes a smaller trip.",
  },
];

// The display face is set on h1 and h2 in globals.css, so anywhere else that
// wants it has to name it. The numerals do, because a serif numeral beside a
// sans sentence is what makes these read as an argument rather than a list.
const DISPLAY = "font-[family-name:var(--font-display)]";

const TEAM = [
  { name: "Donald Jr-Precious Okolocha", role: "Co-founder & CEO", image: "/images/team/team-1.jpg" },
  { name: "Kanyinsola Fakeye", role: "Co-founder & COO", image: "/images/team/team-2.jpg" },
  { name: "Mahamadou Mangane", role: "Co-founder & CFO", image: "/images/team/team-3.jpg" },
  { name: "Kanokwan Techathanapaiboon", role: "Brand Manager", image: "/images/team/Beam.JPG" },
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
// not a city we serve. He is describing the PROBLEM he had before Sabię,
// checking two sites and messaging six friends about prices and dates, and he
// is not claiming we sell Croatia.
//
// As of 15 Nov 2026 that quote is no longer a side note. "Message six friends
// about prices and dates" is now the first paragraph of this page in a real
// customer's own words, which is the strongest position a testimonial can be
// in and the reason to protect it. If the mission copy ever moves off the
// group again, this quote moves with it or comes out.
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-page text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-display sm:text-hero font-extrabold text-white mb-4 text-balance">About Sabię</h1>
          <p className="text-heading text-white/85 leading-relaxed">
            A trip is a group decision. We made it bookable.
          </p>
        </div>
      </section>

      {/* THE PAIN GETS ITS OWN SECTION, ABOVE THE MISSION.
          Added 15 Nov 2026. The first version of this change named the problem
          in one sentence inside Our Mission and then spent the rest of the
          page on us, which is the oldest mistake in a pitch: the reader has to
          recognise themselves BEFORE they care what we built. So the group
          chat gets the room, in four beats a reader has lived through, and the
          mission below is now purely the answer to it. */}
      <section className="border-y border-line bg-surface-sunken py-section">
        <div className="max-w-5xl mx-auto px-gutter sm:px-6 lg:px-8">
          <h2 className="text-title sm:text-display font-bold text-ink text-balance">
            Every trip starts in a group chat. Most of them end there too.
          </h2>
          <p className="mt-4 max-w-2xl text-heading leading-relaxed text-ink-muted">
            Not because nobody wanted to go. Because wanting to go and booking it are two different things, and a chat has nothing in between.
          </p>

          <ol className="mt-stack grid gap-6 sm:grid-cols-2">
            {PAIN.map((p, i) => (
              <li key={p.lead} className={`${cardClass()} flex gap-4`}>
                <span aria-hidden className={`${DISPLAY} text-title font-bold leading-none tabular-nums text-secondary-ink`}>
                  {i + 1}
                </span>
                <p className="min-w-0 text-text-muted leading-relaxed">
                  <strong className="font-semibold text-ink">{p.lead}</strong> {p.rest}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-stack text-title font-bold text-ink text-balance">
            Nothing in that chat is a booking.
          </p>
          <p className="mt-2 max-w-2xl text-text-muted leading-relaxed">
            Everyone agreed and nobody committed, so the thing you all wanted to do is still a message you scroll past.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-section">
        <div className="max-w-5xl mx-auto px-gutter sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-title font-bold text-ink mb-4">What we did about it</h2>
              {/* THE PROBLEM COMES FIRST NOW, AND THE CATALOGUE SECOND.
                  Changed 15 Nov 2026, and the reason is worth keeping.

                  Every other public surface we own already led with the
                  group. The App Store subtitle is "Plan trips with your
                  people", its description opens "Sabię is how you plan a trip
                  with the people you are going with", and its keywords
                  include "friends". This page led with the catalogue. So
                  searching the company returned a group trip product and
                  reading this page returned a booking site, which are two
                  different companies to anybody who checks, and checking is
                  the first thing an investor does.

                  The September version of this copy was right WHEN IT WAS
                  WRITTEN: the website had no trips then, so selling group
                  planning here would have named features that did not exist.
                  It has them now. A trip, the people on it, the chat and the
                  basket are all on this site. The invite link and the bill
                  split are still the iOS app's alone, which is why the copy
                  below claims one trip, one chat and one basket, and claims
                  no wallet and no splitting. */}
              <p className="text-text-muted leading-relaxed mb-4">
                Booking a hotel has been solved for twenty years. Everything else, the restaurants and the salons and the studios and the days out, still happens over phone calls, voice notes, and a cousin who knows somebody. So we go to those places ourselves, we film them, and we make them bookable.
              </p>
              <p className="text-text-muted leading-relaxed">
                Then we put them where the group already is. One trip, one chat, one basket, and a price that is still the price by the time everyone has said yes. The deciding and the booking happen in the same place, which is the only way a decision survives the week it was made in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Measured, not claimed. "Listings worldwide" was the worst of
                  the four: the cities collection holds Lagos, Abuja, Jos,
                  London, Nottingham, Bamako and Nouakchott, and the live
                  listings behind them, counted 15 Nov 2026, are 42 Lagos,
                  23 Abuja, 14 Jos, 3 London, 2 Nottingham, 1 Bamako and
                  1 Nouakchott. "AI-Powered" and "Verified" were the same
                  shape of claim the listing page was making with nothing
                  behind it. A smaller true number beats a big one a visitor
                  can disprove in one tap on Explore.

                  TOGETHER LEADS because the copy beside it now does. The
                  order of these four is the order of the argument: the group
                  is the problem, the visit is how we answer it, bookable is
                  what that buys, and Nigeria first is where. Nigeria first
                  stays at Lagos, Abuja and Jos deliberately: a city holding
                  one listing is not a city we serve, whatever the cities
                  collection says. */}
              {[
                { icon: Users, label: "Together", desc: "One trip, one chat, one basket" },
                { icon: Sparkles, label: "Visited", desc: "We went there ourselves" },
                { icon: Shield, label: "Bookable", desc: "A request, not a phone number" },
                { icon: Globe, label: "Nigeria first", desc: "Lagos, Abuja and Jos" },
              ].map((s) => (
                <div key={s.label} className="bg-card p-5 rounded-2xl border border-line text-center">
                  <s.icon size={24} className="mx-auto text-primary mb-2" />
                  <p className="font-bold text-small text-ink">{s.label}</p>
                  <p className="text-caption text-text-muted mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-page bg-card">
        <div className="max-w-5xl mx-auto px-gutter sm:px-6 lg:px-8">
          <h2 className="text-title font-bold text-ink text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TEAM.map((t) => (
              <div key={t.name} className="text-center">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden bg-surface-sunken mb-4">
                  <Image src={t.image} alt={t.name} fill className="object-cover" />
                </div>
                <h3 className="font-semibold text-small text-ink">{t.name}</h3>
                <p className="text-caption text-text-muted mt-0.5">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT BETA USERS SAID, moved here from under the home feed.
          They sat below every listing, so a visitor browsing hit a wall of
          marketing in the middle of what they were doing, and anybody who
          actually wanted to read them had to scroll past the whole
          catalogue. This is the page people open to find out who we are.

          Their words are not ours to edit; the note above the data says why
          nothing here is rewritten. `photo` is optional and falls back to an
          initial. */}
      <section className="py-section bg-card border-t border-line">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-title font-bold text-ink text-center mb-10">What people told us</h2>
          <div className={`grid gap-6 ${TESTIMONIALS.length > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-line bg-surface p-6">
                <blockquote className="text-ink leading-relaxed">&ldquo;{t.text}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {t.photo ? (
                    <Image src={t.photo} alt="" width={40} height={40} className="rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {t.avatar}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{t.name}</span>
                    <span className="block truncate text-small text-text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Backed By */}
      <section className="py-section">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-caption font-semibold text-text-muted uppercase tracking-widest mb-6">Backed by</p>
          <div className="flex items-center justify-center gap-12 opacity-60">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={140} height={36} />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={100} height={36} />
          </div>
        </div>
      </section>
    </div>
  );
}
