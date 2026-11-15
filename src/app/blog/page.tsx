import type { Metadata } from "next";
import Link from "next/link";
import { cardClass } from "@/lib/ui-recipes";

/**
 * ONE POST, AND THAT IS THE DESIGN.
 *
 * This route was a "Coming Soon" card for months: a promise with nothing
 * behind it, reachable by anyone who typed the address. A stale blog costs
 * more than no blog, so the choice was to delete the route or give it
 * something worth reading. It has something worth reading.
 *
 * NO "more posts soon", NO empty state, NO newsletter box. The page does not
 * promise a second post, because the moment it does it starts aging. If a
 * second one is ever worth writing it can be added to POSTS and this page
 * will carry it without an apology for the gap.
 *
 * It is called Writing rather than Blog for the same reason.
 */

export const metadata: Metadata = {
  title: "Writing | Sabię",
  description:
    "What we find registering businesses in person across Lagos. Counted, sourced and corrected in public.",
  alternates: { canonical: "https://www.sabieapp.com/blog" },
};

const DISPLAY = "font-[family-name:var(--font-display)]";

const POSTS = [
  {
    href: "/blog/nowhere-to-list",
    date: "15 November 2026",
    kicker: "Field notes",
    title: "We knocked on 88 doors in Lagos",
    standfirst:
      "Twenty-three of our businesses are places to stay. For the other sixty-eight, no global platform has a category at all. The full count.",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-6 sm:py-20">
        <header>
          <h1 className={`${DISPLAY} m-0 text-hero font-bold leading-[1.08] text-ink`}>
            Writing
          </h1>
          <p className="mt-4 max-w-[58ch] text-heading leading-[1.6] text-text-muted">
            We register every business on Sabię in person, which means we end up knowing
            things about Lagos that are not written down anywhere. When one of them is worth
            your time, it goes here. Everything is counted rather than estimated, and we
            correct it in public when we get it wrong.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-5">
          {POSTS.map((post) => (
            <Link key={post.href} href={post.href} className="block no-underline">
              <article className={`${cardClass({ pad: "lg", elevated: true })} transition-shadow`}>
                <p className="m-0 text-caption uppercase tracking-[0.2em] text-text-muted">
                  {post.date} · {post.kicker}
                </p>
                <h2 className={`${DISPLAY} mt-3 mb-0 text-title font-bold leading-[1.2] text-ink`}>
                  {post.title}
                </h2>
                <p className="mt-3 mb-0 text-body leading-[1.6] text-text-muted">
                  {post.standfirst}
                </p>
                <p className="mt-4 mb-0 text-small font-semibold text-primary">Read it</p>
              </article>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-small text-text-muted">
          Every figure we state in public, and where it came from, is on our{" "}
          <Link href="/sources" className="text-primary underline underline-offset-[3px]">
            evidence page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
