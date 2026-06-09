// Shared, framework-agnostic label + tone maps for trip metadata.
// Pure data (no "use client", no server-only) so the home page (server),
// the intro/hero, and the card player can all render consistent, humanized
// labels instead of raw enum IDs (J1, live_ide, …).

export const METHOD_NAME: Record<string, string> = {
  J1: "Frame the problem",
  J4: "Options & defend",
  J6: "Priority stack",
  C3: "Debug from logs",
  E1: "Assignment",
};

export const LEVER_LABEL: Record<string, string> = {
  voice: "Voice",
  quiz: "Quiz",
  live_ide: "Live IDE",
  demo: "Demo",
};

export function methodName(id: string): string {
  return METHOD_NAME[id] ?? id;
}

export function leverLabel(id: string): string {
  return LEVER_LABEL[id] ?? id;
}

// Tone tokens map onto the Departures palette in globals.css. One accent per
// skill class keeps a trip legible at a glance (which muscle each card works):
// teal = judgement/proof, sky = cognition/data, coral = execution/action.
export type Tone = "teal" | "sky" | "coral" | "amber" | "ink";

export const CLASS_TONE: Record<string, Tone> = {
  Judgement: "teal",
  Cognition: "sky",
  Execution: "coral",
};

export function classTone(skillClass: string): Tone {
  return CLASS_TONE[skillClass] ?? "ink";
}
