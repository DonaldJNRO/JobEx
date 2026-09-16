"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal, without the failure mode that hid a whole page.
 *
 * WHAT WENT WRONG. The old version took a ref, waited 100ms, and observed
 * `.reveal` elements inside it, once, on mount. The listing page returns a
 * SKELETON while its Firestore fetch is in flight, so at mount the ref was
 * never attached, the effect bailed on a null ref, and with an empty dependency
 * array it never ran again. When the real content arrived nothing was watching
 * it, so every `.reveal` on the page sat at opacity 0 for ever. The hero was
 * visible because it is not a `.reveal`; everything under it was not. It looked
 * like a listing with no information. The information was there the whole time.
 *
 * Two changes, and the first matters more than the second:
 *
 * 1. CONTENT IS VISIBLE BY DEFAULT. `.reveal` no longer hides anything on its
 *    own; the hiding is switched on by a class this hook puts on <html>, and
 *    only then. If the JS fails, never loads, or races the way it just did, the
 *    worst case is that content appears without an animation. Content must
 *    never need JavaScript to become readable.
 *
 * 2. It watches the DOCUMENT, not a ref, and keeps watching. A MutationObserver
 *    picks up nodes that mount later, which is what async content always does.
 */
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    // Someone who has asked their OS to stop animations gets the content, not
    // a fade. Without this branch they would be relying on the observer too.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: "50px 0px 0px 0px" },
    );

    const observeAll = () => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => io.observe(el));
    };
    observeAll();

    // Async content mounts long after this hook does. Without this, anything
    // that arrives from a fetch is never observed and never revealed.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return ref;
}
