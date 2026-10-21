"use client";

/**
 * THE ONE CASE app/error.tsx CANNOT CATCH.
 *
 * I told the founder fourteen routes had no error boundary. That was wrong:
 * in the App Router, app/error.tsx is a boundary for its segment AND every
 * segment beneath it, so /cart, /bookings and /listing/[id] were covered all
 * along by the root one.
 *
 * What is genuinely uncovered is a throw in the ROOT LAYOUT itself, which
 * renders ABOVE that boundary. Only global-error.tsx catches it, and because
 * it replaces the layout it has to supply its own <html> and <body>.
 *
 * It must not be able to throw, so it reads nothing, imports no component of
 * ours, and carries its own colours rather than the CSS variables, which
 * live in a stylesheet the broken layout is what loads.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FAF6ED", color: "#2C2C2A",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "24px", boxSizing: "border-box" }}>
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Sabi&#281; did not load
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: 1.6, color: "#5F5E5A" }}>
              Something went wrong at our end, not yours. Trying again usually works.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: "24px", padding: "12px 20px", borderRadius: "12px",
                border: "1px solid #B47C14", background: "#EF9F27", color: "#2C2C2A",
                fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
