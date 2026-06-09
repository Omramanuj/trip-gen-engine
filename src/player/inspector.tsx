"use client";

import type { CardSecret } from "@/engine/types";

// Author-only panel: exposes the hidden judge block + per-sub-card answer keys for
// the current card. Mounted only in Author view; never rendered in Candidate view.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-mono-accent mb-1.5">{title}</h4>
      <div className="text-[13px] leading-relaxed text-ink-700 space-y-2">{children}</div>
    </div>
  );
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-cream-100 border border-cream-200 px-3 py-2 text-[11.5px] leading-relaxed text-ink-700 whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Exemplars({ ex }: { ex: Record<string, unknown> }) {
  const bands: { key: string; label: string; tone: string }[] = [
    { key: "below", label: "Below (the AI floor)", tone: "border-coral-200 bg-coral-50" },
    { key: "meets", label: "Meets", tone: "border-amber-300 bg-amber-100" },
    { key: "above", label: "Above", tone: "border-forest-200 bg-forest-50" },
  ];
  return (
    <div className="space-y-2">
      {bands.map((b) =>
        asString(ex[b.key]) ? (
          <div key={b.key} className={`rounded-md border px-3 py-2 ${b.tone}`}>
            <p className="text-mono mb-1 text-ink-600">{b.label}</p>
            <p className="text-[13px] text-ink-800">{ex[b.key] as string}</p>
          </div>
        ) : null
      )}
    </div>
  );
}

export function Inspector({ secret }: { secret: CardSecret }) {
  const judge = (secret.judge ?? {}) as Record<string, unknown>;
  const knownJudgeKeys = new Set([
    "ai_floor",
    "distinguishing_observable",
    "rubric_exemplars",
    "key",
    "four_tuple",
  ]);

  return (
    <aside className="w-full lg:w-[360px] lg:shrink-0 rounded-lg border border-burgundy-200 bg-paper p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-mono-accent">Author inspector</span>
        <span className="text-mono text-ink-400">
          {secret.method_id} · {secret.grading_mode}
        </span>
      </div>

      {secret.routing?.fit_reason && (
        <Section title="Why this method (routing)">
          <p>{secret.routing.fit_reason}</p>
        </Section>
      )}
      {secret.routing?.ai_floor_hook && (
        <Section title="AI floor hook">
          <p>{secret.routing.ai_floor_hook}</p>
        </Section>
      )}
      {secret.source_policy && (
        <Section title="Source policy">
          <p>{secret.source_policy}</p>
        </Section>
      )}

      {asString(judge.ai_floor) && (
        <Section title="AI floor (= Below)">
          <p>{judge.ai_floor as string}</p>
        </Section>
      )}
      {asString(judge.distinguishing_observable) && (
        <Section title="Distinguishing observable">
          <p>{judge.distinguishing_observable as string}</p>
        </Section>
      )}

      {/* mode-specific */}
      {secret.grading_mode === "Banded" && judge.rubric_exemplars ? (
        <Section title="Rubric exemplars">
          <Exemplars ex={judge.rubric_exemplars as Record<string, unknown>} />
        </Section>
      ) : null}

      {secret.grading_mode === "Keyed" && judge.key ? (
        <Section title="Answer key">
          <Json value={judge.key} />
        </Section>
      ) : null}

      {secret.grading_mode === "Trap" && judge.four_tuple ? (
        <Section title="Trap four-tuple">
          <Json value={judge.four_tuple} />
        </Section>
      ) : null}

      {/* any remaining judge fields (stronger_option, tradeoff_axis, harness_checks, …) */}
      {Object.entries(judge)
        .filter(([k]) => !knownJudgeKeys.has(k))
        .map(([k, v]) => (
          <Section key={k} title={k.replace(/_/g, " ")}>
            {asString(v) ? <p>{v as string}</p> : <Json value={v} />}
          </Section>
        ))}

      {/* per-sub-card answer keys */}
      {secret.subCards.some((s) => Object.keys(s.fields).length > 0) && (
        <Section title="Sub-card secrets">
          <div className="space-y-3">
            {secret.subCards.map((s, i) =>
              Object.keys(s.fields).length > 0 ? (
                <div key={i} className="rounded-md border border-ink-100 bg-cream-50 p-2.5">
                  <p className="text-mono mb-1.5 text-ink-500">{s.title}</p>
                  {Object.entries(s.fields).map(([k, v]) => (
                    <div key={k} className="mb-1.5">
                      <span className="text-mono-accent">{k.replace(/^_/, "").replace(/_/g, " ")}</span>
                      {asString(v) ? (
                        <p className="text-[13px] text-ink-800">{v as string}</p>
                      ) : (
                        <Json value={v} />
                      )}
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </Section>
      )}
    </aside>
  );
}
