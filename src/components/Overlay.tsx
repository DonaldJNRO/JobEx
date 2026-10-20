"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A full-screen layer that actually covers the screen.
 *
 * `position: fixed` is NOT relative to the viewport when an ancestor carries
 * a transform, a filter or a backdrop-filter: that ancestor becomes the
 * containing block, and the layer is pinned inside it instead. It is not a
 * stacking problem, so no z-index touches it.
 *
 * This bit twice in one page of this app:
 *
 *   the room gallery, inside a section wearing .reveal, which animates
 *   `transform: translateY(20px)`. It rendered as a black box wedged into
 *   the scroll between the opening hours and the tab bar.
 *
 *   the city picker, inside the home page's sticky header, which carries
 *   `backdrop-blur`. backdrop-filter creates a containing block by the same
 *   rule.
 *
 * Both are one import away from being correct, and any future overlay that
 * uses this cannot acquire the bug by being moved into a prettier wrapper.
 */
export default function Overlay({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
