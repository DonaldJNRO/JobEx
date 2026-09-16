import type { ReactNode } from "react";

/**
 * The shell for Privacy and Terms.
 *
 * Both pages carried `prose prose-invert`, which did nothing at all:
 * @tailwindcss/typography is not a dependency of this project, so neither
 * class matched a rule, and `prose-invert` would have been wrong anyway since
 * the site stopped being dark. All the rhythm those pages actually had came
 * from one space-y-6, which is why every heading sat the same distance from
 * the paragraph above it as from the one below.
 *
 * So the spacing lives here instead, in one place, set on the container rather
 * than repeated on each heading. A legal page is read in long passes, and the
 * only thing it owes the reader is a measure they can follow and headings they
 * can find.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-page sm:px-6">
        <header className="mb-section border-b border-line pb-block">
          <h1 className="text-display font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-small text-ink-faint">Last updated {updated}</p>
        </header>

        {/* The measure is capped by max-w-2xl above, which lands near 65
            characters at this size. Headings get their space from the
            container, so a new section never has to remember to bring its own.
            [&>*] rather than a class on each child: the content below is
            prose, and prose should not be carrying layout classes. */}
        <div
          className="
            text-ink-body leading-[1.75]
            [&>h2]:mt-block [&>h2]:mb-2.5 [&>h2]:text-heading [&>h2]:font-semibold [&>h2]:text-ink
            [&>h2]:scroll-mt-24
            [&>p]:mb-4
            [&>p:last-child]:mb-0
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:text-ink [&_strong]:font-semibold
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
