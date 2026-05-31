import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/images/logo-sabie.jpg" alt="Sabię" width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-bold text-white">Sabię</span>
            </div>
            <p className="text-sm leading-relaxed">
              Plan trips with friends. AI-powered recommendations, built-in budget splitting, and vibes that match your crew.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/explore" className="hover:text-white transition-colors">Explore</Link></li>
              <li><Link href="/explore?category=stays" className="hover:text-white transition-colors">Stays</Link></li>
              <li><Link href="/explore?category=experiences" className="hover:text-white transition-colors">Experiences</Link></li>
              <li><Link href="/explore?category=events" className="hover:text-white transition-colors">Events</Link></li>
              <li><Link href="/explore?category=food" className="hover:text-white transition-colors">Food & Drink</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>20 Wenlock Road, London, N1 7GU, UK</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                <a href="mailto:hello@sabieapp.com" className="hover:text-white transition-colors">hello@sabieapp.com</a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="https://twitter.com/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold">X</a>
              <a href="https://instagram.com/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold">IG</a>
              <a href="https://linkedin.com/company/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold">in</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Sabię. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={100} height={24} className="opacity-50 hover:opacity-80 transition-opacity" />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={80} height={24} className="opacity-50 hover:opacity-80 transition-opacity" />
          </div>
        </div>
      </div>
    </footer>
  );
}
