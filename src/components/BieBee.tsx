"use client";

// THE BEE, WHICH MEANS BIE AND NOT "LOADING".
//
// The app has said "wait, Bie is working" with this exact animation since
// BieLoader.js, and the file is the same one: assets_large-files_TEMP/
// BeeFitted.json, 600x600, five seconds, and ZERO image assets, so it is one
// self-contained vector file rather than a sprite sheet to chase.
//
// NOT A PAGE SPINNER. The wordmark already contains the bee, so this never
// goes beside it, and it never stands in for an ordinary wait. It means Bie
// is thinking. A skeleton means a page is loading.
//
// BOTH THE PLAYER AND THE 86KB OF VECTORS LOAD ON DEMAND. A traveller who
// never opens a trip chat never downloads either, which matters more here
// than it reads: a stray download on Nigeria's average mobile connection is
// what put 24.7 MB of grid covers behind a 13 second wait.

import { useEffect, useRef } from "react";

export default function BieBee({ size = 28 }: { size?: number }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let dead = false;
    let anim: { destroy: () => void } | null = null;

    (async () => {
      try {
        const [{ default: lottie }, { default: data }] = await Promise.all([
          // The light build: the full one carries expression and effects
          // support this animation does not use.
          import("lottie-web/build/player/lottie_light"),
          import("@/assets/bee.json"),
        ]);
        if (dead || !host.current) return;
        anim = lottie.loadAnimation({
          container: host.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
        });
      } catch {
        // A bee that will not load is not worth a broken screen. The words
        // beside it still say what is happening.
      }
    })();

    return () => { dead = true; anim?.destroy(); };
  }, []);

  // aria-hidden: the sentence next to it already says Bie is thinking, and a
  // screen reader announcing a decorative animation twice is worse than once.
  return (
    <div
      ref={host}
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="shrink-0"
    />
  );
}
