import { Smartphone, X } from "lucide-react";
import { useState } from "react";

export default function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary text-white px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
        <Smartphone size={20} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Get the Sabię app</p>
          <p className="text-xs text-white/60">Book faster, plan with friends</p>
        </div>
        <a
          href="https://apps.apple.com/app/sabie/id6504672498"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-secondary text-neutral-dark text-xs font-bold px-4 py-2 rounded-full shrink-0"
        >
          Open
        </a>
        <button onClick={() => setDismissed(true)} className="text-white/50 shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
