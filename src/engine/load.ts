import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Trip } from "./types";

// The generated trips live one level up, in trip-gen-engine/output/*.json.
// `npm run dev` runs from preview/, so cwd is .../trip-gen-engine/preview.
const OUTPUT_DIR = path.join(process.cwd(), "..", "output");

export interface TripSummary {
  slug: string; // filename without .json
  domain: string;
  role: string;
  cardCount: number;
  totalTimeSeconds: number;
  band: string;
  rung: string;
  classes: string[]; // skill classes covered, in plan order
  methods: string[]; // method_id sequence across the cards
}

async function readTrip(slug: string): Promise<Trip> {
  const raw = await fs.readFile(path.join(OUTPUT_DIR, `${slug}.json`), "utf8");
  return JSON.parse(raw) as Trip;
}

export async function listTrips(): Promise<TripSummary[]> {
  let files: string[];
  try {
    files = await fs.readdir(OUTPUT_DIR);
  } catch {
    return [];
  }
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const summaries = await Promise.all(
    jsonFiles.map(async (file) => {
      const slug = file.replace(/\.json$/, "");
      try {
        const trip = await readTrip(slug);
        // Single-story (story.v1) trips are listed separately; skip them here.
        if ((trip as unknown as { schema_version?: string }).schema_version) return null;
        const plan = trip.trip_plan ?? {};
        const cards = Array.isArray(trip.cards) ? trip.cards : [];
        return {
          slug,
          domain: plan.domain ?? slug,
          role: plan.role ?? "",
          cardCount: cards.length,
          totalTimeSeconds: plan.total_time_cap_seconds ?? 0,
          band: plan.target_band ?? "",
          rung: plan.default_rung ?? "",
          classes:
            plan.classes_covered ??
            [...new Set(cards.map((c) => c.card?.skill_class).filter(Boolean) as string[])],
          methods: cards.map((c) => c.card?.method_id).filter(Boolean) as string[],
        } satisfies TripSummary;
      } catch {
        return null;
      }
    })
  );
  return summaries.filter((s): s is TripSummary => s !== null);
}

export async function getTrip(slug: string): Promise<Trip | null> {
  try {
    return await readTrip(slug);
  } catch {
    return null;
  }
}
