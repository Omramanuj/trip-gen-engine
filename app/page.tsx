import Link from "next/link";
import { ArrowRight, Layers, Clock, Terminal } from "lucide-react";
import { listTrips } from "@/engine/load";
import { listStories } from "@/story-engine/load";
import { Badge } from "@/ui/Badge";
import { classTone } from "@/engine/meta";

export const dynamic = "force-dynamic"; // always reflect the latest output/*.json

export default async function Home() {
  const [trips, stories] = await Promise.all([listTrips(), listStories()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-mono-accent mb-3">trip-gen-engine</p>
        <h1 className="text-display-xl mb-4">
          Trip <em>preview</em>
        </h1>
        <p className="text-lede max-w-xl">
          Play a generated trip card by card. Toggle <em>Author view</em> inside any trip to
          inspect the hidden rubric, answer keys, and AI-floor reasoning behind each card.
        </p>
      </header>

      {stories.length > 0 && (
        <section className="mb-12">
          <p className="text-mono text-ink-400 mb-3">Single-story trips — one ticket, five linked gates</p>
          <ul className="grid gap-4">
            {stories.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/story/${s.slug}`}
                  className="group flex flex-col rounded-2xl border border-ink-800 bg-ink-900 p-5 text-ink-100 shadow-md transition-all duration-base hover:-translate-y-0.5 hover:border-coral-500/60"
                  style={{
                    background:
                      "radial-gradient(700px 300px at 90% -20%, rgba(238,137,124,0.14), transparent 60%), #0F1D27",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-coral-400" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral-400">
                      Terminal Dossier
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-[#8FA9B6]">
                      {s.gateCount} gates · ~{Math.round(s.totalTimeSeconds / 60)} min · Band {s.band}
                    </span>
                  </div>
                  <span className="text-h3 text-[#EAF2F6]">{s.domain}</span>
                  <p className="mt-1.5 line-clamp-2 text-sm text-[#D7E4EA]">{s.premise}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trips.length === 0 ? (
        <div className="rounded-lg border border-coral-200 bg-coral-50 px-5 py-4 text-small text-coral-800">
          No trips found in <code>../output/*.json</code>. Generate one first.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/trip/${t.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-cream-300 bg-paper p-5 shadow-sm transition-all duration-base hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-h3">{t.domain}</span>
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-ink-400 transition-all duration-base group-hover:bg-coral-500 group-hover:text-white group-hover:shadow-coral">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                {t.role && <p className="text-small mb-4 line-clamp-2">{t.role}</p>}

                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  {t.classes.map((c) => (
                    <Badge key={c} tone={classTone(c)}>
                      {c}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-cream-200 pt-3 text-mono text-ink-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3 w-3" /> {t.cardCount} cards
                  </span>
                  {t.totalTimeSeconds > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> ~{Math.round(t.totalTimeSeconds / 60)} min
                    </span>
                  )}
                  {t.band && <span className="ml-auto">Band {t.band}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
