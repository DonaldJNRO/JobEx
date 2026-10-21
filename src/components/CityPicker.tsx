"use client";

// "Where are you going?" — the app's city sheet, on the web.
//
// It is a sheet on a phone and a dropdown panel on a laptop, which is the
// same choice TikTok and Snapchat make: the shape follows the device, the
// content does not change.
//
// WHY IT SHOWS WHAT EACH CITY HAS. The cities collection carries the live
// categories per city, and the app renders them as chips so somebody sees
// that London is stays and food, and Bamako is stays only, BEFORE picking it
// rather than after landing on a thin feed. Reading them rather than deriving
// them matters: the office keeps that list in sync, and a feed that counts
// listings itself would disagree with the office the moment one is unpublished.
//
// The subtitle is Sabię's own line and stays verbatim. It is the honest
// version of a short city list, and it is the sentence that makes a small
// catalogue read as a decision instead of a gap.

import { useEffect, useRef, useState } from "react";
import Overlay from "./Overlay";
import { Check, ChevronDown, X } from "lucide-react";
import { flagFor } from "@/lib/city-flag";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { KnownCity } from "@/lib/listings";

export default function CityPicker({
  cities,
  selected,
  onSelect,
  counts,
}: {
  cities: KnownCity[];
  selected: string | null;
  onSelect: (cityId: string | null) => void;
  /**
   * HOW MANY PLACES ARE ACTUALLY THERE, by city id.
   *
   * London sits at order 2 in the cities collection, second after Lagos,
   * and has two listings behind it. A picker that shows six equal rows
   * sends somebody into a city with nothing in it and lets them find out
   * afterwards, which is the slowest possible way to learn it.
   *
   * Saying the number on the row costs nothing and is the same honesty the
   * uncovered-country policy already applies to trips.
   */
  counts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // Escape closes, and the page behind does not scroll while a sheet is over
  // it. Both are what the booking modal already does.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Deferred, or the click that opened this closes it again.
    const t = setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      clearTimeout(t);
    };
  }, [open]);

  // ORDERED BY WHAT IS ACTUALLY THERE, not by the collection's `order`
  // field. That field had London at 2, ahead of Abuja's 12 and Jos's 10,
  // on the strength of two listings, and a tie at 4 between Bamako and
  // Jos. Nobody maintains it, and a hand-set rank that disagrees with the
  // catalogue is a rank that sends people to the emptiest city first.
  //
  // Falls back to `order` when counts are not in yet, so the sheet never
  // reshuffles under somebody's thumb as the feed arrives.
  const live = cities
    .filter((c) => !c.status || c.status === "live")
    .slice()
    .sort((a, b) => {
      const byDepth = (counts?.[b.id] ?? -1) - (counts?.[a.id] ?? -1);
      if (byDepth) return byDepth;
      return (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name);
    });
  const current = live.find((c) => c.id === selected);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-1 text-heading font-bold tracking-tight text-ink"
      >
        {current ? current.name : "Everywhere"}
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </button>

      {/* PORTALLED. This sheet lives inside the home page's sticky header,
          which carries backdrop-blur, and backdrop-filter makes that header
          the containing block for anything fixed inside it, by the same rule
          as a transform. So the sheet was pinned to a sixty pixel bar. */}
      {open && (
        <Overlay>
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 sm:items-center">
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Where are you going?"
            className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:max-w-md sm:rounded-3xl sm:pb-6"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-title font-bold tracking-tight text-ink">Where are you going?</h2>
                <p className="mt-1.5 text-small leading-relaxed text-text-muted">
                  We go deep in a few places rather than thin everywhere. Your feed leans toward the city you pick.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-ink-muted hover:bg-surface-sunken"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-6 text-small text-text-muted">Live now</p>
            <ul className="mt-2 overflow-hidden rounded-2xl bg-surface-sunken">
              {live.map((c) => {
                const picked = c.id === selected;
                const flag = flagFor(c.country);
                return (
                  <li key={c.id} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      onClick={() => { onSelect(c.id); setOpen(false); }}
                      aria-current={picked ? "true" : undefined}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface"
                    >
                      {flag && <span className="text-title leading-none" aria-hidden="true">{flag}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-heading font-bold text-ink">{c.name}</span>
                          {counts && (
                            <span className="text-caption text-ink-muted">
                              {counts[c.id] === 1 ? "1 place" : `${counts[c.id] ?? 0} places`}
                            </span>
                          )}
                        </span>
                        {!!c.categories?.length && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.categories.map((id) => (
                              <span key={id} className="rounded-full bg-card px-2.5 py-1 text-caption text-ink-muted">
                                {CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS] || id}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      {picked && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* The way out of a city, without pretending we are everywhere. */}
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className="mt-4 w-full rounded-xl px-4 py-3 text-small font-medium text-ink-muted hover:bg-surface-sunken"
            >
              Show me everywhere
            </button>
          </div>
        </div>
        </Overlay>
      )}
    </>
  );
}
