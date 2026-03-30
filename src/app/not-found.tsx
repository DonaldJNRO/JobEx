import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <MapPin size={36} className="text-primary dark:text-secondary" />
        </div>
        <h1 className="text-6xl font-extrabold text-primary dark:text-secondary mb-2">404</h1>
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Page not found</h2>
        <p className="text-text-muted max-w-md mx-auto mb-8">
          Looks like this page went on a trip without telling us. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-colors">
            Go Home
          </Link>
          <Link href="/explore" className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition-colors">
            Explore Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
