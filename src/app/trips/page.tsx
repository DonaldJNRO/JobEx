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
import EmptyState from "@/components/ui/EmptyState";
import { fieldClass, pillClass, COUNT_BADGE } from "@/lib/ui-recipes";
import LoadError from "@/components/ui/LoadError";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Plus, Loader2, ArrowLeft, UserPlus, Check, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createTrip, addTripMember, findTravellers, type TripMember } from "@/lib/trips";
import { watchMyConversations, fetchPeople, withPeople, keyOf, parseKey, type Conversation } from "@/lib/conversations";
import { tripAvatar, previewOf } from "@/lib/trip-visual";
import TripChat, { NoTripPicked } from "@/components/TripChat";

function whenOf(ms: number): string {
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

  // THE WHOLE INBOX, people and trips. This page read trips and only
  // trips, so 74 one-to-one conversations carrying 2,076 messages were
  // not missing from the list, they were missing from the product.
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [convosFailed, setConvosFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<TripMember[]>([]);

  useEffect(() => { if (!loading && !user) router.push("/auth/login?next=/trips"); }, [user, loading, router]);
  // A chat document carries participant uids and nothing else, so a
  // one-to-one row has no name until the users are resolved. Resolved once
  // per set of ids rather than per render, and a name that will not resolve
  // still renders a row.
  useEffect(() => {
    if (!user) return;
    let live = true;
    const stop = watchMyConversations(user.uid, async (list, failed) => {
      if (!live) return;
      setConvosFailed(!!failed);
      setConvos(list);
      const ids = list.filter((c) => c.kind === "chat").map((c) => c.otherId || "").filter(Boolean);
      if (ids.length === 0) return;
      const people = await fetchPeople(ids);
      // The await means this can land after the component is gone, and a
      // late setState on an unmounted listener is how a leak starts.
      if (live) setConvos((prev) => (prev ? withPeople(prev, people) : prev));
    });
    return () => { live = false; stop(); };
  }, [user]);

  useEffect(() => {
    if (!adding || term.trim().length < 2) { setFound([]); return; }
    let live = true;
    const t = setTimeout(() => { findTravellers(term).then((r) => { if (live) setFound(r); }); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [term, adding]);

  if (loading || !user) return null;

  // A CHAT ID AND A TRIP ID ARE BOTH FIRESTORE IDS and could be equal, so
  // the url carries the kind: ?t=chat:abc or ?t=trip:abc. A bare id from an
  // older link still resolves, as a trip, which is what it used to mean.
  const picked = parseKey(openId || "") ?? (openId ? { kind: "trip" as const, id: openId } : null);
  const open = picked ? (convos?.find((c) => c.kind === picked.kind && c.id === picked.id) ?? null) : null;
  const me = { id: user.uid, name: userProfile?.fullName || user.displayName || "Traveller" };

  const start = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const id = await createTrip(user, userProfile, "New trip");
      router.push(`/trips?t=trip:${id}`);
    } catch { setCreating(false); }
  };

  return (
    // THE WINDOW MINUS THE NAVBAR, and overflow-hidden so the PAGE cannot
    // scroll. Without that last part the thread grew the document, the
    // composer went below the fold and tapping the box scrolled the whole
    // page, which reads as the conversation jumping away from you.
    //
    // The rail is fixed and the layout is already inset past it by the
    // shell, so this is only the height.
    // A CONTAINED PANEL, the way LinkedIn's messaging sits: a card with the
    // page showing around it rather than chrome running edge to edge. On a
    // phone it fills the screen, because margins there are just lost width.
    <div className="h-[calc(100dvh-4rem)] overflow-hidden p-0 lg:p-4">
      <div className="flex h-full min-h-0 overflow-hidden rounded-none border-line bg-card lg:rounded-2xl lg:border">
      {/* THE LIST. Full width on a phone until a trip is picked, then it
          steps aside; always there from lg up. */}
      <aside
        className={`${open ? "hidden lg:flex" : "flex"} w-full shrink-0 flex-col border-r border-line bg-card lg:w-80`}
      >
        {/* TITLE AND SEARCH ON ONE ROW, as LinkedIn has them. Two rows of
            chrome above a list is two rows of list you cannot see. */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <h1 className="shrink-0 pl-1 font-bold tracking-tight text-ink">Trips</h1>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search"
              aria-label="Search your conversations"
              className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-2 text-small text-ink placeholder:text-ink-faint"
            />
          </div>
          <button
            type="button"
            onClick={start}
            disabled={creating}
            aria-label="Start a trip"
            className="shrink-0 rounded-lg bg-primary p-2 text-white disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {/* UNREAD, the one filter that earns its row. LinkedIn carries six;
            with a handful of trips the rest would be chrome over an empty
            list. It hides itself until there IS something unread. */}
        {(convos ?? []).some((c) => c.unread > 0) && (
          <div className="flex gap-2 border-b border-line px-3 py-2">
            {([["all", "All"], ["unread", "Unread"]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setOnlyUnread(id === "unread")}
                aria-pressed={onlyUnread === (id === "unread")}
                className={pillClass({ chosen: onlyUnread === (id === "unread") })}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* A SKELETON THAT LOOKS LIKE A ROW, not three grey bars. It
              carries a circle where the face goes and two lines of
              different widths where the name and the preview go, so the
              list does not change shape when it arrives. */}
          {convos === null && (
            <div className="divide-y divide-line" aria-busy="true" aria-live="polite">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-surface-sunken animate-shimmer" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 rounded bg-surface-sunken animate-shimmer" style={{ width: `${54 + ((i * 13) % 26)}%` }} />
                    <div className="h-3 rounded bg-surface-sunken animate-shimmer" style={{ width: `${68 + ((i * 7) % 22)}%` }} />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading your conversations</span>
            </div>
          )}

          {convosFailed && <LoadError what="your conversations" />}

          {!convosFailed && convos?.length === 0 && (
            <EmptyState
              bare
              title="No conversations yet"
              body="Message someone, or start a trip and bring the people coming with you."
            />
          )}

          {(convos ?? [])
            .filter((c) => {
              if (onlyUnread && !c.unread) return false;
              const q = filter.trim().toLowerCase();
              if (!q) return true;
              // The name, and whoever last spoke, which is how somebody
              // actually remembers a conversation.
              return `${c.title} ${c.lastMessageSenderName ?? ""}`.toLowerCase().includes(q);
            })
            .map((c) => {
              const a = tripAvatar(c.title, c.id);
              const active = picked?.kind === c.kind && picked?.id === c.id;
              const isChat = c.kind === "chat";
              return (
                <button
                  key={keyOf(c)}
                  type="button"
                  onClick={() => router.push(`/trips?t=${keyOf(c)}`)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors ${
                    active ? "bg-surface-sunken" : "hover:bg-surface-sunken/60"
                  }`}
                >
                  {c.photoUrl ? (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
                      <Image src={c.photoUrl} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                  ) : (
                    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-small font-bold ${a.tint}`}>
                      {a.initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{c.title}</span>
                      <span className="shrink-0 text-caption text-ink-faint">{whenOf(c.lastMessageAtMs)}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-small ${c.unread > 0 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                      {c.lastMessage
                        // A NAME ONLY WHERE IT TELLS YOU SOMETHING. In a
                        // one-to-one the only other person is the one in
                        // the row, so "Ada: hi" says Ada twice.
                        ? (!isChat && c.lastMessageSenderName ? `${c.lastMessageSenderName}: ${c.lastMessage}` : c.lastMessage)
                        : isChat
                          ? "Say something"
                          : `${c.memberIds.length} ${c.memberIds.length === 1 ? "person" : "people"}`}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className={COUNT_BADGE}>
                      {c.unread > 99 ? "99+" : c.unread}
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
                aria-label="Back to your conversations"
                className="rounded-lg p-1.5 text-ink hover:bg-surface-sunken lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {open.photoUrl ? (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
                  <Image src={open.photoUrl} alt="" fill sizes="36px" className="object-cover" />
                </span>
              ) : (
                <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-bold ${tripAvatar(open.title, open.id).tint}`}>
                  {tripAvatar(open.title, open.id).initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-ink">{open.title}</h2>
                <p className="truncate text-caption text-ink-muted">
                  {open.kind === "chat"
                    // A one-to-one has one other person in it. Saying "2
                    // people" under their own name is a count nobody needed.
                    ? (open.handleLine || "Direct message")
                    : `${open.memberIds.length} ${open.memberIds.length === 1 ? "person" : "people"}`}
                </p>
              </div>
              {/* ADDING SOMEONE IS A TRIP THING. A one-to-one chat has no
                  member list to add to: in the app, bringing a third person
                  in starts a trip. */}
              {open.kind === "trip" && (
                <button
                  type="button"
                  onClick={() => setAdding((a) => !a)}
                  aria-label="Add someone to this trip"
                  className="rounded-lg p-2 text-ink hover:bg-surface-sunken"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              )}
            </header>

            {adding && (
              <div className="shrink-0 border-b border-line bg-card px-4 py-3">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Find someone by their handle"
                  aria-label="Find someone by their handle"
                  className={fieldClass()}
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
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-4rem)] bg-surface" />}>
      <TripsInner />
    </Suspense>
  );
}
