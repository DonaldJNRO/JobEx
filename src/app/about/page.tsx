import Image from "next/image";
import { Globe, Users, Sparkles, Shield } from "lucide-react";
import { cardClass } from "@/lib/ui-recipes";

// THE PROBLEM, AND IT HAS TWO SIDES BECAUSE WE ARE A MARKETPLACE.
//
// CORRECTED 15 Nov 2026, and the correction is the point. The first version
// of this section was the group chat: a date nobody agreed, a price that
// moved, one person fronting the money. It was recognisable and it was the
// wrong problem, because it is a TRAVELLER'S problem and nothing in it
// touches supply. An operator does not care whether her friends agreed a
// date. A marketplace that explains one side of itself has explained
// nothing.
//
// The deck has this right and this page now matches it. A business that is
// on no register cannot be checked, so the traveller has nothing to look up
// and the business has no way to prove itself, and both of them are stuck on
// the same missing thing. That is one problem with two faces, it covers
// supply and demand in one sentence, and it is why we go in person at all.
//
// The group stays in the product and comes back as ONE LINE in the answer
// below, where it belongs: it is how a trip gets booked, not why anybody
// needs us.
const PROBLEM = [
  {
    eyebrow: "The traveller",
    lead: "She has no way to check.",
    body: "She finds the place on Instagram, because there is nowhere else to look. The one check the market offers, a visit, a housekeeper, a phone call, can be bought. So she transfers the money to a stranger, because a transfer is the only way to pay, and a transfer cannot be undone. She finds out in December.",
  },
  {
    eyebrow: "The business",
    lead: "It has no way to be checked.",
    body: "It is real, it is good, and it is on no register, so there is nothing for her to look up. It never applied to a platform, keeps no live calendar and cannot take a card from London. It can be recommended and it cannot be booked, so it waits for whoever walks past the door.",
  },
];

// The display face is set on h1 and h2 in globals.css, so anywhere else that
// wants it has to name it.
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
            The trusted way to discover, book and pay for real experiences back home.
          </p>
        </div>
      </section>

      {/* THE PROBLEM GETS ITS OWN SECTION, ABOVE THE ANSWER.
          A reader has to recognise the problem before caring what we built,
          and a marketplace has two readers. So: the heading states the one
          problem, the two cards are its two faces, and the line underneath
          says the thing neither card can say alone. The answer follows. */}
      <section className="border-y border-line bg-surface-sunken py-section">
        <div className="max-w-5xl mx-auto px-gutter sm:px-6 lg:px-8">
          <h2 className="text-title sm:text-display font-bold text-ink text-balance">
            Nobody can tell a real business from a fake one.
          </h2>
          <p className="mt-4 max-w-2xl text-heading leading-relaxed text-ink-muted">
            Not the traveller sending the money, and not the business trying to take it. Most of the places worth going to are too small to be on any register, so there is nothing to check and no way to prove it.
          </p>

          <div className="mt-stack grid gap-6 sm:grid-cols-2">
            {PROBLEM.map((c) => (
              <div key={c.eyebrow} className={cardClass({ pad: "lg" })}>
                <p className={`${DISPLAY} text-caption font-semibold uppercase tracking-widest text-secondary-ink`}>
                  {c.eyebrow}
                </p>
                <p className="mt-3 text-heading font-bold text-ink">{c.lead}</p>
                <p className="mt-2 text-text-muted leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-stack text-title font-bold text-ink text-balance">
            Neither side is the problem. The missing layer between them is.
          </p>
          <p className="mt-2 max-w-2xl text-text-muted leading-relaxed">
            Every scam in this market is paid before anyone turns up, and every good business in it is unbookable for exactly the same reason.
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
              <p className="text-text-muted leading-relaxed mb-4">
                A named representative walks in, films the place, records her own prices, and we run the shopfront until she claims it. She fills in no forms, because there was never a form. And the money waits: a licensed provider holds it until the guest has been, so a fake listing earns nothing and there is no reason to build one.
              </p>
              <p className="text-text-muted leading-relaxed">
                Nobody goes home alone, so the trip, the chat and the basket are one place. What the group decides is a thing the group can actually book.
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

                  THE ORDER IS THE ARGUMENT, and it follows the copy beside
                  it: we went, so it can be booked, so a group can book it,
                  and here is where. Together sits third rather than first
                  because it is how a trip gets booked, not why anybody needs
                  us. Nigeria first stays at Lagos, Abuja and Jos
                  deliberately: a city holding one listing is not a city we
                  serve, whatever the cities collection says. */}
              {[
                { icon: Sparkles, label: "Visited", desc: "We went there ourselves" },
                { icon: Shield, label: "Bookable", desc: "A request, not a phone number" },
                { icon: Users, label: "Together", desc: "One trip, one chat, one basket" },
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
