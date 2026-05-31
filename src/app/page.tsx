"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, Sparkles, Wallet, MessageCircle, ArrowRight, ChevronRight, Globe, Shield, Zap, Star, Smartphone } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getFeaturedListings, Listing } from "@/lib/listings";
import { useReveal } from "@/lib/useReveal";
import WaitlistForm from "@/components/WaitlistForm";

// TestFlight public link — lets visitors install Sabīę BEFORE the App Store
// approval lands. Flip back to the real App Store URL when Apple approves.
const TESTFLIGHT_URL = "https://testflight.apple.com/join/d94TEDU7";

const FEATURES = [
  { icon: Users, title: "Group Planning", desc: "Real-time collaboration with your whole crew", color: "from-blue-500/20 to-purple-500/20" },
  { icon: Sparkles, title: "AI Recommendations", desc: "Bie finds places personalized to your vibe", color: "from-amber-500/20 to-orange-500/20" },
  { icon: Wallet, title: "Split Expenses", desc: "Built-in cost splitting — no more IOUs", color: "from-green-500/20 to-emerald-500/20" },
  { icon: MessageCircle, title: "Trip Chat", desc: "Everything in one place, not 10 group chats", color: "from-pink-500/20 to-rose-500/20" },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Travel Creator", text: "Sabię made planning our group trip to Morocco actually fun. The AI suggestions were spot-on.", avatar: "S" },
  { name: "James M.", role: "Adventure Traveler", text: "The expense splitting alone saved us so much drama. Everyone could see what they owed in real-time.", avatar: "J" },
  { name: "Priya D.", role: "Digital Nomad", text: "I've tried every travel app. Sabię is the only one that actually works for group trips.", avatar: "P" },
];

