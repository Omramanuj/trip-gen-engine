"use client";

import { Button } from "@/ui/Button";
import { ChevronRight, Terminal, Bot, Clock, ShieldCheck } from "lucide-react";
import { Panel, MonoLabel, FounderAvatar } from "./console-ui";
import type { StoryTrip, GateMethod } from "@/story-engine/types";

const NODE_LABEL: Record<GateMethod, string> = {
  restate_probe: "Restate",
  pick_defend: "Pick",
  find_target: "Locate",
  assignment: "Build",
  curveball: "Curveball",
};

// Pre-G1 "incident briefing" boot screen. Honest expectations = the top anxiety/fairness lever.
export function HouseRules({ trip, onStart }: { trip: StoryTrip; onStart: () => void }) {
  const m = trip.trip_meta;
  const mins = Math.round((m.total_time_cap_seconds ?? 0) / 60);

  const rules = [
    { icon: Bot, text: "Bring your own AI — we assume you will. This measures the judgment on top of it." },
    { icon: Clock, text: `~${mins} min. The build (Locate → Build) is the heavy part; everything else is quick.` },
    { icon: ShieldCheck, text: "You can't break anything. Every leg is scored on its own — you always continue." },
  ];

  return (
    <div className="py-4">
      <div className="mb-2 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-coral-400" />
        <MonoLabel>incident briefing</MonoLabel>
      </div>

      <h1 className="text-display mb-3 text-console-50">
        One ticket. <em>Five gates.</em>
      </h1>
      <p className="mb-7 max-w-2xl text-[15px] leading-relaxed text-console-100">{trip.story_premise}</p>

      {/* who you're working with */}
      <Panel className="mb-6 flex items-center gap-3 p-4">
        <FounderAvatar persona={trip.founder_persona} size={40} tint="coral" />
        <div className="min-w-0">
          <p className="text-[13px] text-console-50">
            {trip.founder_persona.name} · {trip.founder_persona.role}, {trip.founder_persona.company}
          </p>
          <p className="text-[12px] text-console-300">
            Your point of contact for the whole session. {trip.founder_persona.voice_note}
          </p>
        </div>
      </Panel>

      {/* the legs */}
      <MonoLabel className="mb-2 block">the route</MonoLabel>
      <ol className="mb-7 grid gap-2 sm:grid-cols-5">
        {trip.gates.map((g, i) => (
          <li
            key={g.id}
            className="rounded-xl border border-console-800 bg-console-900/70 px-3 py-3"
            data-testid={`route-leg-${g.id}`}
          >
            <span className="font-mono text-[10px] text-console-600">0{i + 1}</span>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-console-100">
              {NODE_LABEL[g.method] ?? g.id}
            </p>
          </li>
        ))}
      </ol>

      {/* house rules */}
      <div className="mb-8 grid gap-2.5">
        {rules.map((r, i) => (
          <div key={i} className="flex items-start gap-3 text-[13px] text-console-100">
            <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      <Button onClick={onStart} variant="primary" size="lg" data-testid="start-trip">
        Open the ticket <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
