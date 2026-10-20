"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { BUTTON, cx } from "@/lib/ui-recipes";

type Variant = keyof typeof BUTTON.variant;
type Size = keyof typeof BUTTON.size;

interface Props {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * The one button.
 *
 * It replaces nineteen distinct primary-button treatments across twenty-one
 * occurrences: nine rounded-xl, seven rounded-full, two rounded-2xl, one
 * rounded-lg, eleven size recipes, and a disabled state on eight of them.
 *
 * `primary` is the only variant that touches the action fill, and
 * ui-recipes.test.mjs asserts that, because one gold control on screen at a
 * time is the rule the token file has claimed since before it was true.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  block,
  href,
  onClick,
  type = "button",
  disabled,
  loading,
  iconLeft,
  iconRight,
  className,
  ...rest
}: Props) {
  const cls = cx(BUTTON.base, BUTTON.variant[variant], BUTTON.size[size], block && BUTTON.block, className);

  const inner = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  );

  // A link that looks like a button is still a link: it must keep its href so
  // it opens in a new tab and shows in the status bar.
  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cls} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  );
}
