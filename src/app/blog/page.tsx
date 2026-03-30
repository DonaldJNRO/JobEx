import { Newspaper } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Newspaper size={32} className="text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Blog Coming Soon</h1>
        <p className="text-text-muted max-w-md mx-auto">
          Travel tips, destination guides, and behind-the-scenes at Sabię. Stay tuned.
        </p>
        <Link href="/" className="inline-block mt-8 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
