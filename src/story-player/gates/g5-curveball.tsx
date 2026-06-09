"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/ui/cn";
import { Panel, MonoLabel, FounderAvatar } from "../console-ui";
import { useStory } from "@/story-engine/store";
import type { GateProps } from "./gate-props";

interface Opt { id: string; value?: string; label: string }

const STAMP_LINE: Record<string, string> = {
  ship_flag: "Scoped the curveball behind a flag and named the risk — under the clock.",
  block: "Held the release under the clock and gave a clear reason.",
  patch_todo: "Took a quick patch and queued a real test — a defensible punt.",
};

export function G5Curveball({ gate, onComplete, persona }: GateProps) {
  const reduce = useReducedMotion();
  const setChoice = useStory((s) => s.setChoice);
  const blocks = gate.candidate_facing_content.blocks;
  const dm = blocks.find((b) => b.interaction_type === "display")?.body_json as Record<string, unknown> | undefined;
  const choice = blocks.find((b) => b.interaction_type === "choice_buttons")?.body_json as Record<string, unknown> | undefined;
  const whyBlock = blocks.find((b) => b.interaction_type === "long_text")?.body_json as Record<string, unknown> | undefined;

  const total = Number(dm?.time_box_seconds ?? gate.time_cap_seconds ?? 120);
  const options = (choice?.options as Opt[]) ?? [];

  const [left, setLeft] = useState(total);
  const [picked, setPicked] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const pickedRef = useRef<string | null>(null);
  const whyRef = useRef("");
  const submittedRef = useRef(false);
  pickedRef.current = picked;
  whyRef.current = why;

  function submit(reason: "manual" | "timeout") {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const id = pickedRef.current;
    setChoice(gate.id, { judgment: id, why: whyRef.current, decided_before_timeout: reason === "manual" });
    onComplete(
      id
        ? STAMP_LINE[id] ?? "Made a judgment call under the clock."
        : "Ran out the clock without a decision."
    );
  }

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frac = left / total;
  const tone = frac > 0.5 ? "teal" : frac > 0.25 ? "amber" : "coral";
  const stroke = tone === "teal" ? "#3F8682" : tone === "amber" ? "#E89547" : "#E66E5C";
  const R = 30;
  const C = 2 * Math.PI * R;
  const mm = Math.floor(left / 60);
  const ss = (left % 60).toString().padStart(2, "0");

  return (
    <div className="py-4">
      <header className="mb-4">
        <MonoLabel className="mb-1 block">gate 05 · the curveball</MonoLabel>
        <h1 className="text-h1 text-console-50">{gate.title}</h1>
      </header>

      {/* frosted DM card with the remaining-time ring */}
      <Panel
        className="mb-5 border-coral-500/30 p-5"
        style={{ background: "rgba(15,29,39,0.7)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-start gap-4">
          <FounderAvatar persona={persona} size={40} tint="coral" />
          <div className="min-w-0 flex-1">
            <MonoLabel className="mb-1 block">{persona.name.toLowerCase()} · now</MonoLabel>
            <p className="text-[15px] leading-relaxed text-console-50">{String(dm?.prompt ?? "")}</p>
            {dm?.reassure ? (
              <p className="mt-2 text-[12px] text-teal-300">{String(dm.reassure)}</p>
            ) : null}
          </div>

          {/* countdown ring */}
          <div className="relative shrink-0" data-testid="g5-timer" data-seconds={left}>
            <svg width="76" height="76" viewBox="0 0 76 76" className={cn(!reduce && frac <= 0.25 && "animate-pulse")}>
              <circle cx="38" cy="38" r={R} fill="none" stroke="#294049" strokeWidth="5" />
              <circle
                cx="38"
                cy="38"
                r={R}
                fill="none"
                stroke={stroke}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - frac)}
                transform="rotate(-90 38 38)"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-mono text-[13px] text-console-50">
              {mm}:{ss}
            </span>
          </div>
        </div>
      </Panel>

      {/* judgment options — a decision, not a build */}
      <p className="mb-2.5 text-[13px] font-medium text-console-50">{String(choice?.prompt ?? "What do you tell them?")}</p>
      <div className="mb-4 grid gap-2.5">
        {options.map((o) => {
          const active = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setPicked(o.id)}
              data-testid={`g5-option-${o.id}`}
              data-active={active}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[13px] transition-all",
                active
                  ? "border-coral-500/70 bg-coral-500/10 text-console-50"
                  : "border-console-800 bg-console-900/70 text-console-100 hover:border-console-600"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  active ? "border-coral-400 bg-coral-500/30 text-coral-200" : "border-console-700 text-transparent"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              {o.label}
            </button>
          );
        })}
      </div>

      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        placeholder={String(whyBlock?.prompt ?? "in one line — why?")}
        data-testid="g5-why"
        className="mb-4 w-full rounded-xl border border-console-700 bg-console-950 px-3.5 py-2.5 text-[13px] text-console-50 outline-none placeholder:text-console-600 focus:border-coral-500/60"
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-console-300">completion not expected — the call is the point</span>
        <Button onClick={() => submit("manual")} disabled={!picked} variant="primary" data-testid="g5-submit">
          Send to {persona.name} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
