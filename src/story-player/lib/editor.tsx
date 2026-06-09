"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";

// CodeMirror touches the DOM on mount, so load it client-only (no SSR) to avoid
// `document is not defined` during the Next.js server render of the client tree.
// Cast to the real props type so dynamic() doesn't widen props to `{}`.
export const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[200px] place-items-center font-mono text-[12px] text-console-600">
        loading editor…
      </div>
    ),
  }
) as ComponentType<ReactCodeMirrorProps>;

// Minimal structural shape of a CodeMirror update — avoids depending on the
// (undeclared) @codemirror/view package just for a selection read.
export interface CMUpdate {
  state: {
    selection: { main: { empty: boolean; from: number; to: number } };
    doc: { lineAt(pos: number): { number: number } };
  };
}
