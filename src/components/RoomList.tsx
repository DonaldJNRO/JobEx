"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight, Play, Users } from "lucide-react";
import { fetchRooms, roomCover, roomPhotos, roomVideos, hasMedia, type Room } from "@/lib/rooms";
import { ROW_ACTION } from "@/lib/ui-recipes";
import { useMoney as useGuestRates } from "@/lib/useRates";
import { buildDisplayPrice } from "@/lib/display-price";
import RoomGallery from "./RoomGallery";

/**
 * The rooms, with the pictures that were always there.
 *
 * This site showed a stay's rooms as rows out of services[]: a name, a
 * price, and nothing behind them, so tapping one went straight to payment.
 * The real rooms are in a roomTypes or stayUnits subcollection, and all 30
 * of them in production carry media.
 */
export default function RoomList({
  role,
  docId,
  fallbackCurrency,
  onPick,
  onRooms,
}: {
  role: string;
  docId: string;
  /** The listing's currency, for a room that does not name its own. */
  fallbackCurrency: string;
  onPick: (name: string) => void;
  /** The names found, so the services list can drop its copies of them. */
  onRooms?: (names: string[]) => void;
}) {
  // A ROOM STATES ITS OWN CURRENCY. basePrice is {amount, currency} and a
  // GBP room can sit under a listing priced in naira, so converting every
  // room through the listing's currency would misprice it.
  const { rates, ready, to } = useGuestRates();
  const money = (amount: number | null, currency?: string | null): string => {
    if (amount === null || amount === undefined) return "Ask";
    return buildDisplayPrice({
      amount,
      nativeCurrency: currency || fallbackCurrency,
      selectedCurrency: to,
      exchangeRates: rates,
      ratesReady: ready,
    }).display || String(amount);
  };
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [showing, setShowing] = useState<Room | null>(null);

  // In a ref, so a parent passing an inline callback does not re-run the
  // fetch on every render.
  const onRoomsRef = useRef(onRooms);
  useEffect(() => { onRoomsRef.current = onRooms; }, [onRooms]);

  useEffect(() => {
    let live = true;
    fetchRooms(role, docId)
      .then((r) => { if (live) { setRooms(r); onRoomsRef.current?.(r.map((x) => x.name)); } })
      // A listing whose rooms will not load still has a page. The services
      // list below remains the way in.
      .catch(() => { if (live) setRooms([]); });
    return () => { live = false; };
  }, [role, docId]);

  if (rooms === null) {
    return (
      <section>
        <div className="h-5 w-28 rounded bg-surface-sunken animate-shimmer" />
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="h-16 w-20 shrink-0 rounded-xl bg-surface-sunken animate-shimmer" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-surface-sunken animate-shimmer" />
                <div className="h-3 w-1/3 rounded bg-surface-sunken animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (rooms.length === 0) return null;

  return (
    <section className="reveal">
      <h2 className="text-heading font-bold text-ink mb-3">Pick a room</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {rooms.map((room) => {
          const cover = roomCover(room);
          const photos = roomPhotos(room).length;
          const films = roomVideos(room).length;
          return (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => (hasMedia(room) ? setShowing(room) : onPick(room.name))}
                className="group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-sunken"
              >
                {/* THE PICTURE, which is the whole point. A room with only a
                    film has no still to show, so it gets the play mark on
                    its own rather than a grey box pretending to be a photo. */}
                <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-sunken">
                  {cover ? (
                    <Image src={cover} alt="" fill sizes="80px" className="object-cover" />
                  ) : null}
                  {films > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                        <Play size={12} className="ml-0.5 fill-white text-white" />
                      </span>
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{room.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-caption text-ink-muted">
                    {room.maxGuests ? (
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {room.maxGuests}
                      </span>
                    ) : null}
                    {photos > 0 && <span>{photos} {photos === 1 ? "photo" : "photos"}</span>}
                    {films > 0 && <span>{films} {films === 1 ? "film" : "films"}</span>}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-ink">
                    {money(room.priceAmount ?? null, room.priceCurrency)}
                  </span>
                  <span className={`${ROW_ACTION} mt-1`}>
                    {hasMedia(room) ? "See room" : "Book"}
                    <ChevronRight size={13} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {showing && (
        <RoomGallery
          room={showing}
          money={money}
          onClose={() => setShowing(null)}
          onBook={() => { const n = showing.name; setShowing(null); onPick(n); }}
        />
      )}
    </section>
  );
}
