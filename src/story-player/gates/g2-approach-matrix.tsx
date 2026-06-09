"use client";

import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/ui/cn";
import { Panel, MonoLabel, FounderAvatar, TypedText } from "../console-ui";
import { useStory } from "@/story-engine/store";
import type { GateProps } from "./gate-props";

interface Opt {
  id: string;
  value?: string;
  label: string;
  criteria?: Record<string, string>;
}

export function G2ApproachMatrix({ gate, secret, persona, onComplete }: GateProps) {
  const setChoice = useStory((s) => s.setChoice);
  const blocks = gate.candidate_facing_content.blocks;
  const brief = blocks.find((b) => b.interaction_type === "display")?.body_json as Record<string, unknown> | undefined;
  const choice = blocks.find((b) => b.interaction_type === "choice_buttons")?.body_json as Record<string, unknown> | undefined;
  const defend = blocks.find((b) => b.interaction_type === "long_text")?.body_json as Record<string, unknown> | undefined;

  const options = (choice?.options as Opt[]) ?? [];
  const rows = (choice?.matrix_rows as string[]) ?? [];
  const fields = (defend?.fields as Record<string, { prefix?: string; placeholder?: string }>) ?? {};
  const pushback = (secret?.hidden_state?.founder_pushback as string) ?? "why not the simpler one?";

  const [picked, setPicked] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);
  const [why, setWhy] = useState("");
  const [switchIf, setSwitchIf] = useState("");

  function submit() {
    setChoice(gate.id, { pick: picked, why_this: why, switch_if: switchIf });
    const named = switchIf.trim().length > 0;
    onComplete(
      named
        ? "Committed to an approach and named a concrete switch condition."
        : "Committed to an approach and defended the pick."
    );
  }

  return (
    <div className="py-4">
      <header className="mb-5">
        <MonoLabel className="mb-1 block">gate 02 · pick &amp; defend</MonoLabel>
        <h1 className="text-h1 text-console-50">{gate.title}</h1>
      </header>

      {brief && (
        <p className="mb-5 max-w-2xl text-[14px] leading-relaxed text-console-100">{String(brief.prompt ?? "")}</p>
      )}

      <p className="mb-3 text-[13px] font-medium text-console-50">{String(choice?.prompt ?? "Which would you ship?")}</p>

      {/* approach cards over shared criteria — no highlighted winner */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {options.map((o) => {
          const active = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              disabled={committed}
              onClick={() => setPicked(o.id)}
              data-testid={`approach-${o.id}`}
              data-active={active}
              className={cn(
                "flex flex-col rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-coral-500/70 bg-coral-500/10 shadow-[0_0_0_1px_rgba(238,137,124,0.4)]"
                  : "border-console-800 bg-console-900/70 hover:border-console-600",
                committed && !active && "opacity-40"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-console-300">
                  Option {o.id.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border",
                    active ? "border-coral-400 bg-coral-500/30 text-coral-200" : "border-console-700 text-transparent"
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
              </div>
              <p className="mb-3 text-[13px] leading-snug text-console-50">{o.label}</p>
              {rows.length > 0 && o.criteria && (
                <dl className="mt-auto space-y-1 border-t border-console-800 pt-2.5">
                  {rows.map((r) => (
                    <div key={r} className="flex items-center justify-between gap-2">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-console-600">
                        {r.replace(/_/g, " ")}
                      </dt>
                      <dd className="font-mono text-[11px] text-console-100">{o.criteria?.[r] ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </button>
          );
        })}
      </div>

      {!committed ? (
        <Button onClick={() => setCommitted(true)} disabled={!picked} variant="primary" data-testid="g2-commit">
          Commit to this <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <div className="space-y-4" data-testid="g2-defend">
          {/* founder pushes back once */}
          <Panel className="flex items-start gap-3 p-4">
            <FounderAvatar persona={persona} size={32} tint="coral" />
            <div>
              <MonoLabel className="mb-1 block">{persona.name.toLowerCase()}</MonoLabel>
              <p className="text-[13px] text-console-50">
                <TypedText text={pushback} speed={14} />
              </p>
            </div>
          </Panel>

          <div>
            <label className="mb-1.5 block text-[12px] text-console-300">Why this one, under the constraints?</label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder={fields.why_this?.placeholder ?? "Because…"}
              data-testid="g2-why"
              rows={3}
              className="w-full resize-y rounded-xl border border-console-700 bg-console-950 px-3.5 py-2.5 text-[13px] text-console-50 outline-none placeholder:text-console-600 focus:border-coral-500/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-console-300">
              {fields.switch_if?.prefix ?? "I'd switch to"} …
            </label>
            <input
              value={switchIf}
              onChange={(e) => setSwitchIf(e.target.value)}
              placeholder={fields.switch_if?.placeholder ?? "…if a quick prod migration were risky"}
              data-testid="g2-switch"
              className="w-full rounded-xl border border-console-700 bg-console-950 px-3.5 py-2.5 text-[13px] text-console-50 outline-none placeholder:text-console-600 focus:border-coral-500/60"
            />
          </div>

          <Button onClick={submit} disabled={why.trim().length < 3} variant="primary" data-testid="g2-submit">
            Lock it in <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
