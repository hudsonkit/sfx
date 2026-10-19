# Handoff: publish @hudsonkit/sfx

The code, branding and polish are done and verified locally. What's left needs org credentials: creating the GitHub repo, the first npm publish, and pointing Peal at the published version.

## State (2026-10-19)

- Local repo: `~/dev/projects/sfx` on `archie`, branch `main`, one commit, **no remote yet**.
- Package `@hudsonkit/sfx@0.1.0` (MIT), not yet on npm (the name is free; checked 2026-10-19).
- `bun run typecheck`, `bun run test` (6 tests) and `bun run build` pass, and `publint` reports "All good". `bun pm pack` → `hudsonkit-sfx-0.1.0.tgz` (133 KB).
- Exports: `.` (app and UI, `'use client'`), `./engine` (headless), `./toolset` (server), `./styles.css`.
- Mirrors `hudsonkit/arc`: repository, homepage `https://hudsonkit.com/sfx`, `publishConfig` (public + provenance), and an `npm-publish.yml` modelled on Arc's (tags `v*` or a manual dispatch with dry run).
- The first consumer is Peal (`~/dev/projects/peal`, branch `sfx-conversation`). It currently depends on the packed tarball: `"@hudsonkit/sfx": "file:../sfx/hudsonkit-sfx-0.1.0.tgz"`.

## Steps

1. **Create the repo**: `hudsonkit/sfx`, public. Description: "Conversation-first sound design for UI and product audio — a Hudson app, a headless Web Audio engine, and an AI toolset." Homepage `https://hudsonkit.com/sfx`. Topics: `sound-design`, `web-audio`, `ui-sounds`, `hudson`, `react`.
2. **Push**:
   ```bash
   cd ~/dev/projects/sfx
   git remote add origin git@github.com:hudsonkit/sfx.git
   git push -u origin main
   ```
   CI (`.github/workflows/ci.yml`) should go green.
3. **First npm publish**: trusted publishing (OIDC) can only be configured on a package that already exists.
   - Publish 0.1.0 once by hand from a logged-in machine: `bun install && bun run prepublishOnly && npm publish --access public`. Provenance needs CI, so omit `--provenance` for this one.
   - Alternatively, add an `NPM_TOKEN` secret and run the workflow.
   - Then, on npmjs.com, add a trusted publisher for `@hudsonkit/sfx` → GitHub `hudsonkit/sfx`, workflow `npm-publish.yml`. Every release after that is just `git tag v0.1.1 && git push --tags`.
4. **Peal**:
   - Replace the tarball dependency with `"@hudsonkit/sfx": "^0.1.0"`, run `bun install`, and delete `~/dev/projects/sfx/*.tgz`.
   - Smoke-test `http://localhost:3001/studio`. Its dev server runs on 3001; never kill it.
   - Commit on `sfx-conversation`.
5. **Brand surfaces (optional)**: list SFX in the org profile (`hudsonkit/.github` README) next to Arc, Vox and Studio, and add a `hudsonkit.com/sfx` page (the homepage URL above assumes one).

## Notes for whoever continues

- Hosts must serve the AI route: register `sfxToolset` under `sfx` (see the README). Peal does this in `lib/ai/toolsets/index.ts` and routes it through Scout agent sessions in `app/api/ai/chat/route.ts`.
- The set flow still uses a scripted demo plan (`src/demo/ebookReader.json`). Single-sound prompts compose live through the toolset. The next feature is live set planning, which needs a `plan_set` tool in the toolset.
- `shellPersistKey` couples to hudsonkit AppShell's localStorage key format (`inst:<app>:appshell.<app>`). If the kit exposes panel persistence, switch to that.
