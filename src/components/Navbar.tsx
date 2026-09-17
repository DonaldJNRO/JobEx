"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile, loading } = useAuth();
  const pathname = usePathname();

  return (
    /* SOLID. It was bg-surface/80 with a blur, and over a scrolling row of
       photographs the bar went muddy grey with the card text still legible
       through it: you could read "Rayfield Resort" behind the wordmark. 95%
       was better and still ghosted. A header you can read the page through is
       not glass, it is a mistake, and glass done properly costs a repaint on
       every scroll frame for an effect nobody asked for. The blur goes with
       it, because a blur behind an opaque layer renders nothing and costs
       the same. */
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* THE WORDMARK ALREADY CONTAINS THE BEE, in the bowl of the b. It is
              one or the other, never both, and this used to be both: the bee
              mark and the word side by side, in the header of every page.

              It was then set as TEXT, which was right while there was no asset
              to use, and wrong the moment there was. A wordmark is drawn, not
              typed: the b's bowl carries the bee and no font will ever produce
              it. So this is the artwork.

              Black on TRANSPARENT, not on white. The mark sits straight on the
              bar and takes its colour, so there is no plate with its own edges
              to line up. That is the same mistake the old 69KB JPEG made,
              which could not hold transparency and showed its square corners.

              alt is empty on purpose. The link already carries the accessible
              name, and repeating it makes a screen reader say Sabię twice. */}
          <Link href="/" className="flex items-center h-11 -ml-1 px-1" aria-label="Sabię, home">
            <Image
              src="/images/sabie-wordmark.png"
              alt=""
              width={157}
              height={84}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "text-ink bg-surface-sunken"
                      : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user ? (
              <Link href="/account" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                {userProfile?.profileImage ? (
                  <Image src={userProfile.profileImage} alt="" width={32} height={32} className="rounded-full border border-line" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-ink-body">
                  {userProfile?.fullName?.split(" ")[0] || "Account"}
                </span>
              </Link>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-ink-muted hover:text-ink px-4 py-2 transition-colors">
                  Log in
                </Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-secondary hover:bg-secondary-dark text-[#0f0f13] px-5 py-2.5 rounded-full transition-colors">
                  Sign up
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden -mr-2 w-11 h-11 inline-flex items-center justify-center text-ink-body"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-line px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${isActive ? "text-ink bg-surface-sunken" : "text-ink-muted hover:text-ink"}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <hr className="border-line my-2" />
          {user ? (
            <>
              <Link href="/account" className="block text-sm font-medium py-2.5 px-3 text-ink-muted hover:text-ink" onClick={() => setMobileOpen(false)}>My Account</Link>
              <Link href="/bookings" className="block text-sm font-medium py-2.5 px-3 text-ink-muted hover:text-ink" onClick={() => setMobileOpen(false)}>My Bookings</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-sm font-medium py-2.5 px-3 text-ink-muted" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/auth/signup" className="block text-sm font-semibold bg-secondary text-[#0f0f13] text-center py-3 rounded-full mt-2" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
