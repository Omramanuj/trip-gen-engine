import { cn } from "@/ui/cn";
import type { Tone } from "@/engine/meta";

// Small toned pill. Server-safe (no "use client") so both the home list and the
// card player can render it. Tones map onto the globals.css palette.

const TONE_CLASS: Record<Tone, string> = {
  teal: "bg-teal-100 text-teal-700 border border-teal-300",
  sky: "bg-sky-100 text-sky-700 border border-sky-300",
  coral: "bg-coral-100 text-coral-700 border border-coral-200",
  amber: "bg-amber-100 text-ink-800 border border-amber-300",
  ink: "bg-cream-200 text-ink-600 border border-cream-400",
};

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
