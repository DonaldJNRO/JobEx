"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { cardClass, pillClass } from "@/lib/ui-recipes";
import LoadError from "@/components/ui/LoadError";
import { useMoney } from "@/lib/useRates";
import { buildDisplayPrice, formatPriceWithCurrency } from "@/lib/display-price";
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
// THE TONE, NOT THE CLASSES. This map carried its own colour pairs, which
// is a sixteenth spelling of a badge: the pill already knows what settled
// and alarm look like, and a status only has to say which of them it is.
const STATUS_TONE: Record<string, { label: string; tone: "settled" | "alarm" | "gold" | "neutral" }> = {
  // THE BRAND'S OWN THREE, not Tailwind's. leaf for money received, gold for
  // waiting, danger for refused, which is the set the app and Scout use.
  // Tailwind's emerald, amber and red belong to no product and were putting
  // five foreign colours into the stylesheet.
  confirmed_paid: { label: "Confirmed", tone: "settled" },
  confirmed: { label: "Confirmed", tone: "settled" },
  pending: { label: "Awaiting operator", tone: "gold" },
  declined: { label: "Declined", tone: "alarm" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

// A PRIVATE FOUR ENTRY SYMBOL TABLE USED TO LIVE HERE, with no rate lookup
// at all, so every past booking was shown in the OPERATOR's money: a
// traveller in London opened their bookings and read N120,000 for something
// they had paid for in pounds.
//
// It survived because guest-currency.test.mjs sweeps src/components and
// src/lib and never looked in src/app, which is also how the cart page kept
// its own copy. The sweep covers the pages now.

export default function BookingsPage() {
  const [failed, setFailed] = useState(false);
  const { rates, ready, to } = useMoney();
  const money = (amount: number | null, currency: string | null): string | null => {
    if (!amount) return null;
    return buildDisplayPrice({
      amount,
      nativeCurrency: currency || "NGN",
      selectedCurrency: to,
      exchangeRates: rates,
      ratesReady: ready,
    }).display || formatPriceWithCurrency(amount, currency || "NGN");
  };
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<TravellerBooking[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  const load = useCallback(async (uid: string) => {
    setFailed(false);
    try {
      setBookings(await getTravellerBookings(uid));
    } catch {
      // NOT AN EMPTY LIST. This set [] and the page then rendered "No
      // bookings yet" to a traveller with ten of them, so an outage looked
      // like somebody who had never booked anything.
      setFailed(true);
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
          <h1 className="text-title font-bold text-ink">My bookings</h1>
          <p className="mt-1.5 text-small text-text-muted">
            Your code is what you say at the door.
          </p>
        </header>

        {failed && <LoadError what="your bookings" onRetry={() => user?.uid && load(user.uid)} />}

        {!failed && bookings === null && (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        )}

        {!failed && bookings !== null && bookings.length === 0 && (
          <EmptyState
            icon={<Calendar size={28} />}
            title="No bookings yet"
            body="When you book a stay, an experience or an event, it shows up here with the code you need at the door."
            action={<Button href="/">Browse listings</Button>}
          />
        )}

        {bookings !== null && bookings.length > 0 && (
          <ul className="space-y-4">
            {bookings.map((booking) => {
              const tone = STATUS_TONE[booking.status];
              const total = money(booking.totalPrice, booking.currency);
              return (
                <li
                  key={booking.id}
                  className={`overflow-hidden ${cardClass({ pad: "none" })}`}
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
                        className={`whitespace-nowrap ${pillClass({ tone: tone?.tone ?? "neutral" })}`}
                      >
                        {tone?.label || booking.status}
                      </span>
                      {total && (
                        <p className="mt-2 text-heading font-bold text-primary">{total}</p>
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
                        className="text-small font-semibold text-primary hover:underline underline-offset-4"
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
