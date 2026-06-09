"use client";

import { Button } from "@/ui/Button";
import { ChevronRight } from "lucide-react";
import { Panel, FounderAvatar, TypedText, MonoLabel } from "./console-ui";
import { StampPress } from "./stamp-press";
import type { Gate, FounderPersona, GateMethod } from "@/story-engine/types";

const NODE_LABEL: Record<GateMethod, string> = {
  restate_probe: "Restate",
  pick_defend: "Pick",
  find_target: "Locate",
  assignment: "Build",
  curveball: "Curveball",
};

// Between gates: stamp the cleared leg, then the founder's in-fiction one-liner that
// broadcasts the handoff into the next gate. Replaces a neutral "Next".
export function TransitionBeat({
  persona,
  fromGate,
  toGate,
  onContinue,
}: {
  persona: FounderPersona;
  fromGate: Gate;
  toGate?: Gate;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <StampPress label={`${NODE_LABEL[fromGate.method] ?? fromGate.id} cleared`} className="mb-7" />

      <Panel className="mb-7 flex max-w-lg items-start gap-3 p-4 text-left">
        <FounderAvatar persona={persona} size={34} tint="coral" />
        <div>
          <MonoLabel className="mb-1 block">{persona.name.toLowerCase()}</MonoLabel>
          <p className="text-[14px] leading-relaxed text-console-50">
            <TypedText text={fromGate.narrative_handoff ?? "On to the next."} speed={14} />
          </p>
        </div>
      </Panel>

      <Button onClick={onContinue} variant="primary" data-testid="transition-continue">
        {toGate ? `Go to ${NODE_LABEL[toGate.method] ?? toGate.id}` : "Continue"}{" "}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
