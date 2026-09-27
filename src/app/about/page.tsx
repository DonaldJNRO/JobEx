import Image from "next/image";
import { Globe, Users, Sparkles, Shield } from "lucide-react";

const TEAM = [
  { name: "Donald Jr-Precious Okolocha", role: "Co-founder & CEO", image: "/images/team/team-1.jpg" },
  { name: "Kanyinsola Fakeye", role: "Co-founder & COO", image: "/images/team/team-2.jpg" },
  { name: "Mahamadou Mangane", role: "Co-founder & CFO", image: "/images/team/team-3.jpg" },
  { name: "Kanokwan Techathanapaiboon", role: "Brand Manager", image: "/images/team/Beam.JPG" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-page text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">About Sabię</h1>
          <p className="text-lg text-white/85 leading-relaxed">
            We make a whole trip bookable, not just the bed you sleep in.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-4">Our Mission</h2>
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
                  <p className="font-bold text-sm text-ink">{s.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TEAM.map((t) => (
              <div key={t.name} className="text-center">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden bg-surface-sunken mb-4">
                  <Image src={t.image} alt={t.name} fill className="object-cover" />
                </div>
                <h3 className="font-semibold text-sm text-ink">{t.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Backed By */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">Backed by</p>
          <div className="flex items-center justify-center gap-12 opacity-60">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={140} height={36} />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={100} height={36} />
          </div>
        </div>
      </section>
    </div>
  );
}
