"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Clock, Users, ChevronLeft, ChevronRight, Share2, Heart, Wifi, Car, Coffee, Waves, Shield, ArrowRight } from "lucide-react";
import { getListingById, getListingImage, getListingPrice, getListingLocation, getCategoryLabel, Listing } from "@/lib/listings";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, pool: Waves, coffee: Coffee, security: Shield,
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getListingById(id)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[16/9] rounded-2xl bg-black/5 dark:bg-white/5" />
            <div className="h-8 w-2/3 rounded bg-black/5 dark:bg-white/5" />
            <div className="h-4 w-1/3 rounded bg-black/5 dark:bg-white/5" />
            <div className="h-32 rounded-xl bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">Listing not found</h2>
          <p className="text-text-muted mt-2">This listing may have been removed or doesn&apos;t exist.</p>
          <Link href="/explore" className="inline-flex items-center gap-2 mt-6 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  const images = (listing.imageUrls || []).map((img) => typeof img === "string" ? img : img?.url).filter(Boolean) as string[];
  if (listing.coverImage && !images.includes(listing.coverImage)) images.unshift(listing.coverImage);
  const name = listing.businessName || listing.title || "Listing";
  const price = getListingPrice(listing);
  const location = getListingLocation(listing);
  const category = getCategoryLabel(listing.role);
  const amenities = listing.selectedAmenities || listing.amenities || [];

  return (
    <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark">
      {/* Image Gallery */}
      <div className="relative bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="relative aspect-[16/9] sm:aspect-[2.2/1]">
            {images.length > 0 ? (
              <Image
                src={images[currentImage]}
                alt={name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full bg-neutral-dark flex items-center justify-center">
                <MapPin size={64} className="text-white/20" />
              </div>
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImage((i) => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                {currentImage + 1} / {images.length}
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${liked ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
              >
                <Heart size={18} fill={liked ? "white" : "none"} />
              </button>
              <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                <Share2 size={18} />
              </button>
            </div>

            {/* Back */}
            <Link href="/explore" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ChevronLeft size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <span className="bg-primary/10 text-primary dark:text-secondary px-2.5 py-0.5 rounded-full text-xs font-semibold">{category}</span>
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {location}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white">{name}</h1>
              {listing.rating && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Star size={16} className="fill-secondary text-secondary" />
                  <span className="font-semibold text-sm">{listing.rating}</span>
                  <span className="text-text-muted text-sm">rating</span>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary dark:text-white mb-3">About</h2>
                <p className="text-text-muted leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary dark:text-white mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.slice(0, 12).map((a) => {
                    const IconComp = AMENITY_ICONS[a.toLowerCase()] || Shield;
                    return (
                      <div key={a} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-card-dark border border-black/5 dark:border-white/5">
                        <IconComp size={18} className="text-primary dark:text-secondary shrink-0" />
                        <span className="text-sm capitalize">{a.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-card-dark rounded-2xl border border-black/5 dark:border-white/5 p-6 shadow-lg">
              <div className="text-2xl font-bold text-primary dark:text-secondary mb-1">{price}</div>
              <p className="text-sm text-text-muted mb-6">per {listing.pricingUnit?.replace("per_", "") || "night"}</p>

              {/* Book button */}
              <a
                href="https://apps.apple.com/app/sabie/id6504672498"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Book on App <ArrowRight size={18} />
              </a>
              <p className="text-xs text-text-muted text-center mt-3">Download Sabię to book and manage your trip</p>

              <hr className="my-5 border-black/5 dark:border-white/5" />

              {/* Quick info */}
              <div className="space-y-3 text-sm">
                {listing.subCategory?.name && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type</span>
                    <span className="font-medium text-text-primary dark:text-white">{listing.subCategory.name}</span>
                  </div>
                )}
                {location && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-medium text-text-primary dark:text-white">{location}</span>
                  </div>
                )}
                {listing.viewsCount && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Views</span>
                    <span className="font-medium text-text-primary dark:text-white">{listing.viewsCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
