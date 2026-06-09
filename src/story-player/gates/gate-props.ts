import type {
  Gate,
  GateSecret,
  HiddenFact,
  InjectedFlaw,
  FounderPersona,
  Ticket,
  CodebaseSlice,
} from "@/story-engine/types";

// Every gate component conforms to this. The shell owns the spine; a gate owns its own
// internal steps and calls onComplete(stampLine) exactly once when the candidate clears it.
// stampLine names the concrete MOVE the candidate made (informational feedback, never a score).
export interface GateProps {
  gate: Gate;
  secret?: GateSecret; // hidden_state / scoring_rubric / ai_floor (for local scoring + author view)
  facts: HiddenFact[]; // global hidden facts (G1 unlock matching)
  flaws: InjectedFlaw[]; // global injected flaws (G3 target / G4 fix)
  persona: FounderPersona;
  ticket: Ticket;
  slice: CodebaseSlice; // candidate copy of the shared slice (no _injected_flaws)
  onComplete: (stampLine: string) => void;
}
