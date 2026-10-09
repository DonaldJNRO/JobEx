"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ChevronLeft, ChevronRight, Share2, Link2, Heart, Wifi, Car, Coffee, Waves, Shield, ArrowRight, Download, Check, Globe, Clock, Users } from "lucide-react";
import { resolveListing, getListingPrice, getListingLocation, getListingType, getCategoryLabel, getFeaturedListings, visitedBySabie, Listing } from "@/lib/listings";
import { useMoney } from "@/lib/useRates";
import { openingRows, openNow, serviceStyle, verificationLine, amenityLabel } from "@/lib/operator-info";
import ListingCard from "@/components/ListingCard";
import { useReveal } from "@/lib/useReveal";
import { useAuth } from "@/contexts/AuthContext";
import { isSaved, saveListing, unsaveListing } from "@/lib/saved";
import { APP_STORE_URL } from "@/lib/app-links";
import { isShopWindow } from "@/lib/shop-window";
import { fetchBookingDecision, ASK, type BookingDecision } from "@/lib/booking-decision";
import ProfileServices from "@/components/ProfileServices";
import { offersOf } from "@/lib/shop-window";
import { resolveProfileSections, CTA_LABEL } from "@/lib/profile-sections";
import type { ListingSnapshot } from "@/lib/listing-snapshot";
import BookingRequest from "@/components/BookingRequest";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, pool: Waves, coffee: Coffee, security: Shield,
  kitchen: Coffee, gym: Users, spa: Waves, restaurant: Coffee,
};

