// TypeScript contract for a generated trip-gen-engine artifact.
// Mirrors output/trip-*.json. Kept loose (lots of optional fields) because the
// engine evolves and the preview should render whatever it is handed.

export type Lever = "voice" | "quiz" | "live_ide" | "demo";
export type GradingMode = "Banded" | "Keyed" | "Trap";

export type InteractionType =
  | "display"
  | "voice_exchange"
  | "choice_buttons"
  | "ordered_steps"
  | "code_surface"
  | "code_editor"
  | "repo_task"
  | "long_text"
  | "short_text"
  | "file_upload";

export interface SubCard {
  sequence_index: number;
  sub_card_type: string; // briefing | task | reflection | transition
  interaction_type: InteractionType;
  title?: string | null;
  response_expected: boolean;
  body_json: Record<string, unknown>;
}

export interface CardMeta {
  method_id: string; // J1 | J4 | C3 | J6 | E1 | ...
  skill_class: string; // Judgement | Cognition | Execution
  lever_id: Lever;
  grading_mode: GradingMode;
  review?: string;
  title: string;
  instruction?: string;
  time_cap_seconds?: number;
  required?: boolean;
  skill_ref?: Record<string, unknown>;
}

export interface Routing {
  fit_reason?: string;
  ai_floor_hook?: string;
}

export interface CardEntry {
  sequence_index: number;
  routing?: Routing;
  source_policy?: string;
  card: CardMeta;
  sub_cards: SubCard[];
  // judge is stripped from the candidate view; present only in the raw artifact.
  judge?: Record<string, unknown>;
}

export interface TripPlan {
  domain?: string;
  role?: string;
  target_band?: string;
  default_rung?: string;
  total_time_cap_seconds?: number;
  classes_covered?: string[];
  card_sequence?: string[];
  stamina_note?: string;
  coverage_gaps?: string;
  generated_from?: string;
}

export interface Trip {
  trip_plan: TripPlan;
  cards: CardEntry[];
}

// ── Author inspector view-model (per card) ──────────────────────────────────
export interface SubCardSecret {
  title: string;
  interaction_type: InteractionType;
  // any of: hidden_omissions, correct_answer, correct_order, supporting_text,
  // expected_signal, seeded_conflict — whichever this sub-card carries.
  fields: Record<string, unknown>;
}

export interface CardSecret {
  method_id: string;
  grading_mode: GradingMode;
  routing?: Routing;
  source_policy?: string;
  judge?: Record<string, unknown>;
  subCards: SubCardSecret[];
}
