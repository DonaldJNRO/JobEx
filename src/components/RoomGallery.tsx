"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Button from "./ui/Button";
import { roomPhotos, roomVideos, type Room } from "@/lib/rooms";

/**
 * What a room actually looks like, which this website has never shown.
 *
 * Photos and films in the order their sections run, the same order the app
 * uses, so somebody who saw a room on their phone recognises it here.
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
  const items = [
    ...videos.map((src) => ({ kind: "video" as const, src })),
    ...photos.map((src) => ({ kind: "photo" as const, src })),
  ];
  const [i, setI] = useState(0);
  const go = useCallback(
    (d: number) => setI((n) => (items.length ? (n + d + items.length) % items.length : 0)),
    [items.length],
  );

  // ESCAPE CLOSES, ARROWS MOVE. A full-screen layer with no keyboard way out
  // is a trap, and this one covers the whole page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while this is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, go]);

  const current = items[i];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={room.name}
      className="fixed inset-0 z-50 flex flex-col bg-neutral-dark"
    >
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-white">{room.name}</h2>
          {items.length > 1 && (
            <p className="text-caption text-white/70">{i + 1} of {items.length}</p>
          )}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {current?.kind === "video" ? (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            // No autoplay: a film that starts talking the moment a sheet
            // opens is the thing everybody mutes their phone to avoid.
            className="h-full w-full object-contain"
          />
        ) : current ? (
          <Image key={current.src} src={current.src} alt="" fill sizes="100vw" className="object-contain" priority />
        ) : null}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/70"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/70"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <footer className="shrink-0 bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
        {room.description && (
          <p className="mb-3 line-clamp-3 text-small leading-relaxed text-ink-muted">{room.description}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-heading font-extrabold text-ink">{money(room.priceAmount ?? null, room.priceCurrency)}</p>
            {room.maxGuests ? (
              <p className="mt-0.5 inline-flex items-center gap-1 text-caption text-ink-muted">
                <Users size={11} /> Sleeps {room.maxGuests}
              </p>
            ) : null}
          </div>
          <Button size="lg" onClick={onBook}>Book this room</Button>
        </div>
      </footer>
    </div>
  );
}
