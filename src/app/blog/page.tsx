import { Newspaper } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Newspaper size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Blog Coming Soon</h1>
        <p className="text-text-muted max-w-md mx-auto">
          Travel tips, destination guides, and behind-the-scenes at Sabię. Stay tuned.
        </p>
        <Button href="/" className="mt-8">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
