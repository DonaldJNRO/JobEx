import type { ReactNode } from "react";
import Card from "./Card";

interface Props {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  bare?: boolean;
}

/**
 * Ten empty states existed in ten different styles, using h1, h2, h3 and p
 * for the same slot and eight icon-chip sizes between them.
 *
 * The icon is optional and deliberately quiet. An empty state is a sentence
 * explaining what will be here, not an illustration.
 */
export default function EmptyState({ icon, title, body, action, bare }: Props) {
  const inner = (
    <div className="px-6 py-section text-center">
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-ink-faint">{icon}</div>}
      <p className="text-heading font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-small leading-relaxed text-ink-muted">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
  return bare ? inner : <Card pad="none">{inner}</Card>;
}
