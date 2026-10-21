"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { cardClass, fieldClass } from "@/lib/ui-recipes";

/**
 * A BOOKING A GUEST CAN STILL FIND TOMORROW.
 *
 * The website signs every visitor in anonymously so they can browse and buy
 * without an account. That is the right trade at the front of the funnel and
 * the wrong one the moment money moves: the booking is keyed to an anonymous
 * uid that lives in ONE browser's storage. Clear Safari, switch to the
 * laptop, or let iOS evict the data, and the booking is gone from the
 * traveller's side while the operator still expects them.
 *
 * Measured 21 Oct 2026: one paid booking on the platform is owned by an
 * anonymous account AND carries no email on the document, so neither the
 * traveller nor we can reach it. One is not a crisis. One out of seven paid
 * bookings is a rate.
 *
 * SO ASK AFTER THE MONEY, NOT BEFORE. A sign-in wall in front of a checkout
 * costs more bookings than it saves. Here the booking already exists, the
 * code is on the screen, and the offer is only "keep it".
 *
 * AuthContext already links rather than replaces: signup() and
 * loginWithGoogle() both call linkWithCredential on an anonymous guest, so
 * the uid is preserved and the booking stays attached. This component is the
 * prompt, not the mechanism.
 */
export default function KeepThisBooking({ email }: { email?: string | null }) {
  const { user, signup, loginWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mail, setMail] = useState(email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Somebody with a real account already has it kept.
  if (!user || !user.isAnonymous || done) return null;

  const go = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setDone(true);
    } catch (e) {
      // The common one is an email that already has an account, which is not
      // a failure so much as a different door.
      const msg = e instanceof Error ? e.message : "";
      setError(
        /already/i.test(msg)
          ? "That email already has a Sabię account. Sign in from the menu and this booking will be waiting."
          : "That did not work. Your booking is safe either way, and the code is in your email.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${cardClass()} mt-4 text-left`}>
      <p className="text-small font-semibold text-ink">Keep this booking</p>
      <p className="mt-1 text-caption leading-relaxed text-ink-muted">
        You booked as a guest, so this is saved to this browser only. Add a password and it stays
        yours on any device.
      </p>

      {!open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>Keep it</Button>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => go(loginWithGoogle)}>
            Use Google
          </Button>
        </div>
      ) : (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => { e.preventDefault(); void go(() => signup(mail.trim(), password, name.trim())); }}
        >
          <label className="block">
            <span className="sr-only">Your name</span>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" autoComplete="name" required
              className={fieldClass()}
            />
          </label>
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email" value={mail} onChange={(e) => setMail(e.target.value)}
              placeholder="Email" autoComplete="email" required
              className={fieldClass()}
            />
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoComplete="new-password" minLength={6} required
              className={fieldClass()}
            />
          </label>
          <Button type="submit" size="sm" block loading={busy}>Keep this booking</Button>
        </form>
      )}

      {error && <p className="mt-2 text-caption text-alarm-ink">{error}</p>}
    </div>
  );
}
