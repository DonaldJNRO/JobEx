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
import { resolveProfileSections, CTA_LABEL } from "@/lib/profile-sections";

const money = (n: number | null, currency: string) =>
  n === null ? "Ask" : `${currency === "GBP" ? "£" : "₦"}${n.toLocaleString("en-NG")}`;

interface Props {
  listing: Record<string, unknown>;
  currency: string;
  /** Opens the booking sheet on a chosen row. */
  onPick: (offerName: string) => void;
}

export default function ProfileServices({ listing, currency, onPick }: Props) {
  const { services: shape, bookCta } = resolveProfileSections(listing);
  // The same word the button at the top of the page uses.
  const cta = CTA_LABEL[bookCta];
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

  // THE HEADING SAYS WHAT TO DO WITH IT. "What they offer" reads as a
  // brochure next to a Book button at the top of the page, and a visitor
  // cannot tell which one is the booking. This says the list IS the booking.
  const heading = shape === "rooms" ? "Pick a room" : "Pick what you want";
  return (
    <section className="reveal">
      <h2 className="text-lg font-semibold text-ink mb-3">{heading}</h2>
      <ul className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {groups.map((g) => (
          <ServiceRow key={g.name} group={g} currency={currency} cta={cta} onPick={onPick} />
        ))}
      </ul>
    </section>
  );
}

function ServiceRow(
  { group, currency, cta, onPick }:
    { group: ServiceGroup; currency: string; cta: string; onPick: (n: string) => void },
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
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-semibold text-ink">
            {group.hasChoices ? "from " : ""}{money(group.fromPrice, currency)}
          </span>
          {/* A ROW HAS TO LOOK LIKE THE WAY IN. Without this the list reads
              as a brochure beside the Book button at the top of the page,
              and a visitor cannot tell which of the two is the booking.
              "Choose" on a row that opens, the action word on one that
              books straight through. */}
          {group.hasChoices ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Choose
              <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">{cta}</span>
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
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-ink">{money(t.price, currency)}</span>
                  <span className="text-xs font-semibold text-primary">{cta}</span>
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
