import { NextResponse } from "next/server";

// Turn-based voice persona. The candidate probes a non-technical "founder"; the
// founder answers only what's asked and never volunteers constraints (that's the
// whole J1 signal). Uses OpenRouter when OPENROUTER_API_KEY is set; otherwise a
// scripted in-character fallback so the interaction is testable today.

interface Msg {
  role: "candidate" | "founder";
  text: string;
}

const SYSTEM = `You are role-playing a NON-TECHNICAL startup founder in a working interview.
You handed an engineer a short brief and asked them to design a data layer / feature.
Rules of the role-play:
- Stay fully in character as the founder. Never break character, never evaluate or coach.
- Answer ONLY what the candidate specifically asks. Be concrete and plausible.
- NEVER volunteer constraints, requirements, edge cases, or schema/architecture advice
  the candidate didn't ask for — making them surface the right questions is the point.
- If they ask a vague or cosmetic question, give a short vague answer.
- If they ask a sharp, decision-relevant question (e.g. who can see whose data, what
  "shared" means, files vs text, enforcement layer), give a clear concrete answer.
- Keep replies to 1-3 sentences, conversational.`;

function scriptedReply(messages: Msg[], briefing: string): string {
  const last = messages.filter((m) => m.role === "candidate").pop()?.text ?? "";
  const lower = last.toLowerCase();
  const asksSharing = /shar|visib|who can see|public|private|access|permission|tenant|org/.test(lower);
  const asksArtifact = /file|blob|image|text|json|store|storage|big|size|immutab|version/.test(lower);
  const asksEnforce = /rls|row level|enforc|database layer|app layer|route handler|where clause/.test(lower);
  const isQuestion = last.includes("?");

  if (asksSharing)
    return "Good question. Honestly we hadn't pinned that down — let's say a user mostly sees their own generations, but they should be able to share a specific one with another person by a link. Whether that's read-only… you tell me what's simpler.";
  if (asksArtifact)
    return "A generation is usually a chunk of text or JSON the model returns — sometimes longer, but not huge files. Once it's made we don't really edit it.";
  if (asksEnforce)
    return "I'm not technical enough to say where it should live — I just need it to be safe. You'd know better than me whether that's the database or the app.";
  if (isQuestion)
    return "Sure — whatever you think is the sensible default there. I trust your judgment, just walk me through the tradeoff.";
  return briefing
    ? "Right, that matches what I was picturing. What do you need from me to lock the model down?"
    : "Makes sense — keep going.";
}

export async function POST(req: Request) {
  let payload: { messages?: Msg[]; prompt?: string; briefing?: string; maxTurns?: number };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const briefing = typeof payload.briefing === "string" ? payload.briefing : "";

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ reply: scriptedReply(messages, briefing), source: "stub" });
  }

  try {
    const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: `${SYSTEM}\n\nThe brief you gave the candidate:\n${briefing}` },
          ...messages.map((m) => ({
            role: m.role === "candidate" ? "user" : "assistant",
            content: m.text,
          })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenRouter ${res.status}: ${detail.slice(0, 200)}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string") {
      return NextResponse.json({ error: "no reply from model" }, { status: 502 });
    }
    return NextResponse.json({ reply: reply.trim(), source: "openrouter" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "request failed" },
      { status: 502 }
    );
  }
}
