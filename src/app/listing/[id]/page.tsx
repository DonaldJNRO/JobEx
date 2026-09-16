"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ChevronLeft, ChevronRight, Share2, Link2, Heart, Wifi, Car, Coffee, Waves, Shield, ArrowRight, Download, Check, Globe, Clock, Users } from "lucide-react";
import { resolveListing, getListingPrice, getListingLocation, getListingType, getCategoryLabel, getFeaturedListings, Listing } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import { useReveal } from "@/lib/useReveal";
import { APP_STORE_URL } from "@/lib/app-links";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, pool: Waves, coffee: Coffee, security: Shield,
  kitchen: Coffee, gym: Users, spa: Waves, restaurant: Coffee,
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const revealRef = useReveal();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCurrentImage(0);
    setImageLoaded(false);
    resolveListing(id)
      .then((resolved) => {
        setListing(resolved?.listing ?? null);
        if (!resolved) return;
        setSlug(resolved.slug);
        // The link worked, but it was not the one we want people to keep. Swap
        // the address bar for the readable slug without adding a history entry,
        // so Back still goes where the visitor came from. replace(), never
        // push(), or a truncated link becomes a Back button that does nothing.
        if (!resolved.canonical) router.replace(`/listing/${resolved.slug}`, { scroll: false });
        getFeaturedListings(4).then(setSimilarListings).catch(() => {});
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[2.2/1] rounded-2xl bg-surface-sunken animate-shimmer" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 w-2/3 rounded-lg bg-surface-sunken" />
                <div className="h-4 w-1/3 rounded-lg bg-surface-sunken" />
                <div className="h-32 rounded-xl bg-surface-sunken" />
              </div>
              <div className="h-64 rounded-2xl bg-surface-sunken" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} className="text-primary/40" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Listing not found</h2>
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
  const type = getListingType(listing);
  // getListingPrice already appends the unit for the units it knows, so the
  // page rendered "₦2,250/person" with "per person" directly underneath it.
  // Only say it once, and only when the price line has not said it already.
  const priceUnit =
    listing.pricingUnit && !price.includes("/")
      ? `per ${listing.pricingUnit.replace("per_", "").replace(/_/g, " ")}`
      : "";
  const bookingLink = slug ? `https://www.sabieapp.com/listing/${slug}` : "";

  const bookingBlock = (
    <>
      <div className="text-3xl font-extrabold text-primary mb-1">{price}</div>
      <div className={priceUnit ? "" : "mb-6"} />
      {priceUnit && <p className="text-sm text-text-muted mb-6">{priceUnit}</p>}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-shine w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
      >
        Book <ArrowRight size={18} />
      </a>
      <p className="text-[11px] text-text-muted text-center mt-3">Book and manage your trip in the Sabię app</p>
    </>
  );

  const copyLink = async () => {
    if (!bookingLink) return;
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div ref={revealRef} className="min-h-screen bg-surface">
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
                <MapPin size={64} className="text-ink/10" />
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => { setCurrentImage((i) => (i - 1 + images.length) % images.length); setImageLoaded(false); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center text-ink hover:bg-line-strong transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => { setCurrentImage((i) => (i + 1) % images.length); setImageLoaded(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center text-ink hover:bg-line-strong transition-all"
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
                {images.length > 8 && <span className="text-ink-faint text-[10px] ml-1">+{images.length - 8}</span>}
              </div>
            )}

            {/* Top actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Link href="/explore" className="w-10 h-10 rounded-full glass flex items-center justify-center text-ink hover:bg-line-strong transition-all">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${liked ? "bg-red-500 text-ink scale-110" : "glass text-ink hover:bg-line-strong"}`}
                >
                  <Heart size={18} fill={liked ? "white" : "none"} />
                </button>
                <button
                  onClick={copyLink}
                  aria-label={copied ? "Link copied" : "Copy link to this listing"}
                  className="h-10 rounded-full glass flex items-center justify-center gap-1.5 text-ink hover:bg-line-strong transition-all px-3"
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                  {copied && <span className="text-xs font-semibold">Copied</span>}
                </button>
              </div>
            </div>

            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-black/55 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">{category}</span>
                  {listing.rating && (
                    <span className="bg-black/55 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <Star size={10} className="fill-secondary text-secondary" /> {listing.rating}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">{name}</h1>
                {location && (
                  <p className="text-white/90 text-sm mt-1.5 flex items-center gap-1.5 drop-shadow">
                    <MapPin size={14} /> {location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THE FIRST SCREEN, on a phone. Name, city and the hero are in the
          overlay above; this is the price and the one thing we want a visitor
          to do, put where they land rather than a scroll and a half down the
          page in a sidebar that only exists on a desktop. Hidden at lg, where
          the sticky sidebar card carries it instead, so there is never more
          than one Book button on screen. */}
      <div className="lg:hidden max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-card rounded-2xl border border-line p-6 shadow-lg shadow-black/5">
          {bookingBlock}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick info pills */}
            {(type || location) && (
              <div className="flex flex-wrap gap-2 reveal">
                {type && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3.5 py-2 rounded-xl">
                    <Globe size={12} /> {type}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5 bg-surface-sunken text-text-muted text-xs font-medium px-3.5 py-2 rounded-xl">
                    <MapPin size={12} /> {location}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="reveal">
                <h2 className="text-lg font-bold text-ink mb-4">About this place</h2>
                <p className="text-text-muted leading-[1.8] whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="reveal">
                <h2 className="text-lg font-bold text-ink mb-5">What this place offers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.slice(0, 12).map((a) => {
                    const IconComp = AMENITY_ICONS[a.toLowerCase()] || Check;
                    return (
                      <div key={a} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-line group hover:border-secondary/20 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconComp size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium capitalize text-ink">{a.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-line p-7 shadow-xl shadow-black/5 ">
              <div className="hidden lg:block">
                {bookingBlock}
                <div className="my-6 border-t border-line" />
              </div>

              {/* Quick info */}
              <div className="space-y-4 text-sm">
                {type && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type</span>
                    <span className="font-semibold text-ink text-right max-w-[60%]">{type}</span>
                  </div>
                )}
                {location && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-semibold text-ink text-right max-w-[60%]">{location}</span>
                  </div>
                )}
                {(listing.viewsCount || listing.views) && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Views</span>
                    <span className="font-semibold text-ink">{(listing.viewsCount || listing.views || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="my-6 border-t border-line" />

              {/* Trust badges */}
              <div className="space-y-3">
                {[
                  { icon: Shield, text: "Verified listing" },
                  { icon: Clock, text: "Instant confirmation" },
                  { icon: Heart, text: "Free cancellation" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2.5 text-xs text-text-muted">
                    <badge.icon size={14} className="text-primary shrink-0" />
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
        <section className="py-16 bg-card border-t border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 reveal">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">More to explore</p>
                <h2 className="text-2xl font-extrabold text-ink">Similar Listings</h2>
              </div>
              <Link href="/explore" className="text-sm font-bold text-primary hover:underline underline-offset-4">
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
