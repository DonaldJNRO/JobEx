"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Mail, LogOut, Shield, Bell, Bookmark, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const { user, userProfile, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-8">My Account</h1>

        {/* Profile card */}
        <div className="bg-[#18181f] rounded-2xl border border-white/6 p-6 mb-6">
          <div className="flex items-center gap-4">
            {userProfile?.profileImage ? (
              <Image src={userProfile.profileImage} alt="" width={56} height={56} className="rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">{userProfile?.fullName || "User"}</h2>
              <p className="text-sm text-text-muted">{user.email}</p>
              {userProfile?.handle && (
                <p className="text-xs text-text-muted">@{userProfile.handle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-[#18181f] rounded-2xl border border-white/6 overflow-hidden mb-6">
          {[
            { icon: Calendar, label: "My Bookings", href: "/bookings" },
            { icon: Bookmark, label: "Saved Listings", href: "/favorites" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center gap-4 px-6 py-4 border-b border-white/6 last:border-0 hover:bg-neutral-light hover:bg-white/5 transition-colors">
              <item.icon size={20} className="text-text-muted" />
              <span className="text-sm font-medium text-white">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );
}
