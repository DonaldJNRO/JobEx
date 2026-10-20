import type { ReactNode } from "react";
import { CONTAINER, cx } from "@/lib/ui-recipes";

/**
 * Nine different max-w values were in use, and --spacing-gutter had zero
 * consumers while the side padding it exists for was written as px-4 in
 * forty-nine places. This is that token's first consumer.
 */
export default function Container({
  children,
  width = "page",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof CONTAINER.width;
  className?: string;
}) {
  return <div className={cx(CONTAINER.base, CONTAINER.width[width], className)}>{children}</div>;
}
