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

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Check, CheckCheck, MessageSquare } from "lucide-react";
import { watchMessages, sendMessage, markTripRead, type ChatMessage } from "@/lib/chat";
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
  const [sending, setSending] = useState(false);
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage(trip.id, me, body, trip.memberIds, trip.kind);
    } catch {
      // Put it back rather than losing what they typed.
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

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
            <div className="mx-auto max-w-xs py-16 text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${avatar.tint}`}>
                {avatar.initials}
              </span>
              <p className="mt-4 font-semibold text-ink">{trip.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
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
            {(messages ?? []).map((m, i) => {
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
                    <p className="py-3 text-center text-xs text-ink-faint">
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
                        <p className="mb-0.5 text-xs font-semibold text-ink-muted">{m.senderName}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                      <div className={`mt-0.5 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[11px] tabular-nums ${mine ? "text-white/60" : "text-ink-faint"}`}>
                          {timeOf(m)}
                        </span>
                        {mine && (
                          <span className="text-white/60">
                            {seen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          </span>
                        )}
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
          disabled={!draft.trim() || sending}
          aria-label="Send"
          className="shrink-0 rounded-xl bg-primary px-4 text-white disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
        <p className="mt-3 text-sm text-ink-muted">Pick a trip to open its chat.</p>
      </div>
    </div>
  );
}
