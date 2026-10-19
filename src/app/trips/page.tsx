"use client";

// Your trips, and the way into their group chats.
//
// A trip IS the group chat on this platform, so this list is the inbox. The
// app has 44 files under screens/renter/trip for the full thing — itinerary,
// wallet, moments, polls, a film. This is deliberately the WhatsApp Web
// shape: your threads, the history, and sending. Everything else stays where
// it is built.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchMyTrips, createTrip, type Trip } from "@/lib/trips";
import { tripAvatar, previewOf } from "@/lib/trip-visual";

function whenOf(t: Trip): string {
  const ms = t.lastMessageTime?.toMillis?.()
    ?? (typeof t.lastMessageTime?.seconds === "number" ? t.lastMessageTime.seconds * 1000 : 0);
  if (!ms) return "";
  const d = new Date(ms);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function TripsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    return watchMyTrips(user.uid, setTrips);
  }, [user]);

  if (loading || !user) return null;

  const start = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const id = await createTrip(user, userProfile, "New trip");
      router.push(`/trips/${id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Trips</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Every trip has a group chat. Plan it here or in the app.
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            disabled={creating}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New trip
          </button>
        </header>

        {trips === null && (
          <div className="mt-8 space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-sunken animate-shimmer" />
            ))}
          </div>
        )}

        {trips?.length === 0 && (
          <div className="mt-16 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-primary/30" />
            <p className="mt-4 text-text-muted">No trips yet.</p>
            <p className="mt-1 text-sm text-text-muted">
              Start one and add the people you are going with.
            </p>
          </div>
        )}

        <ul className="mt-6 space-y-2">
          {(trips ?? []).map((t) => {
            const unread = t.unreadCounts?.[user.uid] || 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/trips/${t.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:bg-surface-sunken"
                >
                  {/* A PHOTO WHEN THERE IS ONE, INITIALS WHEN THERE IS NOT.
                      31 of the 41 trips in production have no imageUrl, so a
                      row that only renders a photo is an empty grey square
                      three times out of four. The tint comes from the trip's
                      id, so it never changes and renaming a trip does not
                      recolour it. */}
                  {t.imageUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
                      <Image src={t.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tripAvatar(t.tripName, t.id).tint}`}
                    >
                      {tripAvatar(t.tripName, t.id).initials}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{t.tripName}</span>
                      <span className="shrink-0 text-xs text-text-muted">{whenOf(t)}</span>
                    </div>
                    {/* FOUR TRIPS CARRY THE LITERAL "[object Object]" as
                        their last message, from something upstream handing an
                        object to a field that holds a preview. previewOf
                        returns null for it, so the row falls back to
                        something true about the trip rather than printing a
                        bug at somebody. */}
                    <p className={`truncate text-sm ${unread > 0 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                      {(() => {
                        const preview = previewOf(t.lastMessage);
                        if (!preview) return `${t.memberIds.length} ${t.memberIds.length === 1 ? "person" : "people"}`;
                        return t.lastMessageSenderName ? `${t.lastMessageSenderName}: ${preview}` : preview;
                      })()}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
