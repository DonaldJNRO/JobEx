"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getListingsByCategory, getFeaturedListings, Listing } from "@/lib/listings";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "stays", label: "Stays" },
  { id: "experiences", label: "Experiences" },
  { id: "events", label: "Events" },
  { id: "food", label: "Food & Drink" },
];

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-light dark:bg-neutral-dark" />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [category, setCategory] = useState(initialCategory);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Client-side search filter
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
    <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-black/5 dark:border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search destinations, stays, experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full bg-neutral-light dark:bg-neutral-dark border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === c.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-black/5 dark:bg-white/5 text-text-primary dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Count */}
        <p className="text-sm text-text-muted mb-6">
          {loading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-2xl bg-black/5 dark:bg-white/5" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-black/5 dark:bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-black/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <Search size={48} className="mx-auto text-text-muted/30 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary dark:text-white">No listings found</h3>
            <p className="text-sm text-text-muted mt-1">Try a different search or category</p>
          </div>
        ) : (
          /* Listing grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
