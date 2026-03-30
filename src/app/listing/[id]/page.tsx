"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ChevronLeft, ChevronRight, Share2, Heart, Wifi, Car, Coffee, Waves, Shield, ArrowRight, Download, Check, Globe, Clock, Users } from "lucide-react";
import { getListingById, getListingPrice, getListingLocation, getCategoryLabel, getFeaturedListings, Listing } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import { useReveal } from "@/lib/useReveal";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, pool: Waves, coffee: Coffee, security: Shield,
  kitchen: Coffee, gym: Users, spa: Waves, restaurant: Coffee,
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const revealRef = useReveal();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCurrentImage(0);
    setImageLoaded(false);
    getListingById(id)
      .then((data) => {
        setListing(data);
        // Fetch similar
        if (data) {
          getFeaturedListings(4).then(setSimilarListings).catch(() => {});
        }
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f13]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[2.2/1] rounded-2xl bg-white/5 animate-shimmer" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 w-2/3 rounded-lg bg-white/5" />
                <div className="h-4 w-1/3 rounded-lg bg-white/5" />
                <div className="h-32 rounded-xl bg-white/5" />
              </div>
              <div className="h-64 rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} className="text-primary/40" />
          </div>
          <h2 className="text-2xl font-bold text-white">Listing not found</h2>
          <p className="text-text-muted mt-2">This listing may have been removed.</p>
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
    <div ref={revealRef} className="min-h-screen bg-[#0f0f13]">
      {/* Image Gallery */}
      <div className="relative bg-neutral-dark">
        <div className="max-w-6xl mx-auto">
          <div className="relative aspect-[2.2/1] sm:aspect-[2.5/1] overflow-hidden sm:rounded-b-3xl">
            {images.length > 0 ? (
              <Image
                src={images[currentImage]}
                alt={name}
                fill
                className={`object-cover transition-all duration-700 ${imageLoaded ? "scale-100 blur-0" : "scale-105 blur-sm"}`}
                priority
                sizes="100vw"
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full bg-neutral-dark flex items-center justify-center">
                <MapPin size={64} className="text-white/10" />
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => { setCurrentImage((i) => (i - 1 + images.length) % images.length); setImageLoaded(false); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => { setCurrentImage((i) => (i + 1) % images.length); setImageLoaded(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentImage(i); setImageLoaded(false); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? "bg-white w-6" : "bg-white/40 w-1.5 hover:bg-white/60"}`}
                  />
                ))}
                {images.length > 8 && <span className="text-white/40 text-[10px] ml-1">+{images.length - 8}</span>}
              </div>
            )}

            {/* Top actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Link href="/explore" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${liked ? "bg-red-500 text-white scale-110" : "glass text-white hover:bg-white/20"}`}
                >
                  <Heart size={18} fill={liked ? "white" : "none"} />
                </button>
                <button className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="glass text-white text-xs font-semibold px-3 py-1 rounded-full">{category}</span>
                  {listing.rating && (
                    <span className="glass text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-secondary text-secondary" /> {listing.rating}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">{name}</h1>
                {location && (
                  <p className="text-white/60 text-sm mt-1.5 flex items-center gap-1.5">
                    <MapPin size={14} /> {location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick info pills */}
            {(listing.subCategory?.name || location) && (
              <div className="flex flex-wrap gap-2 reveal">
                {listing.subCategory?.name && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-secondary text-xs font-semibold px-3.5 py-2 rounded-xl">
                    <Globe size={12} /> {listing.subCategory.name}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5 bg-white/5 text-text-muted text-xs font-medium px-3.5 py-2 rounded-xl">
                    <MapPin size={12} /> {location}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="reveal">
                <h2 className="text-lg font-bold text-white mb-4">About this place</h2>
                <p className="text-text-muted leading-[1.8] whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="reveal">
                <h2 className="text-lg font-bold text-white mb-5">What this place offers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.slice(0, 12).map((a) => {
                    const IconComp = AMENITY_ICONS[a.toLowerCase()] || Check;
                    return (
                      <div key={a} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#18181f] border border-white/6 group hover:border-secondary/20 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconComp size={16} className="text-secondary" />
                        </div>
                        <span className="text-sm font-medium capitalize text-white">{a.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#18181f] rounded-2xl border border-white/6 p-7 shadow-xl shadow-black/5 ">
              <div className="text-3xl font-extrabold text-secondary mb-1">{price}</div>
              <p className="text-sm text-text-muted mb-7">per {listing.pricingUnit?.replace("per_", "").replace(/_/g, " ") || "night"}</p>

              {/* Book on app */}
              <a
                href="https://apps.apple.com/app/sabie/id6504672498"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                <Download size={18} /> Book on App
              </a>
              <p className="text-[11px] text-text-muted text-center mt-3">Download Sabię to book and manage your trip</p>

              <div className="my-6 border-t border-white/6" />

              {/* Quick info */}
              <div className="space-y-4 text-sm">
                {listing.subCategory?.name && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type</span>
                    <span className="font-semibold text-white">{listing.subCategory.name}</span>
                  </div>
                )}
                {location && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-semibold text-white text-right max-w-[60%]">{location}</span>
                  </div>
                )}
                {(listing.viewsCount || listing.views) && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Views</span>
                    <span className="font-semibold text-white">{(listing.viewsCount || listing.views || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="my-6 border-t border-white/6" />

              {/* Trust badges */}
              <div className="space-y-3">
                {[
                  { icon: Shield, text: "Verified listing" },
                  { icon: Clock, text: "Instant confirmation" },
                  { icon: Heart, text: "Free cancellation" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2.5 text-xs text-text-muted">
                    <badge.icon size={14} className="text-secondary shrink-0" />
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <section className="py-16 bg-[#18181f] border-t border-white/6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 reveal">
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2">More to explore</p>
                <h2 className="text-2xl font-extrabold text-white">Similar Listings</h2>
              </div>
              <Link href="/explore" className="text-sm font-bold text-secondary hover:underline underline-offset-4">
                View all <ChevronRight size={14} className="inline" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
              {similarListings.map((l, i) => (
                <div key={l.id} className="reveal">
                  <ListingCard listing={l} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
