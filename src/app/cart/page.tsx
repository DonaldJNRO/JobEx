"use client";

// "My trip" — everything in a trip that has not been paid for.
//
// The app's cart screen is a basket grouped by trip, with a total and one Pay
// button. This is that, built on the same server endpoint, so a basket paid
// here produces the same records as a basket paid on the phone.
//
// WHAT IT SHOWS THAT A TILL WOULD NOT. Items waiting on an operator sit in
// the list, greyed, with the reason. They are excluded from the total because
// the Pay button cannot charge for them, and showing them anyway is the
// difference between a basket a person understands and one that surprises
// them at the till.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShoppingBag, Clock3, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchMyTrips, type Trip } from "@/lib/trips";
import { loadCart, payCart, type Cart } from "@/lib/cart";
import PayStep, { canPay } from "@/components/PayStep";
import { useMoney } from "@/lib/useRates";
import { formatPriceWithCurrency } from "@/lib/display-price";

function CartContents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get("trip");

  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const { to } = useMoney();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    return watchMyTrips(user.uid, setTrips);
  }, [user]);

  // The trip in the address bar, or the most recent one. Somebody arriving
  // from a listing should land on the basket they just added to.
  const tripId = wanted || trips?.[0]?.id || null;

  useEffect(() => {
    if (!tripId) return;
    let live = true;
    loadCart(tripId).then((c) => { if (live) setCart(c); }).catch(() => { if (live) setCart(null); });
    return () => { live = false; };
  }, [tripId]);

  if (loading || !user) return null;

  const empty = trips?.length === 0 || (cart && cart.items.length === 0);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">My trip</h1>

        {trips === null && (
          <div className="mt-8 space-y-3" aria-busy="true">
            {[0, 1].map((i) => <div key={i} className="h-28 rounded-2xl bg-surface-sunken animate-shimmer" />)}
          </div>
        )}

        {empty && (
          // The app's own empty state, in its own words: a trip is the thing
          // everything you book lives in, not a shopping bag.
          <div className="mt-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-primary/30" />
            <h2 className="mt-5 text-xl font-bold text-ink">Start your first trip</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
              A trip is where everything you book lives, on your own or with the people coming with you.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white">
              Browse places <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <>
            {/* THE TOTAL AND THE BUTTON TOGETHER, because a total somebody
                has to scroll away from to act on is a total they re-read. */}
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4">
              <div>
                <p className="text-caption uppercase tracking-wider text-ink-faint">Trip total</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">
                  {formatPriceWithCurrency(cart.total, cart.currency || "NGN")}
                </p>
                {cart.waiting > 0 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {cart.waiting} {cart.waiting === 1 ? "item is" : "items are"} still waiting on the operator, so {cart.waiting === 1 ? "it is" : "they are"} not in this total.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={busy || cart.total <= 0 || !canPay()}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true);
                  setPayError(null);
                  try {
                    // The server groups per operator and decides what Sabię
                    // keeps. Nothing about the money is worked out here.
                    const intent = await payCart(cart, to || cart.currency || "NGN");
                    setSecret(intent.clientSecret);
                  } catch (e) {
                    setPayError(e instanceof Error ? e.message : "Sabię could not start that payment. Nothing has been charged.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="shrink-0 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pay now"}
              </button>
            </div>

            {payError && (
              <p className="mt-3 rounded-xl border border-alarm-line bg-alarm-bg px-3 py-2 text-sm text-alarm-ink">
                {payError}
              </p>
            )}

            {paid ? (
              <div className="mt-4 rounded-2xl border border-line bg-card p-5 text-center">
                <p className="font-bold text-ink">Paid. Your trip is booked.</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Sabię holds the money until after you have been. Your booking codes are in Bookings.
                </p>
                <Link href="/bookings" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-white">
                  See your bookings
                </Link>
              </div>
            ) : secret ? (
              <div className="mt-4 rounded-2xl border border-line bg-card p-4">
                <PayStep
                  clientSecret={secret}
                  amountLabel={formatPriceWithCurrency(cart.total, cart.currency || "NGN")}
                  onPaid={() => { setPaid(true); setSecret(null); }}
                  onCancel={() => setSecret(null)}
                />
              </div>
            ) : null}

            <ul className="mt-4 space-y-3">
              {cart.items.map((i) => (
                <li
                  key={i.id}
                  className={`rounded-2xl border border-line bg-card p-4 ${i.ready ? "" : "opacity-70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{i.businessName}</p>
                      {i.package && <p className="mt-0.5 truncate text-sm text-ink-muted">{i.package}</p>}
                      <p className="mt-1.5 text-sm text-ink-muted">
                        {[i.date, i.time, `${i.guests} ${i.guests === 1 ? "guest" : "guests"}`].filter(Boolean).join(" · ")}
                      </p>
                      {!i.ready && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                          <Clock3 className="h-3.5 w-3.5" />
                          Waiting for them to accept
                        </p>
                      )}
                    </div>
                    {i.totalPrice !== null && (
                      <p className="shrink-0 font-semibold tabular-nums text-ink">
                        {formatPriceWithCurrency(i.totalPrice, i.currency || cart.currency || "NGN")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* SABIĘ'S FLOOR, stated before they pay rather than after. The
                operator may be more generous and never less. */}
            <section className="mt-8">
              <h2 className="font-semibold text-ink">Cancellation</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-muted">
                <li>More than 48 hours before: everything back.</li>
                <li>Between 24 and 48 hours before: half back.</li>
                <li>Inside 24 hours: the operator keeps the payment.</li>
                <li>If the operator cancels, everything goes back.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// useSearchParams opts a page out of static rendering, and Next refuses to
// prerender it without a boundary to fall back to. The fallback is the same
// skeleton the page shows while the trips load, so a visitor sees one
// loading state rather than two different ones in a row.
export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface">
          <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink">My trip</h1>
            <div className="mt-8 space-y-3" aria-busy="true">
              {[0, 1].map((i) => <div key={i} className="h-28 rounded-2xl bg-surface-sunken animate-shimmer" />)}
            </div>
          </div>
        </main>
      }
    >
      <CartContents />
    </Suspense>
  );
}
