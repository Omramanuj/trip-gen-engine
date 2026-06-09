"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { FileCode, Play, Check, X, ChevronRight, FlaskConical } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/ui/cn";
import { MonoLabel, Panel } from "../console-ui";
import { CodeMirror } from "../lib/editor";
import { runTests, type TestResult } from "../lib/runner";
import { useStory } from "@/story-engine/store";
import type { GateProps } from "./gate-props";
import type { SliceFile } from "@/story-engine/types";

export function G4Sandbox({ gate, secret, slice, onComplete }: GateProps) {
  const setChoice = useStory((s) => s.setChoice);
  const blocks = gate.candidate_facing_content.blocks;
  const brief = blocks.find((b) => b.interaction_type === "display")?.body_json as Record<string, unknown> | undefined;
  const sandbox = blocks.find((b) => b.interaction_type === "code_surface")?.body_json as Record<string, unknown> | undefined;
  const reflect = blocks.find((b) => b.interaction_type === "long_text")?.body_json as Record<string, unknown> | undefined;

  const sliceFiles = (sandbox?.files as SliceFile[]) ?? slice.files ?? [];
  const visibleTestNames = (sandbox?.tests_visible_names as string[]) ?? [];

  // hidden test file (never shown in the editor) injected from secrets at run time
  const testFileName = String(secret?.hidden_state?.test_file_name ?? "checkout.test.ts");
  const testFileContent = String(secret?.hidden_state?.test_file_content ?? "");

  const initial = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of sliceFiles) m[f.path] = f.content;
    return m;
  }, [sliceFiles]);

  const [files, setFiles] = useState<Record<string, string>>(initial);
  const [active, setActive] = useState(sliceFiles[0]?.path ?? "");
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [reflection, setReflection] = useState("");

  const filesRef = useRef(files);
  filesRef.current = files;

  const exts = useMemo(() => [javascript({ typescript: true })], []);

  function execute() {
    if (!testFileContent) return;
    setRunning(true);
    setResults([]);
    const all = runTests(filesRef.current, { name: testFileName, content: testFileContent });
    // stream results in for the "tests going green" feel
    all.forEach((r, i) => {
      setTimeout(() => {
        setResults((prev) => [...prev, r]);
        if (i === all.length - 1) {
          setRunning(false);
          setRan(true);
        }
      }, 180 * (i + 1));
    });
    if (all.length === 0) {
      setRunning(false);
      setRan(true);
    }
  }

  const runRef = useRef(execute);
  runRef.current = execute;

  // dev/e2e test seam — drive the editor + runner deterministically without typing into CodeMirror
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    w.__storyG4 = {
      setFile: (p: string, c: string) => setFiles((prev) => ({ ...prev, [p]: c })),
      run: () => runRef.current(),
    };
    return () => {
      delete w.__storyG4;
    };
  }, []);

  const passed = results.filter((r) => r.status === "pass").length;
  const total = visibleTestNames.length || results.length;
  const allGreen = ran && results.length > 0 && results.every((r) => r.status === "pass");

  function submit() {
    setChoice(gate.id, { passed, total, allGreen, reflection, files });
    onComplete(
      allGreen
        ? "Fixed the null once at the adapter seam — all checks green."
        : `Shipped a fix with ${passed}/${total} checks green.`
    );
  }

  // merge the streamed results onto the known test names so the panel shows the full list
  const rows = (visibleTestNames.length ? visibleTestNames : results.map((r) => r.name)).map((name) => {
    const r = results.find((x) => x.name === name);
    return { name, status: r?.status, message: r?.message };
  });

  return (
    <div className="py-4">
      <header className="mb-4">
        <MonoLabel className="mb-1 block">gate 04 · the assignment · open-time</MonoLabel>
        <h1 className="text-h1 text-console-50">{gate.title}</h1>
      </header>

      {brief && (
        <Panel className="mb-4 p-4">
          <p className="mb-2 text-[14px] text-console-100">{String(brief.prompt ?? "")}</p>
          {Array.isArray(brief.blocks) && (
            <ul className="mb-2 list-inside list-disc space-y-1 text-[13px] text-console-300">
              {(brief.blocks as unknown[]).map((b, i) => (
                <li key={i}>{String(b)}</li>
              ))}
            </ul>
          )}
          {brief.highlight ? (
            <p className="rounded-lg bg-teal-500/10 px-3 py-2 text-[12px] text-teal-300">{String(brief.highlight)}</p>
          ) : null}
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* editor */}
        <div className="overflow-hidden rounded-2xl border border-console-800 bg-console-950">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-console-800 bg-console-900 px-2 py-1.5">
            {sliceFiles.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setActive(f.path)}
                data-testid={`g4-tab-${f.path}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[12px] transition-colors",
                  f.path === active ? "bg-console-850 text-console-50" : "text-console-300 hover:text-console-100"
                )}
              >
                <FileCode className="h-3.5 w-3.5" /> {f.path}
              </button>
            ))}
          </div>
          <div data-testid="g4-editor">
            <CodeMirror
              key={active}
              value={files[active] ?? ""}
              theme={vscodeDark}
              extensions={exts}
              height="44vh"
              basicSetup={{ lineNumbers: true, foldGutter: false }}
              onChange={(v: string) => setFiles((prev) => ({ ...prev, [active]: v }))}
            />
          </div>
        </div>

        {/* test runner */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-console-800 bg-console-900">
          <div className="flex items-center justify-between border-b border-console-800 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-console-300">
              <FlaskConical className="h-3.5 w-3.5" /> tests
            </span>
            <span
              className={cn(
                "font-mono text-[11px]",
                allGreen ? "text-teal-300" : ran ? "text-coral-300" : "text-console-300"
              )}
              data-testid="g4-summary"
            >
              {ran ? `${passed}/${total} passing` : `${total} tests`}
            </span>
          </div>

          <ul className="flex-1 space-y-1.5 overflow-y-auto p-3" data-testid="g4-results">
            {rows.map((r, i) => (
              <li
                key={r.name}
                data-testid={`g4-test-${i}`}
                data-status={r.status ?? "idle"}
                className="rounded-lg border border-console-800 bg-console-950 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {r.status === "pass" ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                  ) : r.status === "fail" ? (
                    <X className="h-3.5 w-3.5 shrink-0 text-coral-400" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-console-600" />
                  )}
                  <span
                    className={cn(
                      "text-[12px]",
                      r.status === "pass" ? "text-console-100" : r.status === "fail" ? "text-coral-200" : "text-console-300"
                    )}
                  >
                    {r.name}
                  </span>
                </div>
                {r.status === "fail" && r.message && (
                  <p className="mt-1 pl-5 font-mono text-[10px] leading-relaxed text-coral-300/80">{r.message}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="border-t border-console-800 p-3">
            <Button onClick={execute} disabled={running} variant="teal" size="sm" className="w-full" data-testid="g4-run">
              <Play className="h-3.5 w-3.5" /> {running ? "running…" : "Run tests"}
            </Button>
          </div>
        </div>
      </div>

      {/* reflection + submit */}
      {reflect && (
        <div className="mt-4">
          <label className="mb-1.5 block text-[12px] text-console-300">{String(reflect.prompt ?? "")}</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={2}
            data-testid="g4-reflection"
            className="w-full resize-y rounded-xl border border-console-700 bg-console-950 px-3.5 py-2.5 text-[13px] text-console-50 outline-none placeholder:text-console-600 focus:border-teal-500/50"
            placeholder="Where did you verify the pieces agree?"
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-console-300">
          {allGreen ? "all green — nice" : ran ? "keep going — some checks are red" : "edit, then run the tests"}
        </span>
        <Button onClick={submit} disabled={!ran} variant="primary" data-testid="g4-submit">
          Ship it <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
