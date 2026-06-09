"use client";

import { useRef, useState } from "react";
import { Download, Github, UploadCloud, X, FileArchive } from "lucide-react";
import { cn } from "@/ui/cn";

// repo_task (Execution / demo): the candidate GETS a realistic starter repo
// (downloadable zip and/or a GitHub repo link), works in their own tool, then
// SUBMITS a single .zip. De-API'd for the preview — submission is a local object
// URL (no backend upload), same value shape as file_upload so graders see it.

interface SubmittedZip {
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
}

export function RepoTaskRenderer({
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
  const starter = (body.starter_repo ?? {}) as Record<string, unknown>;
  const zipUrl = typeof starter.zip_url === "string" ? starter.zip_url : null;
  const githubUrl = typeof starter.github_url === "string" ? starter.github_url : null;
  const repoName =
    typeof starter.name === "string" ? starter.name : zipUrl?.split("/").pop() ?? "starter repo";

  const current =
    value && typeof value === "object" && !Array.isArray(value) ? (value as SubmittedZip) : null;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!/\.zip$/i.test(file.name)) {
      setError("Submit a .zip of your work.");
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      onChange({ url, file_name: file.name, mime_type: file.type || "application/zip", size: file.size } satisfies SubmittedZip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not read file");
    }
  }

  return (
    <div>
      <h2 className="text-h2 mb-5 whitespace-pre-line">{prompt}</h2>

      {/* Get the starter */}
      {(zipUrl || githubUrl) && (
        <div className="mb-6 rounded-lg border border-cream-300 bg-cream-50 p-4">
          <p className="text-mono text-ink-400 mb-3">Get the starter — {repoName}</p>
          <div className="flex flex-wrap gap-3">
            {zipUrl && (
              <a
                href={zipUrl}
                download
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-cream-50 shadow-sm transition-colors hover:bg-teal-700"
              >
                <Download className="h-4 w-4" /> Download .zip
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-paper px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-forest-300"
              >
                <Github className="h-4 w-4" /> Open on GitHub
              </a>
            )}
          </div>
        </div>
      )}

      {/* Submit your work */}
      <p className="text-mono text-ink-400 mb-2">Submit your work (.zip)</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group block w-full rounded-lg border-2 border-dashed border-cream-400 bg-cream-100 px-6 py-10 text-center transition-all hover:border-sky-500 hover:bg-sky-100"
      >
        <span className="mx-auto mb-4 grid h-[62px] w-[62px] place-items-center rounded-xl bg-sky-100 text-sky-700">
          <UploadCloud className="h-6 w-6" />
        </span>
        <span className="block text-h3">Drop your .zip here</span>
        <span className="text-small block">or click to browse your machine</span>
      </button>
      <input ref={inputRef} type="file" accept=".zip,application/zip" onChange={onPick} className="hidden" />

      {error && <p className="text-mono mt-3 text-coral-600">{error}</p>}

      {current?.url && (
        <div className="mt-4 flex items-center gap-4 rounded-md border border-cream-300 bg-cream-50 px-[18px] py-4 shadow-xs">
          <span className="grid h-14 w-12 shrink-0 place-items-center rounded-[9px] bg-gradient-to-b from-sky-600 to-sky-700 text-white">
            <FileArchive className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink-900">{current.file_name}</p>
            <p className="text-mono mt-0.5 text-ink-400">
              {(current.size / 1_048_576).toFixed(1)} MB · submitted
            </p>
          </div>
          <a href={current.url} target="_blank" rel="noreferrer" className="text-mono text-teal-700 underline">
            Preview
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn("text-ink-300 transition-colors hover:text-coral-600")}
            aria-label="Remove submission"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
