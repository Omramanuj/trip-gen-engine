// Ported from cp-platform trip-player-normalize.ts — tolerant coercion of
// choice options and ordered-step items into a consistent {id,label,value?} shape.

export interface ChoiceOption {
  id: string;
  label: string;
  value?: string;
}

export interface OrderedStepItem {
  id: string;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fallbackId(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return slug || `option_${index + 1}`;
}

export function normalizeChoiceOptions(raw: unknown): ChoiceOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    if (typeof item === "string") {
      return [{ id: fallbackId(item, index), label: item, value: item }];
    }
    if (!isRecord(item)) return [];
    const labelSource = item.label ?? item.value ?? item.id;
    if (typeof labelSource !== "string" || labelSource.trim().length === 0) return [];
    const label = labelSource.trim();
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : fallbackId(label, index);
    const value = typeof item.value === "string" && item.value.trim() ? item.value.trim() : label;
    return [{ id, label, value }];
  });
}

export function normalizeOrderedItems(raw: unknown): OrderedStepItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    if (typeof item === "string") {
      return [{ id: fallbackId(item, index), label: item }];
    }
    if (!isRecord(item)) return [];
    const labelSource = item.label ?? item.title ?? item.value ?? item.id;
    if (typeof labelSource !== "string" || labelSource.trim().length === 0) return [];
    const label = labelSource.trim();
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : fallbackId(label, index);
    return [{ id, label }];
  });
}
