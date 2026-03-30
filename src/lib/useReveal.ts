"use client";

import { useEffect, useRef } from "react";

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Small delay to let layout settle, then observe
    const timer = setTimeout(() => {
      const children = el.querySelectorAll(".reveal");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target); // Only animate once
            }
          });
        },
        { threshold: 0.05, rootMargin: "50px 0px 0px 0px" }
      );

      children.forEach((child) => observer.observe(child));
      if (el.classList.contains("reveal")) observer.observe(el);

      // Cleanup
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return ref;
}
