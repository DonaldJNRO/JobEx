"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROW, cx } from "@/lib/ui-recipes";

interface Props {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  "aria-expanded"?: boolean;
}

/**
 * One row, against eighteen treatments and four separation mechanics for the
 * same job (border-b with a last: reset, border-b without one, divide-y, and
 * space-y).
 *
 * `action` is separate from `trailing` on purpose. A row whose only
 * affordance was a twelve-pixel word the same colour as the price beside it
 * is what started all of this; a real control goes in `action` and the row
 * itself does not become a button when it holds one.
 */
export default function Row({
  leading,
  title,
  subtitle,
  trailing,
  action,
  href,
  onClick,
  active,
  className,
  ...rest
}: Props) {
  const body = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-body text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-small text-ink-muted">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      {action && <div className="shrink-0 self-center">{action}</div>}
    </>
  );

  const cls = cx(ROW.base, (href || onClick) && ROW.interactive, active && ROW.active, className);

  // A row holding its own control is not itself a control: nesting a button
  // inside a button is invalid and the inner one stops receiving the tap.
  if (action) return <div className={cls}>{body}</div>;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls} {...rest}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
