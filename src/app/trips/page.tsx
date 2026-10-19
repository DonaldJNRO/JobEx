"use client";

// Trips, and their chats, side by side.
//
// THE SHAPE IS STUDIO'S, and WhatsApp Web's and Snapchat Web's: a column of
// conversations pinned left at w-80, the thread filling everything right of
// it, and on a phone one or the other rather than both. Opening a chat used
// to REPLACE this list, which on a desktop left a narrow column of bubbles
// with an empty half-screen beside it. That is most of why it read as odd.
//
// src/app/dashboard/messages/page.tsx in sabie-studio is the reference an
// operator already uses, down to the bubble radii, so the two halves of one
// conversation look like one product.

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Plus, Loader2, ArrowLeft, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchMyTrips, createTrip, addTripMember, findTravellers, type Trip, type TripMember } from "@/lib/trips";
import { tripAvatar, previewOf } from "@/lib/trip-visual";
import TripChat, { NoTripPicked } from "@/components/TripChat";

function whenOf(t: Trip): string {
  const ms = t.lastMessageTime?.toMillis?.()
    ?? (typeof t.lastMessageTime?.seconds === "number" ? t.lastMessageTime.seconds * 1000 : 0);
  if (!ms) return "";
  const d = new Date(ms);
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function TripsInner() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("t");

  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<TripMember[]>([]);

  useEffect(() => { if (!loading && !user) router.push("/auth/login?next=/trips"); }, [user, loading, router]);
  useEffect(() => { if (user) return watchMyTrips(user.uid, setTrips); }, [user]);

  useEffect(() => {
    if (!adding || term.trim().length < 2) { setFound([]); return; }
    let live = true;
    const t = setTimeout(() => { findTravellers(term).then((r) => { if (live) setFound(r); }); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [term, adding]);

  if (loading || !user) return null;

  const open = trips?.find((t) => t.id === openId) ?? null;
  const me = { id: user.uid, name: userProfile?.fullName || user.displayName || "Traveller" };

  const start = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const id = await createTrip(user, userProfile, "New trip");
      router.push(`/trips?t=${id}`);
    } catch { setCreating(false); }
  };

  return (
    // The shell's rail is 224px and the navbar is 64px; this fills what is
    // left so the thread's composer sits on the bottom of the window rather
    // than below the fold.
    <div className="flex h-[calc(100vh-4rem)] min-h-0">
      {/* THE LIST. Full width on a phone until a trip is picked, then it
          steps aside; always there from lg up. */}
      <aside
        className={`${open ? "hidden lg:flex" : "flex"} w-full shrink-0 flex-col border-r border-line bg-card lg:w-80`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight text-ink">Trips</h1>
          <button
            type="button"
            onClick={start}
            disabled={creating}
            aria-label="Start a trip"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {trips === null && (
            <div className="space-y-2 p-3" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-sunken animate-shimmer" />)}
            </div>
          )}

          {trips?.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-ink">No trips yet</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                A trip is where everything you book lives, with the people coming with you.
              </p>
            </div>
          )}

          {(trips ?? []).map((t) => {
            const unread = t.unreadCounts?.[user.uid] || 0;
            const a = tripAvatar(t.tripName, t.id);
            const preview = previewOf(t.lastMessage);
            const active = t.id === openId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/trips?t=${t.id}`)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors ${
                  active ? "bg-surface-sunken" : "hover:bg-surface-sunken/60"
                }`}
              >
                {t.imageUrl ? (
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
                    <Image src={t.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                ) : (
                  <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${a.tint}`}>
                    {a.initials}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{t.tripName}</span>
                    <span className="shrink-0 text-[11px] text-ink-faint">{whenOf(t)}</span>
                  </span>
                  <span className={`mt-0.5 block truncate text-sm ${unread > 0 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                    {preview
                      ? (t.lastMessageSenderName ? `${t.lastMessageSenderName}: ${preview}` : preview)
                      : `${t.memberIds.length} ${t.memberIds.length === 1 ? "person" : "people"}`}
                  </span>
                </span>
                {unread > 0 && (
                  <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* THE THREAD. */}
      <section className={`${open ? "flex" : "hidden lg:flex"} min-h-0 flex-1 flex-col`}>
        {open ? (
          <>
            <header className="flex shrink-0 items-center gap-3 border-b border-line bg-card px-4 py-3">
              <button
                type="button"
                onClick={() => router.push("/trips")}
                aria-label="Back to your trips"
                className="rounded-lg p-1.5 text-ink hover:bg-surface-sunken lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tripAvatar(open.tripName, open.id).tint}`}>
                {tripAvatar(open.tripName, open.id).initials}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-ink">{open.tripName}</h2>
                <p className="truncate text-xs text-ink-muted">
                  {open.memberIds.length} {open.memberIds.length === 1 ? "person" : "people"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdding((a) => !a)}
                aria-label="Add someone to this trip"
                className="rounded-lg p-2 text-ink hover:bg-surface-sunken"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            </header>

            {adding && (
              <div className="shrink-0 border-b border-line bg-card px-4 py-3">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Find someone by their handle"
                  aria-label="Find someone by their handle"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink placeholder:text-ink-faint"
                />
                <ul className="mt-2 space-y-1">
                  {found.map((m) => {
                    const already = open.memberIds.includes(m.id);
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => !already && addTripMember(open.id, m).catch(() => {})}
                          disabled={already}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-sunken disabled:opacity-60"
                        >
                          <span className="min-w-0 truncate text-ink">
                            {m.name}{m.username ? <span className="text-ink-muted"> @{m.username}</span> : null}
                          </span>
                          {already ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <UserPlus className="h-4 w-4 shrink-0 text-ink-muted" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <TripChat trip={open} me={me} />
          </>
        ) : (
          <NoTripPicked />
        )}
      </section>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-4rem)] bg-surface" />}>
      <TripsInner />
    </Suspense>
  );
}
