"use client";

// Your account, as something you can actually change.
//
// This was a name, an email, one link and a log out button: signing in gave
// you a read-only card about yourself. Everything a person might reasonably
// want to adjust about how this site behaves lived either in a guess
// (currency, from the browser's language) or nowhere at all.
//
// WHAT IT DOES NOT DO, and why. No password change, because every account
// here can reset by email and a second path to the same thing is a second
// thing to get wrong. No delete account: that is a real promise about data
// in five collections across two apps, and a button that half does it is
// worse than no button.

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { cardClass, fieldClass, pillClass, ROW } from "@/lib/ui-recipes";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar, MessageSquare, ShoppingBag, LogOut, Check, Loader2, Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveProfile } from "@/lib/account";
import { savedCurrency, setSavedCurrency } from "@/lib/useRates";
import { getKnownCities, type KnownCity } from "@/lib/listings";
import { flagFor } from "@/lib/city-flag";
import { symbolForCurrency } from "@/lib/listing-price";

// The ones Sabię actually trades in, plus the big three a visitor is likely
// to think in. Not a list of 255: a picker nobody can get to the bottom of
// is worse than a short one that covers everybody who has ever paid.
const CURRENCIES = ["NGN", "GBP", "USD", "EUR", "GHS", "KES", "ZAR", "CAD"];

export default function AccountPage() {
  const { user, userProfile, loading, logout } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currency, setCurrency] = useState("");
  const [cities, setCities] = useState<KnownCity[]>([]);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    setName(userProfile?.fullName || "");
    setHandle((userProfile?.handle || "").replace(/^@+/, ""));
  }, [userProfile]);

  useEffect(() => {
    setCurrency(savedCurrency());
    getKnownCities().then(setCities).catch(() => {});
    try { setCity(window.localStorage.getItem("sabie.city")); } catch { /* blocked */ }
  }, []);

  if (loading || !user) return null;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile(user.uid, { fullName: name, handle });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* the inputs keep what was typed */ }
    finally { setSaving(false); }
  };

  const pickCurrency = (code: string) => {
    setCurrency(code);
    setSavedCurrency(code);
    // Prices are read through useMoney all over the site and it reads this
    // once on mount, so a reload is the honest way to apply it everywhere at
    // the same moment rather than leaving half the page in the old money.
    router.refresh();
  };

  const pickCity = (id: string | null) => {
    setCity(id);
    try {
      if (id) window.localStorage.setItem("sabie.city", id);
      else window.localStorage.removeItem("sabie.city");
    } catch { /* applies to this visit */ }
  };

  const initial = (userProfile?.fullName || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-title font-bold tracking-tight text-ink">Account</h1>

        {/* WHO YOU ARE, and the first thing on the page you can change. */}
        <section className={`mt-6 ${cardClass()}`}>
          <div className="flex items-center gap-4">
            {userProfile?.profileImage ? (
              <Image
                src={userProfile.profileImage}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-title font-bold text-primary">
                {initial}
              </span>
            )}

            {editing ? (
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  className={fieldClass()}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-muted">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="handle"
                    aria-label="Your handle"
                    className={`${fieldClass()} font-mono`}
                  />
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-heading font-bold text-ink">{userProfile?.fullName || "Add your name"}</p>
                {userProfile?.handle && (
                  <p className="truncate font-mono text-small text-ink-muted">{userProfile.handle}</p>
                )}
                <p className="truncate text-small text-ink-muted">{user.email}</p>
              </div>
            )}

            {editing ? (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit your profile"
                className="shrink-0 rounded-xl p-2.5 text-ink-muted hover:bg-surface-sunken"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {saved && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-small text-settled-ink">
              <Check className="h-4 w-4" /> Saved
            </p>
          )}
          {/* A handle is how somebody adds you to a trip, which is the only
              reason it is on this page at all. */}
          {editing && (
            <p className="mt-3 text-caption leading-relaxed text-ink-muted">
              Your handle is how people find you to add you to a trip.
            </p>
          )}
        </section>

        {/* WHAT MONEY YOU THINK IN. Guessed from the browser until now, with
            no way to disagree: somebody Nigerian living in London got the
            wrong one and could do nothing about it. */}
        <section className={`mt-5 ${cardClass()}`}>
          <h2 className="font-bold text-ink">Show prices in</h2>
          <p className="mt-1 text-small text-ink-muted">
            Operators set their own prices. We convert them so you can compare.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCurrency(c)}
                aria-pressed={currency === c}
                className={pillClass({ size: "md", chosen: currency === c })}
              >
                {symbolForCurrency(c).trim()} {c}
              </button>
            ))}
            <button
              type="button"
              onClick={() => pickCurrency("")}
              aria-pressed={!currency}
              className={pillClass({ size: "md", chosen: !currency })}
            >
              Match my device
            </button>
          </div>
        </section>

        {/* WHERE YOUR FEED LEANS. The same choice the home page's sheet
            writes, so changing it in either place changes it in both. */}
        {cities.length > 0 && (
          <section className={`mt-5 ${cardClass()}`}>
            <h2 className="font-bold text-ink">Your city</h2>
            <p className="mt-1 text-small text-ink-muted">
              We go deep in a few places rather than thin everywhere.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.filter((c) => !c.status || c.status === "live").map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCity(c.id)}
                  aria-pressed={city === c.id}
                  className={pillClass({ size: "md", chosen: city === c.id })}
                >
                  {flagFor(c.country) && <span aria-hidden="true">{flagFor(c.country)}</span>}
                  {c.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickCity(null)}
                aria-pressed={!city}
                className={pillClass({ size: "md", chosen: !city })}
              >
                Everywhere
              </button>
            </div>
          </section>
        )}

        <nav className={`mt-5 overflow-hidden ${cardClass({ pad: "none" })}`}>
          {[
            { icon: Calendar, label: "Your bookings", href: "/bookings", hint: "Codes, dates and receipts" },
            { icon: MessageSquare, label: "Your trips", href: "/trips", hint: "Plan with the people coming" },
            { icon: ShoppingBag, label: "Your basket", href: "/cart", hint: "Anything not paid for yet" },
          ].map(({ icon: Icon, label, href, hint }) => (
            <Link
              key={href}
              href={href}
              className={`${ROW.base} ${ROW.interactive} items-center gap-4 border-b border-line last:border-0`}
            >
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{label}</span>
                <span className="block text-small text-ink-muted">{hint}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* A BUTTON, NOT A CARD WITH A HANDLER. This wore the card's
            radius and border, which is the shape of a container, so the one
            destructive control on the page read as a panel somebody had
            made clickable. */}
        <Button
          variant="danger"
          size="lg"
          block
          className="mt-5"
          onClick={() => logout().then(() => router.push("/"))}
          iconLeft={<LogOut className="h-4 w-4" />}
        >
          Log out
        </Button>

        <p className="mt-6 text-center text-caption text-ink-faint">
          <Link href="/terms" className="underline decoration-line-strong underline-offset-4 hover:text-ink">Terms</Link>
          {" · "}
          <Link href="/privacy" className="underline decoration-line-strong underline-offset-4 hover:text-ink">Privacy</Link>
          {" · "}
          <Link href="/contact" className="underline decoration-line-strong underline-offset-4 hover:text-ink">Contact</Link>
        </p>
      </div>
    </main>
  );
}
