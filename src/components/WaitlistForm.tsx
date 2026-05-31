"use client";

// WaitlistForm — captures emails into Firestore /waitlist for users who
// don't want to install via TestFlight today. Used on the homepage hero
// + the bottom Download CTA section.
//
// Storage: writes to /waitlist/{auto}. Anonymous Firebase auth is silently
// established on first submit (the /waitlist rule requires request.auth)
// so visitors don't have to register.

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, ensureAnonymousAuth } from "@/lib/firebase";
import { Mail, Check, Loader2 } from "lucide-react";

interface WaitlistFormProps {
  source?: string;      // tag where on the site they signed up — useful for analytics
  placeholder?: string;
  buttonLabel?: string;
  // Visual variant — "hero" sits over a dark hero (light text), "inline" sits on the page bg.
  variant?: "hero" | "inline";
}

export default function WaitlistForm({
  source = "homepage-hero",
  placeholder = "your@email.com",
  buttonLabel = "Get notified",
  variant = "hero",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    // Light client-side check — server-side rules + de-dup happen separately.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg("That doesn't look like a valid email.");
      setState("error");
      return;
    }
    setState("submitting"); setErrorMsg("");
    try {
      await ensureAnonymousAuth();
      await addDoc(collection(db, "waitlist"), {
        email: clean,
        source,
        signedUpAt: serverTimestamp(),
        // No name / phone — minimum-data principle; can ask later when we email them.
      });
      setState("ok");
      setEmail("");
    } catch (err) {
      console.error("[WaitlistForm] submit failed:", err);
      setErrorMsg("Couldn't save your email — try again in a moment.");
      setState("error");
    }
  };

  if (state === "ok") {
    return (
      <div className={`flex items-center gap-2 text-sm ${variant === "hero" ? "text-emerald-300" : "text-emerald-600"}`}>
        <Check className="w-4 h-4" />
        <span>You&apos;re on the list — we&apos;ll email when Sabīę launches.</span>
      </div>
    );
  }

  const inputBase = variant === "hero"
    ? "bg-white/10 border-white/15 text-white placeholder-white/40 focus:bg-white/15 focus:border-white/30"
    : "bg-black/[0.04] border-black/10 text-[#0f0f13] placeholder-black/40 focus:bg-black/[0.06] focus:border-black/20";
  const buttonBase = variant === "hero"
    ? "bg-white text-[#0f0f13] hover:bg-white/90"
    : "bg-[#0f0f13] text-white hover:bg-[#0f0f13]/90";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
        <div className={`flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl border ${inputBase}`}>
          <Mail className="w-4 h-4 flex-shrink-0 opacity-60" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            disabled={state === "submitting"}
            className="flex-1 bg-transparent text-[13px] focus:outline-none disabled:opacity-50"
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={state === "submitting" || !email.trim()}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-40 ${buttonBase}`}
        >
          {state === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : buttonLabel}
        </button>
      </div>
      {state === "error" && errorMsg && (
        <p className={`text-[11px] mt-2 ${variant === "hero" ? "text-red-300" : "text-red-600"}`}>{errorMsg}</p>
      )}
    </form>
  );
}
