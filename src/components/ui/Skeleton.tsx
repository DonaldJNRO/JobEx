import { cx } from "@/lib/ui-recipes";

/**
 * One shimmer, one radius. Eight skeleton blocks existed across two different
 * animations (animate-shimmer and animate-pulse) with aria-busy on four of
 * seven, so half the loading states were silent to a screen reader.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("rounded-xl bg-surface-sunken animate-shimmer", className)} />;
}

/** A block of loading rows. aria-busy is on the group, not each bar. */
export function SkeletonRows({ count = 3, height = "h-16", className }: { count?: number; height?: string; className?: string }) {
  return (
    <div className={cx("space-y-3", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={height} />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}
