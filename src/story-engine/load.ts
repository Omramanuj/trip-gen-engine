import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { StoryTrip } from "./types";

// Single-story trips live alongside the legacy trips in preview/output/*.json,
// distinguished by schema_version === "story.v1".
const OUTPUT_DIR = path.join(process.cwd(), "output");

function isStory(v: unknown): v is StoryTrip {
  return !!v && typeof v === "object" && (v as { schema_version?: string }).schema_version === "story.v1";
}

export async function getStory(slug: string): Promise<StoryTrip | null> {
  try {
    const raw = await fs.readFile(path.join(OUTPUT_DIR, `${slug}.json`), "utf8");
    const parsed = JSON.parse(raw);
    return isStory(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface StorySummary {
  slug: string;
  premise: string;
  domain: string;
  role: string;
  band: string;
  gateCount: number;
  totalTimeSeconds: number;
}

export async function listStories(): Promise<StorySummary[]> {
  let files: string[];
  try {
    files = await fs.readdir(OUTPUT_DIR);
  } catch {
    return [];
  }
  const out: StorySummary[] = [];
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const slug = file.replace(/\.json$/, "");
    try {
      const parsed = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, file), "utf8"));
      if (!isStory(parsed)) continue;
      const m = parsed.trip_meta ?? ({} as StoryTrip["trip_meta"]);
      out.push({
        slug,
        premise: parsed.story_premise ?? "",
        domain: m.domain ?? slug,
        role: m.role ?? "",
        band: m.target_band ?? "",
        gateCount: parsed.gates?.length ?? 0,
        totalTimeSeconds: m.total_time_cap_seconds ?? 0,
      });
    } catch {
      // skip unreadable
    }
  }
  return out;
}
