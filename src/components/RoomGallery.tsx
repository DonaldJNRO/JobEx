"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Users, Play } from "lucide-react";
import Button from "./ui/Button";
import Overlay from "./Overlay";
import { roomPhotos, roomVideos, type Room } from "@/lib/rooms";
import { ROOM_HERO } from "@/lib/screen-open";
import { quoteStay, stayLine, todayISO, dayAfter } from "@/lib/stay";

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
  onBook: (checkIn: string, checkOut: string) => void;
}) {
  const photos = roomPhotos(room);
  const videos = roomVideos(room);
  // FILMS FIRST, because a walkthrough tells you more about a room than any
  // still, then the photos in the order their sections run.
  const items = [
    ...videos.map((src) => ({ kind: "video" as const, src })),
    ...photos.map((src) => ({ kind: "photo" as const, src })),
  ];
  const total = items.length;
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const quote = quoteStay(checkIn, checkOut, {
    rate: room.priceAmount ?? null,
    minStay: room.minStay,
  });

  // THE SCREEN WAS CLOSING ITSELF. This effect pushes a history entry on
  // mount and pops it on cleanup, and `close` depended on `onClose`, which
  // both parents pass as an inline arrow: a new function every render. So
  // every parent re-render tore the effect down, ran history.back(), armed
  // it again, and the queued popstate fired the fresh handler and closed
  // the screen. The parents re-render when the exchange rates land, when
  // the booking decision resolves and when the sticky bar appears, so a
  // room shut itself a moment after opening.
  //
  // In a ref, so the effect depends on nothing that changes and runs once
  // per mount, which is what it was always meant to do.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const close = useCallback(() => onCloseRef.current(), []);

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

  return (
    <Overlay>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={room.name}
      className="fixed inset-0 z-[100] flex flex-col bg-surface"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink transition-colors hover:bg-line"
        >
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-ink">{room.name}</h2>
          {total > 1 && <p className="text-caption text-ink-muted">{at + 1} of {total}</p>}
        </div>
      </header>

      {/* ONE AT A TIME, SWIPED. This was a column you scrolled, which I
          took from Airbnb's "show all photos" grid. Wrong reference: that
          grid is a second screen you open FROM a carousel. The first look
          at a room, on a phone, is a swipe, and stacking two photos just
          made you scroll past the first to find the second.

          CSS scroll snapping, so the swipe is the browser's own: it has the
          right momentum and the right rubber band, which no amount of touch
          handling reproduces. The counter follows the scroll rather than
          driving it. */}
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== at) setAt(i);
        }}
        // THE PHOTO TAKES THE SPACE NOBODY ELSE WANTS.
        //
        // Fixed at 4:3 it left a band of empty cream between the picture
        // and the dates on any room without a description, which is most of
        // them. Before that it was flex-1 with object-contain, which
        // letterboxed a 4:3 photo into a tall box between two black bars.
        //
        // flex-1 AND object-cover is the pair that works: the photo grows
        // into whatever height is going and fills it, so there is no dead
        // space and no letterbox. A minimum, so it cannot be squeezed to a
        // strip when a room does have a lot to say.
        className="flex max-h-[42dvh] min-h-[30dvh] min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth bg-neutral-dark [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={item.src} className="relative flex w-full shrink-0 snap-center items-center justify-center">
            {item.kind === "video" ? (
              <video
                src={item.src}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={item.src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                // The first is what somebody is waiting to see; the rest
                // load as they swipe to them.
                priority={i === 0}
                style={i === 0 ? { viewTransitionName: ROOM_HERO } : undefined}
              />
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="flex w-full items-center justify-center text-small text-ink-muted">
            No pictures of this room yet.
          </p>
        )}
      </div>

      {/* NATURAL HEIGHT, not a second claim on the space. With this at
          flex-1 as well, the photo and an almost empty body split the
          screen between them and the half holding the dots was blank
          cream. It takes what it needs and scrolls past a point. */}
      <div className="min-w-0 shrink-0 overflow-y-auto overscroll-contain" style={{ maxHeight: "40dvh" }}>
      {/* WHERE YOU ARE IN THE SET. Dots past about eight become a smear, so
          past that the count says it in words instead. */}
      {items.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-1.5 py-3">
          {items.length <= 8
            ? items.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" })}
                  className={`h-1.5 rounded-full transition-all ${i === at ? "w-5 bg-ink" : "w-1.5 bg-line-strong"}`}
                />
              ))
            : <span className="text-caption text-ink-muted">{at + 1} of {items.length}</span>}
        </div>
      )}

      </div>

      <footer className="shrink-0 border-t border-line bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
        {/* THE TERMS THAT ARE ACTUALLY FIELDS, said in the viewer's own
            money. Four rooms carry settings.cautionFee with
            cautionFeeRefundable, and the only way a traveller had ever seen
            that was as "20k" buried in a sentence beside a price in pounds. */}
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

        {/* TWO DATES, BECAUSE A STAY HAS TWO. The sheet this used to open
            asked one date and a time, which is right for a haircut and
            cannot describe a night. */}
        {/* min-w-0 ON THE CELLS. Safari gives <input type="date"> an
            intrinsic width of its own and a grid cell will not shrink below
            its content, so the two boxes grew past their columns, touched
            in the middle and ran off the right edge. Chrome lets them
            shrink, which is why this looked right until it was opened on an
            iPhone. */}
        <div className="mb-3 grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
          <label className="block">
            <span className="mb-1 block text-caption font-semibold text-ink">Check in</span>
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                // Moving the arrival past the departure leaves an
                // impossible pair on screen that the guest did not create.
                if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut(dayAfter(e.target.value));
              }}
              className="w-full min-w-0 appearance-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-small text-ink [&::-webkit-date-and-time-value]:text-left"
            />
            {/* iOS RENDERS AN EMPTY date INPUT AS NOTHING. No placeholder,
                no dd/mm/yyyy, just a box, so the two most important
                controls on this screen read as dead. Chrome draws its own
                hint, which is why this looked fine until it was opened on a
                phone. */}
            {!checkIn && <span className="pointer-events-none -mt-9 block px-3 py-2.5 text-small text-ink-faint sm:hidden">Add a date</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-caption font-semibold text-ink">Check out</span>
            <input
              type="date"
              value={checkOut}
              min={checkIn ? dayAfter(checkIn) : todayISO()}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full min-w-0 appearance-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-small text-ink [&::-webkit-date-and-time-value]:text-left"
            />
            {!checkOut && <span className="pointer-events-none -mt-9 block px-3 py-2.5 text-small text-ink-faint sm:hidden">Add a date</span>}
          </label>
        </div>

        {quote.problem && (
          <p className="mb-3 rounded-xl border border-alarm-line bg-alarm-bg px-3 py-2 text-caption text-alarm-ink" role="alert">
            {quote.problem}
          </p>
        )}

        {/* WHAT IT COMES TO, ITEMISED. The deposit is listed and NOT added:
            no Cloud Function reads cautionFee, so Sabię never charges it. It
            is money the property takes and gives back, and putting it in the
            total would take it off a card nobody intended to. */}
        {quote.subtotal !== null && (
          <div className="mb-3 space-y-1 border-t border-line pt-3 text-small">
            <div className="flex justify-between">
              <span className="text-ink-muted">
                {money(room.priceAmount ?? null, room.priceCurrency)} × {quote.nights} {quote.nights === 1 ? "night" : "nights"}
              </span>
              <span className="text-ink">{money(quote.subtotal, room.priceCurrency)}</span>
            </div>
            {room.cautionFee ? (
              <div className="flex justify-between">
                <span className="text-ink-muted">
                  Deposit, paid at the property
                  {room.cautionRefundable ? " and refunded" : ""}
                </span>
                <span className="text-ink-muted">{money(room.cautionFee, room.priceCurrency)}</span>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-heading font-extrabold text-ink">
              {quote.subtotal !== null
                ? money(quote.subtotal, room.priceCurrency)
                : money(room.priceAmount ?? null, room.priceCurrency)}
            </p>
            <p className="mt-0.5 flex items-center gap-2.5 text-caption text-ink-muted">
              {quote.nights > 0
                ? stayLine(checkIn, checkOut)
                : (
                  <>
                    {room.maxGuests ? <span className="inline-flex items-center gap-1"><Users size={11} /> Sleeps {room.maxGuests}</span> : null}
                    {videos.length > 0 && <span className="inline-flex items-center gap-1"><Play size={10} /> {videos.length}</span>}
                  </>
                )}
            </p>
          </div>
          <Button size="lg" onClick={() => onBook(checkIn, checkOut)} disabled={!quote.ok || quote.nights === 0}>
            {quote.nights > 0 ? "Book this room" : "Pick your dates"}
          </Button>
        </div>
      </footer>
    </div>
    </Overlay>
  );
}
