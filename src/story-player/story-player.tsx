"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/ui/cn";
import type { StoryTrip, StorySecrets, GateMethod, AmbientTint } from "@/story-engine/types";
import { useStory } from "@/story-engine/store";
import { ConsoleRail } from "./console-rail";
import { HouseRules } from "./house-rules";
import { TransitionBeat } from "./transition-beat";
import { Debrief } from "./debrief";
import { StoryInspector } from "./inspector";
import type { GateProps } from "./gates/gate-props";
import { G1FounderChat } from "./gates/g1-founder-chat";
import { G2ApproachMatrix } from "./gates/g2-approach-matrix";
import { G3ReadonlyIde } from "./gates/g3-readonly-ide";
import { G4Sandbox } from "./gates/g4-sandbox";
import { G5Curveball } from "./gates/g5-curveball";

const GATE_COMPONENTS: Record<GateMethod, React.ComponentType<GateProps>> = {
  restate_probe: G1FounderChat,
  pick_defend: G2ApproachMatrix,
  find_target: G3ReadonlyIde,
  assignment: G4Sandbox,
  curveball: G5Curveball,
};

const TINT_GLOW: Record<AmbientTint, string> = {
  sky: "radial-gradient(900px 480px at 50% -10%, rgba(156,206,224,0.10), transparent 60%)",
  coral: "radial-gradient(900px 480px at 50% -10%, rgba(238,137,124,0.12), transparent 60%)",
  teal: "radial-gradient(900px 480px at 50% -10%, rgba(63,134,130,0.13), transparent 60%)",
};

type Phase = "intro" | "gate" | "transition" | "debrief";

export function StoryPlayer({ trip, secrets }: { trip: StoryTrip; secrets: StorySecrets }) {
  const reduce = useReducedMotion();
  const gates = trip.gates ?? [];
  const [phase, setPhase] = useState<Phase>("intro");
  const [gateIdx, setGateIdx] = useState(0);
  const [transitionGate, setTransitionGate] = useState(0); // gate whose handoff we're showing
  const [view, setView] = useState<"candidate" | "author">("candidate");

  const { stamps, flightLog, earnStamp, reset } = useStory();

  const slice = trip.shared_payload.codebase_slice;
  const persona = trip.founder_persona;
  const ticket = trip.shared_payload.ticket;

  function handleComplete(idx: number, stampLine: string) {
    const g = gates[idx];
    earnStamp(g.id, stampLine);
    setTransitionGate(idx);
    if (g.unlocks) setPhase("transition");
    else setPhase("debrief");
  }

  function advance() {
    setGateIdx((i) => Math.min(i + 1, gates.length - 1));
    setPhase("gate");
  }

  function restart() {
    reset();
    setGateIdx(0);
    setPhase("intro");
  }

  const railIdx = phase === "intro" ? -1 : phase === "debrief" ? gates.length : gateIdx;

  const enter = reduce
    ? { opacity: 0 }
    : { opacity: 0, x: 28 };
  const exit = reduce ? { opacity: 0 } : { opacity: 0, x: -28 };

  return (
    <div className="story-console">
      <div className="mx-auto max-w-5xl px-6 py-5">
        {/* top chrome: home + author toggle */}
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-console-300 transition-colors hover:text-coral-400"
          >
            ← trips
          </Link>
          <button
            type="button"
            onClick={() => setView((v) => (v === "author" ? "candidate" : "author"))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all",
              view === "author"
                ? "border-coral-500/50 bg-coral-500/15 text-coral-300"
                : "border-console-700 bg-console-900 text-console-300 hover:border-console-600"
            )}
          >
            {view === "author" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {view === "author" ? "Author view" : "Candidate view"}
          </button>
        </div>

        {phase !== "intro" && (
          <ConsoleRail
            ticket={ticket}
            persona={persona}
            gates={gates}
            gateIdx={railIdx}
            stamps={stamps}
          />
        )}

        <div className={cn("flex gap-6", view === "author" ? "items-start" : "")}>
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {phase === "intro" && (
                <motion.div key="intro" initial={enter} animate={{ opacity: 1, x: 0 }} exit={exit}>
                  <HouseRules trip={trip} onStart={() => setPhase("gate")} />
                </motion.div>
              )}

              {phase === "gate" &&
                (() => {
                  const gate = gates[gateIdx];
                  const Comp = GATE_COMPONENTS[gate.method];
                  const secret = secrets.gates.find((s) => s.id === gate.id);
                  return (
                    <motion.div
                      key={`gate-${gateIdx}`}
                      initial={enter}
                      animate={{ opacity: 1, x: 0 }}
                      exit={exit}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: TINT_GLOW[gate.ambient_tint] }}
                      className="rounded-3xl"
                      data-testid={`gate-${gate.id}`}
                    >
                      {Comp ? (
                        <Comp
                          gate={gate}
                          secret={secret}
                          facts={secrets.hidden_facts}
                          flaws={secrets.injected_flaws}
                          persona={persona}
                          ticket={ticket}
                          slice={slice}
                          onComplete={(line) => handleComplete(gateIdx, line)}
                        />
                      ) : (
                        <p className="text-console-300">Unknown gate method: {gate.method}</p>
                      )}
                    </motion.div>
                  );
                })()}

              {phase === "transition" && (
                <motion.div key={`tr-${transitionGate}`} initial={enter} animate={{ opacity: 1, x: 0 }} exit={exit}>
                  <TransitionBeat
                    persona={persona}
                    fromGate={gates[transitionGate]}
                    toGate={gates[transitionGate + 1]}
                    onContinue={advance}
                  />
                </motion.div>
              )}

              {phase === "debrief" && (
                <motion.div key="debrief" initial={enter} animate={{ opacity: 1, x: 0 }} exit={exit}>
                  <Debrief
                    trip={trip}
                    persona={persona}
                    flightLog={flightLog}
                    onReplay={restart}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {view === "author" && phase === "gate" && (
            <StoryInspector
              gate={gates[gateIdx]}
              secret={secrets.gates.find((s) => s.id === gates[gateIdx].id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
