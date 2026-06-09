# Departures — design system

- `departures.html` — **v1**: foundations + component library (tokens, type,
  buttons, pills, cards, the Trip card, web/mobile shells). Source of truth for tokens.
- `departures-v2-flows.html` — **v2**: full assessment flows composed from v1
  (the screen frame, MCQ option cards, reading pack, voice recorder, dropzone +
  file card, the stamp-earned completion). Source of truth for the trip-player UI.

Open either in a browser to see the living style guide.

## Where it lives in code

| DS concept            | In this app                                              |
| --------------------- | -------------------------------------------------------- |
| Color / radius / shadow / type tokens | `app/globals.css` → `@theme` block              |
| Fonts (Fraunces · Hanken Grotesk · Geist Mono) | `app/layout.tsx` (`next/font`)  |
| Buttons (coral hero · teal · sky · ghost) | `src/ui/Button.tsx`                  |
| Status pills          | `src/ui/Badge.tsx`                                       |
| Skill-class → color role | `src/engine/meta.ts` (`CLASS_TONE`)                  |
| v2 MCQ option cards   | `src/player/renderers/choice.tsx`                       |
| v2 reading callout    | `src/player/renderers/display.tsx`                      |
| v2 dropzone + file card | `src/player/renderers/file-upload.tsx`                |
| v2 progress strip · guide bubble · stamp | `src/player/trip-player.tsx`         |

## Color roles (keep these disciplined)

- **cream** — the canvas. Always the ground.
- **teal** — surfaces of focus & verified proof. (`Judgement`)
- **sky** — information & the candidate's own data, never an action. (`Cognition`, stat tiles)
- **coral** — the *one* action that matters per screen. (`Execution`, primary CTA)

## Legacy names

The earlier palette used `forest-*` and `burgundy-*`. Those variable names are
**kept in `@theme` but re-valued onto teal**, so existing utility classes adopt
the Departures look without a rename sweep. New code should use `teal-*` / `sky-*`.
