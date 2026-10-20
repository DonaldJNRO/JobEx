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
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { cardClass } from "@/lib/ui-recipes";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShoppingBag, Clock3, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchMyTrips, type Trip } from "@/lib/trips";
import { loadCart, payCart, type Cart } from "@/lib/cart";
import PayStep, { canPay } from "@/components/PayStep";
import { useMoney } from "@/lib/useRates";
import { formatPriceWithCurrency, buildDisplayPrice } from "@/lib/display-price";

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
  const { rates, ready, to } = useMoney();
  // THE GUEST'S OWN MONEY, like everywhere else on the site.
  //
  // This page printed the OPERATOR's currency with no conversion on the
  // trip total, the Pay sheet's label and every line, while line 117
  // charged in the guest's currency. So a London traveller read N120,000,
  // pressed Pay, and Stripe asked for a pound figure that appeared nowhere
  // on the screen. `to` was already imported and used only for the charge.
  const price = (amount: number, native?: string | null) =>
    buildDisplayPrice({
      amount,
      nativeCurrency: native || cart?.currency || "NGN",
      selectedCurrency: to,
      exchangeRates: rates,
      ratesReady: ready,
    }).display || formatPriceWithCurrency(amount, native || cart?.currency || "NGN");

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
            {[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        )}

        {empty && (
          // The app's own empty state, in its own words: a trip is the thing
          // everything you book lives in, not a shopping bag.
          <EmptyState
            bare
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Start your first trip"
            body="A trip is where everything you book lives, on your own or with the people coming with you."
            action={<Button href="/" iconRight={<ArrowRight className="h-4 w-4" />}>Browse places</Button>}
          />
        )}

        {cart && cart.items.length > 0 && (
          <>
            {/* THE TOTAL AND THE BUTTON TOGETHER, because a total somebody
                has to scroll away from to act on is a total they re-read. */}
            <div className={`mt-6 flex items-center justify-between gap-4 ${cardClass({ pad: "sm" })}`}>
              <div>
                <p className="text-caption uppercase tracking-wider text-ink-faint">Trip total</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">
                  {price(cart.total)}
                </p>
                {cart.waiting > 0 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {cart.waiting} {cart.waiting === 1 ? "item is" : "items are"} still waiting on the operator, so {cart.waiting === 1 ? "it is" : "they are"} not in this total.
                  </p>
                )}
              </div>
              <Button
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
                size="lg"
                loading={busy}
                className="shrink-0"
              >
                Pay now
              </Button>
            </div>

            {payError && (
              <p className="mt-3 rounded-xl border border-alarm-line bg-alarm-bg px-3 py-2 text-sm text-alarm-ink">
                {payError}
              </p>
            )}

            {paid ? (
              <div className={`mt-4 text-center ${cardClass()}`}>
                <p className="font-bold text-ink">Paid. Your trip is booked.</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Sabię holds the money until after you have been. Your booking codes are in Bookings.
                </p>
                <Button href="/bookings" className="mt-4">
                  See your bookings
                </Button>
              </div>
            ) : secret ? (
              <div className={`mt-4 ${cardClass({ pad: "sm" })}`}>
                <PayStep
                  clientSecret={secret}
                  amountLabel={price(cart.total)}
                  onPaid={() => { setPaid(true); setSecret(null); }}
                  onCancel={() => setSecret(null)}
                />
              </div>
            ) : null}

            <ul className="mt-4 space-y-3">
              {cart.items.map((i) => (
                <li
                  key={i.id}
                  className={`${cardClass({ pad: "sm" })} ${i.ready ? "" : "opacity-70"}`}
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
                        {price(i.totalPrice, i.currency)}
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
              {[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          </div>
        </main>
      }
    >
      <CartContents />
    </Suspense>
  );
}
