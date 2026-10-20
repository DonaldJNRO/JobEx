/**
 * WHAT YOU SEE THE INSTANT YOU TAP A CARD.
 *
 * There was no loading.tsx anywhere in this app, and this route's
 * generateMetadata awaits a Firestore read. In the App Router that means a
 * client-side navigation SUSPENDS with no boundary to fall back to, so Next
 * holds the previous page on screen until the server answers. Tapping a grid
 * card did nothing at all: no acknowledgement, no movement, just the feed
 * sitting there, and then the whole page swapping at once and showing a
 * SECOND skeleton from the client component underneath.
 *
 * Two loading phases with a dead period between them, which is why opening a
 * listing felt broken rather than slow.
 *
 * This file is that boundary. It paints immediately on tap and it is shaped
 * like the page that replaces it, so the hero does not resize when the real
 * photo lands. The aspect ratios below are the hero's own, which the old
 * in-component skeleton got wrong: it used 2.2/1 against a hero of 4/3 on a
 * phone, so the page visibly reflowed at the moment the content arrived.
 */
export default function LoadingListing() {
  return (
    <div className="min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading this listing</span>

      {/* The hero, at the hero's real shape. */}
      {/* THE SAME NAME, so the photo lands HERE while the rest of the page
          is still loading, rather than waiting for the real hero and
          morphing into a grey box in the meantime. */}
      <div
        className="aspect-[4/3] w-full bg-surface-sunken animate-shimmer sm:aspect-[2.5/1] sm:rounded-b-3xl"
        style={{ viewTransitionName: "listing-hero" }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The price card, which is now always present on the real page. */}
        <div className="pt-6 lg:hidden">
          <div className="rounded-2xl border border-line bg-card p-6">
            <div className="h-9 w-40 rounded-lg bg-surface-sunken animate-shimmer" />
            <div className="mt-2 h-4 w-24 rounded bg-surface-sunken animate-shimmer" />
            <div className="mt-6 h-13 min-h-[52px] rounded-xl bg-surface-sunken animate-shimmer" />
          </div>
        </div>

        <div className="grid gap-10 py-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <div className="space-y-3">
              <div className="h-5 w-32 rounded bg-surface-sunken animate-shimmer" />
              <div className="h-4 w-full rounded bg-surface-sunken animate-shimmer" />
              <div className="h-4 w-11/12 rounded bg-surface-sunken animate-shimmer" />
              <div className="h-4 w-4/5 rounded bg-surface-sunken animate-shimmer" />
            </div>
            {/* The menu, which is the first thing on this page worth reading. */}
            <div className="space-y-3">
              <div className="h-5 w-36 rounded bg-surface-sunken animate-shimmer" />
              <div className="divide-y divide-line rounded-2xl border border-line bg-card">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 rounded bg-surface-sunken animate-shimmer" style={{ width: `${44 + ((i * 17) % 30)}%` }} />
                      <div className="h-3 w-1/3 rounded bg-surface-sunken animate-shimmer" />
                    </div>
                    <div className="h-8 w-20 shrink-0 rounded-xl bg-surface-sunken animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-72 rounded-2xl border border-line bg-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
