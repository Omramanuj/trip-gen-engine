"use client";

import { create } from "zustand";

// Cross-gate, never-reset memory for one story run. The founder persona, the logged
// choices, the surfaced facts and the earned stamps all read from here, so continuity
// is real (G4 references the G2 pick; G5 is framed against it; the debrief replays it).

export interface FlightLogEntry {
  gateId: string;
  line: string; // names a concrete MOVE the candidate made — never a score
}

interface StoryState {
  surfacedFacts: number[]; // hidden-fact ranks the candidate probed out in G1
  stamps: string[]; // gate ids cleared, in order
  flightLog: FlightLogEntry[];
  choices: Record<string, unknown>; // gateId -> captured response
  telemetry: Record<string, unknown>; // e.g. G3 navigation path / time-to-mark

  surfaceFact: (rank: number) => void;
  earnStamp: (gateId: string, line: string) => void;
  setChoice: (gateId: string, value: unknown) => void;
  setTelemetry: (key: string, value: unknown) => void;
  reset: () => void;
}

export const useStory = create<StoryState>((set) => ({
  surfacedFacts: [],
  stamps: [],
  flightLog: [],
  choices: {},
  telemetry: {},

  surfaceFact: (rank) =>
    set((s) => (s.surfacedFacts.includes(rank) ? s : { surfacedFacts: [...s.surfacedFacts, rank] })),

  earnStamp: (gateId, line) =>
    set((s) =>
      s.stamps.includes(gateId)
        ? s
        : { stamps: [...s.stamps, gateId], flightLog: [...s.flightLog, { gateId, line }] }
    ),

  setChoice: (gateId, value) => set((s) => ({ choices: { ...s.choices, [gateId]: value } })),

  setTelemetry: (key, value) => set((s) => ({ telemetry: { ...s.telemetry, [key]: value } })),

  reset: () => set({ surfacedFacts: [], stamps: [], flightLog: [], choices: {}, telemetry: {} }),
}));
