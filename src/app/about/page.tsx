import Image from "next/image";
import { Globe, Users, Sparkles, Shield } from "lucide-react";

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-page text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-display sm:text-hero font-extrabold text-white mb-4 text-balance">About Sabię</h1>
          <p className="text-heading text-white/85 leading-relaxed">
            We make a whole trip bookable, not just the bed you sleep in.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-section">
        <div className="max-w-5xl mx-auto px-gutter sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-title font-bold text-ink mb-4">Our Mission</h2>
              {/* The old copy here sold a planning tool: WhatsApp polls,
                  spreadsheet budgets, AI recommendations, expense splitting.
                  Three of those four name features this site does not have,
                  and the category as a whole is one a free group chat already
                  wins. This is the actual mission. */}
              <p className="text-text-muted leading-relaxed mb-4">
                Booking a hotel has been solved for twenty years. Everything else about a trip still happens over phone calls, voice notes, and a cousin who knows somebody.
              </p>
              <p className="text-text-muted leading-relaxed">
                So we go to the places the booking platforms never listed, the restaurants and the salons and the studios and the days out, we film them, and we make them bookable. A trip should be something you book, not something you arrange once you land.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Measured, not claimed. "Listings worldwide" was the worst of
                  the four: the cities collection holds Lagos, Abuja, Jos and
                  London live, and the 38 public listings are 20 Lagos, 7 Jos,
                  6 Abuja, 2 London, 1 Bamako. "AI-Powered" and "Verified" were
                  the same shape of claim the listing page was making with
                  nothing behind it. A smaller true number beats a big one a
                  visitor can disprove in one tap on Explore. */}
              {[
                { icon: Sparkles, label: "Visited", desc: "We went there ourselves" },
                { icon: Shield, label: "Bookable", desc: "A request, not a phone number" },
                { icon: Users, label: "Together", desc: "One trip the whole crew sees" },
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
