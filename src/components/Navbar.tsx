"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-dark/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo-sabie.jpg" alt="Sabie" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-primary dark:text-white">Sabię</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-sm font-medium text-text-primary dark:text-white/80 hover:text-primary transition-colors">
              Explore
            </Link>
            <Link href="/about" className="text-sm font-medium text-text-primary dark:text-white/80 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-text-primary dark:text-white/80 hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user ? (
              <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {userProfile?.profileImage ? (
                  <Image src={userProfile.profileImage} alt="" width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary dark:text-white">
                  {userProfile?.fullName?.split(" ")[0] || "Account"}
                </span>
              </Link>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-text-primary dark:text-white/80 hover:text-primary transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full transition-colors">
                  Sign up
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-primary dark:text-white">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-dark border-t border-black/5 dark:border-white/5 px-4 py-4 space-y-3">
          <Link href="/explore" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Explore</Link>
          <Link href="/about" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/contact" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Contact</Link>
          <hr className="border-black/5 dark:border-white/10" />
          {user ? (
            <>
              <Link href="/account" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>My Account</Link>
              <Link href="/bookings" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>My Bookings</Link>
              <Link href="/favorites" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Saved</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/auth/signup" className="block text-sm font-semibold bg-primary text-white text-center py-3 rounded-full" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
