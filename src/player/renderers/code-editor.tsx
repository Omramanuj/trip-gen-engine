"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import "./cloud-code-editor.css"; // vendored — package's "./styles" export is broken in 1.0.2
import type { FileMap } from "cloud-code-editor";

// code_editor (Cognition / live_ide): a real multi-file Monaco IDE via the
// `cloud-code-editor` package, in-memory storage (no backend). read_only for C3
// debug surfaces; editable variants emit the edited FileMap and can export a zip.
// Loaded ssr:false — Monaco can't server-render.

const EditorLayout = dynamic(
  () => import("cloud-code-editor").then((m) => m.EditorLayout),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-ink-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  }
);

interface SeedFile {
  path: string;
  language?: string;
  content: string;
}

function toFileMap(files: SeedFile[]): FileMap {
  const map: FileMap = {};
  for (const f of files) {
    if (f && typeof f.content === "string") {
      map[f.path] = { content: f.content, language: f.language };
    }
  }
  return map;
}

export function CodeEditorRenderer({
  prompt,
  body,
  onChange,
}: {
  prompt: string;
  body: Record<string, unknown>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const files: SeedFile[] = Array.isArray(body.files) ? (body.files as SeedFile[]) : [];
  const readOnly = body.mode === "read_only";
  const fileMap = useMemo(() => toFileMap(files), [files]);
  const latest = useRef<FileMap>(fileMap);
  const [zipping, setZipping] = useState(false);

  const config = useMemo(
    () => ({
      storage: { type: "memory" as const },
      layout: {
        showFileTree: true,
        showTabBar: true,
        showTerminal: false,
        resizable: true,
      },
      theme: { mode: "dark" as const, editorTheme: "vs-dark" },
      editor: { readOnly, minimap: false, fontSize: 13, wordWrap: "on" as const },
      fileTree: {
        allowCreate: !readOnly,
        allowDelete: !readOnly,
        allowRename: !readOnly,
      },
      autoSave: { enabled: !readOnly, debounceMs: 600, saveOnBlur: true, saveOnClose: true },
      initialState: {
        projectId: "assessment",
        files: fileMap,
        activeFile: files[0]?.path,
      },
      callbacks: {
        onSave: (f: FileMap) => {
          latest.current = f;
          if (!readOnly) onChange({ kind: "code_editor_files", files: f });
        },
      },
    }),
    [fileMap, readOnly, files, onChange]
  );

  async function downloadZip() {
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const [path, file] of Object.entries(latest.current)) {
        zip.file(path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-work.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div>
      {prompt && <h2 className="text-h2 mb-4 whitespace-pre-line">{prompt}</h2>}

      <div className="h-[70vh] min-h-[480px] overflow-hidden rounded-xl border border-ink-200 bg-[#1e1e1e] shadow-md">
        <EditorLayout config={config} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-mono text-ink-400">
          {readOnly ? "Read-only — inspect the code, then answer below." : "Edit freely. Autosaves as you go."}
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={downloadZip}
            disabled={zipping}
            className="inline-flex items-center gap-1.5 text-mono text-teal-700 underline disabled:opacity-50"
          >
            {zipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download my work (.zip)
          </button>
        )}
      </div>
    </div>
  );
}
