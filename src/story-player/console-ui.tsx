"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/ui/cn";
import type { FounderPersona, AmbientTint } from "@/story-engine/types";

// ── small dark-console primitives shared across the gates ────────────────────

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-console-800 bg-console-900/80 shadow-lg backdrop-blur-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MonoLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("text-mono-console", className)}>{children}</span>;
}

const TINT_RING: Record<AmbientTint, string> = {
  sky: "ring-sky-500/40 from-sky-500/30",
  coral: "ring-coral-500/40 from-coral-500/30",
  teal: "ring-teal-500/40 from-teal-500/30",
};

export function FounderAvatar({
  persona,
  tint = "teal",
  size = 36,
}: {
  persona: FounderPersona;
  tint?: AmbientTint;
  size?: number;
}) {
  const initials = (persona?.name ?? "?").slice(0, 1).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br to-console-850 font-mono font-semibold text-console-50 ring-2",
        TINT_RING[tint]
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}

// Types text out terminal-style; instant under prefers-reduced-motion.
export function TypedText({
  text,
  speed = 16,
  startDelay = 0,
  className,
  onDone,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? text : "");
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    if (reduce) {
      setShown(text);
      onDone?.();
      return;
    }
    setShown("");
    let i = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length && timer) {
          clearInterval(timer);
          if (!doneRef.current) {
            doneRef.current = true;
            onDone?.();
          }
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduce]);

  const done = shown.length >= text.length;
  return (
    <span className={className}>
      {shown}
      {!done && <span className="caret text-coral-400">▋</span>}
    </span>
  );
}
