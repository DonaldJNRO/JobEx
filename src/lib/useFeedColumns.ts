"use client";

/**
 * The wall's column count, read from the window.
 *
 * A LAYOUT EFFECT AND NOT AN EFFECT, which is the whole reason this is worth
 * a file. MasonryFeed used to start at two columns in state and widen in a
 * useEffect, and a useEffect runs AFTER the browser has painted. So a desktop
 * visitor saw two columns for one frame and then four, every single time the
 * feed mounted. A layout effect runs before the paint, so the first frame the
 * person sees is already the right shape.
 *
 * Two on the server, because that is the phone shape and the common case, and
 * because rendering a guess at the window on the server and a real
 * measurement on the client is a hydration mismatch that reflows the whole
 * wall.
 */

import { useEffect, useLayoutEffect, useState } from "react";
import { columnsForWidth } from "./feed-columns";

// useLayoutEffect warns when it runs during a server render, so pick the one
// that is right for where we are. Module level, so the hook order never
// changes between renders.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useFeedColumns(): number {
  const [columns, setColumns] = useState(2);

  useIsomorphicLayoutEffect(() => {
    const apply = () => setColumns(columnsForWidth(window.innerWidth));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return columns;
}
