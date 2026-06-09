"use client";

// long_text / short_text input. Ported from cp-platform TextRenderer.

export function TextRenderer({
  prompt,
  body,
  long,
  value,
  onChange,
}: {
  prompt: string;
  body: Record<string, unknown>;
  long: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const placeholder = typeof body.placeholder === "string" ? body.placeholder : "Type your answer";
  const maxWords = typeof body.max_words === "number" ? body.max_words : null;
  const minWords = typeof body.min_words === "number" ? body.min_words : null;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <h2 className="text-h2 mb-3 whitespace-pre-line">{prompt}</h2>
      {long ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] bg-paper border border-ink-100 rounded-md p-4 text-sm leading-relaxed text-ink-900 caret-coral-600 resize-y outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100 transition-all"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-paper border border-ink-100 rounded-md px-4 py-3 text-sm text-ink-900 caret-coral-600 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100 transition-all"
        />
      )}
      {(maxWords || minWords) && (
        <p className="text-mono mt-2 text-ink-400">
          {words} words{minWords ? ` · min ${minWords}` : ""}{maxWords ? ` · max ${maxWords}` : ""}
        </p>
      )}
    </div>
  );
}
