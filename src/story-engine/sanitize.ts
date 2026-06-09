import type { StoryTrip, StorySecrets, GateSecret, InjectedFlaw, HiddenFact } from "./types";

// Split a raw story.v1 trip into a candidate-safe copy (ground truth removed) and a
// secrets bundle (kept client-side for the author inspector + the gates that legitimately
// need it to score locally: G1 fact-unlock, G3 target check, G4 hidden test execution).
//
// Mirrors the legacy engine/sanitize.ts splitTrip() contract.

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : (JSON.parse(JSON.stringify(v)) as T);
}

export interface SplitStory {
  candidate: StoryTrip;
  secrets: StorySecrets;
}

export function splitStory(raw: StoryTrip): SplitStory {
  const candidate = clone(raw);

  // ── capture secrets ──
  const injected_flaws: InjectedFlaw[] = clone(
    raw.shared_payload?.codebase_slice?._injected_flaws ?? []
  );
  const hidden_facts: HiddenFact[] = clone(raw.shared_payload?.hidden_facts ?? []);
  const gates: GateSecret[] = (raw.gates ?? []).map((g) => ({
    id: g.id,
    method: g.method,
    hidden_state: clone(g.hidden_state),
    scoring_rubric: clone(g.scoring_rubric),
    ai_floor: g.ai_floor,
  }));

  // ── strip ground truth from the candidate copy ──
  if (candidate.shared_payload?.codebase_slice) {
    delete candidate.shared_payload.codebase_slice._injected_flaws;
  }
  if (candidate.shared_payload) {
    delete candidate.shared_payload.hidden_facts;
  }
  for (const g of candidate.gates ?? []) {
    delete g.hidden_state;
    delete g.scoring_rubric;
    delete g.ai_floor;
  }

  return { candidate, secrets: { injected_flaws, hidden_facts, gates } };
}
