import type { Trip, CardEntry, CardSecret, SubCardSecret } from "./types";

// Keys inside a sub-card's body_json that leak the answer / grading intent and
// must be hidden in candidate view (but surfaced in the author inspector).
const SECRET_SUBCARD_KEYS = [
  "_hidden_omissions",
  "correct_answer",
  "correct_order",
  "supporting_text",
  "expected_signal",
] as const;

function clone<T>(v: T): T {
  // structuredClone is available in Node 18+ / modern browsers.
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : (JSON.parse(JSON.stringify(v)) as T);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export interface SplitTrip {
  // Candidate-safe trip: judge / routing / source_policy / inline answers removed.
  candidate: Trip;
  // Per-card secrets (index-aligned with candidate.cards) for the author panel.
  secrets: CardSecret[];
}

export function splitTrip(raw: Trip): SplitTrip {
  const candidate = clone(raw);
  const secrets: CardSecret[] = [];

  (candidate.cards ?? []).forEach((card: CardEntry) => {
    // ── capture the secret view-model for this card ──
    const subSecrets: SubCardSecret[] = (card.sub_cards ?? []).map((sub) => {
      const fields: Record<string, unknown> = {};
      const body = isRecord(sub.body_json) ? sub.body_json : {};
      for (const key of SECRET_SUBCARD_KEYS) {
        if (key in body) fields[key] = body[key];
      }
      // chunk-match seam explanation lives nested under variant_chunk_match
      const variant = body["variant_chunk_match"];
      if (isRecord(variant) && "seeded_conflict" in variant) {
        fields["seeded_conflict"] = variant["seeded_conflict"];
      }
      return {
        title: sub.title ?? sub.sub_card_type,
        interaction_type: sub.interaction_type,
        fields,
      };
    });

    secrets.push({
      method_id: card.card?.method_id ?? "?",
      grading_mode: card.card?.grading_mode ?? "Banded",
      routing: card.routing,
      source_policy: card.source_policy,
      judge: card.judge,
      subCards: subSecrets,
    });

    // ── strip secrets from the candidate copy ──
    delete card.judge;
    delete card.routing;
    delete card.source_policy;

    (card.sub_cards ?? []).forEach((sub) => {
      if (!isRecord(sub.body_json)) return;
      for (const key of SECRET_SUBCARD_KEYS) delete sub.body_json[key];
      const variant = sub.body_json["variant_chunk_match"];
      if (isRecord(variant)) delete variant["seeded_conflict"];
    });
  });

  return { candidate, secrets };
}
