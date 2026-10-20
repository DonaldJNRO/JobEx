"use client";

import { RotateCw } from "lucide-react";
import Button from "./Button";

/**
 * WHEN A READ FAILS, SAY SO.
 *
 * Four pages caught a failed fetch into an empty array, so a Firestore
 * outage or a dropped connection rendered "Nothing here yet" to everybody:
 * the home feed told every visitor the marketplace was empty, the inbox
 * said "No conversations yet" to somebody with 74, and the bookings page
 * told a traveller with ten bookings they had none.
 *
 * An empty state is a FACT about the data. An error is a fact about us, and
 * conflating them is how an outage looks like a product with nothing in it.
 */
export default function LoadError({
  what,
  onRetry,
}: {
  /** The thing that would not load, lowercase: "your bookings". */
  what: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center" role="alert">
      <p className="text-heading font-bold text-ink">We could not load {what}</p>
      <p className="mx-auto mt-2 max-w-sm text-small leading-relaxed text-ink-muted">
        That is our end, not yours. Trying again usually works.
      </p>
      {onRetry && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onRetry} iconLeft={<RotateCw size={15} />}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
