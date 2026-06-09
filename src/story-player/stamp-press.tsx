"use client";

import { Check } from "lucide-react";
import { cn } from "@/ui/cn";

// The one celebratory beat: a teal "verified" stamp, pressed onto the page on a genuine
// gate-pass. Honors prefers-reduced-motion via the CSS animation (instant fallback there).
export function StampPress({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span className="animate-stamp grid h-16 w-16 -rotate-3 place-items-center rounded-full border-2 border-teal-500/70 bg-teal-500/10 text-teal-300 shadow-[0_0_30px_-8px_rgba(63,134,130,0.6)]">
        <Check className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-teal-400">{label}</span>
    </div>
  );
}
