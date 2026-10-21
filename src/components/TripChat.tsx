"use client";

// One trip's conversation.
//
// Pulled out of the page so the trips list can render it BESIDE itself on a
// wide screen, which is the shape Studio's messages page uses and the shape
// WhatsApp Web and Snapchat Web use: a column of conversations pinned left, a
// thread filling the rest. A chat that replaces the list leaves a narrow
// column with nothing next to it on a desktop, which is most of why this
// read as odd.
//
// The bubble treatment is Studio's, deliberately: same radii, the tail on the
// sender's corner, a shadow on the other person's rather than a border, and a
// tick for delivered against two for seen. An operator and a traveller
// looking at the same conversation should be looking at the same object.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2, Check, CheckCheck, Clock, MessageSquare } from "lucide-react";
import { watchMessages, sendMessage, markTripRead, type ChatMessage } from "@/lib/chat";
import {
  queue, markFailed, markSending, reconcile, retryable, newClientMessageId, type Pending,
} from "@/lib/outbox";
import { tripAvatar } from "@/lib/trip-visual";
import type { Conversation } from "@/lib/conversations";

function msOf(m: ChatMessage): number {
  return m.timestamp?.toMillis?.()
    ?? (typeof m.timestamp?.seconds === "number" ? m.timestamp.seconds * 1000 : 0);
}

function timeOf(m: ChatMessage): string {
  const ms = msOf(m);
  return ms ? new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
}

