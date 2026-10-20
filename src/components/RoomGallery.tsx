"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, Users, Play } from "lucide-react";
import Button from "./ui/Button";
import Overlay from "./Overlay";
import { roomPhotos, roomVideos, type Room } from "@/lib/rooms";
import { ROOM_HERO } from "@/lib/screen-open";

/**
 * What a room looks like, the way Airbnb shows one.
 *
 * THREE THINGS THAT ARE NOT OPTIONAL, and the first is why this appeared
 * wedged into the middle of the page instead of over it:
 *
 * 1. IT IS PORTALLED TO THE BODY. `position: fixed` is NOT relative to the
 *    viewport when any ancestor carries a transform: that ancestor becomes
 *    the containing block. Every section on the listing page wears .reveal,
 *    which animates `transform: translateY(20px)`, so a fixed overlay inside
 *    one was pinned to that section and rendered as a black box in the
 *    scroll, clipped by the bottom bar. No amount of z-index fixes it,
 *    because it is not a stacking problem.
 *
 * 2. THE BACK BUTTON CLOSES IT. Opening pushes a history entry. On a phone
 *    the first thing anybody does to dismiss a full-screen layer is swipe or
 *    press back, and without this that leaves the listing entirely.
 *
 * 3. IT SCROLLS. A room here has up to eleven photos. One-at-a-time with
 *    arrows is a slideshow; Airbnb gives you the whole set in a column you
 *    scroll, which is how somebody actually decides on a room.
 */
export default function RoomGallery({
  room,
  money,
  onClose,
  onBook,
}: {
  room: Room;
  money: (amount: number | null, currency?: string | null) => string;
  onClose: () => void;
  onBook: () => void;
}) {
  const photos = roomPhotos(room);
  const videos = roomVideos(room);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);

    // The page behind must not scroll under the overlay.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // A history entry, so back closes this rather than leaving the listing.
    window.history.pushState({ roomGallery: true }, "");
    const onPop = () => close();
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      // If this closed by any route other than back, that entry is still on
      // the stack and the next back press would do nothing visible.
      if (window.history.state?.roomGallery) window.history.back();
    };
  }, [close]);

  const total = photos.length + videos.length;

  return (
    <Overlay>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={room.name}
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-dark"
    >
      <header className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-white">{room.name}</h2>
          {total > 0 && (
            <p className="text-caption text-white/70">
              {total} {total === 1 ? "item" : "items"}
            </p>
          )}
        </div>
      </header>

      {/* THE WHOLE SET, SCROLLED. Films first, because a walkthrough tells
          you more about a room than any single still. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {videos.map((src) => (
            <video
              key={src}
              src={src}
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-xl bg-black"
            />
          ))}
          {photos.map((src, i) => (
            <div
              key={src}
              className="relative w-full overflow-hidden rounded-xl bg-white/5"
              // THE OTHER END. The first photo is the one that travelled up
              // from the row, so it alone carries the name; giving it to
              // every photo would be several elements claiming one name,
              // which names none of them.
              style={i === 0 ? { viewTransitionName: ROOM_HERO } : undefined}
            >
              <Image
                src={src}
                alt=""
                width={1200}
                height={900}
                sizes="(min-width: 768px) 768px, 100vw"
                className="h-auto w-full object-contain"
                // The first one is what somebody is waiting to see.
                priority={i === 0}
              />
            </div>
          ))}
          {total === 0 && (
            <p className="py-20 text-center text-small text-white/60">
              No pictures of this room yet.
            </p>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-line bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
        {/* THE TERMS THAT ARE ACTUALLY FIELDS, said in the viewer's own
            money. Four rooms carry settings.cautionFee: 20000 with
            cautionFeeRefundable, and the only way a traveller had ever seen
            that was as "20k" buried in a sentence, beside a price in
            pounds. A deposit you learn about at the door is the worst
            possible moment to learn about it. */}
        {(room.cautionFee || room.checkIn || room.minStay) && (
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            {room.cautionFee ? (
              <span>
                <span className="font-semibold text-ink">{money(room.cautionFee, room.priceCurrency)}</span>
                {room.cautionRefundable ? " refundable deposit" : " deposit"}
              </span>
            ) : null}
            {room.checkIn && room.checkOut ? <span>In {room.checkIn}, out {room.checkOut}</span> : null}
            {room.minStay && room.minStay > 1 ? <span>{room.minStay} nights minimum</span> : null}
          </div>
        )}
        {room.description && (
          <p className="mb-3 line-clamp-2 text-small leading-relaxed text-ink-muted">{room.description}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-heading font-extrabold text-ink">
              {money(room.priceAmount ?? null, room.priceCurrency)}
            </p>
            <p className="mt-0.5 flex items-center gap-2.5 text-caption text-ink-muted">
              {room.maxGuests ? (
                <span className="inline-flex items-center gap-1"><Users size={11} /> Sleeps {room.maxGuests}</span>
              ) : null}
              {videos.length > 0 && (
                <span className="inline-flex items-center gap-1"><Play size={10} /> {videos.length}</span>
              )}
            </p>
          </div>
          <Button size="lg" onClick={onBook}>Book this room</Button>
        </div>
      </footer>
    </div>
    </Overlay>
  );
}
