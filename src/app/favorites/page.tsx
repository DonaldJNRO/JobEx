"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listSavedListings } from "@/lib/saved";
import { type Listing } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const load = useCallback(async (uid: string) => {
    try {
      setListings(await listSavedListings(uid));
    } catch {
      setListings([]);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) load(user.uid);
  }, [user?.uid, load]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-section sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Saved listings</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Saved here or in the app, it is the same list.
          </p>
        </header>

        {listings === null && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-surface-sunken animate-shimmer" />
            ))}
          </div>
        )}

        {listings !== null && listings.length === 0 && (
          <div className="rounded-2xl border border-line bg-card py-20 text-center">
            <Heart size={44} className="mx-auto mb-4 text-text-muted/30" />
            <h2 className="text-lg font-semibold text-ink">No saved listings</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              Tap the heart on any listing to save it here for later.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Browse listings
            </Link>
          </div>
        )}

        {listings !== null && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
