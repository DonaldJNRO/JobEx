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
import Image from "next/image";
import OfferScreen from "./OfferScreen";
import { ChevronRight } from "lucide-react";
import { ROW_ACTION, cardClass } from "@/lib/ui-recipes";
import { openAsScreen, OFFER_HERO } from "@/lib/screen-open";
import { useMoney as useGuestRates } from "@/lib/useRates";
import { buildDisplayPrice } from "@/lib/display-price";
import { serviceGroups, worthAScreen, type ServiceGroup } from "@/lib/shop-window";
import { resolveProfileSections, CTA_LABEL } from "@/lib/profile-sections";

/**
 * THE GUEST'S OWN CURRENCY, not the operator's.
 *
 * This component first shipped with `currency === "GBP" ? "£" : "₦"` written
 * into it, which showed a guest in London ₦35,000 and asked them to work out
 * what that is. The site already had the answer: buildDisplayPrice, the same
 * converter the grid cards and the booking sheet use, reading the same rate
 * source as the mobile app so the two cannot disagree. Hardcoding the symbol
 * walked straight past it.
 *
 * When rates have not arrived this returns the operator's own price in the
 * operator's own currency, which is the rule inherited from the app: show
 * native only, never a guess.
 */
function useMoney(nativeCurrency: string) {
  // THE EXISTING HOOK, not a second copy of it. The first version of this
  // read navigator.language during render; useMoney reads it in an effect,
  // and the comment there says why: navigator does not exist on the server,
  // so reading it while rendering makes the server and client markup differ
  // and trips hydration. Walking past that comment was the whole bug.
  const { rates, ready, to } = useGuestRates();
  return (n: number | null): string => {
    if (n === null) return "Ask";
    return buildDisplayPrice({
      amount: n,
      nativeCurrency,
      selectedCurrency: to,
      exchangeRates: rates,
      ratesReady: ready,
    }).display;
  };
}

interface Props {
  /** Names already shown as real rooms, to drop from this list. */
  hideNames?: string[];
  /** True when the rooms were drawn above, so this list is everything else. */
  roomsShown?: boolean;
  listing: Record<string, unknown>;
  currency: string;
  /** Opens the booking sheet on a chosen row. */
  onPick: (offerName: string, slot?: string) => void;
}

