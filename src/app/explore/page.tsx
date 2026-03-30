"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, Sparkles } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getListingsByCategory, getFeaturedListings, Listing } from "@/lib/listings";
import { useReveal } from "@/lib/useReveal";

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "stays", label: "Stays", icon: MapPin },
  { id: "experiences", label: "Experiences", icon: Sparkles },
  { id: "events", label: "Events", icon: Sparkles },
  { id: "food", label: "Food & Drink", icon: Sparkles },
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
    <div className="min-h-screen bg-[#0f0f13] pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden bg-[#18181f] border border-white/6">
              <div className="aspect-[4/3] bg-white/5" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 rounded-lg bg-white/5" />
                <div className="h-3 w-1/2 rounded-lg bg-white/5" />
                <div className="h-4 w-1/3 rounded-lg bg-white/5" />
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
  const revealRef = useReveal();

  const [category, setCategory] = useState(initialCategory);
  const [listings, setListings] = useState<Listing[]>([]);
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

  const filtered = searchQuery.trim()
    ? listings.filter((l) => {
        const q = searchQuery.toLowerCase();
        const name = (l.businessName || l.title || "").toLowerCase();
        const loc = typeof l.location === "string" ? l.location.toLowerCase() : "";
        const desc = (l.description || "").toLowerCase();
        return name.includes(q) || loc.includes(q) || desc.includes(q);
      })
    : listings;

  return (
    <div ref={revealRef} className="min-h-screen bg-[#0f0f13]">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-dark overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-blob" />
          <div className="absolute bottom-[-30%] right-[-10%] w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[80px] animate-blob" style={{ animationDelay: "3s" }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Explore Listings</h1>
            <p className="text-white/50 max-w-md mx-auto">Find your perfect stay, experience, or event anywhere in the world</p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className={`relative transition-all duration-300 ${searchFocused ? "scale-[1.02]" : ""}`}>
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search destinations, stays, experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-13 pr-12 py-4 rounded-2xl glass text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex justify-center gap-2 mt-8 overflow-x-auto scrollbar-hide pb-1 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  category === c.id
                    ? "bg-secondary text-neutral-dark shadow-lg shadow-secondary/25 scale-105"
                    : "glass text-white/60 hover:text-white hover:bg-white/10"
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
              <span><strong className="text-white">{filtered.length}</strong> listing{filtered.length !== 1 ? "s" : ""} found</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl overflow-hidden bg-[#18181f] border border-white/6">
                <div className="aspect-[4/3] bg-white/5 animate-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-3/4 rounded-lg bg-white/5" />
                  <div className="h-3 w-1/2 rounded-lg bg-white/5" />
                  <div className="h-4 w-1/3 rounded-lg bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">Try a different search term or browse another category</p>
            <button onClick={() => { setSearchQuery(""); setCategory("all"); }} className="mt-6 text-sm font-semibold text-secondary hover:underline underline-offset-4">
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