export default function TripChat({
  trip,
  me,
}: {
  // A CONVERSATION, not a trip. This component read trips/{id}/messages
  // only, so the 74 one-to-one chats on this platform had no thread view at
  // all. A chat and a trip are the same object to a reader: a title, people,
  // and a list of messages.
  trip: Conversation;
  me: { id: string; name: string };
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const pendingRef = useRef<Pending[]>([]);
  pendingRef.current = pending;
  const bottom = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => { first.current = true; return watchMessages(trip.id, setMessages, trip.kind); }, [trip.id, trip.kind]);
  useEffect(() => { void markTripRead(trip.id, me.id, trip.kind); }, [trip.id, trip.kind, me.id, messages?.length]);

  useEffect(() => {
    if (!messages?.length) return;
    // Not smooth on the first paint, or opening a long thread animates
    // through all of it.
    bottom.current?.scrollIntoView({ behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [messages?.length]);

  // OPTIMISTIC, BECAUSE A SECOND OF SILENCE READS AS BEING IGNORED.
  //
  // This awaited the round trip and showed nothing until it came back. On
  // the mobile data travellers and reps actually use that is a thread that
  // appears to have swallowed you, and the only sign of failure was the
  // text reappearing in the box with no explanation.
  //
  // The message goes on the screen first, carrying a clientMessageId, and
  // its local copy is dropped when the very document it became arrives
  // through onSnapshot. See src/lib/outbox.ts for why that id exists and
  // why matching on text instead would be wrong.
  const deliver = useCallback(async (body: string, cid: string) => {
    try {
      await sendMessage(trip.id, me, body, trip.memberIds, trip.kind, cid);
    } catch {
      setPending((list) => markFailed(list, cid));
    }
  }, [trip.id, trip.memberIds, trip.kind, me]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const cid = newClientMessageId();
    setDraft("");
    setPending((list) => [...list, queue(body, cid)]);
    await deliver(body, cid);
  };

  const retry = useCallback((cid: string) => {
    const item = pendingRef.current.find((p) => p.clientMessageId === cid);
    if (!item) return;
    setPending((list) => markSending(list, cid));
    void deliver(item.text, cid);
  }, [deliver]);

  // A RECONNECT REPLAYS WHAT FAILED, oldest first, so a thread that went out
  // while the signal dropped arrives in the order it was typed.
  useEffect(() => {
    const onBack = () => retryable(pendingRef.current).forEach(retry);
    window.addEventListener("online", onBack);
    return () => window.removeEventListener("online", onBack);
  }, [retry]);

  // Dropped as soon as the server echoes each one back.
  useEffect(() => {
    if (!messages?.length) return;
    setPending((list) => reconcile(list, messages));
  }, [messages]);

  const avatar = tripAvatar(trip.title, trip.id);
  let lastDay = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col-reverse overflow-y-auto bg-surface px-4 py-4">
        {/* column-reverse keeps the newest message pinned to the bottom while
            the list grows upward, so a short conversation sits at the foot of
            the panel rather than floating at the top of an empty one. */}
        <div>
          {messages === null && (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-9 w-2/5 rounded-2xl bg-surface-sunken animate-shimmer ${i === 1 ? "ml-auto" : ""}`} />
              ))}
            </div>
          )}

          {messages?.length === 0 && (
            <div className="mx-auto max-w-xs py-section text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-heading font-bold ${avatar.tint}`}>
                {avatar.initials}
              </span>
              <p className="mt-4 font-semibold text-ink">{trip.title}</p>
              <p className="mt-1.5 text-small leading-relaxed text-ink-muted">
                {trip.kind === "chat"
                  // A one-to-one has nobody to add and no itinerary behind
                  // it, so neither trip sentence is true in one.
                  ? "Nothing here yet. Say hello."
                  : trip.memberIds.length > 1
                    ? "Say where you are thinking of going."
                    : "Add the people coming with you, then say where you are thinking of going."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {/* THE THREAD, PLUS WHAT HAS NOT LANDED YET. A pending message
                is a real ChatMessage with pending or failed on it, so every
                bubble below renders it the same way and only the tail
                differs. Appended, never merged by time: they are by
                definition the newest thing in the conversation. */}
            {[
              ...(messages ?? []),
              ...pending.map((q): ChatMessage => ({
                id: q.clientMessageId,
                text: q.text,
                senderId: me.id,
                senderName: me.name,
                type: "text",
                timestamp: { toMillis: () => q.at },
                clientMessageId: q.clientMessageId,
                pending: q.state === "sending",
                failed: q.state === "failed",
              })),
            ].map((m, i) => {
              const mine = m.senderId === me.id;
              const ms = msOf(m);
              const day = ms ? new Date(ms).toDateString() : "";
              const newDay = day && day !== lastDay;
              if (day) lastDay = day;
              const prev = (messages ?? [])[i - 1];
              const grouped = prev && prev.senderId === m.senderId && !newDay;
              // Seen by anybody other than the sender.
              const seen = false;

              return (
                <div key={m.id}>
                  {newDay && (
                    <p className="py-3 text-center text-caption text-ink-faint">
                      {new Date(day).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
                    </p>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "-mt-1" : ""}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                        mine
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-card text-ink shadow-sm rounded-bl-md"
                      }`}
                    >
                      {!mine && !grouped && (
                        <p className="mb-0.5 text-caption font-semibold text-ink-muted">{m.senderName}</p>
                      )}
                      <p className={`whitespace-pre-wrap break-words leading-relaxed ${m.pending ? "opacity-70" : ""}`}>{m.text}</p>
                      <div className={`mt-0.5 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        <span className={`text-caption tabular-nums ${mine ? "text-white/60" : "text-ink-faint"}`}>
                          {timeOf(m)}
                        </span>
                        {/* FOUR STATES, NOT TWO. Sending, failed, delivered,
                            seen. A clock means it is still going; a tick
                            means the server has it. Collapsing the first two
                            into "no tick yet" is how a message that never
                            left looks exactly like one that did. */}
                        {mine && m.failed ? (
                          <button
                            type="button"
                            onClick={() => retry(m.clientMessageId as string)}
                            className="text-caption font-semibold text-white underline underline-offset-2"
                          >
                            Not sent. Tap to retry
                          </button>
                        ) : mine && m.pending ? (
                          <span className="text-white/60" aria-label="Sending">
                            <Clock className="h-3 w-3" />
                          </span>
                        ) : mine ? (
                          <span className="text-white/60">
                            {seen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>
        </div>
      </div>

      <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-line bg-card px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${trip.title}`}
          aria-label="Write a message"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="shrink-0 rounded-xl bg-primary px-4 text-white disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

/** What fills the right-hand pane before a conversation is picked. */
export function NoTripPicked() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-surface">
      <div className="text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-ink-faint/40" />
        <p className="mt-3 text-small text-ink-muted">Pick a trip to open its chat.</p>
      </div>
    </div>
  );
}
