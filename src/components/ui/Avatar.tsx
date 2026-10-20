import Image from "next/image";
import { cx } from "@/lib/ui-recipes";
import { tripAvatar } from "@/lib/trip-visual";

const SIZE = {
  sm: { box: "h-9 w-9", text: "text-caption", px: 36 },
  md: { box: "h-11 w-11", text: "text-small", px: 44 },
  lg: { box: "h-16 w-16", text: "text-title", px: 64 },
} as const;

/**
 * Thirteen avatar treatments across nine sizes and two unrelated colour
 * systems: a fixed primary tint on some pages and the deterministic five-way
 * tint on others, so the same person wore a different colour per screen.
 * This reuses the deterministic one everywhere.
 */
export default function Avatar({
  name,
  id,
  src,
  size = "md",
  className,
}: {
  name?: string;
  id?: string;
  src?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];
  if (src) {
    return (
      <span className={cx("relative shrink-0 overflow-hidden rounded-full bg-surface-sunken", s.box, className)}>
        <Image src={src} alt="" fill sizes={`${s.px}px`} className="object-cover" />
      </span>
    );
  }
  // tripAvatar(name, id): the initials come from the name, the tint is
  // hashed from the id so one person keeps one colour on every screen.
  const a = tripAvatar(name, id || name || "");
  return (
    <span
      className={cx("flex shrink-0 items-center justify-center rounded-full font-bold", s.box, s.text, a.tint, className)}
      aria-hidden="true"
    >
      {a.initials}
    </span>
  );
}
