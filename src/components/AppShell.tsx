"use client";

// The shell, so browsing and talking are not two different websites.
//
// WHAT WAS WRONG. This site was pages that replace each other: a Navbar, a
// page, a Footer. To answer a message you left what you were looking at, and
// to go back to it you lost your place. The app has a bar that never goes
// away, so a trip chat is always one tap from the feed.
//
// TikTok and Snapchat solve the same problem on the web with a persistent
// left rail: the feed scrolls beside it and Messages sits there the whole
// time, carrying its unread count. That is what this is. On a phone it is the
// bottom bar the app already has, because a rail on a 390px screen is a
// scroll-killer and a thumb cannot reach the top of the window.
//
// It is deliberately NOT on the marketing and legal pages. Those are a
// website and should read as one; the app shell belongs to the surfaces a
// signed-in person lives in.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageSquare, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchMyTrips } from "@/lib/trips";
import { showsShell, isChatRoute } from "@/lib/app-shell";

// FIVE, like the app's bar. A sixth would put six 65px targets on a 390px
// screen, and Bookings is already one tap away inside Account
// (account/page.tsx:59), where a record of what you have already paid for
// belongs more than it does beside a basket you have not.
const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  // SEARCH, NOT EXPLORE. /explore was the home page with a search box on it,
  // so it redirects here and the box came with it. The tab opens the one feed
  // and puts the cursor in the box, which is the "two states of one screen"
  // the app's own bar describes.
  { href: "/?search=1", label: "Search", icon: Search },
  { href: "/trips", label: "Chat", icon: MessageSquare, needsAuth: true, badge: true },
  // The app's bottom bar ends on the bag, and so does this.
  { href: "/cart", label: "Trip", icon: ShoppingBag, needsAuth: true },
  { href: "/account", label: "Account", icon: User, needsAuth: true },
];

export default function AppShell({
  children,
  // Passed as a slot rather than imported, so Footer stays a server component
  // and this client component still decides where it belongs. It is wrong on
  // a full-height chat: you would scroll past the conversation to find it.
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  // The count that makes "scroll and chat" real: without it somebody has to
  // open the thread to find out whether to open the thread.
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    return watchMyTrips(user.uid, (trips) => {
      setUnread(trips.reduce((n, t) => n + (t.unreadCounts?.[user.uid] || 0), 0));
    });
  }, [user]);

  // The rule lives in src/lib/app-shell.ts so it can be tested. The first
  // version of it was inline and matched prefixes with startsWith, so
  // "/aboutface" counted as "/about" and would have lost its bar; the test
  // caught that before this shipped.
  const show = showsShell(pathname);
  const isChat = isChatRoute(pathname);

  const tabs = TABS.filter((t) => !t.needsAuth || user);

  return (
    <>
      {show && (
        <nav
          aria-label="Sabię"
          className="fixed left-0 top-16 bottom-0 z-30 hidden w-56 flex-col gap-1 border-r border-line bg-card px-3 py-5 lg:flex"
        >
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                  active ? "bg-primary/10 font-bold text-primary" : "font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" />
                  {t.badge && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-[16px] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* The rail is fixed, so the page is inset rather than pushed. The
          bottom padding is the phone bar plus the home indicator under it;
          the footer sits inside this, or the bar covers its last rows. */}
      <div className={show ? "lg:pl-56" : undefined}>
        <div className={show ? "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0" : undefined}>
          {children}
          {!isChat && footer}
        </div>
      </div>

      {show && (
        <nav
          aria-label="Sabię"
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        >
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? "text-primary" : "text-ink-muted"
                }`}
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" />
                  {t.badge && unread > 0 && (
                    <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
