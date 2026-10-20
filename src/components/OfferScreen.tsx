"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Clock, ChevronRight } from "lucide-react";
import Button from "./ui/Button";
import Overlay from "./Overlay";
import { ROW_ACTION, cardClass } from "@/lib/ui-recipes";
import { OFFER_HERO } from "@/lib/screen-open";
import type { ServiceGroup } from "@/lib/shop-window";

/**
 * One screen for a thing you can book that is not a room.
 *
 * "It needs every single category we have, events, experiences as well. See
 * activity, scroll down, tap on it, take to another screen that shows that
 * type of thing with the details I can scroll down."
 *
 * Rooms got this first and the rest of the catalogue did not, which made it
 * a special case rather than how the product works. 136 experience services
 * exist, 85 with a photo and 116 carrying their own hours, and all of that
 * reached a traveller as a name and a price on one row.
 *
 * NOT FOOD AND DRINK. A café's menu is a menu: you read it, you do not tap
 * a jollof rice to open its screen. hasPickableList already refuses a menu
 * shape, so that stays true by construction rather than by a rule here.
 */
export default function OfferScreen({
  group,
  money,
  onClose,
  onPick,
}: {
  group: ServiceGroup;
  money: (n: number | null) => string;
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  const media = [
    ...(group.videoUrl ? [{ kind: "video" as const, src: group.videoUrl }] : []),
    ...(group.imageUrl ? [{ kind: "photo" as const, src: group.imageUrl }] : []),
  ];
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement | null>(null);
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Back closes this, as it closes a room. On a phone that is the first
    // thing anybody does to dismiss a full-screen layer.
    window.history.pushState({ offerScreen: true }, "");
    const onPop = () => close();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prev;
      if (window.history.state?.offerScreen) window.history.back();
    };
  }, [close]);

  return (
    <Overlay>
      <div role="dialog" aria-modal="true" aria-label={group.name} className="fixed inset-0 z-[100] flex flex-col bg-surface">
        <header className="flex shrink-0 items-center gap-3 border-b border-line bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink hover:bg-line"
          >
            <X size={18} />
          </button>
          <h2 className="min-w-0 flex-1 truncate font-bold text-ink">{group.name}</h2>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          {media.length > 0 && (
            <div
              ref={track}
              onScroll={(e) => {
                const el = e.currentTarget;
                const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (i !== at) setAt(i);
              }}
              className="flex snap-x snap-mandatory overflow-x-auto bg-neutral-dark [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {media.map((m, i) => (
                <div key={m.src} className="relative aspect-[4/3] w-full shrink-0 snap-center">
                  {m.kind === "video" ? (
                    <video src={m.src} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    <Image
                      src={m.src}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority={i === 0}
                      style={i === 0 ? { viewTransitionName: OFFER_HERO } : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-5">
            {group.description && (
              <p className="whitespace-pre-line text-body leading-[1.8] text-ink-body">{group.description}</p>
            )}

            {/* THE HOURS IT RUNS. 116 experience services carry timeSlots
                and nothing on this website had ever read one, so "when is
                it" was a question the page could answer and did not. */}
            {(group.timeSlots?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2.5 flex items-center gap-2 text-heading font-bold text-ink">
                  <Clock size={16} /> When it runs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.timeSlots!.map((t) => (
                    <span key={t} className="rounded-full bg-ink-wash px-3 py-1.5 text-small font-semibold text-ink">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-caption text-ink-muted">You pick the day on the next screen.</p>
              </div>
            )}

            {/* THE CHOICES, where there are some. A tier is a real decision
                about what you are buying, not a detail. */}
            {group.tiers.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2.5 text-heading font-bold text-ink">Choose one</h3>
                <ul className={`divide-y divide-line overflow-hidden ${cardClass({ pad: "none" })}`}>
                  {group.tiers.map((t) => (
                    <li key={t.label}>
                      <button
                        type="button"
                        onClick={() => onPick(`${group.name} (${t.label})`)}
                        className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-surface-sunken"
                      >
                        <span className="min-w-0 text-ink">{t.label}</span>
                        <span className="flex shrink-0 items-center gap-2.5">
                          <span className="text-sm font-semibold text-ink">{money(t.price)}</span>
                          <span className={ROW_ACTION}>Book <ChevronRight size={13} /></span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* One action, and only where there is one thing to book. With
            tiers the choice above IS the action, and a second button here
            could not say which tier it meant. */}
        {group.tiers.length === 0 && (
          <footer className="shrink-0 border-t border-line bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-heading font-extrabold text-ink">{money(group.fromPrice)}</p>
              <Button size="lg" onClick={() => onPick(group.name)}>Book this</Button>
            </div>
          </footer>
        )}
      </div>
    </Overlay>
  );
}
