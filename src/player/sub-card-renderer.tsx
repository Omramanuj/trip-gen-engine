"use client";

import type { SubCard } from "@/engine/types";
import { DisplayRenderer } from "./renderers/display";
import { TextRenderer } from "./renderers/text";
import { ChoiceRenderer } from "./renderers/choice";
import { OrderedRenderer } from "./renderers/ordered";
import { WalkthroughRenderer } from "./renderers/walkthrough";
import { FileUploadRenderer } from "./renderers/file-upload";
import { VoiceExchangeRenderer } from "./renderers/voice-exchange";
import { CodeSurfaceRenderer } from "./renderers/code-surface";
import { CodeEditorRenderer } from "./renderers/code-editor";
import { RepoTaskRenderer } from "./renderers/repo-task";

// Dispatch on interaction_type. Mirrors cp-platform SubCardRenderer, plus the two
// new levers (voice_exchange, code_surface) and the ordered_steps fork.

export function SubCardRenderer({
  sub,
  value,
  onChange,
  briefingText,
}: {
  sub: SubCard;
  value: unknown;
  onChange: (v: unknown) => void;
  briefingText: string;
}) {
  const body = (sub.body_json ?? {}) as Record<string, unknown>;
  const prompt = (typeof body.prompt === "string" && body.prompt) || sub.title || "";

  switch (sub.interaction_type) {
    case "display":
      return <DisplayRenderer prompt={prompt} body={body} />;

    case "long_text":
    case "short_text":
      return (
        <TextRenderer
          prompt={prompt}
          body={body}
          long={sub.interaction_type === "long_text"}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );

    case "choice_buttons":
      return <ChoiceRenderer prompt={prompt} body={body} value={value} onChange={onChange} />;

    case "ordered_steps":
      // Graded reorder (J6) vs read-only build spec (E1) — split on response_expected.
      return sub.response_expected ? (
        <OrderedRenderer prompt={prompt} body={body} value={value} onChange={onChange} />
      ) : (
        <WalkthroughRenderer prompt={prompt} body={body} />
      );

    case "voice_exchange":
      return (
        <VoiceExchangeRenderer
          prompt={prompt}
          body={body}
          context={briefingText}
          value={value}
          onChange={onChange}
        />
      );

    case "code_surface":
      return <CodeSurfaceRenderer body={body} />;

    case "code_editor":
      return <CodeEditorRenderer prompt={prompt} body={body} value={value} onChange={onChange} />;

    case "repo_task":
      return <RepoTaskRenderer prompt={prompt} body={body} value={value} onChange={onChange} />;

    case "file_upload":
      return <FileUploadRenderer prompt={prompt} body={body} value={value} onChange={onChange} />;

    default:
      return (
        <div className="text-small text-ink-500">
          Interaction type <code>{sub.interaction_type}</code> isn&apos;t rendered yet.
        </div>
      );
  }
}
