import Image from "next/image";
import { Globe, Users, Sparkles, Shield } from "lucide-react";

const TEAM = [
  { name: "Donald Jr-Precious Okolocha", role: "CEO & Founder", image: "/images/team/team-1.jpg" },
  { name: "Sandra Aziken", role: "COO", image: "/images/team/team-2.jpg" },
  { name: "Muhammed Ahmed", role: "CTO", image: "/images/team/team-3.jpg" },
  { name: "Beam Adetola", role: "Design Lead", image: "/images/team/Beam.JPG" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">About Sabię</h1>
          <p className="text-lg text-white/60 leading-relaxed">
            We&apos;re building the future of group travel — where planning is fun, booking is easy, and every trip actually happens.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Travel is better with friends. But planning a group trip? That&apos;s a nightmare of WhatsApp polls, spreadsheet budgets, and someone always ghosting the chat.
              </p>
              <p className="text-text-muted leading-relaxed">
                Sabię fixes all of that. We bring AI-powered recommendations, real-time collaboration, built-in expense splitting, and verified listings into one beautiful app. Plan together, book together, travel together.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Globe, label: "Global", desc: "Listings worldwide" },
                { icon: Sparkles, label: "AI-Powered", desc: "Smart recommendations" },
                { icon: Shield, label: "Verified", desc: "Trusted hosts" },
                { icon: Users, label: "Group-First", desc: "Built for crews" },
              ].map((s) => (
                <div key={s.label} className="bg-[#18181f] p-5 rounded-2xl border border-white/6 text-center">
                  <s.icon size={24} className="mx-auto text-secondary mb-2" />
                  <p className="font-bold text-sm text-white">{s.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-[#18181f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TEAM.map((t) => (
              <div key={t.name} className="text-center">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden bg-white/5 mb-4">
                  <Image src={t.image} alt={t.name} fill className="object-cover" />
                </div>
                <h3 className="font-semibold text-sm text-white">{t.name}</h3>
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
