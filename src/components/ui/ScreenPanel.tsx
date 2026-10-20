import { cx } from "@/lib/ui-recipes";

/**
 * A FULL SCREEN ON A PHONE, A PANEL ON A LAPTOP.
 *
 * The room and offer screens were written as `fixed inset-0` with no width
 * constraint anywhere in either file. That is right at 390px and horrible
 * at 1280: a room photo stretched across the whole monitor, a date field
 * 630px wide for eight characters, and a price at the far left of the
 * screen with its own button 1,200px away at the far right. Nothing was
 * broken; nothing was bounded either.
 *
 * A phone keeps exactly what it had. From `md` up this becomes what a room
 * detail is on every site that sells rooms: a centred panel over a dimmed
 * page, capped in width so a line of text stays readable and a pair of date
 * fields stay a pair rather than two halves of a horizon.
 *
 * The backdrop closes on click, which is the gesture a panel over a dimmed
 * page has taught everyone to expect, and which a full-bleed screen has no
 * room for.
 */
export function ScreenPanel({
  label,
  onClose,
  children,
  className,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] md:flex md:items-center md:justify-center md:bg-ink/40 md:p-6">
      {/* The dimmed ground is the close target on a laptop, and does not
          exist on a phone, where the screen fills the window. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="hidden md:absolute md:inset-0 md:block md:cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cx(
          "relative flex h-full flex-col bg-surface",
          // CAPPED, AND NO TALLER THAN THE WINDOW. A panel that outgrows the
          // viewport scrolls the page behind it instead of itself.
          "md:h-auto md:max-h-[90dvh] md:w-full md:max-w-4xl md:overflow-hidden md:rounded-3xl md:shadow-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
