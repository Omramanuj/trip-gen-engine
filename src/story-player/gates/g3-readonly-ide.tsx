"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { FileCode, Lock, BotOff, Crosshair, ChevronRight } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/ui/cn";
import { MonoLabel } from "../console-ui";
import { CodeMirror, type CMUpdate } from "../lib/editor";
import { useStory } from "@/story-engine/store";
import type { GateProps } from "./gate-props";
import type { SliceFile } from "@/story-engine/types";

interface Marked { file: string; from: number; to: number }

export function G3ReadonlyIde({ gate, secret, flaws, slice, onComplete }: GateProps) {
  const setTelemetry = useStory((s) => s.setTelemetry);
  const blocks = gate.candidate_facing_content.blocks;
  const brief = blocks.find((b) => b.interaction_type === "display")?.body_json as Record<string, unknown> | undefined;
  const codeBlock = blocks.find((b) => b.interaction_type === "code_surface")?.body_json as Record<string, unknown> | undefined;

  const files = (codeBlock?.files as SliceFile[]) ?? slice.files ?? [];
  const aiOff = String(codeBlock?.ai_off_note ?? "AI is off for this gate.");
  const instruction = String(codeBlock?.instruction ?? "Mark the one block that's actually broken.");

  const targetBlock = secret?.hidden_state?.target_block as { file?: string; lines?: string } | undefined;
  const targetFile = targetBlock?.file ?? flaws[0]?.file;

  const [active, setActive] = useState(0);
  const [sel, setSel] = useState<{ from: number; to: number } | null>(null);
  const selRef = useRef<{ from: number; to: number } | null>(null);
  const [marked, setMarked] = useState<Marked | null>(null);
  const opened = useRef(new Set<string>([files[0]?.path]));
  const startedAt = useRef(Date.now());

  const activeFile = files[active];

  const exts = useMemo(() => [javascript({ typescript: true })], []);

  // Stable handler + no-op guard: CodeMirror fires onUpdate on many view updates, and a
  // fresh handler identity each render makes it reconfigure → loop. useCallback + the
  // change guard keep it to one setState per real selection change.
  const onUpdate = useCallback((vu: CMUpdate) => {
    const main = vu.state.selection.main;
    const next = main.empty
      ? null
      : { from: vu.state.doc.lineAt(main.from).number, to: vu.state.doc.lineAt(main.to).number };
    const prev = selRef.current;
    if (prev?.from === next?.from && prev?.to === next?.to) return;
    selRef.current = next;
    setSel(next);
  }, []);

  function markSuspect() {
    if (!sel || !activeFile) return;
    setMarked({ file: activeFile.path, from: sel.from, to: sel.to });
  }

  function confirm() {
    const hit = marked?.file === targetFile;
    setTelemetry("g3", {
      filesOpened: [...opened.current],
      timeToMarkMs: Date.now() - startedAt.current,
      marked,
      correctFile: hit,
    });
    onComplete(
      hit
        ? "Navigated past the symptom to the real cross-file cause — the lying cast in the adapter."
        : marked
          ? `Marked a suspect block in ${marked.file}.`
          : "Reviewed the slice."
    );
  }

  return (
    <div className="py-4">
      <header className="mb-4">
        <MonoLabel className="mb-1 block">gate 03 · find the target block</MonoLabel>
        <h1 className="text-h1 text-console-50">{gate.title}</h1>
      </header>

      {brief && (
        <div className="mb-4">
          <p className="mb-3 max-w-2xl text-[14px] leading-relaxed text-console-100">{String(brief.prompt ?? "")}</p>
          {Array.isArray(brief.blocks) && (
            <div className="flex flex-col gap-1.5">
              {(brief.blocks as unknown[]).map((b, i) => (
                <code key={i} className="rounded-lg bg-console-950 px-3 py-2 font-mono text-[12px] text-teal-300">
                  {String(b)}
                </code>
              ))}
            </div>
          )}
        </div>
      )}

      {/* read-only / AI-off banner */}
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-console-700 bg-console-900 px-2.5 py-1 font-mono uppercase tracking-[0.1em] text-console-300">
          <Lock className="h-3 w-3" /> read-only
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-coral-500/40 bg-coral-500/10 px-2.5 py-1 font-mono uppercase tracking-[0.1em] text-coral-300">
          <BotOff className="h-3 w-3" /> {aiOff}
        </span>
      </div>

      {/* the IDE */}
      <div className="overflow-hidden rounded-2xl border border-console-800 bg-console-950">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-console-800 bg-console-900 px-2 py-1.5">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => {
                setActive(i);
                opened.current.add(f.path);
                setSel(null);
              }}
              data-testid={`g3-tab-${f.path}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[12px] transition-colors",
                i === active ? "bg-console-850 text-console-50" : "text-console-300 hover:text-console-100"
              )}
            >
              <FileCode className="h-3.5 w-3.5" /> {f.path}
            </button>
          ))}
        </div>

        <div data-testid="g3-editor">
          <CodeMirror
            key={activeFile?.path}
            value={activeFile?.content ?? ""}
            theme={vscodeDark}
            extensions={exts}
            readOnly
            height="46vh"
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
            onUpdate={onUpdate}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-console-800 bg-console-900 px-3 py-2">
          <span className="font-mono text-[11px] text-console-300" data-testid="g3-selection">
            {sel ? `lines ${sel.from}–${sel.to} selected` : "select the suspect lines…"}
          </span>
          <Button onClick={markSuspect} disabled={!sel} variant="secondary" size="sm" data-testid="g3-mark">
            <Crosshair className="h-3.5 w-3.5" /> Mark suspect block
          </Button>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-console-300">{instruction}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-console-300" data-testid="g3-marked">
          {marked ? `marked: ${marked.file} lines ${marked.from}–${marked.to}` : "nothing marked yet"}
        </span>
        <Button onClick={confirm} disabled={!marked} variant="primary" data-testid="g3-confirm">
          That&apos;s the cause <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