export default function ListingClient({ snapshot }: { snapshot?: ListingSnapshot | null }) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  // SEEDED FROM THE SERVER, so the first paint has a name, a photo and a
  // price list instead of a skeleton. The effect below still resolves the
  // listing and overwrites this; the snapshot only has to be right for the
  // moment before that lands.
  const [listing, setListing] = useState<Listing | null>((snapshot as Listing) ?? null);
  const [loading, setLoading] = useState(!snapshot);
  const [currentImage, setCurrentImage] = useState(0);
  // The heart used to be local state only: it filled in, wrote nothing, and
  // /favorites told people their taps were being saved. `savingLike` stops a
  // double tap racing two writes at the same document.
  const [liked, setLiked] = useState(false);
  const [savingLike, setSavingLike] = useState(false);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [booking, setBooking] = useState(false);
  // Which row they tapped, so the sheet opens on it rather than on whatever
  // happens to be first. Tapping "Pedicure" and being shown "Acrylic" is the
  // difference between a menu and a form.
  const [pickedOffer, setPickedOffer] = useState("");
  const revealRef = useReveal();
  const { user } = useAuth();
  // ABOVE THE EARLY RETURNS, with the other hooks. Placed beside the price it
  // feeds, it sat after `if (loading)` and `if (!listing)`, so it was called on
  // some renders and not others: a conditional hook, which React throws on.
  const money = useMoney();

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

  // Reads the saved state once both the viewer and the listing are known.
  // Sits above the loading return, so it is not a conditional hook.
  useEffect(() => {
    if (!user?.uid || !listing?.id) { setLiked(false); return; }
    let cancelled = false;
    isSaved(user.uid, listing.id).then((saved) => {
      if (!cancelled) setLiked(saved);
    });
    return () => { cancelled = true; };
  }, [user?.uid, listing?.id]);

  const toggleLike = async () => {
    if (!listing) return;
    // Signed out, the heart is an invitation to sign in rather than a control
    // that silently does nothing.
    if (!user?.uid) { router.push("/auth/login"); return; }
    if (savingLike) return;
    setSavingLike(true);
    const next = !liked;
    setLiked(next);
    try {
      if (next) await saveListing(user.uid, listing);
      else await unsaveListing(user.uid, listing.id);
    } catch {
      // The write failed, so the heart has to go back. Leaving it filled is
      // the same lie this whole change exists to remove.
      setLiked(!next);
    } finally {
      setSavingLike(false);
    }
  };

  // THE SAME SERVER ANSWER as the sheet, so the page cannot promise one
  // thing and the form say another. Asked without an offer, which gives the
  // listing's headline terms, which is what a page-level line should say.
  //
  // ABOVE THE EARLY RETURNS, and that is not a style choice. This sat below
  // `if (loading) return` and `if (!listing) return`, so a closed render ran
  // two fewer hooks than an open one and React tore the page down the moment
  // the listing arrived: "This page couldn't load". Exactly the fault fixed
  // in BookingRequest this morning, reintroduced here hours later.
  const [bookMode, setBookMode] = useState<BookingDecision>(ASK);
  useEffect(() => {
    if (!listing?.id) return;
    let live = true;
    fetchBookingDecision(listing.id, "").then((d) => { if (live) setBookMode(d); });
    return () => { live = false; };
  }, [listing?.id]);

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
  const price = getListingPrice(listing, money);
  const location = getListingLocation(listing);
  const category = getCategoryLabel(listing.role);
  const amenities = listing.selectedAmenities || listing.amenities || [];
  const openingWeek = openingRows(listing);
  const isOpenNow = openNow(listing);
  const style = serviceStyle(listing);
  const visitLine = verificationLine(listing);
  const type = getListingType(listing);
  // getListingPrice already appends the unit for the units it knows, so the
  // page rendered "₦2,250/person" with "per person" directly underneath it.
  // Only say it once, and only when the price line has not said it already.
  const priceUnit =
    listing.pricingUnit && !price.includes("/")
      ? `per ${listing.pricingUnit.replace("per_", "").replace(/_/g, " ")}`
      : "";
  const bookingLink = slug ? `https://www.sabieapp.com/listing/${slug}` : "";
  /* THE SHOP WINDOW. On these listings the page belongs to the operator: no
     other businesses, no app poster, and Book finishes here. Everywhere else
     renders exactly as it did before, until the founder has seen these two. */
  const shopWindow = isShopWindow(slug || id);
  const instant = bookMode.mode === "instant" || bookMode.mode === "deposit";
  // THE BUTTON SAYS WHAT IT DOES. A café "Books" nothing, it requests a
  // table; a stay shows rooms. Same resolver as the services section, so the
  // word on the button and the shape of the list below it cannot disagree.
  const ctaWord = CTA_LABEL[resolveProfileSections(listing ?? {}).bookCta];
  // The price of the row they chose, so the headline figure is no longer the
  // cheapest of everything while they are looking at something else. Null
  // until they choose, which is when the "from" price is the honest answer.
  const pickedPrice = pickedOffer
    ? (() => {
      const hit = offersOf(listing ?? {}).find((o) => o.name === pickedOffer);
      return typeof hit?.price === "number"
        ? `${listing?.currency === "GBP" ? "£" : "₦"}${hit.price.toLocaleString("en-NG")}`
        : null;
    })()
    : null;

  const bookingBlock = (
    <>
      {/* WHAT THEY PICKED, where they complete it. Two entry points competed
          here: a big "from" price with a Book button at the top, and a list
          of services with their own prices below. Nothing connected them, so
          a visitor could not tell which was the booking. Choosing a row now
          names it up here, and the price stops being the cheapest of
          everything and becomes the price of that thing. */}
      {pickedOffer ? (
        <p className="text-sm text-ink-muted mb-1">{pickedOffer}</p>
      ) : null}
      <div className="text-3xl font-extrabold text-primary mb-1">{pickedPrice ?? price}</div>
      <div className={priceUnit ? "" : "mb-6"} />
      {priceUnit && <p className="text-sm text-text-muted mb-6">{priceUnit}</p>}
      {shopWindow ? (
        <>
          {/* BOOK FINISHES HERE. It used to be a link to the App Store, which
              asked a guest who arrived from an Instagram bio to install an app
              before they could ask a question. Now it opens the request form,
              and the store is offered afterwards, once there is a booking for
              the app to hold. */}
          <button
            type="button"
            onClick={() => setBooking(true)}
            className="btn-shine w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {ctaWord} <ArrowRight size={18} />
          </button>
          {/* THE SERVER ALREADY DECIDES THIS, and the page did not know.
              canSellInstantly in onBookingRequestCreated confirms a request
              on the spot when the listing takes payment, is not a cafe and
              has an allocation. It has fired 14 times. Every listing's page
              still promised a 12 hour wait. */}
          <p className="text-[11px] text-text-muted text-center mt-3">
            {instant
              ? `Confirmed on the spot. ${bookMode.why}`
              : bookMode.mode === "external"
                ? "They take bookings on their own system."
                : "Ask first, pay later. They have 12 hours to accept."}
          </p>
        </>
      ) : (
        <>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {ctaWord} <ArrowRight size={18} />
          </a>
          <p className="text-[11px] text-text-muted text-center mt-3">Book and manage your trip in the Sabię app</p>
        </>
      )}
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
          <div className="relative aspect-[4/3] sm:aspect-[2.5/1] overflow-hidden sm:rounded-b-3xl">
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
            {/* Desktop only. At phone width these sat at top-1/2 of a short
                hero, which put a chevron on top of the back button and across
                the first letter of the business name. A gallery on a phone is
                worked with the dots below, which are a real target now. */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => { setCurrentImage((i) => (i - 1 + images.length) % images.length); setImageLoaded(false); }}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass hidden sm:flex items-center justify-center text-ink hover:bg-line-strong transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => { setCurrentImage((i) => (i + 1) % images.length); setImageLoaded(false); }}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass hidden sm:flex items-center justify-center text-ink hover:bg-line-strong transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur-sm">
                {images.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentImage(i); setImageLoaded(false); }}
                    aria-label={`Photo ${i + 1} of ${images.length}`}
                    aria-current={i === currentImage}
                    className="group/dot p-1.5"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? "bg-white w-5" : "bg-white/50 w-1.5 group-hover/dot:bg-white/80"}`}
                    />
                  </button>
                ))}
                {images.length > 8 && <span className="text-white/70 text-[10px] pr-1">+{images.length - 8}</span>}
              </div>
            )}

            {/* Top actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Link href="/explore" className="w-10 h-10 rounded-full glass flex items-center justify-center text-ink hover:bg-line-strong transition-all">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={toggleLike}
                  aria-pressed={liked}
                  aria-label={liked ? "Remove from saved listings" : "Save this listing"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${liked ? "bg-red-500 text-white scale-110" : "glass text-ink hover:bg-line-strong"}`}
                >
                  <Heart size={18} fill={liked ? "currentColor" : "none"} />
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
                {location && !shopWindow && (
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
                        <span className="text-sm font-medium text-ink">{amenityLabel(a)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WHO RUNS THIS PLACE, AND WHEN IT IS OPEN ──
                The page knew almost nothing about the business: a name, a
                description, a price. The ad documents carry far more that
                nothing read. Measured across the 38 public listings:
                openingHours on 100%, businessModel on 47%, a named rep on 53%.

                NOT SHOWN, deliberately: phone, WhatsApp and Instagram, which
                are on 95%, 84% and 79% of documents. Publishing an operator's
                direct line turns a marketplace into a directory, and the
                booking request is the only thing that creates a record and
                earns the commission that paid for the visit. */}
            {(openingWeek.length > 0 || style || visitLine) && (
              <div className="reveal">
                <h2 className="text-lg font-bold text-ink mb-5">Good to know</h2>

                <div className="rounded-2xl border border-line bg-card divide-y divide-line">
                  {visitLine && (
                    <div className="flex items-start gap-3 p-4">
                      <Shield size={16} className="text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-ink">{visitLine}</span>
                    </div>
                  )}

                  {style && (
                    <div className="flex items-start gap-3 p-4">
                      <Users size={16} className="text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-ink">{style}</span>
                    </div>
                  )}

                  {openingWeek.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock size={16} className="text-primary shrink-0" />
                        <span className="text-sm font-semibold text-ink">Opening hours</span>
                        {/* Only when we can actually tell. `null` means the
                            document says nothing about today, and rendering
                            that as "Closed" would send somebody to a locked
                            door on a day the place was open. */}
                        {isOpenNow === true && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Open now</span>
                        )}
                        {isOpenNow === false && (
                          <span className="text-xs font-semibold text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-full">Closed now</span>
                        )}
                      </div>
                      <dl className="space-y-1.5">
                        {openingWeek.map((row) => (
                          <div key={row.day} className="flex justify-between gap-4 text-sm">
                            <dt className="text-text-muted">{row.label}</dt>
                            <dd className={row.closed ? "text-ink-muted" : "text-ink font-medium"}>{row.hours}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* THE SERVICES, AS THE APP SHOWS THEM. Three shapes, because
                they are three different transactions: a stay sold by the
                night, a café menu read by category, and a service with tiers
                under it. resolveProfileSections picks, using the same rules
                as sectionRouter.js so the two surfaces cannot disagree about
                the same business. */}
            <ProfileServices
              listing={listing as unknown as Record<string, unknown>}
              currency={listing.currency || "NGN"}
              onPick={(name) => { setPickedOffer(name); setBooking(true); }}
            />

            {/* The menu, where there is one. On 50% of listings and read by
                nothing until now, which for a restaurant is the single most
                useful thing on the document. */}
            {listing.menuPdfUrl && (
              <div className="reveal">
                <a
                  href={listing.menuPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  <Download size={16} /> See the menu
                </a>
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
                {location && !shopWindow && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-semibold text-ink text-right max-w-[60%]">{location}</span>
                  </div>
                )}
                {!shopWindow && (listing.viewsCount || listing.views) && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Views</span>
                    <span className="font-semibold text-ink">{(listing.viewsCount || listing.views || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="my-6 border-t border-line" />

              {/* WHAT IS ACTUALLY TRUE OF EVERY LISTING, and nothing else.
                  This used to show "Instant confirmation" and "Free
                  cancellation" on every listing outside the shop window. Both
                  are false and the code already knew it: the shop-window
                  branch dropped exactly those two, because the real model is
                  a request the business has 12 hours to accept, and Sabię has
                  no cancellation policy of its own to give away for free. 36
                  of the 38 live listings took the non-shop-window branch, so
                  the false pair was what almost everybody saw.

                  "Verified listing" went too, on both branches. The site never
                  reads isVerifiedBusiness, verifiedMethod, visitedAt or the
                  verification photo, so it cannot tell a verified business
                  from an unverified one and was asserting it on all of them.
                  Wiring the real four-field gate in is the fix worth doing;
                  claiming it in the meantime is not.

                  The visit badge is now READ, not asserted: visitedBySabie()
                  checks the record, and 6 of the 38 public listings do not
                  carry the visit, so they correctly do not get the badge. The
                  12 hour line needs no data because it is the model itself. */}
              <div className="space-y-3">
                {([
                  ...(visitedBySabie(listing) ? [{ icon: Shield, text: "Visited by Sabię" }] : []),
                  { icon: Clock, text: "The business replies within 12 hours" },
                ]).map((badge) => (
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
      {!shopWindow && similarListings.length > 0 && (
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

      {shopWindow && listing && (
        <BookingRequest listing={listing} open={booking} initialOffer={pickedOffer} onClose={() => setBooking(false)} />
      )}
    </div>
  );
}
