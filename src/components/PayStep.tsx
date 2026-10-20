"use client";

// The card step. Appears only when the server has already said this booking
// is payable and a publishable key is configured.
//
// DARK UNTIL SOMEONE TURNS IT ON, deliberately. The Cloud Functions default
// to Stripe LIVE mode (`STRIPE_MODE || 'live'`), so the first card entered
// here moves real money. canPay() is false without
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, the sheet falls back to sending a
// request, and nothing about the page is broken in the meantime. Setting
// that key in Vercel is the act of going live, and it is a person's decision
// rather than a side effect of a deploy.
//
// NEVER SAYS PAID ON ITS OWN. The guest is told their money has gone only
// when Stripe confirms the intent succeeded, not when the form submits.

import { useState } from "react";
import Button from "./ui/Button";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

const KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

/** Is the site configured to take a card at all? */
export function canPay(): boolean {
  return KEY.startsWith("pk_");
}

let stripePromise: Promise<Stripe | null> | null = null;
function stripe() {
  if (!stripePromise) stripePromise = loadStripe(KEY);
  return stripePromise;
}

interface Props {
  clientSecret: string;
  /** What the guest was told they would pay, in the words they saw. */
  amountLabel: string;
  onPaid: () => void;
  onCancel: () => void;
}

export default function PayStep(props: Props) {
  if (!canPay()) return null;
  return (
    <Elements
      stripe={stripe()}
      options={{
        clientSecret: props.clientSecret,
        // Stripe renders its own fields, so the brand has to be handed to it:
        // a purple focus ring inside a charcoal page is the one element on
        // the screen that belongs to somebody else. #4c3a73 was a third
        // purple, matching neither the old token nor anything else.
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#2C2C2A",
            colorBackground: "#ffffff",
            colorText: "#2C2C2A",
            colorDanger: "#9B2C1C",
            borderRadius: "12px",
          },
        },
      }}
    >
      <CardForm {...props} />
    </Elements>
  );
}

function CardForm({ amountLabel, onPaid, onCancel }: Props) {
  const stripeJs = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeJs || !elements || busy) return;
    setBusy(true);
    setError(null);

    // redirect: "if_required" keeps the guest on the page for a plain card
    // and still lets a bank that demands 3-D Secure take over. Without it
    // every payment would bounce through a redirect it does not need.
    const { error: err, paymentIntent } = await stripeJs.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (err) {
      // Stripe's own message is the useful one here: it says declined, or
      // expired, or insufficient funds, which is what the guest can act on.
      setError(err.message || "That card did not go through. Nothing has been charged.");
      setBusy(false);
      return;
    }

    // THE ONLY THING THAT COUNTS AS PAID. Not a submitted form, not an
    // absence of errors: Stripe saying the intent succeeded.
    if (paymentIntent?.status === "succeeded") {
      onPaid();
      return;
    }

    // processing, requires_action that resolved oddly, anything else: say
    // what is true rather than guessing in either direction.
    setError("Your bank is still deciding. Do not pay again — we will email you as soon as it clears.");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-small text-alarm-ink bg-alarm-bg border border-alarm-line rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={!stripeJs} loading={busy}>
        {busy ? "Paying" : `Pay ${amountLabel}`}
      </Button>

      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="w-full text-small text-ink-muted py-1 disabled:opacity-50"
      >
        Back
      </button>

      <p className="text-caption text-ink-muted text-center">
        Sabię holds your money until after your visit.
      </p>
    </form>
  );
}