export default function ProfileServices({ listing, currency, onPick, hideNames, roomsShown }: Props) {
  const { services: shape, bookCta } = resolveProfileSections(listing);
  // The same word the button at the top of the page uses.
  // A ROW IS NOT THE PAGE. CTA_LABEL is the word for the ONE button at the
  // top of a listing, where "See rooms" means "go and look at the list". On
  // a row it was nonsense: every room in a guesthouse carried a button
  // saying See rooms, and tapping one went straight to payment. The thing
  // you tapped WAS the room, so there was nothing further to see, which is
  // exactly what came back: "it says see rooms but when I tap on it it just
  // says pay, nothing that shows the rooms".
  //
  // On a row the honest word is what tapping it does. A row with tiers
  // behind it opens them; a row with one price books that price.
  const cta = bookBookCtaRowWord(bookCta);
  // ROOMS ARE WRITTEN INTO services[] TOO. Scout writes a stay's rooms as
  // services as well as into roomTypes, so a page that renders both lists
  // shows every room twice, once with a photograph and once as a bare stub.
  // The root of that is a writer in another repo and a fix there was tried
  // and reverted as unsafe, so the duplicate is dropped at display time by
  // whichever surface already drew it properly.
  //
  // By name, trimmed and case-insensitively, because the two writers do not
  // agree on capitalisation. Anything NOT a room, a bonfire for instance,
  // stays: this is a de-duplicate, not a way to hide the services list.
  const drop = new Set((hideNames || []).map((n) => n.trim().toLowerCase()).filter(Boolean));
  const groups = serviceGroups(listing).filter((g) => !drop.has(String(g.name).trim().toLowerCase()));
  const money = useMoney(currency);
  const [showing, setShowing] = useState<ServiceGroup | null>(null);
  const menu = Array.isArray(listing.menu) ? (listing.menu as MenuCategory[]) : [];

  // A CAFÉ READS ITS MENU, it does not pick a service. Never payable, so
  // nothing here is tappable: the table request is the only action.
  if (shape === "menu") {
    const withItems = menu.filter((c) => Array.isArray(c?.items) && c.items.length > 0);
    if (withItems.length === 0) return null;
    return (
      <section className="reveal">
        <h2 className="text-heading font-bold text-ink mb-3">On the menu</h2>
        <div className="space-y-5">
          {withItems.map((cat, i) => (
            <div key={`${cat.name ?? i}`}>
              {cat.name && (
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
                  {cat.name}
                </p>
              )}
              <ul className={`divide-y divide-line overflow-hidden ${cardClass({ pad: "none" })}`}>
                {(cat.items ?? []).map((it, j) => (
                  <li key={`${it?.name ?? j}`} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <span className="text-sm text-ink">{it?.name}</span>
                    {typeof it?.price === "number" && (
                      <span className="text-sm text-ink-muted whitespace-nowrap">
                        {money(it.price)}
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
  // "PICK A ROOM" OVER A BONFIRE, A LIGHTHOUSE AND A TENT.
  //
  // On a lodging this heading says rooms, and it was right while this list
  // WAS the rooms. The real rooms now come from the roomTypes
  // subcollection and are drawn above, so what is left here is everything
  // else the place offers: a bonfire, a walk to the lighthouse, a pitched
  // tent. Calling those rooms is worse than not labelling them.
  const heading = roomsShown
    ? "Also here"
    : shape === "rooms" ? "Pick a room" : "Pick what you want";
  return (
    <section className="reveal">
      {/* IN THE BRANCH WITH TAPPABLE ROWS. This was rendered inside the
          `shape === "menu"` branch, which returns above and whose rows are
          not buttons, so nothing in there ever opened it and nothing out
          here could. Tapping a service played the view transition, set the
          state and showed nothing. 97 of 159 services carry a photo. */}
      {showing && (
        <OfferScreen
          group={showing}
          money={money}
          onClose={() => setShowing(null)}
          onPick={(n, slot) => { setShowing(null); onPick(n, slot); }}
        />
      )}
      <h2 className="text-heading font-bold text-ink mb-3">{heading}</h2>
      <ul className={`divide-y divide-line overflow-hidden ${cardClass({ pad: "none" })}`}>
        {groups.map((g) => (
          <ServiceRow key={g.name} group={g} money={money} cta={cta} onPick={onPick} onOpen={setShowing} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The word on a ROW, as against the word on the page's single button.
 *
 * "See rooms" and "Enquire" describe navigating to a list. Once you are IN
 * the list, the row's action is the booking itself.
 */
function bookBookCtaRowWord(bookCta: string): string {
  if (bookCta === "reserve") return "Reserve";
  if (bookCta === "inquire") return "Ask";
  // rooms and book both end at the same place from a row: this exact thing,
  // at this exact price.
  return "Book";
}

function ServiceRow(
  { group, money, cta, onPick, onOpen }:
    { group: ServiceGroup; money: (n: number | null) => string; cta: string; onPick: (n: string) => void; onOpen: (g: ServiceGroup) => void },
) {

  // A row with one price books it. A row with a choice opens first, because
  // booking "Gel nails" without saying Short or Medium is not a booking.
  //
  // AND A ROW WITH SOMETHING BEHIND IT OPENS A SCREEN. 136 experience
  // services exist, 85 carrying a photo and 116 carrying their own hours,
  // and every one of them reached a traveller as a name and a price on one
  // line. A row with a photo, a description, its own times or a set of
  // tiers has something to show; a bare name and a price has not, and
  // opening a screen for that would be a screen with a name on it.
  const act = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (worthAScreen(group)) {
      const thumb = (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-offer-thumb]");
      return openAsScreen(thumb, OFFER_HERO, () => onOpen(group));
    }
    return onPick(group.name);
  };

  return (
    <li>
      <button
        type="button"
        onClick={act}
        className="group w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-surface-sunken transition-colors"
      >
        {group.imageUrl ? (
          <span data-offer-thumb className="relative block h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-sunken">
            <Image src={group.imageUrl} alt="" fill sizes="64px" className="object-cover" />
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="block text-sm text-ink">{group.name}</span>
          {group.description && (
            <span className="block text-xs text-ink-muted mt-0.5">{group.description}</span>
          )}
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-semibold text-ink">
            {group.hasChoices ? "from " : ""}{money(group.fromPrice)}
          </span>
          {/* A ROW HAS TO LOOK LIKE THE WAY IN. Without this the list reads
              as a brochure beside the Book button at the top of the page,
              and a visitor cannot tell which of the two is the booking.
              "Choose" on a row that opens, the action word on one that
              books straight through. */}
          {/* ONE WORD, BECAUSE THERE IS NOW ONE BEHAVIOUR. The row used to
              expand its tiers inline, and worthAScreen made that branch
              unreachable the moment a tiered row started opening a screen
              instead: tiers.length > 1 is itself enough to be worth one. So
              "Choose" sat above a chevron that never rotated over a list
              that never opened. The screen shows the tiers and books them. */}
          <span className={ROW_ACTION}>
            {group.hasChoices ? "Choose" : cta}
            <ChevronRight size={13} />
          </span>
        </span>
      </button>

    </li>
  );
}

interface MenuItem { name?: string; price?: number }
interface MenuCategory { name?: string; items?: MenuItem[] }

/**
 * Will this listing render anything to pick?
 *
 * The page needs to know BEFORE it draws its own booking card, because the
 * two must never both appear: a single "Book" button above a list of
 * seventeen services cannot say which one it means.
 *
 * Measured on 9 Oct: of 49 live listings, 20 have something to pick and 29
 * have nothing at all, most of them cafés with no menu items loaded yet.
 * Those 29 still need a way to act, so the page keeps its card for them.
 * Exported from here rather than worked out again on the page, so the answer
 * cannot differ from what this component actually does.
 */
export function hasPickableList(listing: Record<string, unknown>): boolean {
  const { services: shape } = resolveProfileSections(listing);
  // A CAFÉ'S MENU IS NOT A WAY TO BOOK. Nothing in it is tappable, because
  // cafés are reservation-only and that rule is locked, so the one action a
  // café has is the card's. Hiding it on the strength of a menu being
  // present would leave the café with no way to request a table at all.
  if (shape === "menu") return false;
  return serviceGroups(listing).length > 0;
}
