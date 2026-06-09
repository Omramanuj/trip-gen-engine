"use client";

import { useState } from "react";

import { normalizeOrderedItems } from "@/player/normalize";

// ordered_steps as a GRADED reorder task (J6 priority stack). Items are {id,label}
// and response_expected is true. Reorder by dragging a row or via arrows (a11y
// fallback). Ported from cp-platform.

export function OrderedRenderer({
  prompt,
  body,
  value,
  onChange,
}: {
  prompt: string;
  body: Record<string, unknown>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const seedItems = normalizeOrderedItems(body.items ?? body.steps);
  const current = Array.isArray((value as { ordered_items?: unknown[] } | null)?.ordered_items)
    ? normalizeOrderedItems((value as { ordered_items: unknown[] }).ordered_items)
    : seedItems;

  // drag state: which row is being dragged, which row it's hovering over
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function commit(next: typeof current) {
    onChange({ ordered_ids: next.map((it) => it.id), ordered_items: next });
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    const next = current.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    commit(next);
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = current.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }

  function endDrag() {
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <div>
      <h2 className="text-h2 mb-3 whitespace-pre-line">{prompt}</h2>
      <p className="text-mono mb-4 text-ink-500">Drag a row to reorder, or use the arrows.</p>
      <ol className="flex flex-col gap-2">
        {current.map((item, idx) => (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => {
              setDragIdx(idx);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overIdx !== idx) setOverIdx(idx);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null) reorder(dragIdx, idx);
              endDrag();
            }}
            onDragEnd={endDrag}
            className={`flex items-center gap-3 px-4 py-3 rounded-md border bg-paper transition-colors ${
              dragIdx === idx
                ? "opacity-40 border-ink-100"
                : overIdx === idx
                  ? "border-forest-500 ring-1 ring-forest-500"
                  : "border-ink-100"
            }`}
          >
            <span
              className="text-ink-300 cursor-grab active:cursor-grabbing select-none leading-none"
              aria-hidden="true"
            >
              ⠿
            </span>
            <span className="font-mono text-mono text-ink-500 w-6">{idx + 1}.</span>
            <span className="flex-1 text-sm text-ink-900">{item.label}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="text-ink-400 hover:text-forest-700 disabled:opacity-30 text-xs"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === current.length - 1}
                className="text-ink-400 hover:text-forest-700 disabled:opacity-30 text-xs"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
