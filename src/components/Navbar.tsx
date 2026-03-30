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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f13]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo-sabie.jpg" alt="Sabie" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-white">Sabię</span>
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
                      ? "text-white bg-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5"
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
                  <Image src={userProfile.profileImage} alt="" width={32} height={32} className="rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={16} className="text-secondary" />
                  </div>
                )}
                <span className="text-sm font-medium text-white/80">
                  {userProfile?.fullName?.split(" ")[0] || "Account"}
                </span>
              </Link>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-white/50 hover:text-white px-4 py-2 transition-colors">
                  Log in
                </Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-secondary hover:bg-secondary-dark text-[#0f0f13] px-5 py-2.5 rounded-full transition-colors">
                  Sign up
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white/70">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0f0f13] border-t border-white/5 px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${isActive ? "text-white bg-white/10" : "text-white/50 hover:text-white"}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <hr className="border-white/5 my-2" />
          {user ? (
            <>
              <Link href="/account" className="block text-sm font-medium py-2.5 px-3 text-white/50 hover:text-white" onClick={() => setMobileOpen(false)}>My Account</Link>
              <Link href="/bookings" className="block text-sm font-medium py-2.5 px-3 text-white/50 hover:text-white" onClick={() => setMobileOpen(false)}>My Bookings</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-sm font-medium py-2.5 px-3 text-white/50" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/auth/signup" className="block text-sm font-semibold bg-secondary text-[#0f0f13] text-center py-3 rounded-full mt-2" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
