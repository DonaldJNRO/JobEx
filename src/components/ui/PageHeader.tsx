import type { ReactNode } from "react";

interface Props {
  title: string;
  sub?: string;
  actions?: ReactNode;
}

/** Nine header treatments, one of which had no size class at all. */
export default function PageHeader({ title, sub, actions }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 mb-stack">
      <div className="min-w-0">
        <h1 className="text-title font-bold tracking-tight text-ink text-balance">{title}</h1>
        {sub && <p className="mt-1.5 text-small text-ink-muted">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
