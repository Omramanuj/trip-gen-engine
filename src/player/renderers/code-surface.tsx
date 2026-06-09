"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { FileCode2, Folder, Search, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/ui/cn";

// code_surface (C3 Live IDE): read-only, multi-file, AI-absent. VS Code-style
// surface — traffic-light chrome, file-tree sidebar, tabs, syntax highlighting,
// branded status bar. Expand button blows it up to full-viewport (Esc closes).
// Global (cross-file) search: ⌘⇧F greps every file, click a hit to jump+highlight.
// Browser ⌘F still covers in-file find.

interface CodeFile {
  path: string;
  language?: string;
  content: string;
}

interface Hit {
  lineNo: number;
  text: string;
}
interface FileResult {
  fileIndex: number;
  path: string;
  hits: Hit[];
}

function langFor(file: CodeFile): Language {
  const ext = file.path.split(".").pop()?.toLowerCase();
  if (ext === "tsx" || ext === "jsx") return "tsx";
  if (ext === "ts") return "typescript";
  if (ext === "sql") return "sql" as Language;
  if (ext === "js") return "javascript";
  if (ext === "json") return "json";
  if (ext === "css") return "css";
  return (file.language as Language) ?? "tsx";
}

function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}
function baseOf(path: string): string {
  return path.split("/").pop() ?? path;
}

