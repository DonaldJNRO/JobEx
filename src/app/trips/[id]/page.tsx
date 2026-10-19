"use client";

// The group chat, on the web.
//
// Read the history, send a message, add somebody. The app's version is 2,101
// lines in TripChat.js alone, over 38,000 across components/trip, with polls,
// moments, expenses, reactions, replies, voice notes, calls and Bie. WhatsApp
// Web did not rebuild WhatsApp either: it did conversations and left the rest
// on the phone. This is that.
//
// Every write goes through src/lib/chat.ts, which writes the trip document as
// well as the message. See the note at the top of that file: no Cloud
// Function maintains lastMessage or unreadCounts for a human message, so a
// client that writes only the message leaves every mobile inbox stale.

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, UserPlus, Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchTrip, addTripMember, findTravellers, type Trip, type TripMember } from "@/lib/trips";
import { watchMessages, sendMessage, markTripRead, type ChatMessage } from "@/lib/chat";
import { tripAvatar } from "@/lib/trip-visual";

function dayOf(m: ChatMessage): string {
  const ms = m.timestamp?.toMillis?.()
    ?? (typeof m.timestamp?.seconds === "number" ? m.timestamp.seconds * 1000 : 0);
  return ms ? new Date(ms).toDateString() : "";
}

function timeOf(m: ChatMessage): string {
  const ms = m.timestamp?.toMillis?.()
    ?? (typeof m.timestamp?.seconds === "number" ? m.timestamp.seconds * 1000 : 0);
  return ms ? new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
}

export default function TripChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<TripMember[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => { if (id) return watchTrip(id, setTrip); }, [id]);
  useEffect(() => { if (id) return watchMessages(id, setMessages); }, [id]);

  // Clear the badge on open, so the phone stops showing unread for a thread
  // that is on screen.
  useEffect(() => { if (id && user) void markTripRead(id, user.uid); }, [id, user, messages?.length]);

  // Follow the conversation down. Not smooth on first paint, or opening a
  // long thread animates through all of it.
  const first = useRef(true);
  useEffect(() => {
    if (!messages?.length) return;
    bottom.current?.scrollIntoView({ behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [messages?.length]);

  useEffect(() => {
    if (!adding || term.trim().length < 2) { setFound([]); return; }
    let live = true;
    const t = setTimeout(() => {
      findTravellers(term).then((r) => { if (live) setFound(r); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [term, adding]);

  if (loading || !user) return null;

  if (trip === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="font-semibold text-ink">That trip is not here.</p>
          <p className="mt-1 text-sm text-text-muted">It may have been deleted, or you are not in it.</p>
          <Link href="/trips" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-white">
            Your trips
          </Link>
        </div>
      </main>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending || !trip) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage(id, { id: user.uid, name: userProfile?.fullName || user.displayName || "Traveller" }, body, trip.memberIds);
    } catch {
      // Put it back in the box rather than losing what they typed.
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  const add = async (m: TripMember) => {
    try {
      await addTripMember(id, m);
      setAdded((a) => [...a, m.id]);
    } catch { /* the list reloads from the trip listener either way */ }
  };

  let lastDay = "";

  return (
    // 100vh MINUS the navbar, not 100vh. layout.tsx pads main by pt-16 for
    // the fixed nav, so a full-screen child is 64px taller than the window
    // and the composer sits just under the fold.
    <main className="flex h-[calc(100vh-4rem)] flex-col bg-surface">
      <header className="flex items-center gap-3 border-b border-line bg-card px-4 py-3">
        <Link href="/trips" aria-label="Back to your trips" className="rounded-lg p-1.5 text-ink hover:bg-surface-sunken">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {trip && (
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tripAvatar(trip.tripName, trip.id).tint}`}
          >
            {tripAvatar(trip.tripName, trip.id).initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold text-ink">{trip?.tripName ?? "Trip"}</h1>
          <p className="truncate text-xs text-text-muted">
            {trip ? `${trip.memberIds.length} ${trip.memberIds.length === 1 ? "person" : "people"}` : ""}
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
        <div className="border-b border-line bg-card px-4 py-3">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Find someone by their handle"
            aria-label="Find someone by their handle"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink placeholder:text-text-muted"
          />
          <ul className="mt-2 space-y-1">
            {found.map((m) => {
              const already = trip?.memberIds.includes(m.id) || added.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => !already && add(m)}
                    disabled={already}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-sunken disabled:opacity-60"
                  >
                    <span className="min-w-0 truncate text-ink">
                      {m.name}{m.username ? <span className="text-text-muted"> @{m.username}</span> : null}
                    </span>
                    {already ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <UserPlus className="h-4 w-4 shrink-0 text-text-muted" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages === null && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 w-2/3 rounded-2xl bg-surface-sunken animate-shimmer" />
            ))}
          </div>
        )}

        {messages?.length === 0 && (
          <div className="mx-auto mt-16 max-w-xs text-center">
            {trip && (
              <span
                aria-hidden="true"
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${tripAvatar(trip.tripName, trip.id).tint}`}
              >
                {tripAvatar(trip.tripName, trip.id).initials}
              </span>
            )}
            <p className="mt-4 font-semibold text-ink">{trip?.tripName}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {trip && trip.memberIds.length > 1
                ? "Say where you are thinking of going."
                : "Add the people coming with you, then say where you are thinking of going."}
            </p>
          </div>
        )}

        <ul className="mx-auto max-w-2xl">
          {(messages ?? []).map((m, i) => {
            const mine = m.senderId === user.uid;
            const day = dayOf(m);
            const newDay = day && day !== lastDay;
            if (day) lastDay = day;
            // CONSECUTIVE MESSAGES FROM ONE PERSON ARE ONE BLOCK. Repeating
            // somebody's name above every line they send turns a
            // conversation into a list of labelled rows, which is what every
            // chat app groups to avoid.
            const prev = (messages ?? [])[i - 1];
            const sameSender = prev && prev.senderId === m.senderId && dayOf(prev) === day;
            return (
              <li key={m.id}>
                {newDay && (
                  <p className="my-4 text-center text-xs text-text-muted">
                    {new Date(day).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-3"}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 ${
                      mine
                        ? "bg-primary text-white rounded-2xl rounded-br-md"
                        : "bg-card text-ink border border-line rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {!mine && !sameSender && (
                      <p className="mb-0.5 text-xs font-semibold text-primary">{m.senderName}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                    {/* The time sits with the message rather than under every
                        one of them: a column of timestamps down a thread is
                        noise, and the one that matters is the last. */}
                    <p className={`mt-1 text-right text-[10px] tabular-nums ${mine ? "text-white/60" : "text-ink-faint"}`}>
                      {timeOf(m)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
          <div ref={bottom} />
        </ul>
      </div>

      <form onSubmit={send} className="border-t border-line bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message"
            aria-label="Write a message"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-3 text-ink placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="shrink-0 rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </main>
  );
}
