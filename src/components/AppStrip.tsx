"use client";

/**
 * The app ask, as one dismissible line.
 *
 * It used to be the hero, the footer CTA and a badge: three requests for the
 * same thing on a page whose job is to let somebody book. Airbnb gets away
 * with one thin strip at the very top with an X on it, and so should we. The
 * listings get the page.
 *
 * Dismissal is remembered per browser. localStorage can throw in a private
 * window or with site data blocked, so every read and write is wrapped and the
 * strip simply shows again rather than taking the page down with it.
 *
 * IT IS ALWAYS IN THE MARKUP, AND CSS HIDES IT. It used to start hidden and
 * turn itself on in an effect, which meant a returning visitor got the page
 * drawn, then a 57px strip inserted at the top, then everything below it
 * shoved down. That jump is what "it glitches a bit when it loads" was. The
 * check now happens in a blocking script in <head> (see layout.tsx), which
 * sets data-appstrip="off" on <html> before the first paint, and globals.css
 * hides the strip on that attribute. Nothing moves, in either case.
 *
 * State still exists, but only for the dismiss press itself: the person is
 * looking at the page then, so a strip disappearing under their thumb is the
 * thing they asked for rather than a jump they did not.
 */
import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { APP_STORE_URL, APP_STRIP_KEY } from "@/lib/app-links";

export default function AppStrip() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(APP_STRIP_KEY, "1");
    } catch {
      /* nothing to do, and nothing broken */
    }
    // So the very next page load hides it before paint, without waiting for
    // the head script to run again on a client-side navigation.
    document.documentElement.dataset.appstrip = "off";
  };

  return (
    <div data-app-strip className="flex items-center gap-3 px-4 py-2.5 bg-surface-sunken border-b border-line">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="w-9 h-9 -ml-2 shrink-0 inline-flex items-center justify-center text-ink-faint hover:text-ink rounded-lg"
      >
        <X size={16} />
      </button>
      <Image src="/images/apple-touch-icon.png" alt="" width={32} height={32} className="w-8 h-8 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink leading-tight">Get the app</p>
        <p className="text-xs text-ink-muted leading-tight truncate">Plan the whole trip with your crew</p>
      </div>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-4 h-9 inline-flex items-center rounded-full bg-primary text-white text-sm font-semibold"
      >
        Get
      </a>
    </div>
  );
}