// split a line around case-insensitive matches of q for the results list
function highlightMatch(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-amber-400/40 text-amber-100 rounded-sm">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function CodeSurfaceRenderer({ body }: { body: Record<string, unknown> }) {
  const files: CodeFile[] = Array.isArray(body.files)
    ? (body.files as CodeFile[]).filter((f) => f && typeof f.content === "string")
    : [];
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const targetLineRef = useRef<HTMLDivElement | null>(null);

  // lock body scroll while expanded
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  // keyboard: ⌘⇧F / Ctrl⇧F toggles global search; Esc closes search then fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else if (expanded) setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, expanded]);

  // focus the search box when the panel opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // scroll the jumped-to line into view
  useEffect(() => {
    if (activeLine != null) targetLineRef.current?.scrollIntoView({ block: "center" });
  }, [active, activeLine]);

  // group files by directory for the sidebar tree
  const groups = useMemo(() => {
    const m = new Map<string, { file: CodeFile; index: number }[]>();
    files.forEach((file, index) => {
      const d = dirOf(file.path);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push({ file, index });
    });
    return Array.from(m.entries());
  }, [files]);

  // cross-file search results
  const results = useMemo<FileResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: FileResult[] = [];
    files.forEach((f, fileIndex) => {
      const lines = f.content.replace(/\n$/, "").split("\n");
      const hits: Hit[] = [];
      lines.forEach((text, li) => {
        if (text.toLowerCase().includes(q)) hits.push({ lineNo: li + 1, text });
      });
      if (hits.length) out.push({ fileIndex, path: f.path, hits });
    });
    return out;
  }, [files, query]);
  const totalHits = results.reduce((n, r) => n + r.hits.length, 0);

  if (files.length === 0) {
    return <p className="text-small text-ink-500">No files provided for this surface.</p>;
  }

  // switch file via explorer/tab — drop any stale jump highlight (line nums are per-file)
  function selectFile(i: number) {
    setActive(i);
    setActiveLine(null);
  }
  // jump to a specific hit (keeps the search panel open, VS Code-style)
  function jumpTo(fileIndex: number, lineNo: number) {
    setActive(fileIndex);
    setActiveLine(lineNo);
  }

  const file = files[active];
  const lineCount = file.content.replace(/\n$/, "").split("\n").length;
  const q = query.trim();

  const frame = (
    <div
      className={cn(
        "overflow-hidden bg-[#1e1e1e] flex flex-col",
        expanded
          ? "fixed inset-0 z-50 rounded-none"
          : "rounded-xl border border-[#0d0d0d] shadow-xl ring-1 ring-black/40"
      )}
    >
      {/* title bar with traffic lights + search + expand */}
      <div className="flex items-center gap-3 px-4 h-10 bg-[#181818] border-b border-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-[11px] font-mono text-[#8a8a8a] truncate">
          generations — read-only
        </span>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-mono border rounded px-1.5 py-0.5 transition-colors",
            searchOpen
              ? "text-white border-forest-400 bg-[#2a2d2e]"
              : "text-[#9a9a9a] hover:text-white border-[#3a3a3a] hover:border-[#5a5a5a]"
          )}
          title="Search all files (⌘⇧F)"
        >
          <Search className="w-3 h-3" /> ⌘⇧F
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-[#9a9a9a] hover:text-white border border-[#3a3a3a] hover:border-[#5a5a5a] rounded px-1.5 py-0.5 transition-colors"
          title={expanded ? "Exit fullscreen (Esc)" : "Fullscreen"}
        >
          {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          {expanded ? "Exit" : "Expand"}
        </button>
      </div>

      <div className={cn("flex min-h-0", expanded ? "flex-1" : "h-[min(80vh,760px)]")}>
        {/* sidebar — explorer OR search panel */}
        <aside className="w-64 shrink-0 bg-[#252526] border-r border-black/40 overflow-y-auto py-2">
          {searchOpen ? (
            <div className="flex flex-col">
              <div className="px-2 pb-2">
                <div className="flex items-center gap-1.5 rounded bg-[#3c3c3c] border border-[#5a5a5a] px-2 py-1">
                  <Search className="w-3 h-3 shrink-0 text-[#9a9a9a]" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search all files"
                    className="flex-1 min-w-0 bg-transparent text-[12px] font-mono text-[#e0e0e0] placeholder:text-[#7a7a7a] outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="text-[#7a7a7a] hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {q && (
                  <p className="px-1 pt-1.5 text-[10px] font-mono text-[#7a7a7a]">
                    {totalHits} result{totalHits === 1 ? "" : "s"} in {results.length} file
                    {results.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              {q && results.length === 0 && (
                <p className="px-3 py-2 text-[11px] font-mono text-[#7a7a7a]">No matches.</p>
              )}

              {results.map((r) => (
                <div key={r.path} className="mb-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-[#bdbdbd]">
                    <FileCode2 className="w-3 h-3 shrink-0 text-[#5aa0ff]" />
                    <span className="truncate" title={r.path}>
                      {baseOf(r.path)}
                    </span>
                    <span className="ml-auto text-[#7a7a7a]">{r.hits.length}</span>
                  </div>
                  {r.hits.map((h) => (
                    <button
                      key={h.lineNo}
                      type="button"
                      onClick={() => jumpTo(r.fileIndex, h.lineNo)}
                      className={cn(
                        "flex items-baseline gap-2 w-full text-left pl-7 pr-2 py-0.5 text-[11.5px] font-mono transition-colors hover:bg-[#2a2d2e]",
                        r.fileIndex === active && h.lineNo === activeLine
                          ? "bg-[#37373d] text-white"
                          : "text-[#9a9a9a]"
                      )}
                      title={`${r.path}:${h.lineNo}`}
                    >
                      <span className="text-[#6a6a6a] tabular-nums shrink-0">{h.lineNo}</span>
                      <span className="truncate">{highlightMatch(h.text.trim(), q)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7a7a7a]">
                Explorer
              </p>
              {groups.map(([dir, entries]) => (
                <div key={dir} className="mb-1">
                  {dir && (
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-[#9a9a9a]">
                      <Folder className="w-3 h-3 shrink-0 text-[#7a7a7a]" />
                      <span className="truncate" title={dir}>
                        {dir}
                      </span>
                    </div>
                  )}
                  {entries.map(({ file: f, index }) => (
                    <button
                      key={f.path}
                      type="button"
                      onClick={() => selectFile(index)}
                      className={cn(
                        "flex items-center gap-1.5 w-full text-left pr-2 py-1 text-[12.5px] font-mono transition-colors",
                        dir ? "pl-7" : "pl-3",
                        index === active
                          ? "bg-[#37373d] text-white border-l-2 border-forest-400"
                          : "text-[#bdbdbd] hover:bg-[#2a2d2e] border-l-2 border-transparent"
                      )}
                      title={f.path}
                    >
                      <FileCode2 className="w-3.5 h-3.5 shrink-0 text-[#5aa0ff]" />
                      <span className="truncate">{baseOf(f.path)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </aside>

        {/* editor pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* tab strip */}
          <div className="flex items-stretch overflow-x-auto bg-[#2d2d2d] border-b border-black/40 shrink-0">
            {files.map((f, i) => (
              <button
                key={f.path}
                type="button"
                onClick={() => selectFile(i)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-[12px] font-mono whitespace-nowrap border-r border-black/40 transition-colors",
                  i === active
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-forest-400"
                    : "bg-[#2d2d2d] text-[#9a9a9a] hover:text-[#cfcfcf] border-t-2 border-t-transparent"
                )}
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {baseOf(f.path)}
              </button>
            ))}
          </div>

          {/* code body */}
          <div className="overflow-auto flex-1">
            <Highlight theme={themes.vsDark} code={file.content.replace(/\n$/, "")} language={langFor(file)}>
              {({ tokens, getLineProps, getTokenProps }) => (
                <pre className="text-[13px] leading-[1.65] font-mono bg-[#1e1e1e] py-2 min-w-max">
                  {tokens.map((line, i) => {
                    const { key: _lk, ...lineProps } = getLineProps({ line }) as Record<string, unknown>;
                    const isTarget = i + 1 === activeLine;
                    return (
                      <div
                        key={i}
                        ref={isTarget ? targetLineRef : undefined}
                        {...(lineProps as object)}
                        className={cn("table-row group", isTarget && "bg-[#2f4a2a]")}
                      >
                        <span
                          className={cn(
                            "table-cell select-none text-right pr-4 pl-4 w-12 tabular-nums",
                            isTarget
                              ? "text-forest-300"
                              : "text-[#5a5a5a] group-hover:text-[#8a8a8a]"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="table-cell pr-8 whitespace-pre">
                          {line.map((token, key) => {
                            const { key: _tk, ...tokenProps } = getTokenProps({ token }) as Record<string, unknown>;
                            return <span key={key} {...(tokenProps as object)} />;
                          })}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </Highlight>
          </div>
        </div>
      </div>

      {/* status bar (branded) */}
      <div className="flex items-center gap-4 px-4 h-7 bg-forest-700 text-cream-50 text-[10.5px] font-mono shrink-0">
        <span className="truncate">{file.path}</span>
        <span className="ml-auto opacity-90">{langFor(file)}</span>
        <span className="opacity-70">·</span>
        <span className="opacity-90">{lineCount} lines</span>
        <span className="opacity-70">·</span>
        <span className="opacity-90">read-only · no AI</span>
      </div>
    </div>
  );

  // In fullscreen, keep an inline placeholder so layout doesn't jump.
  return expanded ? (
    <>
      <div className="rounded-xl border border-ink-100 bg-cream-50 h-[min(80vh,760px)] flex items-center justify-center text-small text-ink-400">
        Editor open in fullscreen — press Esc or “Exit” to return.
      </div>
      {frame}
    </>
  ) : (
    frame
  );
}
