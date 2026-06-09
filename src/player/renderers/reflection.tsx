"use client";

import { TextRenderer } from "./text";
import { VideoReflection } from "./video-reflection";

// End-of-trip subjective self-assessment. Text ("what are you most proud of")
// plus an optional small highlight video (the Mux/demo seam). Composite value:
// { proud_text: string, highlight_video: {url,...} | null }.

export interface ReflectionValue {
  proud_text?: string;
  highlight_video?: unknown;
}

export function ReflectionRenderer({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const v = (value && typeof value === "object" ? value : {}) as ReflectionValue;
  const setText = (proud_text: string) => onChange({ ...v, proud_text });
  const setVideo = (highlight_video: unknown) => onChange({ ...v, highlight_video });

  return (
    <div className="flex flex-col gap-7">
      <TextRenderer
        prompt={"What are you most proud of in this assessment?\nWhat was your best work — and why?"}
        body={{ placeholder: "The decision, fix, or trade-off you'd point to first…", min_words: 20 }}
        long
        value={typeof v.proud_text === "string" ? v.proud_text : ""}
        onChange={setText}
      />

      <div>
        <h3 className="text-h3 mb-1">Walk us through it (optional)</h3>
        <p className="text-small mb-3 text-ink-500">
          Record a short video highlighting your best moment — talking through it often shows more
          than text alone.
        </p>
        <VideoReflection maxDurationSeconds={90} value={v.highlight_video} onChange={setVideo} />
      </div>
    </div>
  );
}