const MOCKUPS = [
  { src: "/images/app-mockup-1.png", alt: "Sabię Home — Explore and Following" },
  { src: "/images/app-mockup-2.png", alt: "Sabię Search — Map, Ask Bie, Spin Together" },
  { src: "/images/app-mockup-3.png", alt: "Sabię Country — at-a-glance country info" },
  { src: "/images/app-mockup-4.png", alt: "Sabię Inbox — chat with friends and Bie AI" },
  { src: "/images/app-mockup-5.png", alt: "Sabię Moments — capture the trip" },
  { src: "/images/app-mockup-6.png", alt: "Sabię Shortcuts — @ to jump anywhere" },
  { src: "/images/app-mockup-7.png", alt: "Sabię Sidebar — everything in one place" },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [mockupIndex, setMockupIndex] = useState(0);
  const revealRef = useReveal();

  useEffect(() => {
    getFeaturedListings(8).then(setListings).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setMockupIndex((i) => (i + 1) % MOCKUPS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={revealRef}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center bg-neutral-dark">
        {/* Animated gradient blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[100px] animate-blob" style={{ animationDelay: "4s" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="stagger-children">
              <div className="inline-flex items-center gap-2.5 glass text-white/70 text-xs font-medium px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Now in TestFlight · App Store launch soon
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                Plan trips<br />
                <span className="gradient-text">with friends.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed">
                Stop the endless group chats. Sabię brings everyone together to plan, vote, and book trips that actually happen.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="btn-shine inline-flex items-center gap-2.5 bg-secondary hover:bg-secondary-dark text-neutral-dark font-bold px-8 py-4 rounded-full transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-secondary/25">
                  <Smartphone size={18} /> Try in TestFlight
                </a>
                <Link href="/explore" className="inline-flex items-center gap-2.5 glass text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                  Browse Listings <ArrowRight size={18} />
                </Link>
              </div>

              {/* Waitlist — for visitors who'd rather wait for the public App
                  Store launch than install via TestFlight. Writes to Firestore
                  /waitlist; rendered against the dark hero so use variant=hero. */}
              <div className="mt-8 max-w-md">
                <p className="text-xs text-white/40 mb-2">Prefer to wait for the App Store launch?</p>
                <WaitlistForm source="homepage-hero" placeholder="your@email.com" buttonLabel="Notify me" variant="hero" />
              </div>

            </div>

            {/* Right — Phone */}
            <div className="hidden lg:flex justify-center relative">
              <div className="relative w-[290px] h-[600px] animate-float">
                {/* Phone frame */}
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl shadow-black/60 overflow-hidden border-[6px] border-gray-700/50">
                  <Image
                    src={MOCKUPS[mockupIndex].src}
                    alt={MOCKUPS[mockupIndex].alt}
                    fill
                    className="object-cover transition-all duration-700 ease-out"
                    priority
                  />
                </div>
                {/* Glow behind phone */}
                <div className="absolute -inset-8 bg-primary/20 rounded-full blur-[60px] -z-10" />
              </div>
              {/* Dots */}
              <div className="absolute bottom-[-20px] flex gap-2">
                {MOCKUPS.map((_, i) => (
                  <button key={i} onClick={() => setMockupIndex(i)} className={`h-2 rounded-full transition-all duration-300 ${i === mockupIndex ? "bg-secondary w-8" : "bg-white/20 w-2 hover:bg-white/40"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-[#18181f] border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3">Why Sabię</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything you need for group trips</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {FEATURES.map((f) => (
              <div key={f.title} className="reveal group p-6 rounded-2xl border border-white/6 hover:border-secondary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} className="text-secondary" />
                </div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      {listings.length > 0 && (
        <section className="py-24 bg-[#0f0f13]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3">Explore</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Discover Amazing Places</h2>
                <p className="text-text-muted mt-2 max-w-md">Handpicked stays, experiences, and events from around the world</p>
              </div>
              <Link href="/explore" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline underline-offset-4 transition-all">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
              {listings.map((listing, i) => (
                <div key={listing.id} className="reveal">
                  <ListingCard listing={listing} index={i} />
                </div>
              ))}
            </div>
            <div className="sm:hidden text-center mt-10 reveal">
              <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary">
                View all listings <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      <section className="py-24 bg-[#18181f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Three steps to your next adventure</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {[
              { step: "01", icon: Globe, title: "Browse & Discover", desc: "Explore verified stays, experiences, and events. Filter by destination, price, and vibe." },
              { step: "02", icon: Users, title: "Plan Together", desc: "Invite your crew, vote on options, and build your itinerary with AI assistance." },
              { step: "03", icon: Zap, title: "Book & Go", desc: "Book directly, split expenses, and get real-time updates. Your trip is sorted." },
            ].map((item) => (
              <div key={item.step} className="reveal relative text-center p-8 rounded-2xl border border-white/6 group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <span className="absolute top-4 right-4 text-6xl font-black text-secondary/5 leading-none">{item.step}</span>
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                  <item.icon size={28} className="text-secondary" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-[#0f0f13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Loved by travelers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="reveal bg-[#18181f] p-7 rounded-2xl border border-white/6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-secondary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Backed By ── */}
      <section className="py-14 bg-[#18181f] border-y border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
          <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-8">Backed by</p>
          <div className="flex items-center justify-center gap-16 opacity-40 hover:opacity-60 transition-opacity duration-500">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={150} height={40} />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={110} height={40} />
          </div>
        </div>
      </section>

      {/* ── App Download CTA ── */}
      <section className="py-24 bg-[#0f0f13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-neutral-dark p-12 sm:p-16 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 glass text-white/60 text-xs font-medium px-4 py-2 rounded-full mb-6">
                <Smartphone size={14} /> TestFlight beta · iOS
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
                Try Sabię today.
              </h2>
              <p className="text-white/45 text-lg max-w-md mx-auto mb-10">
                Install the iPhone beta in TestFlight, or join the waitlist for the App Store launch.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="btn-shine inline-flex items-center gap-2.5 bg-white text-primary font-bold px-8 py-4 rounded-full hover:scale-[1.02] hover:shadow-xl transition-all">
                  <Smartphone size={18} /> Try in TestFlight
                </a>
                <Link href="/explore" className="inline-flex items-center gap-2.5 glass text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                  Browse Listings <ArrowRight size={18} />
                </Link>
              </div>
              {/* Bottom waitlist — second chance to capture an email if the
                  visitor scrolled all the way down without signing up earlier. */}
              <div className="mt-8 flex justify-center">
                <WaitlistForm source="homepage-bottom-cta" placeholder="Get notified when Sabīę launches" buttonLabel="Notify me" variant="hero" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
