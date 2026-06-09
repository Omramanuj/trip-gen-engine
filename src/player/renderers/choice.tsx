"use client";

import { cn } from "@/ui/cn";
import { normalizeChoiceOptions, type ChoiceOption } from "@/player/normalize";

// choice_buttons (single / multiple). Ported from cp-platform ChoiceRenderer.

export function ChoiceRenderer({
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
  const options = normalizeChoiceOptions(body.options);
  const mode = body.selection_mode === "multiple" ? "multiple" : "single";
  const selectedSingle =
    typeof (value as { id?: string } | null)?.id === "string" ? (value as ChoiceOption) : null;
  const selectedMulti = Array.isArray((value as { selections?: ChoiceOption[] } | null)?.selections)
    ? (value as { selections: ChoiceOption[] }).selections
    : [];

  function pick(opt: ChoiceOption) {
    if (mode === "single") {
      onChange({ id: opt.id, label: opt.label, value: opt.value ?? opt.id });
    } else {
      const exists = selectedMulti.some((s) => s.id === opt.id);
      const next = exists
        ? selectedMulti.filter((s) => s.id !== opt.id)
        : [...selectedMulti, { id: opt.id, label: opt.label, value: opt.value ?? opt.id }];
      onChange({ selections: next });
    }
  }

  function isOn(opt: ChoiceOption): boolean {
    if (mode === "single") return selectedSingle?.id === opt.id;
    return selectedMulti.some((s) => s.id === opt.id);
  }

  return (
    <div>
      <p className="text-mono mb-2 text-ink-400">
        {mode === "multiple" ? "Multiple choice" : "Single choice"}
      </p>
      <h2 className="text-h2 mb-6 whitespace-pre-line">{prompt}</h2>
      {/* Departures v2 option cards: lettered key · coral selected state */}
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const on = isOn(opt);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt)}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center gap-4 rounded-md border-[1.5px] px-[18px] py-4 text-left transition-all",
                on
                  ? "border-coral-500 bg-coral-100"
                  : "border-cream-300 bg-cream-50 hover:translate-x-0.5 hover:border-ink-300"
              )}
            >
              <span
                className={cn(
                  "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] font-mono text-[15px] font-bold",
                  on ? "bg-coral-500 text-white" : "bg-cream-200 text-ink-600"
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className={cn(
                  "flex-1 text-[15.5px]",
                  on ? "font-medium text-ink-900" : "text-ink-700"
                )}
              >
                {opt.label}
              </span>
              <span
                className={cn(
                  mode === "multiple" ? "rounded-[7px]" : "rounded-full",
                  "h-[22px] w-[22px] shrink-0 border-2 transition-all",
                  on
                    ? "border-coral-500 bg-coral-500 shadow-[inset_0_0_0_4px_var(--color-coral-100)]"
                    : "border-cream-400"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
