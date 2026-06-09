"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, Clock, Eye, EyeOff, Compass } from "lucide-react";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { cn } from "@/ui/cn";
import { methodName, leverLabel, classTone } from "@/engine/meta";
import type { Trip, CardSecret, CardEntry, SubCard } from "@/engine/types";
import { SubCardRenderer } from "./sub-card-renderer";
import { ReflectionRenderer } from "./renderers/reflection";
import { Inspector } from "./inspector";

type View = "candidate" | "author";

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function briefingOf(card: CardEntry): string {
  // First display/briefing sub-card → grounding context for voice/code cards.
  const brief = card.sub_cards.find(
    (s) => s.interaction_type === "display" || s.sub_card_type === "briefing"
  );
  if (!brief) return card.card.instruction ?? "";
  const b = brief.body_json as Record<string, unknown>;
  const parts = [card.card.instruction, b.prompt, b.subtitle].filter(
    (x): x is string => typeof x === "string"
  );
  if (Array.isArray(b.blocks)) parts.push(...(b.blocks as unknown[]).map(String));
  return parts.join("\n");
}

export function TripPlayer({ trip, secrets }: { trip: Trip; secrets: CardSecret[] }) {
  const cards = trip.cards ?? [];
  const [started, setStarted] = useState(false);
  const [view, setView] = useState<View>("author");
  const [cardIdx, setCardIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  const card = cards[cardIdx];
  const sub: SubCard | undefined = card?.sub_cards[subIdx];
  const briefingText = useMemo(() => (card ? briefingOf(card) : ""), [card]);

  // ── per-card countdown (display only, non-blocking) ──
  const cap = card?.card.time_cap_seconds ?? 0;
  const [timeLeft, setTimeLeft] = useState(cap);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setTimeLeft(card?.card.time_cap_seconds ?? 0);
    if (tick.current) clearInterval(tick.current);
    if (!started || completed || reflecting) return;
    tick.current = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [cardIdx, started, completed, reflecting, card]);

  function setResponse(v: unknown) {
    setResponses((r) => ({ ...r, [`${cardIdx}:${subIdx}`]: v }));
  }

  function next() {
    if (!card) return;
    if (subIdx < card.sub_cards.length - 1) setSubIdx(subIdx + 1);
    else if (cardIdx < cards.length - 1) {
      setCardIdx(cardIdx + 1);
      setSubIdx(0);
    } else setReflecting(true);
  }
  function back() {
    if (subIdx > 0) setSubIdx(subIdx - 1);
    else if (cardIdx > 0) {
      const prev = cardIdx - 1;
      setCardIdx(prev);
      setSubIdx(cards[prev].sub_cards.length - 1);
    }
  }
  const isFirst = cardIdx === 0 && subIdx === 0;
  const isLast = cardIdx === cards.length - 1 && subIdx === (card?.sub_cards.length ?? 1) - 1;

  // ── header bar (shared) ──
  const Header = (
    <header className="flex items-center justify-between gap-4 mb-8">
      <Link
        href="/"
        className="text-mono text-ink-400 hover:text-forest-700 transition-colors"
      >
        ← trips
      </Link>
      <button
        type="button"
        onClick={() => setView(view === "author" ? "candidate" : "author")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all",
          view === "author"
            ? "border-burgundy-200 bg-burgundy-100 text-burgundy-700"
            : "border-ink-100 bg-paper text-ink-500 hover:border-forest-300"
        )}
      >
        {view === "author" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {view === "author" ? "Author view" : "Candidate view"}
      </button>
    </header>
  );

  // ── intro ──
  if (!started) {
    const p = trip.trip_plan ?? {};
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        {Header}
        <p className="text-mono-accent mb-3">Trip preview</p>
        <h1 className="text-display-xl mb-3">{p.domain ?? "Generated trip"}</h1>
        {p.role && <p className="text-lede mb-8">{p.role}</p>}

        <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Band" value={p.target_band ?? "—"} />
          <Stat label="Rung" value={p.default_rung ?? "—"} />
          <Stat label="Cards" value={String(cards.length)} />
          <Stat
            label="Total time"
            value={p.total_time_cap_seconds ? `~${Math.round(p.total_time_cap_seconds / 60)} min` : "—"}
          />
        </dl>

        {cards.length > 0 && (
          <div className="mb-9">
            <p className="text-mono text-ink-400 mb-3">What you&apos;ll work through</p>
            <ol className="flex flex-col gap-2">
              {cards.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-cream-300 bg-paper px-4 py-3 shadow-sm"
                >
                  <span className="text-mono text-ink-300 w-4 shrink-0">{i + 1}</span>
                  <Badge tone={classTone(c.card.skill_class)}>{c.card.skill_class}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-ink-800 truncate">{c.card.title}</p>
                    <p className="text-mono text-ink-400">
                      {methodName(c.card.method_id)} · {leverLabel(c.card.lever_id)}
                    </p>
                  </div>
                  {c.card.time_cap_seconds ? (
                    <span className="text-mono text-ink-400 shrink-0">
                      ~{Math.round(c.card.time_cap_seconds / 60)}m
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        )}

        <Button onClick={() => setStarted(true)} size="lg">
          Start trip <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ── reflection (end-of-trip self-assessment) ──
  if (reflecting) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        {Header}
        <p className="text-mono-accent mb-3">Last step · in your words</p>
        <h1 className="text-display mb-2">Your highlight reel</h1>
        <p className="text-lede mb-8">
          The grading looks at the work itself — this is your chance to point us at your best of it.
        </p>

        <div className="rounded-xl border border-ink-100 bg-paper p-6 shadow-sm">
          <ReflectionRenderer
            value={responses["reflection"]}
            onChange={(v) => setResponses((r) => ({ ...r, reflection: v }))}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setReflecting(false);
              setCardIdx(cards.length - 1);
              setSubIdx(Math.max(0, (cards[cards.length - 1]?.sub_cards.length ?? 1) - 1));
            }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            onClick={() => {
              setReflecting(false);
              setCompleted(true);
            }}
          >
            Finish trip <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── completed ──
  if (completed) {
    const p = trip.trip_plan ?? {};
    const classes = [...new Set(cards.map((c) => c.card.skill_class))];
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        {Header}
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-teal-600 text-cream-50 inline-flex items-center justify-center mb-5 shadow-teal animate-card-in">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-display mb-2">Trip complete</h1>
          <Badge tone="teal" className="mb-4">Verified · {cards.length} stamps</Badge>
          <p className="text-small mb-6">You walked all {cards.length} cards.</p>

          <dl className="mb-8 grid grid-cols-3 gap-3 max-w-md w-full">
            <Stat label="Cards" value={String(cards.length)} />
            <Stat label="Classes" value={String(classes.length)} />
            <Stat
              label="Total time"
              value={
                p.total_time_cap_seconds ? `~${Math.round(p.total_time_cap_seconds / 60)} min` : "—"
              }
            />
          </dl>

          {view === "author" && (() => {
            const refl = (responses["reflection"] ?? {}) as {
              proud_text?: string;
              highlight_video?: { url?: string } | null;
            };
            if (!refl.proud_text && !refl.highlight_video) return null;
            return (
              <div className="mb-8 w-full max-w-md rounded-xl border border-burgundy-200 bg-burgundy-50 p-5 text-left">
                <p className="text-mono text-burgundy-700 mb-2">Author · candidate reflection</p>
                {refl.proud_text && (
                  <p className="text-small whitespace-pre-line text-ink-700">{refl.proud_text}</p>
                )}
                {refl.highlight_video?.url && (
                  <video src={refl.highlight_video.url} controls className="mt-3 w-full rounded-md bg-black" />
                )}
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setCompleted(false);
                setReflecting(false);
                setCardIdx(0);
                setSubIdx(0);
              }}
            >
              Replay from start
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Back to trips</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!card || !sub) return null;
  const meta = card.card;
  const isWide = sub.interaction_type === "code_surface" || sub.interaction_type === "code_editor";
  const secret = secrets[cardIdx];

  return (
    <div className={cn("mx-auto px-6 py-8", isWide ? "max-w-[1600px]" : "max-w-6xl")}>
      {Header}

      {/* segmented progress — one segment per card, current card fills by step */}
      <div className="mb-5 flex gap-1.5" aria-hidden="true">
        {cards.map((c, i) => {
          const subs = c.sub_cards.length || 1;
          const fill = i < cardIdx ? 1 : i === cardIdx ? (subIdx + 1) / subs : 0;
          // Departures v2: legs you've cleared = teal (proof); the leg you're on = coral.
          return (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-base",
                  i === cardIdx ? "bg-coral-500" : "bg-teal-500"
                )}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* card meta + step counter + timer */}
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge tone={classTone(meta.skill_class)}>{meta.skill_class}</Badge>
          <span className="text-small font-medium text-ink-700">{methodName(meta.method_id)}</span>
          <span className="text-mono text-ink-400">
            {leverLabel(meta.lever_id)} · {meta.grading_mode}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-mono text-ink-400">
            Card {cardIdx + 1}/{cards.length}
          </span>
          {card.sub_cards.length > 1 && (
            <span className="flex items-center gap-1">
              {card.sub_cards.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === subIdx ? "bg-coral-500" : i < subIdx ? "bg-teal-500" : "bg-cream-300"
                  )}
                />
              ))}
            </span>
          )}
          {cap > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-mono",
                timeLeft <= 60 && timeLeft > 0 ? "text-coral-600" : "text-ink-400"
              )}
            >
              <Clock className="w-3.5 h-3.5" /> {mmss(timeLeft)}
            </span>
          )}
        </div>
      </div>

      <div className={cn("flex gap-6", isWide ? "flex-col" : "flex-col lg:flex-row lg:items-start")}>
        <main className="flex-1 min-w-0">
          {/* card title + instruction (once, on the first sub-card) */}
          {subIdx === 0 && (
            <div className="mb-6">
              <h1 className="text-h1 mb-3">{meta.title}</h1>
              {meta.instruction && (
                // Departures v2 guide line — chat-first grounding, teal voice.
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-cream-50 shadow-teal">
                    <Compass className="h-4 w-4" />
                  </span>
                  <p className="rounded-[6px_18px_18px_18px] border border-teal-100 bg-teal-50 px-4 py-3 text-body text-ink-700 whitespace-pre-line">
                    {meta.instruction}
                  </p>
                </div>
              )}
            </div>
          )}

          <div
            key={`${cardIdx}:${subIdx}`}
            className={cn(
              "animate-card-in",
              !isWide && "rounded-xl border border-ink-100 bg-paper p-6 shadow-sm"
            )}
          >
            <SubCardRenderer
              sub={sub}
              value={responses[`${cardIdx}:${subIdx}`]}
              onChange={setResponse}
              briefingText={briefingText}
            />
          </div>

          {/* nav */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" onClick={back} disabled={isFirst}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={next}>
              {isLast ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </main>

        {view === "author" && secret && <Inspector key={cardIdx} secret={secret} />}
      </div>
    </div>
  );
}

// Sky-coded stat tile — the candidate's own data (never an action). Departures DS.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cream-300 bg-cream-50 px-4 py-3 shadow-sm">
      <dt className="text-mono text-ink-400 mb-1">{label}</dt>
      <dd className="text-h3 text-sky-700">{value}</dd>
    </div>
  );
}
