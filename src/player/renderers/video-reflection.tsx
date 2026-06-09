"use client";

import { useEffect, useRef, useState } from "react";
import { Video, Circle, Square, RotateCcw, ShieldCheck, X } from "lucide-react";

// Small self-highlight video. Records via getUserMedia + MediaRecorder behind a
// hard consent gate, capped at max_duration_seconds. Emits the SAME value shape
// as file_upload ({url,file_name,mime_type,size}) so the real Mux module
// (cp-platform use-mux-upload → "mux:<playbackId>") swaps in transport-only later.

interface Captured {
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
}

type Phase = "consent" | "ready" | "recording" | "done";

export function VideoReflection({
  maxDurationSeconds = 90,
  value,
  onChange,
}: {
  maxDurationSeconds?: number;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const current =
    value && typeof value === "object" && !Array.isArray(value) ? (value as Captured) : null;
  const [phase, setPhase] = useState<Phase>(current ? "done" : "consent");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  function clearTick() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  }

  useEffect(() => () => { stopStream(); clearTick(); }, []);

  async function grantCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "camera/mic access denied");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      onChange({ url, file_name: "highlight.webm", mime_type: mime, size: blob.size } satisfies Captured);
      stopStream();
      if (videoRef.current) videoRef.current.srcObject = null;
      setPhase("done");
    };
    recorderRef.current = rec;
    rec.start();
    setElapsed(0);
    setPhase("recording");
    tickRef.current = setInterval(() => {
      setElapsed((e) => {
        const n = e + 1;
        if (n >= maxDurationSeconds) stopRecording();
        return n;
      });
    }, 1000);
  }

  function stopRecording() {
    clearTick();
    recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
  }

  function retake() {
    if (current?.url) URL.revokeObjectURL(current.url);
    onChange(null);
    setPhase("consent");
    setElapsed(0);
  }

  const mm = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-5">
      <p className="text-mono text-ink-400 mb-3">
        <Video className="mr-1.5 inline h-3.5 w-3.5" />
        Optional · up to {Math.round(maxDurationSeconds / 60) || 1} min
      </p>

      {phase === "consent" && (
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-start gap-2.5 text-small text-ink-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <span>
              We&apos;ll record a short video from your camera + mic so you can talk through your best
              work. Nothing records until you allow access and press record. You can retake before
              moving on.
            </span>
          </div>
          <button
            type="button"
            onClick={grantCamera}
            className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-cream-50 shadow-sm transition-colors hover:bg-teal-700"
          >
            <Video className="h-4 w-4" /> Allow camera &amp; mic
          </button>
        </div>
      )}

      {(phase === "ready" || phase === "recording") && (
        <div>
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-video w-full" playsInline />
            {phase === "recording" && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-coral-600/90 px-2.5 py-1 text-xs font-medium text-white">
                <Circle className="h-2.5 w-2.5 animate-pulse fill-current" /> {mm(elapsed)}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-3">
            {phase === "ready" ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-md bg-coral-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-700"
              >
                <Circle className="h-3.5 w-3.5 fill-current" /> Start recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-md bg-ink-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-900"
              >
                <Square className="h-3.5 w-3.5 fill-current" /> Stop
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "done" && current?.url && (
        <div>
          <video src={current.url} controls className="aspect-video w-full rounded-lg bg-black" />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-mono text-ink-400">
              {(current.size / 1_048_576).toFixed(1)} MB · captured
            </p>
            <button
              type="button"
              onClick={retake}
              className="inline-flex items-center gap-1.5 text-mono text-teal-700 underline"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-mono mt-3 flex items-center gap-1.5 text-coral-600">
          <X className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
