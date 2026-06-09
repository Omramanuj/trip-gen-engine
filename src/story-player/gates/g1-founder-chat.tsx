"use client";

import { useMemo, useRef, useState } from "react";
import { Send, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/ui/cn";
import { Panel, MonoLabel, FounderAvatar, TypedText } from "../console-ui";
import { useStory } from "@/story-engine/store";
import type { GateProps } from "./gate-props";

interface Msg { role: "candidate" | "founder"; text: string; typed?: boolean }

const STOPWORDS = new Set([
  "the","a","an","is","it","do","does","did","you","your","what","when","who","how","are","to","of",
  "and","or","on","in","for","with","that","this","they","them","only","some","any","i","we","be","at",
]);

function keywords(phrases: string[]): string[] {
  const out = new Set<string>();
  for (const p of phrases) {
    for (const w of p.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 3 && !STOPWORDS.has(w)) out.add(w);
    }
    out.add(p.toLowerCase());
  }
  return [...out];
}

const DEFLECTIONS = [
  "hm, not sure what you mean — what exactly do you want to know?",
  "i mean… it just doesn't work for some people? tell me what to check and i'll look.",
  "couldn't say off the top of my head — ask me something more specific.",
];

export function G1FounderChat({ gate, secret, facts, persona, onComplete }: GateProps) {
  const surfaceFact = useStory((s) => s.surfaceFact);
  const surfacedAll = useStory((s) => s.surfacedFacts);

  const blocks = gate.candidate_facing_content.blocks;
  const briefing = blocks.find((b) => b.interaction_type === "display")?.body_json as
    | Record<string, unknown>
    | undefined;
  const chat = blocks.find((b) => b.interaction_type === "voice_exchange")?.body_json as
    | Record<string, unknown>
    | undefined;

  const maxTurns = Number(chat?.max_turns ?? 5);
  const chips = (chat?.first_turn_chips as string[]) ?? [];

  // checklist (secret) maps a fact rank -> the probes that should surface it.
  const checklist = (secret?.hidden_state?.checklist as
    | { fact_rank: number; surfacing_questions: string[] }[]
    | undefined) ?? [];
  const factByRank = useMemo(() => new Map(facts.map((f) => [f.rank, f])), [facts]);
  const keyIndex = useMemo(
    () => checklist.map((c) => ({ rank: c.fact_rank, keys: keywords(c.surfacing_questions) })),
    [checklist]
  );

  const totalFacts = facts.length || checklist.length || 0;
  const surfacedHere = surfacedAll.filter((r) => factByRank.has(r));

  const [messages, setMessages] = useState<Msg[]>([
    { role: "founder", text: `hey! thanks for jumping on this. ask me whatever you need 🙂` },
  ]);
  const [input, setInput] = useState("");
  const turnsRef = useRef(0);
  const [, force] = useState(0);

  const turnsUsed = turnsRef.current;
  const exhausted = turnsUsed >= maxTurns;
  const deflectIdx = useRef(0);

  function reply(question: string): { text: string; revealedRank: number | null } {
    const t = question.toLowerCase();
    // find the highest-impact (lowest rank) unsurfaced fact this probe hits
    const hits = keyIndex
      .filter((k) => k.keys.some((kw) => t.includes(kw)))
      .map((k) => k.rank)
      .filter((r) => !surfacedAll.includes(r))
      .sort((a, b) => a - b);
    if (hits.length) {
      const rank = hits[0];
      const fact = factByRank.get(rank);
      return { text: fact ? fact.fact : "yeah, that's a thing.", revealedRank: rank };
    }
    const d = DEFLECTIONS[deflectIdx.current % DEFLECTIONS.length];
    deflectIdx.current += 1;
    return { text: d, revealedRank: null };
  }

  function send(text: string) {
    const q = text.trim();
    if (!q || exhausted) return;
    turnsRef.current += 1;
    const r = reply(q);
    setMessages((m) => [
      ...m,
      { role: "candidate", text: q },
      { role: "founder", text: r.text, typed: true },
    ]);
    if (r.revealedRank != null) surfaceFact(r.revealedRank);
    setInput("");
    force((n) => n + 1);
  }

  function finish() {
    const got = surfacedHere.length;
    const probedRoot = surfacedHere.includes(1);
    const line = probedRoot
      ? `Probed the deploy timing and isolated the failing variant — surfaced ${got}/${totalFacts} hidden facts.`
      : got > 0
        ? `Restated the ticket and surfaced ${got}/${totalFacts} hidden facts.`
        : `Restated the ticket; left the load-bearing facts unprobed.`;
    onComplete(line);
  }

  return (
    <div className="py-4">
      <header className="mb-5">
        <MonoLabel className="mb-1 block">gate 01 · restate &amp; probe</MonoLabel>
        <h1 className="text-h1 text-console-50">{gate.title}</h1>
      </header>

      {/* the ticket */}
      {briefing && (
        <Panel className="mb-5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral-400">
              {String(briefing.subtitle ?? "ticket")}
            </span>
          </div>
          <p className="mb-3 text-[14px] text-console-100">{String(briefing.prompt ?? "")}</p>
          {Array.isArray(briefing.blocks) &&
            (briefing.blocks as unknown[]).map((b, i) => (
              <blockquote
                key={i}
                className="rounded-xl border-l-2 border-coral-500/60 bg-console-950 px-4 py-3 font-mono text-[13px] leading-relaxed text-console-100"
              >
                {String(b)}
              </blockquote>
            ))}
        </Panel>
      )}

      {/* chat */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-console-800 px-4 py-2.5">
          <span className="inline-flex items-center gap-2 text-[12px] text-console-300">
            <MessageSquare className="h-3.5 w-3.5" /> {persona.name.toLowerCase()}
          </span>
          <span
            className="font-mono text-[11px] text-console-300"
            data-testid="yield-meter"
            title="facts surfaced — not a score"
          >
            context surfaced {surfacedHere.length}/{totalFacts}
          </span>
        </div>

        <div className="max-h-[42vh] space-y-3 overflow-y-auto p-4" data-testid="chat-log">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-2.5", m.role === "candidate" ? "flex-row-reverse" : "")}
              data-role={m.role}
            >
              {m.role === "founder" && <FounderAvatar persona={persona} size={28} tint="sky" />}
              <p
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                  m.role === "candidate"
                    ? "rounded-br-sm bg-coral-500/20 text-console-50"
                    : "rounded-bl-sm bg-console-850 text-console-100"
                )}
              >
                {m.role === "founder" && m.typed ? <TypedText text={m.text} speed={12} /> : m.text}
              </p>
            </div>
          ))}
        </div>

        {/* first-turn chips */}
        {turnsUsed === 0 && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-console-800 px-4 py-3">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => send(c)}
                className="rounded-full border border-console-700 bg-console-850 px-3 py-1.5 text-[12px] text-console-100 transition-colors hover:border-coral-500/60 hover:text-coral-300"
                data-testid="chip"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* input */}
        <form
          className="flex items-center gap-2 border-t border-console-800 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={exhausted}
            placeholder={exhausted ? "that's all the questions for now" : "ask Maya a question…"}
            data-testid="chat-input"
            className="flex-1 rounded-full border border-console-700 bg-console-950 px-4 py-2.5 text-[13px] text-console-50 outline-none placeholder:text-console-600 focus:border-coral-500/60 disabled:opacity-50"
          />
          <Button type="submit" size="icon" variant="primary" disabled={exhausted || !input.trim()} aria-label="send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Panel>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-console-300">
          {Math.max(0, maxTurns - turnsUsed)} questions left
        </span>
        <Button
          onClick={finish}
          variant={surfacedHere.length > 0 ? "primary" : "secondary"}
          disabled={turnsUsed === 0}
          data-testid="g1-done"
        >
          I&apos;ve got what I need <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
