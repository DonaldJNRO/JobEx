import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Listing, getListingImage, getListingPrice, getListingLocation, getCategoryLabel } from "@/lib/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  const image = getListingImage(listing);
  const price = getListingPrice(listing);
  const location = getListingLocation(listing);
  const name = listing.businessName || listing.title || "Listing";
  const category = getCategoryLabel(listing.role);

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <MapPin size={32} />
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-text-primary dark:text-white">
          {category}
        </div>
        {listing.isPromoted && (
          <div className="absolute top-3 right-3 bg-secondary text-neutral-dark text-xs font-bold px-2.5 py-1 rounded-full">
            Featured
          </div>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-text-primary dark:text-white truncate">{name}</h3>
          {listing.rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={12} className="fill-secondary text-secondary" />
              <span className="text-xs font-medium">{listing.rating}</span>
            </div>
          )}
        </div>
        {location && (
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            {location}
          </p>
        )}
        <p className="text-sm font-bold text-primary dark:text-secondary mt-1">{price}</p>
      </div>
    </Link>
  );
}
