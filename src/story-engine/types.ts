// story.v1 — the single-story trip contract. Mirrors output/story-*.json.
// Kept loose where the engine still evolves; the player renders what it's handed.

export type AmbientTint = "sky" | "coral" | "teal";
export type GateMethod =
  | "restate_probe"
  | "pick_defend"
  | "find_target"
  | "assignment"
  | "curveball";

export type InteractionType =
  | "display"
  | "voice_exchange"
  | "choice_buttons"
  | "ordered_steps"
  | "code_surface"
  | "long_text"
  | "file_upload";

export interface Block {
  interaction_type: InteractionType;
  body_json: Record<string, unknown>;
}

export interface SliceFile {
  path: string;
  language: string;
  content: string;
}

export interface InjectedFlaw {
  id: string;
  file: string;
  line_hint: string;
  kind: string;
  the_tell: string;
  why_cross_file: string;
}

export interface HiddenFact {
  rank: number;
  fact: string;
  why_it_changes_the_approach: string;
  surfacing_questions: string[];
}

export interface FounderPersona {
  name: string;
  company: string;
  role: string;
  voice_note: string;
  avatar_seed: string;
}

export interface Ticket {
  id: string;
  title: string;
  body_vague: string;
  reporter_is_founder?: boolean;
}

export interface CodebaseSlice {
  files: SliceFile[];
  entry_points?: string[];
  _injected_flaws?: InjectedFlaw[];
}

export interface SharedPayload {
  ticket: Ticket;
  codebase_slice: CodebaseSlice;
  hidden_facts?: HiddenFact[];
}

export interface RubricExemplars {
  below: string;
  meets: string;
  above: string;
}

export interface ScoringRubric {
  grading_mode: "Banded" | "Trap" | "Keyed";
  distinguishing_observable: string;
  rubric_exemplars: RubricExemplars;
  [k: string]: unknown;
}

export interface Gate {
  id: string;
  method: GateMethod;
  title: string;
  time_cap_seconds: number;
  ambient_tint: AmbientTint;
  candidate_facing_content: { blocks: Block[] };
  hidden_state?: Record<string, unknown>;
  scoring_rubric?: ScoringRubric;
  ai_floor?: string;
  unlocks: string | null;
  narrative_handoff?: string;
}

export interface TripMeta {
  domain: string;
  role: string;
  target_band: string;
  target_rung: string;
  stack: string;
  total_time_cap_seconds: number;
  open_time_gate: string;
}

export interface StoryTrip {
  schema_version: "story.v1";
  story_premise: string;
  trip_meta: TripMeta;
  founder_persona: FounderPersona;
  shared_payload: SharedPayload;
  gates: Gate[];
  skill_nodes_covered?: { node: string; gates: string[] }[];
}

// ── author / secret view-model (split out of the candidate copy) ──────────────
export interface GateSecret {
  id: string;
  method: GateMethod;
  hidden_state?: Record<string, unknown>;
  scoring_rubric?: ScoringRubric;
  ai_floor?: string;
}

export interface StorySecrets {
  injected_flaws: InjectedFlaw[];
  hidden_facts: HiddenFact[];
  gates: GateSecret[]; // index-aligned with candidate.gates
}
