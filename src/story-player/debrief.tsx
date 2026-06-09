"use client";

import Link from "next/link";
import { Button } from "@/ui/Button";
import { Check, RotateCcw } from "lucide-react";
import { Panel, FounderAvatar, MonoLabel } from "./console-ui";
import type { StoryTrip, FounderPersona, GateMethod } from "@/story-engine/types";
import type { FlightLogEntry } from "@/story-engine/store";

const NODE_LABEL: Record<GateMethod, string> = {
  restate_probe: "Restate",
  pick_defend: "Pick",
  find_target: "Locate",
  assignment: "Build",
  curveball: "Curveball",
};

// In-narrative founder debrief (pass or fail). Replays the concrete moves the candidate
// made (the FlightLog) — informational, never a score. The stamp sheet "develops".
export function Debrief({
  trip,
  persona,
  flightLog,
  onReplay,
}: {
  trip: StoryTrip;
  persona: FounderPersona;
  flightLog: FlightLogEntry[];
  onReplay: () => void;
}) {
  const methodOf = (gateId: string) => trip.gates.find((g) => g.id === gateId)?.method;

  return (
    <div className="py-8" data-testid="debrief">
      <div className="mb-6 flex items-center gap-3">
        <FounderAvatar persona={persona} size={42} tint="teal" />
        <div>
          <MonoLabel className="mb-0.5 block">debrief · {persona.name.toLowerCase()}</MonoLabel>
          <h1 className="text-h1 text-console-50">That&apos;s the fire out.</h1>
        </div>
      </div>

      <p className="mb-7 max-w-2xl text-[14px] leading-relaxed text-console-100">
        Here&apos;s what I noticed while you worked the ticket — gate by gate.
      </p>

      {/* the flight log — what they actually did */}
      <ol className="mb-8 grid gap-2.5">
        {flightLog.map((e, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-console-800 bg-console-900/70 px-4 py-3"
            data-testid={`flightlog-${e.gateId}`}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-500/15 text-teal-300">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-console-300">
                {NODE_LABEL[methodOf(e.gateId) as GateMethod] ?? e.gateId}
              </span>
              <p className="text-[13px] text-console-50">{e.line}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* developed stamp sheet */}
      <Panel className="mb-8 p-5">
        <MonoLabel className="mb-3 block">passport</MonoLabel>
        <div className="flex flex-wrap gap-3">
          {trip.gates.map((g, i) => (
            <span
              key={g.id}
              className="animate-stamp inline-flex items-center gap-1.5 rounded-full border border-teal-600/50 bg-teal-600/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-teal-300"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <Check className="h-3 w-3" /> {NODE_LABEL[g.method] ?? g.id}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onReplay}>
          <RotateCcw className="h-4 w-4" /> Replay from start
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Back to trips</Link>
        </Button>
      </div>
    </div>
  );
}
