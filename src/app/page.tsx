"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, Sparkles, Wallet, MessageCircle, ArrowRight, ChevronRight, Globe, Shield, Zap } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getFeaturedListings, Listing } from "@/lib/listings";

const FEATURES = [
  { icon: Users, title: "Group Planning", desc: "Real-time collaboration with your crew" },
  { icon: Sparkles, title: "AI Recommendations", desc: "Personalized to your vibe" },
  { icon: Wallet, title: "Split Expenses", desc: "No more IOUs" },
  { icon: MessageCircle, title: "Trip Chat", desc: "Keep everything in one place" },
];

const STATS = [
  { value: "10K+", label: "Travelers" },
  { value: "50+", label: "Countries" },
  { value: "1,200+", label: "Listings" },
  { value: "4.9", label: "App Rating" },
];

const MOCKUPS = [
  { src: "/images/app-mockup-1.png", alt: "Sabię AI Itinerary" },
  { src: "/images/app-mockup-2.png", alt: "Sabię Search" },
  { src: "/images/app-mockup-3.png", alt: "Sabię Explore" },
  { src: "/images/app-mockup-4.png", alt: "Sabię Trip Planning" },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [mockupIndex, setMockupIndex] = useState(0);

  useEffect(() => {
    getFeaturedListings(8).then(setListings).catch(() => {});
  }, []);

  // Auto-rotate mockup
  useEffect(() => {
    const timer = setInterval(() => setMockupIndex((i) => (i + 1) % MOCKUPS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-neutral-dark min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(90,74,138,0.4),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now on the App Store
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Plan trips<br />
                <span className="text-secondary">with friends.</span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-lg leading-relaxed">
                Stop the endless group chats. Sabię brings everyone together to plan, vote, and book trips that actually happen.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/explore" className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-neutral-dark font-bold px-7 py-3.5 rounded-full transition-all hover:scale-105">
                  Browse Listings <ArrowRight size={18} />
                </Link>
                <a href="https://apps.apple.com/app/sabie/id6504672498" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-full backdrop-blur-sm border border-white/10 transition-all">
                  Download App
                </a>
              </div>

              {/* Stats */}
              <div className="mt-12 flex gap-8 flex-wrap">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Phone mockup */}
            <div className="hidden lg:flex justify-center relative">
              <div className="relative w-[280px] h-[580px] animate-float">
                <div className="absolute inset-0 rounded-[3rem] bg-black shadow-2xl shadow-black/50 overflow-hidden border-[6px] border-gray-800">
                  <Image
                    src={MOCKUPS[mockupIndex].src}
                    alt={MOCKUPS[mockupIndex].alt}
                    fill
                    className="object-cover transition-opacity duration-500"
                    priority
                  />
                </div>
              </div>
              {/* Dots */}
              <div className="absolute bottom-0 flex gap-2">
                {MOCKUPS.map((_, i) => (
                  <button key={i} onClick={() => setMockupIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === mockupIndex ? "bg-secondary w-6" : "bg-white/30"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className="py-16 bg-white dark:bg-card-dark border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-neutral-light dark:hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-primary dark:text-secondary" />
                </div>
                <h3 className="font-semibold text-sm text-text-primary dark:text-white">{f.title}</h3>
                <p className="text-xs text-text-muted mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      {listings.length > 0 && (
        <section className="py-20 bg-neutral-light dark:bg-neutral-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white">Discover Amazing Places</h2>
                <p className="text-text-muted mt-2">Handpicked stays, experiences, and events from around the world</p>
              </div>
              <Link href="/explore" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <Link href="/explore" className="sm:hidden flex items-center justify-center gap-1 text-sm font-semibold text-primary mt-8">
              View all listings <ChevronRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Why Sabię ── */}
      <section className="py-20 bg-white dark:bg-card-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white">Why travelers love Sabię</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Real Listings", desc: "Browse verified stays, experiences, and events. Book directly — no middleman." },
              { icon: Shield, title: "Trusted Community", desc: "Verified hosts, real reviews, and secure payments with Stripe." },
              { icon: Zap, title: "AI-Powered", desc: "Bie, your AI travel assistant, builds personalized itineraries in seconds." },
            ].map((item) => (
              <div key={item.title} className="text-center p-8 rounded-2xl border border-black/5 dark:border-white/5 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-5">
                  <item.icon size={28} className="text-primary dark:text-secondary" />
                </div>
                <h3 className="font-bold text-text-primary dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Backed By ── */}
      <section className="py-12 bg-neutral-light dark:bg-neutral-dark border-y border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">Backed by</p>
          <div className="flex items-center justify-center gap-12 opacity-60">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={140} height={36} />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={100} height={36} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary-dark text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Try Sabię today.
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Download the app and start planning your next adventure with friends.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://apps.apple.com/app/sabie/id6504672498" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform">
              Download on App Store
            </a>
            <Link href="/explore" className="inline-flex items-center gap-2 bg-secondary text-neutral-dark font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform">
              Browse Listings <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
