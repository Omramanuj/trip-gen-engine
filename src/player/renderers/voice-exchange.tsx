"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/ui/cn";

// voice_exchange (J1): turn-based typing with an LLM playing the stakeholder.
// User said voice = turn-based typing for now. Posts to /api/voice (OpenRouter,
// or a scripted fallback until OPENROUTER_API_KEY is set).

interface Msg {
  role: "candidate" | "founder";
  text: string;
}

export function VoiceExchangeRenderer({
  prompt,
  body,
  context,
  value,
  onChange,
}: {
  prompt: string;
  body: Record<string, unknown>;
  context: string; // the briefing text, sent to the persona for grounding
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const maxTurns = typeof body.max_turns === "number" ? body.max_turns : 4;
  const messages: Msg[] = Array.isArray((value as { messages?: Msg[] } | null)?.messages)
    ? (value as { messages: Msg[] }).messages
    : [];
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidateTurns = messages.filter((m) => m.role === "candidate").length;
  const atLimit = candidateTurns >= maxTurns;

  async function send() {
    const text = draft.trim();
    if (!text || loading || atLimit) return;
    const nextMessages: Msg[] = [...messages, { role: "candidate", text }];
    onChange({ messages: nextMessages });
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          prompt,
          briefing: context,
          maxTurns,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { reply: string; source?: string }
        | { error: string }
        | null;
      if (!res.ok || !json || "error" in json) {
        setError((json && "error" in json && json.error) || `request failed (${res.status})`);
        return;
      }
      onChange({ messages: [...nextMessages, { role: "founder", text: json.reply }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-h2 mb-1 whitespace-pre-line">{prompt}</h2>
      <p className="text-mono mb-4 text-ink-400">
        Turn-based · {candidateTurns}/{maxTurns} of your turns used
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {messages.length === 0 && (
          <p className="text-small text-ink-400 italic">
            Restate the problem and ask your first question to begin. The founder will only answer
            what you actually probe for.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
              m.role === "candidate"
                ? "self-end bg-forest-700 text-paper"
                : "self-start bg-paper border border-ink-100 text-ink-900"
            )}
          >
            {m.role === "founder" && (
              <span className="text-mono mb-1 block text-teal-700">Founder</span>
            )}
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="self-start inline-flex items-center gap-2 text-ink-400 text-small">
            <Loader2 className="w-3 h-3 animate-spin" /> Founder is thinking…
          </div>
        )}
      </div>

      {error && <p className="text-mono mb-3 text-coral-600">{error}</p>}

      {atLimit ? (
        <p className="text-small text-ink-500 rounded-md border border-ink-100 bg-cream-50 px-4 py-3">
          You&apos;ve used all {maxTurns} turns. This is where the conversation closes.
        </p>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            placeholder="Restate, then ask…  (⌘/Ctrl+Enter to send)"
            className="flex-1 min-h-[64px] bg-paper border border-ink-100 rounded-md p-3 text-sm text-ink-900 caret-coral-600 resize-y outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100 transition-all"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !draft.trim()}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-coral-500 text-white shadow-coral hover:bg-coral-600 hover:translate-x-0.5 disabled:opacity-40 disabled:shadow-none transition-all shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
