"use client";

// Briefing / reflection / situation cards. Ported from cp-platform DisplayRenderer,
// extended to also render `guidance`, `highlight`, and `links` (E1 reflection sub-card).

export function DisplayRenderer({
  prompt,
  body,
}: {
  prompt: string;
  body: Record<string, unknown>;
}) {
  const subtitle = typeof body.subtitle === "string" ? body.subtitle : null;
  const guidance = typeof body.guidance === "string" ? body.guidance : null;
  const highlight = typeof body.highlight === "string" ? body.highlight : null;
  const blocks = Array.isArray(body.blocks) ? (body.blocks as unknown[]) : [];
  const rules = Array.isArray(body.rules) ? (body.rules as unknown[]) : [];
  const links = Array.isArray(body.links) ? (body.links as unknown[]) : [];

  return (
    <div>
      {prompt && <h2 className="text-h2 mb-2 whitespace-pre-line">{prompt}</h2>}
      {subtitle && <p className="text-small mb-4">{subtitle}</p>}
      {guidance && (
        <p className="text-body mb-4 whitespace-pre-line text-ink-700">{guidance}</p>
      )}
      {blocks.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="rounded-md bg-cream-50 border border-cream-300 px-4 py-3 text-sm text-ink-700 whitespace-pre-line"
            >
              {typeof b === "string" ? b : JSON.stringify(b)}
            </div>
          ))}
        </div>
      )}
      {rules.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-ink-700 mt-4 space-y-1">
          {rules.map((r, i) => (
            <li key={i}>{typeof r === "string" ? r : JSON.stringify(r)}</li>
          ))}
        </ul>
      )}
      {highlight && (
        // Departures v2 scenario callout: teal left-rule on a teal-50 wash.
        <div className="mt-5 rounded-r-xl border-l-[3px] border-teal-500 bg-teal-50 px-[18px] py-3.5 text-sm text-ink-700">
          {highlight}
        </div>
      )}
      {links.length > 0 && (
        <ul className="mt-4 space-y-1">
          {links.map((l, i) => (
            <li key={i} className="text-mono text-teal-700 underline">
              {typeof l === "string" ? l : JSON.stringify(l)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
