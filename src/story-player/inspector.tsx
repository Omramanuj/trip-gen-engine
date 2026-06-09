"use client";

import { MonoLabel } from "./console-ui";
import type { Gate, GateSecret } from "@/story-engine/types";

// Author-only side panel: the hidden rubric, AI floor, and ground truth behind the
// current gate. Mirrors the legacy inspector's job for the story track.
export function StoryInspector({ gate, secret }: { gate: Gate; secret?: GateSecret }) {
  const rubric = secret?.scoring_rubric;
  const exemplars = rubric?.rubric_exemplars;

  return (
    <aside className="hidden w-80 shrink-0 lg:block" data-testid="inspector">
      <div className="sticky top-28 space-y-4 rounded-2xl border border-coral-500/30 bg-console-900/80 p-4">
        <MonoLabel className="block text-coral-300">author · {gate.id}</MonoLabel>

        {secret?.ai_floor && (
          <Section title="AI floor">
            <p className="text-[12px] leading-relaxed text-console-100">{secret.ai_floor}</p>
          </Section>
        )}

        {rubric?.distinguishing_observable && (
          <Section title="Distinguishing observable">
            <p className="text-[12px] leading-relaxed text-console-100">
              {rubric.distinguishing_observable}
            </p>
          </Section>
        )}

        {exemplars && (
          <Section title="Bands">
            <Band tone="text-console-300" label="below" text={exemplars.below} />
            <Band tone="text-amber-300" label="meets" text={exemplars.meets} />
            <Band tone="text-teal-300" label="above" text={exemplars.above} />
          </Section>
        )}

        {secret?.hidden_state && (
          <Section title="Hidden state">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-console-950 p-3 font-mono text-[10px] leading-relaxed text-console-300">
              {JSON.stringify(secret.hidden_state, null, 2)}
            </pre>
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-console-800 pt-3 first:border-t-0 first:pt-0">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-console-300">{title}</p>
      {children}
    </div>
  );
}

function Band({ tone, label, text }: { tone: string; label: string; text: string }) {
  return (
    <p className="mb-1.5 text-[12px] leading-relaxed text-console-100">
      <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}>{label} · </span>
      {text}
    </p>
  );
}
