"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f13] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-8">Saved Listings</h1>

        <div className="text-center py-20 bg-[#18181f] rounded-2xl border border-white/6">
          <Heart size={48} className="mx-auto text-text-muted/30 mb-4" />
          <h3 className="text-lg font-semibold text-white">No saved listings</h3>
          <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
            Tap the heart on any listing to save it here for later.
          </p>
          <Link href="/explore" className="inline-block mt-6 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-colors">
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
