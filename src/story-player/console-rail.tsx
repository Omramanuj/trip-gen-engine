"use client";

import { Check } from "lucide-react";
import { cn } from "@/ui/cn";
import { FounderAvatar } from "./console-ui";
import type { Gate, GateMethod, Ticket, FounderPersona } from "@/story-engine/types";

const NODE_LABEL: Record<GateMethod, string> = {
  restate_probe: "Restate",
  pick_defend: "Pick",
  find_target: "Locate",
  assignment: "Build",
  curveball: "Curveball",
};

// Persistent boarding-pass / incident rail: the ticket spine + the 5 named legs.
// Cleared = teal stamp · current = coral · future = dimmed-but-named. No score, no %.
export function ConsoleRail({
  ticket,
  persona,
  gates,
  gateIdx,
  stamps,
}: {
  ticket: Ticket;
  persona: FounderPersona;
  gates: Gate[];
  gateIdx: number; // -1 intro, gates.length debrief
  stamps: string[];
}) {
  return (
    <div className="sticky top-0 z-20 -mx-6 mb-8 border-b border-console-800 bg-console-950/85 px-6 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-2.5">
        {/* ticket spine */}
        <div className="flex items-center gap-2.5">
          <FounderAvatar persona={persona} size={26} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-coral-400">
            {ticket.id}
          </span>
          <span className="truncate text-[13px] text-console-100">{ticket.title}</span>
          <span className="ml-auto hidden font-mono text-[11px] text-console-300 sm:inline">
            {persona.name} · {persona.company}
          </span>
        </div>

        {/* named legs */}
        <ol className="flex items-center gap-1.5 overflow-x-auto">
          {gates.map((g, i) => {
            const cleared = stamps.includes(g.id);
            const current = i === gateIdx;
            return (
              <li key={g.id} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span
                    className={cn(
                      "h-px w-4 sm:w-7",
                      i <= gateIdx ? "bg-teal-600" : "bg-console-700"
                    )}
                  />
                )}
                <span
                  data-testid={`rail-node-${g.id}`}
                  data-state={cleared ? "cleared" : current ? "current" : "future"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                    cleared && "border-teal-600/50 bg-teal-600/15 text-teal-300",
                    current && !cleared && "border-coral-500/60 bg-coral-500/15 text-coral-300",
                    !cleared && !current && "border-console-700 bg-console-900 text-console-300"
                  )}
                >
                  {cleared ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full",
                        current ? "animate-pulse bg-coral-400" : "bg-console-600"
                      )}
                    />
                  )}
                  {NODE_LABEL[g.method] ?? g.id}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
