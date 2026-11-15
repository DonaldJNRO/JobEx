import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-sunken text-ink-muted border-t border-line">
      <div className="max-w-6xl mx-auto px-gutter sm:px-6 lg:px-8 py-section">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            {/* Same rule and same artwork as the header: the wordmark, which
                already contains the bee, and never the wordmark beside it.
                Here the mark is not inside a link, so it carries its own
                name. */}
            <div className="mb-4">
              <Image
                src="/images/sabie-wordmark.png"
                alt="Sabię"
                width={157}
                height={84}
                className="h-8 w-auto"
              />
            </div>
            {/* ON EVERY PAGE, so it was the most repeated untrue sentence on
                the site. It promised "AI-powered recommendations, built-in
                budget splitting", neither of which exists anywhere on this
                website, under a wordmark, in the footer of the listings, the
                legal pages and everything else. */}
            <p className="text-small leading-relaxed">
              Stays, experiences and places to eat, visited by us and bookable in one place. Lagos, Abuja, Jos and London.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-small font-semibold text-ink mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-small">
              <li><Link href="/" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Explore</Link></li>
              <li><Link href="/?category=stays" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Stays</Link></li>
              <li><Link href="/?category=experiences" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Experiences</Link></li>
              <li><Link href="/?category=events" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Events</Link></li>
              <li><Link href="/?category=food" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Food & Drink</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-small font-semibold text-ink mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-small">
              <li><Link href="/how-it-works" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">How it works</Link></li>
              <li><Link href="/about" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">About</Link></li>
              {/* BACK IN, 15 Nov 2026. The note here said to restore this "the
                  day it has something to read", and that day is today: /blog
                  carries one post, the 91 live businesses and the 68 of them
                  no global platform can book. sitemap.ts was updated in the
                  same change, so the two no longer disagree. */}
              <li><Link href="/blog" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Writing</Link></li>
              {/* SOURCES IS LINKED NOW, AND IT STAYS noindex.
                  That page was built to be unreachable: "not in the sitemap
                  and not in the nav, on purpose", reached only by typing the
                  address or tapping the deck. The reason given was that an
                  evidence sheet must never outrank a product page in search,
                  and that reason is still good. A footer link does not change
                  it: the robots metadata keeps it out of results while a
                  human who wants to check our numbers can now find it without
                  being handed a URL. Linking and indexing are separate, and
                  only the second one was ever the worry. */}
              <li><Link href="/sources" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Sources</Link></li>
              <li><Link href="/contact" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">Terms</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-small font-semibold text-ink mb-4 uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3 text-small">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>20 Wenlock Road, London, N1 7GU, UK</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                <a href="mailto:hello@sabieapp.com" className="inline-flex items-center min-h-9 hover:text-ink transition-colors">hello@sabieapp.com</a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="https://twitter.com/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-line-strong transition-colors text-caption font-bold">X</a>
              <a href="https://instagram.com/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-line-strong transition-colors text-caption font-bold">IG</a>
              <a href="https://linkedin.com/company/sabieapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-line-strong transition-colors text-caption font-bold">in</a>
            </div>
          </div>
        </div>

        <div className="border-t border-line mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-ink-faint">&copy; {new Date().getFullYear()} Sabię. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Image src="/images/barclays-eagle-labs-logo.svg" alt="Barclays Eagle Labs" width={100} height={24} className="opacity-50 hover:opacity-80 transition-opacity" />
            <Image src="/images/fv-partner-new24.svg" alt="Foundervine" width={80} height={24} className="opacity-50 hover:opacity-80 transition-opacity" />
          </div>
        </div>
      </div>
    </footer>
  );
}
