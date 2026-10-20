"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTravellerBookings, type TravellerBooking } from "@/lib/bookings";
import BookingFields from "@/components/BookingFields";

// The chips a traveller can actually act on. Anything unrecognised falls
// through to the raw status rather than being hidden, because a status nobody
// mapped is still information.
const STATUS_TONE: Record<string, { label: string; className: string }> = {
  // THE BRAND'S OWN THREE, not Tailwind's. leaf for money received, gold for
  // waiting, danger for refused, which is the set the app and Scout use.
  // Tailwind's emerald, amber and red belong to no product and were putting
  // five foreign colours into the stylesheet.
  confirmed_paid: { label: "Confirmed", className: "bg-settled-bg text-settled-ink" },
  confirmed: { label: "Confirmed", className: "bg-settled-bg text-settled-ink" },
  pending: { label: "Awaiting operator", className: "bg-secondary/15 text-secondary-ink" },
  declined: { label: "Declined", className: "bg-alarm-bg text-alarm-ink" },
  cancelled: { label: "Cancelled", className: "bg-surface-sunken text-ink-muted" },
  refunded: { label: "Refunded", className: "bg-surface-sunken text-ink-muted" },
};

function money(amount: number | null, currency: string | null): string | null {
  if (!amount) return null;
  const symbols: Record<string, string> = { NGN: "₦", GBP: "£", USD: "$", EUR: "€" };
  const symbol = currency ? symbols[currency] || `${currency} ` : "";
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<TravellerBooking[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const load = useCallback(async (uid: string) => {
    try {
      setBookings(await getTravellerBookings(uid));
    } catch {
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) load(user.uid);
  }, [user?.uid, load]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-section">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-ink">My bookings</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Your code is what you say at the door.
          </p>
        </header>

        {bookings === null && (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-surface-sunken animate-shimmer" />
            ))}
          </div>
        )}

        {bookings !== null && bookings.length === 0 && (
          <div className="rounded-2xl border border-line bg-card py-20 text-center">
            <Calendar size={44} className="mx-auto mb-4 text-text-muted/30" />
            <h2 className="text-lg font-semibold text-ink">No bookings yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              When you book a stay, an experience or an event, it shows up here with
              the code you need at the door.
            </p>
            <Button href="/" className="mt-6">
              Browse listings
            </Button>
          </div>
        )}

        {bookings !== null && bookings.length > 0 && (
          <ul className="space-y-4">
            {bookings.map((booking) => {
              const tone = STATUS_TONE[booking.status];
              const total = money(booking.totalPrice, booking.currency);
              return (
                <li
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-line bg-card"
                >
                  <div className="flex items-start gap-4 p-5">
                    {booking.image ? (
                      <Image
                        src={booking.image}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-sunken">
                        <MapPin size={20} className="text-text-muted/40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {/* whitespace-nowrap because a pill stops being a pill
                          the moment its label wraps: the text spills out of the
                          rounded background and the chip reads as broken. The
                          first attempt added max-w-full and truncate as well,
                          which collapsed every label to "C.." and "A.." — the
                          labels are short by design, so nowrap is the whole
                          fix and truncation only had something to break. */}
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-caption font-semibold ${
                          tone?.className || "bg-line-strong text-text-muted"
                        }`}
                      >
                        {tone?.label || booking.status}
                      </span>
                      {total && (
                        <p className="mt-2 text-lg font-bold text-primary">{total}</p>
                      )}
                    </div>
                  </div>

                  {/* The four fields, in the one order, from the one component. */}
                  <div className="border-t border-line px-5 py-5">
                    <BookingFields booking={booking} />
                  </div>

                  {booking.listingId && (
                    <div className="border-t border-line px-5 py-3">
                      <Link
                        href={`/listing/${booking.listingId}`}
                        className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                      >
                        View the listing
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
