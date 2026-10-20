"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = [
  "a[href]", "button:not([disabled])", "input:not([disabled])",
  "select:not([disabled])", "textarea:not([disabled])", "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * A full-screen layer that actually covers the screen, and actually holds
 * the keyboard.
 *
 * TWO JOBS, and the second was missing from three of four overlays.
 *
 * 1. IT IS PORTALLED. `position: fixed` is NOT relative to the viewport
 *    when an ancestor carries a transform, a filter or a backdrop-filter:
 *    that ancestor becomes the containing block. It bit twice in one page,
 *    with .reveal's translateY on the listing and backdrop-blur on the home
 *    header, and no z-index touches it because it is not a stacking problem.
 *
 * 2. IT TRAPS FOCUS. Open a room on a laptop, press Tab, and focus walked
 *    straight out of the overlay into the page behind it: content you
 *    cannot see, still reachable, while a dialog sat on top claiming to be
 *    modal. Nothing moved focus IN when it opened and nothing gave it back
 *    when it closed, so Tab started from the top of the document again.
 *
 *    A screen reader is the obvious loser, but so is anybody on a keyboard,
 *    and the thing it really breaks is the sense that the overlay is a
 *    place rather than a picture.
 */
export default function Overlay({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const holder = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const root = holder.current;
    if (!root) return;

    // Whatever had focus before, so it can be given back. A tap on a card
    // should return the cursor to that card when the screen closes.
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Into the layer, on the first thing worth focusing. The container
    // itself when there is nothing, so the reader lands inside the dialog
    // rather than at the top of the page behind it.
    const first = focusables()[0];
    (first ?? root).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) { e.preventDefault(); return; }
      const start = list[0];
      const end = list[list.length - 1];
      const here = document.activeElement;
      // Wrap at both ends, so Tab and Shift+Tab stay inside.
      if (!e.shiftKey && here === end) { e.preventDefault(); start.focus(); }
      else if (e.shiftKey && here === start) { e.preventDefault(); end.focus(); }
      else if (here && !root.contains(here)) { e.preventDefault(); start.focus(); }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // Back where they were. Guarded, because the opener may have been
      // unmounted by whatever the overlay did.
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [mounted]);

  if (!mounted) return null;
  return createPortal(
    <div ref={holder} tabIndex={-1} className="outline-none">
      {children}
    </div>,
    document.body,
  );
}
