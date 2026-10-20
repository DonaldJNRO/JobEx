"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight, Play, Users } from "lucide-react";
import { fetchRooms, roomCover, roomPhotos, roomVideos, hasMedia, stayFacts, type Room } from "@/lib/rooms";
import { ROW_ACTION } from "@/lib/ui-recipes";
import { openAsScreen, ROOM_HERO } from "@/lib/screen-open";
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
  /** The room, and the nights, so the sheet does not ask for a date again. */
  onPick: (name: string, stay?: { checkIn: string; checkOut: string }) => void;
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
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement | null>(null);

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
      <h2 className="text-heading font-bold text-ink">Pick a room</h2>
      {/* WILL WE FIT, answered before the prices. Airbnb puts this directly
          under the title and it is the first thing anybody checks. */}
      <p className="mb-3 mt-1 text-small text-ink-muted">{stayFacts(rooms).join(" · ")}</p>
      {/* SIDE BY SIDE, SWIPED. A stacked list of seven rooms is seven
          scrolls before you have seen what is on offer, and the photo gets
          a thumbnail because a list row has nowhere to put one. A card you
          slide gives each room a picture at the size somebody can judge it
          by, and the next one is always half in view, which is what says
          "there is more". Same scroll snapping as inside a room: the
          browser's own swipe, not a reproduction of one. */}
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          const w = card ? card.offsetWidth + 12 : el.clientWidth;
          const i = Math.round(el.scrollLeft / Math.max(1, w));
          if (i !== at) setAt(i);
        }}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {rooms.map((room) => {
          const cover = roomCover(room);
          const photos = roomPhotos(room).length;
          const films = roomVideos(room).length;
          return (
            <button
              key={room.id}
              type="button"
              onClick={(e) => {
                if (!hasMedia(room)) return onPick(room.name);
                const thumb = (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-room-thumb]");
                openAsScreen(thumb, ROOM_HERO, () => setShowing(room));
              }}
              // 66%, so a second card is genuinely readable rather than a
              // sliver. At 78 one room owned the screen and the carousel
              // read as a very tall single card you happened to be able to
              // push sideways.
              className="w-[66%] max-w-[18rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-card text-left transition-transform duration-150 active:scale-[0.985]"
            >
              {/* 3:2, not 4:3. Seven rooms of 4:3 plus their details made
                  each card taller than the screen it sits in. */}
              <span data-room-thumb className="relative block aspect-[3/2] w-full overflow-hidden bg-surface-sunken">
                {cover ? <Image src={cover} alt="" fill sizes="(min-width: 640px) 288px, 66vw" className="object-cover" /> : null}
                {films > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                      <Play size={15} className="ml-0.5 fill-white text-white" />
                    </span>
                  </span>
                )}
              </span>

              <span className="block p-3.5">
                <span className="block truncate font-semibold text-ink">{room.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-caption text-ink-muted">
                  {room.maxGuests ? (
                    <span className="inline-flex items-center gap-1"><Users size={11} /> {room.maxGuests}</span>
                  ) : null}
                  {photos > 0 && <span>{photos} {photos === 1 ? "photo" : "photos"}</span>}
                </span>
                <span className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="text-heading font-extrabold text-ink">
                    {money(room.priceAmount ?? null, room.priceCurrency)}
                  </span>
                  <span className={ROW_ACTION}>
                    {hasMedia(room) ? "See room" : "Book"}
                    <ChevronRight size={13} />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* WHICH ONE OF HOW MANY. Seven rooms sliding past with no counter is
          a carousel you cannot tell the end of. */}
      {rooms.length > 1 && (
        <p className="mt-2.5 text-caption text-ink-muted">
          {Math.min(at + 1, rooms.length)} of {rooms.length}
        </p>
      )}

      {showing && (
        <RoomGallery
          room={showing}
          money={money}
          onClose={() => setShowing(null)}
          onBook={(checkIn, checkOut) => {
            const n = showing.name;
            setShowing(null);
            onPick(n, checkIn && checkOut ? { checkIn, checkOut } : undefined);
          }}
        />
      )}
    </section>
  );
}
