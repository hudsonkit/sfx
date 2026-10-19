# CLAUDE.md

`@hudsonkit/sfx` — conversation-first sound design (Hudson app + headless Web Audio engine + AI toolset). Standalone project under the Hudson Kit umbrella (GitHub `hudsonkit/sfx`, npm `@hudsonkit/sfx`); depends on `hudsonkit`, doesn't live in its repo.

## Layout

- `src/engine/` — patch schema + offline renderer (`patch.ts`), mixing (`mix.ts`), WAV (`wav.ts`), AI design guide (`guide.ts`). No React; exported as `./engine`.
- `src/audio/transport.ts` — shared playback transport (one take at a time, seek/pause/resume).
- `src/ui/` — `Sfx.tsx` (sidebar / thread / pages panes), `Player.tsx` (inline + full players), `MixRack.tsx`, `scope.ts` (canvas drawing), `instruments.tsx`/`knob.tsx` (racks, pads, transport, knobs), `store.ts` (zustand session store), `compose.ts` (AI client), `config.ts` (host config), `slots.tsx` (Hudson slot wrappers: panel sizing, Space key).
- `src/app.tsx` — `sfxApp: HudsonApp`. `src/toolset.ts` — server toolset. `src/styles/sfx.css` → `dist/styles.css`.

## Conventions

- Everything styled is scoped under `.sfx-root`; classes are `sfx-*`, instrument classes `sfx-inst-*`. Colors come from `--sfx-surface-*` / `--inst-*` tokens (dark default, light under `[data-hudson-theme="light"]`). No Tailwind in components.
- Sans for conversation prose (`--sfx-sans`), mono for all chrome (`--sfx-mono`).
- Host-specific behaviour goes through `configureSfx`, never hardcoded.
- Commits: no co-author trailers or "Generated with" lines.

## Commands

`bun run typecheck` · `bun run test` · `bun run build` · `bun run check:dist` · `bun pm pack` (local tarball for consumers)
