"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/ui/cn";

// file_upload (E1 screen recording). De-API'd for the preview: no backend upload,
// we keep a local object URL so the author can confirm the pick + a Preview link.

interface LocalFile {
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
}

export function FileUploadRenderer({
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
  const accepted = Array.isArray(body.accepted_file_types)
    ? (body.accepted_file_types as string[])
    : null;
  const acceptAttr = accepted?.join(",") ?? undefined;
  const maxDuration =
    typeof body.max_duration_seconds === "number" ? body.max_duration_seconds : null;
  const captureMode = typeof body.capture_mode === "string" ? body.capture_mode : null;
  const current =
    value && typeof value === "object" && !Array.isArray(value) ? (value as LocalFile) : null;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      onChange({ url, file_name: file.name, mime_type: file.type, size: file.size } satisfies LocalFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not read file");
    }
  }

  const isVideo = (current?.mime_type ?? "").startsWith("video");
  const kind = isVideo ? "VID" : (current?.file_name.split(".").pop() ?? "FILE").slice(0, 4).toUpperCase();

  return (
    <div>
      {(captureMode || maxDuration) && (
        <p className="text-mono mb-2 text-ink-400">
          {captureMode ? `${captureMode} · ` : ""}
          {maxDuration ? `up to ${Math.round(maxDuration / 60)} min` : "upload"}
        </p>
      )}
      <h2 className="text-h2 mb-5 whitespace-pre-line">{prompt}</h2>

      {/* Departures v2 dropzone — sky-coded (information / candidate data) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group block w-full rounded-lg border-2 border-dashed border-cream-400 bg-cream-100 px-6 py-10 text-center transition-all hover:border-sky-500 hover:bg-sky-100"
      >
        <span className="mx-auto mb-4 grid h-[62px] w-[62px] place-items-center rounded-xl bg-sky-100 text-sky-700">
          <UploadCloud className="h-6 w-6" />
        </span>
        <span className="block text-h3">Drag your file here</span>
        <span className="text-small block">or click to browse your machine</span>
        {accepted && (
          <span className="text-mono mt-3 block text-ink-400">{accepted.join(" · ")}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept={acceptAttr} onChange={onPick} className="hidden" />
      <p className="text-mono mt-3 text-ink-400">
        Preview: pick any local file to stand in for the real capture.
      </p>

      {error && <p className="text-mono mt-3 text-coral-600">{error}</p>}

      {current?.url && (
        // file card — pdf = coral chip, video = sky chip
        <div className="mt-4 flex items-center gap-4 rounded-md border border-cream-300 bg-cream-50 px-[18px] py-4 shadow-xs">
          <span
            className={cn(
              "grid h-14 w-12 shrink-0 place-items-center rounded-[9px] font-mono text-[10px] font-semibold text-white",
              isVideo
                ? "bg-gradient-to-b from-sky-600 to-sky-700"
                : "bg-gradient-to-b from-coral-500 to-coral-700"
            )}
          >
            {kind}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink-900">{current.file_name}</p>
            <p className="text-mono mt-0.5 text-ink-400">
              {(current.size / 1_048_576).toFixed(1)} MB · ready
            </p>
          </div>
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="text-mono text-teal-700 underline"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-ink-300 transition-colors hover:text-coral-600"
            aria-label="Remove file"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
