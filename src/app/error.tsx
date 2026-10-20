"use client";

import Button from "@/components/ui/Button";

/**
 * There was no error boundary on any route in this app, so an unhandled
 * render error dropped the visitor onto Next's own error screen: no brand,
 * no navigation, and no way back other than the browser's buttons.
 *
 * Next requires this to be a client component, and it must not itself be
 * able to throw, so it reads nothing and renders no data.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-gutter py-16">
      <div className="max-w-sm text-center">
        <h1 className="text-title font-bold tracking-tight text-ink">That did not load</h1>
        <p className="mt-2 text-small leading-relaxed text-ink-muted">
          Something went wrong at our end, not yours. Trying again usually works.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" href="/">Go home</Button>
        </div>
      </div>
    </div>
  );
}
