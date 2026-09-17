"use client";

/**
 * Asking to book, in a phone browser, with no app installed.
 *
 * THE MODEL IS UNCHANGED. The guest REQUESTS. The operator has 12 hours to
 * accept. Payment comes after that, elsewhere. Nothing here takes money, and
 * nothing here confirms a booking, because neither is this screen's to give.
 *
 * WHAT IT REFUSES TO DO. It never tells a guest their request was sent unless
 * the write came back with a document id. A cheerful confirmation over a
 * failed write is the worst outcome available here: the guest waits twelve
 * hours, the operator never heard, and the first anybody knows is somebody
 * turning up.
 */

import { useEffect, useRef, useState } from "react";
import { X, Check, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { sendBookingRequest, BookingError } from "@/lib/book";
import { offersOf, type Offer } from "@/lib/shop-window";
import { buildDisplayPrice, guestCurrency, formatPriceWithCurrency } from "@/lib/display-price";
import { APP_STORE_URL } from "@/lib/app-links";
import type { Listing } from "@/lib/listings";

/** Today, in the yyyy-mm-dd a date input wants, in the GUEST's timezone.
 *  Built from local parts rather than toISOString(), which is UTC and puts
 *  anyone west of Greenwich a day behind for part of every day. */
function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Our own formatting, never the browser's locale: a date shown as 09/15/2026
 *  to a guest in Lagos is a different day to half the people reading it. */
function readableDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function BookingRequest({
  listing,
  open,
  onClose,
}: {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}) {
  const offers = offersOf(listing);
  const [offer, setOffer] = useState<string>(offers[0]?.name ?? "");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const firstField = useRef<HTMLSelectElement | HTMLInputElement | null>(null);

  // One key per opening of this form, so a guest who taps Send twice on a slow
  // connection does not put two requests in the operator's inbox.
  const idempotencyKey = useRef<string>("");
  useEffect(() => {
    if (!open) return;
    idempotencyKey.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setError(null);
    firstField.current?.focus();
  }, [open]);

  // The page behind must not scroll while this is over it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const chosen: Offer | undefined = offers.find((o) => o.name === offer);
  const unit = chosen?.price;
  const total = typeof unit === "number" ? unit * Math.max(1, guests) : undefined;
  const money = buildDisplayPrice({
    amount: total,
    nativeCurrency: listing.currency || "NGN",
    selectedCurrency: guestCurrency(typeof navigator !== "undefined" ? navigator.language : ""),
    // No rates on the web yet, so this shows the operator's own price and says
    // nothing it cannot stand behind. It converts the day rates arrive.
    ratesReady: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const id = await sendBookingRequest(
        listing,
        { offer, date, guests, name, contact, note, totalPrice: total },
        idempotencyKey.current,
      );
      setSentId(id);
    } catch (err) {
      setError(err instanceof BookingError ? err.message : "That did not send. Nothing has been booked.");
    } finally {
      setSending(false);
    }
  };

  const business = listing.businessName || listing.title || "them";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sentId ? "Request sent" : `Ask ${business} to book`}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-card rounded-t-3xl sm:rounded-3xl border border-line p-5 sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 w-11 h-11 inline-flex items-center justify-center text-ink-faint hover:text-ink rounded-xl"
        >
          <X size={18} />
        </button>

        {sentId ? (
          <div className="pt-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check size={22} className="text-primary" />
            </div>
            <h2 className="text-xl text-ink mb-2">Request sent</h2>
            {/* The exact promise, and nothing beyond it. No "confirmed", no
                "booked": the operator has not answered yet. */}
            <p className="text-sm text-ink-muted leading-relaxed">
              They have 12 hours. We&rsquo;ll tell you when to pay.
            </p>
            <dl className="mt-5 rounded-2xl bg-surface-sunken border border-line p-4 text-sm">
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-ink-muted">What</dt><dd className="text-ink font-medium text-right">{offer}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-ink-muted">When</dt><dd className="text-ink font-medium text-right">{readableDate(date)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-ink-muted">How many</dt><dd className="text-ink font-medium text-right">{guests}</dd>
              </div>
              {money.display && (
                <div className="flex justify-between gap-4 py-1">
                  <dt className="text-ink-muted">Price</dt><dd className="text-ink font-medium text-right">{money.display}</dd>
                </div>
              )}
            </dl>
            {/* ONLY NOW. The App Store is offered after a request exists, and
                as a second option, never as the way to make one. */}
            <p className="mt-5 text-xs text-ink-faint leading-relaxed">
              Want it on your phone? The Sabię app keeps this booking, and the
              rest of the trip, in one place.{" "}
              <a href={APP_STORE_URL} className="font-semibold text-primary underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                Get the app
              </a>
            </p>
            <button type="button" onClick={onClose} className="mt-5 w-full h-12 rounded-2xl bg-primary text-white font-semibold">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="pt-4">
            <h2 className="text-xl text-ink mb-1">Ask to book</h2>
            <p className="text-sm text-ink-muted mb-5">
              {business} has 12 hours to accept. You pay after they do, not now.
            </p>

            {offers.length > 1 ? (
              <label className="block mb-4">
                <span className="block text-sm font-semibold text-ink mb-1.5">What are you booking?</span>
                {/* OUR CHEVRON, not the browser's. A native select draws its
                    own arrow in a different place, at a different size and in a
                    different grey on every OS, hard against the right edge and
                    ignoring the radius. It is the one control on a form that
                    refuses to match the others. appearance-none removes it, the
                    padding makes room, and pointer-events-none keeps the whole
                    field tappable rather than leaving a dead 16px where the
                    icon sits. Same treatment as the explore filter, the admin
                    filter bar, and Scout. */}
                <div className="relative">
                  <select
                    ref={firstField as React.RefObject<HTMLSelectElement>}
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    className="w-full h-12 pl-3 pr-11 rounded-2xl bg-card border border-line text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
                  >
                    {offers.map((o) => (
                      <option key={o.name} value={o.name}>
                        {o.name}{typeof o.price === "number" ? ` · ${formatPriceWithCurrency(o.price, listing.currency || "NGN")}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                  />
                </div>
              </label>
            ) : offers.length === 1 ? (
              <div className="mb-4 rounded-2xl bg-surface-sunken border border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">{offers[0].name}</p>
                {typeof offers[0].price === "number" && (
                  <p className="text-sm text-ink-muted">{formatPriceWithCurrency(offers[0].price, listing.currency || "NGN")}</p>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="block text-sm font-semibold text-ink mb-1.5">Date</span>
                <input
                  type="date"
                  required
                  min={todayLocal()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-card border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-ink mb-1.5">How many</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-2xl bg-card border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
                />
              </label>
            </div>

            {date && (
              <p className="-mt-2 mb-4 text-xs text-ink-faint">{readableDate(date)}</p>
            )}

            <label className="block mb-4">
              <span className="block text-sm font-semibold text-ink mb-1.5">Your name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl bg-card border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
              />
            </label>

            <label className="block mb-4">
              <span className="block text-sm font-semibold text-ink mb-1.5">Email or phone</span>
              <input
                type="text"
                required
                inputMode="email"
                placeholder="So they can reply"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl bg-card border border-line text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
              />
            </label>

            <label className="block mb-5">
              <span className="block text-sm font-semibold text-ink mb-1.5">Anything they should know? <span className="font-normal text-ink-faint">Optional</span></span>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-card border border-line text-ink resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
              />
            </label>

            {money.display && (
              <div className="mb-5 flex items-baseline justify-between">
                <span className="text-sm text-ink-muted">Total</span>
                <span className="text-right">
                  <span className="block text-2xl font-semibold text-ink">{money.display}</span>
                  {money.original && <span className="block text-xs text-ink-faint">{money.original}</span>}
                </span>
              </div>
            )}

            {error && (
              <p className="mb-4 flex items-start gap-2 text-sm text-alarm-ink bg-alarm-bg border border-alarm-line rounded-2xl px-3 py-2.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full h-13 min-h-[52px] rounded-2xl bg-primary text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending && <Loader2 size={16} className="animate-spin" />}
              {sending ? "Sending" : "Send request"}
            </button>
            <p className="mt-3 text-xs text-ink-faint text-center">
              No payment now. Nothing is charged until they accept.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
