"use client";

import { useState } from "react";
import { cn } from "@/ui/cn";

// E1 "what to build" sub-card: ordered_steps with response_expected:false.
// `steps` is a string[] (the standard build brief). `variant_chunk_match` carries
// an alternate brief + 4 code pieces. This is a READ-ONLY spec, not a graded reorder.
// (seeded_conflict is stripped from candidate view; the inspector shows it.)

interface ChunkVariant {
  prompt?: string;
  pieces?: string[];
}

export function WalkthroughRenderer({
  prompt,
  body,
}: {
  prompt: string;
  body: Record<string, unknown>;
}) {
  const steps = Array.isArray(body.steps) ? (body.steps as unknown[]).map(String) : [];
  const variant =
    body.variant_chunk_match && typeof body.variant_chunk_match === "object"
      ? (body.variant_chunk_match as ChunkVariant)
      : null;
  const [mode, setMode] = useState<"standard" | "chunk">("standard");
  const hasChunk = !!variant && Array.isArray(variant.pieces) && variant.pieces.length > 0;

  return (
    <div>
      {prompt && <h2 className="text-h2 mb-3 whitespace-pre-line">{prompt}</h2>}

      {hasChunk && (
        <div className="inline-flex rounded-full border border-ink-100 bg-paper p-1 mb-4">
          {(["standard", "chunk"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm transition-all",
                mode === m ? "bg-forest-700 text-paper" : "text-ink-600 hover:text-forest-700"
              )}
            >
              {m === "standard" ? "Standard build" : "Chunk-match"}
            </button>
          ))}
        </div>
      )}

      {mode === "standard" && (
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <li
              key={i}
              className="rounded-md border border-ink-100 bg-cream-50 px-4 py-3 text-sm text-ink-900 whitespace-pre-line"
            >
              {step}
            </li>
          ))}
        </ol>
      )}

      {mode === "chunk" && variant && (
        <div className="flex flex-col gap-3">
          {variant.prompt && (
            <p className="text-body text-ink-700 whitespace-pre-line">{variant.prompt}</p>
          )}
          {(variant.pieces ?? []).map((piece, i) => (
            <pre
              key={i}
              className="overflow-x-auto rounded-md border border-ink-200 bg-ink-900 px-4 py-3 text-xs leading-relaxed text-ink-50 font-mono"
            >
              <code>{piece}</code>
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
