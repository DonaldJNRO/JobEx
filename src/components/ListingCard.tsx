"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Listing, getListingImage, getListingPrice, getListingLocation, getCategoryLabel } from "@/lib/listings";

export default function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const image = getListingImage(listing);
  const price = getListingPrice(listing);
  const location = getListingLocation(listing);
  const name = listing.businessName || listing.title || "Listing";
  const category = getCategoryLabel(listing.role);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block card-hover rounded-2xl overflow-hidden bg-[#18181f] border border-white/6"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0f0f13]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted/30">
            <MapPin size={32} />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Category pill */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[11px] font-semibold px-2.5 py-1 rounded-full text-white shadow-sm">
          {category}
        </div>

        {/* Featured badge */}
        {listing.isPromoted && (
          <div className="absolute top-3 right-3 bg-secondary text-neutral-dark text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Featured
          </div>
        )}

        {/* Price on hover */}
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span className="bg-black/80 backdrop-blur-md text-sm font-bold text-secondary px-3 py-1.5 rounded-lg shadow-md">
            {price}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[13px] text-white leading-snug line-clamp-1 group-hover:text-primary group-hover:text-secondary transition-colors">
            {name}
          </h3>
          {listing.rating && (
            <div className="flex items-center gap-0.5 shrink-0 bg-secondary/10 px-1.5 py-0.5 rounded">
              <Star size={10} className="fill-secondary text-secondary" />
              <span className="text-[11px] font-bold text-secondary">{listing.rating}</span>
            </div>
          )}
        </div>
        {location && (
          <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}
        <p className="text-sm font-bold text-secondary mt-2">{price}</p>
      </div>
    </Link>
  );
}
