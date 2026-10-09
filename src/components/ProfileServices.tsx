"use client";

// The services section, mirroring the mobile app's ProfileServices.
//
// Three shapes, because they are three different transactions: a stay sold
// by the night, a café menu read by category, and a service with tiers under
// it. resolveProfileSections decides which, using the same rules as the app
// so the two surfaces cannot disagree about the same business.
//
// TWO LEVELS, LOCKED, as the app is. Tap a service to reveal its tiers.
// Three levels waits for Studio's service.category enum.

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { serviceGroups, type ServiceGroup } from "@/lib/shop-window";
import { resolveProfileSections } from "@/lib/profile-sections";

const money = (n: number | null, currency: string) =>
  n === null ? "Ask" : `${currency === "GBP" ? "£" : "₦"}${n.toLocaleString("en-NG")}`;

interface Props {
  listing: Record<string, unknown>;
  currency: string;
  /** Opens the booking sheet on a chosen row. */
  onPick: (offerName: string) => void;
}

export default function ProfileServices({ listing, currency, onPick }: Props) {
  const { services: shape } = resolveProfileSections(listing);
  const groups = serviceGroups(listing);
  const menu = Array.isArray(listing.menu) ? (listing.menu as MenuCategory[]) : [];

  // A CAFÉ READS ITS MENU, it does not pick a service. Never payable, so
  // nothing here is tappable: the table request is the only action.
  if (shape === "menu") {
    const withItems = menu.filter((c) => Array.isArray(c?.items) && c.items.length > 0);
    if (withItems.length === 0) return null;
    return (
      <section className="reveal">
        <h2 className="text-lg font-semibold text-ink mb-3">On the menu</h2>
        <div className="space-y-5">
          {withItems.map((cat, i) => (
            <div key={`${cat.name ?? i}`}>
              {cat.name && (
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
                  {cat.name}
                </p>
              )}
              <ul className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
                {(cat.items ?? []).map((it, j) => (
                  <li key={`${it?.name ?? j}`} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <span className="text-sm text-ink">{it?.name}</span>
                    {typeof it?.price === "number" && (
                      <span className="text-sm text-ink-muted whitespace-nowrap">
                        {money(it.price, currency)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (groups.length === 0) return null;

  const heading = shape === "rooms" ? "Rooms" : "What they offer";
  return (
    <section className="reveal">
      <h2 className="text-lg font-semibold text-ink mb-3">{heading}</h2>
      <ul className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {groups.map((g) => (
          <ServiceRow key={g.name} group={g} currency={currency} onPick={onPick} />
        ))}
      </ul>
    </section>
  );
}

function ServiceRow(
  { group, currency, onPick }: { group: ServiceGroup; currency: string; onPick: (n: string) => void },
) {
  const [open, setOpen] = useState(false);

  // A row with one price books it. A row with a choice opens first, because
  // booking "Gel nails" without saying Short or Medium is not a booking.
  const act = () => (group.hasChoices ? setOpen((v) => !v) : onPick(group.name));

  return (
    <li>
      <button
        type="button"
        onClick={act}
        className="w-full flex items-start justify-between gap-4 px-4 py-3 text-left hover:bg-surface-sunken transition-colors"
      >
        <span className="min-w-0">
          <span className="block text-sm text-ink">{group.name}</span>
          {group.description && (
            <span className="block text-xs text-ink-muted mt-0.5">{group.description}</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-sm font-semibold text-ink">
            {group.hasChoices ? "from " : ""}{money(group.fromPrice, currency)}
          </span>
          {group.hasChoices && (
            <ChevronDown
              size={15}
              className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </span>
      </button>

      {open && group.tiers.length > 0 && (
        <ul className="bg-surface-sunken border-t border-line">
          {group.tiers.map((t) => (
            <li key={t.label}>
              <button
                type="button"
                onClick={() => onPick(`${group.name} (${t.label})`)}
                className="w-full flex items-baseline justify-between gap-4 pl-7 pr-4 py-2.5 text-left hover:bg-line/40 transition-colors"
              >
                <span className="text-sm text-ink-muted">{t.label}</span>
                <span className="text-sm font-semibold text-ink whitespace-nowrap">
                  {money(t.price, currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface MenuItem { name?: string; price?: number }
interface MenuCategory { name?: string; items?: MenuItem[] }
