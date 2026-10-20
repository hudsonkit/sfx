# SFX

Conversation-first sound design for UI and product audio. Describe one sound and it gets composed; describe an app and its moments, and you get a coherent set. Refine everything in chat, then fine-tune each sound with a per-layer mixer.

Part of [Hudson Kit](https://hudsonkit.com). Ships as:

- **`sfxApp`** — a ready [Hudson](https://github.com/hudsonkit/hudson) app: projects and conversations on the left, the conversation in the centre, sound pages (scope, timeline, transport, mixer) on the right.
- **`@hudsonkit/sfx/engine`** — a headless Web Audio engine: a layered patch format (tone/noise layers, envelopes, filter sweeps, grains, flutter, stereo motion, synthetic rooms, per-play variation), an offline renderer, non-destructive mixing and WAV export. No React.
- **`@hudsonkit/sfx/toolset`** — the server-side AI toolset (`compose_sound` plus a sound design guide) for your chat route.

```bash
bun add @hudsonkit/sfx hudsonkit
```

## Use the app

```tsx
import { AppShell } from 'hudsonkit/app-shell'
import { sfxApp, configureSfx } from '@hudsonkit/sfx'
import '@hudsonkit/sfx/styles.css'

configureSfx({ chatEndpoint: '/api/ai/chat', modelLabel: 'Claude' })

export default function Page() {
  return <AppShell app={sfxApp} />
}
```

Already have a Hudson app? Mount the slots in your own:

```tsx
import { SfxLeftPanel, SfxContent, SfxInspector } from '@hudsonkit/sfx'

slots: { LeftPanel: SfxLeftPanel, Content: SfxContent, Inspector: SfxInspector }
```

## Serve the AI

SFX composes through your chat route (Vercel AI SDK UI message stream). Register the toolset under the id the client uses (default `sfx`):

```ts
import { sfxToolset } from '@hudsonkit/sfx/toolset'

// Supply sfxToolset to your host's chat route under the id `sfx`.
// Provider connections belong to the host; SFX supplies its tools.
```

The client sends `{ toolset, messages, context: { composition } }` and reads the `compose_sound` tool call from the stream. Each refinement sends the current patch as `context.composition`.

## Configuration

`configureSfx(partial)`:

| Option | Default | |
| --- | --- | --- |
| `chatEndpoint` | `/api/ai/chat` | UI message stream endpoint |
| `toolset` | `sfx` | Toolset id on that endpoint |
| `provider`, `model` | — | Passed through to the endpoint |
| `modelLabel` | `AI` | Shown in the composer |
| `context` | — | Extra context merged into every request |
| `exportCommand` | — | `(slug) => string` CLI line shown on export, e.g. `` (s) => `peal add ${s}` `` |
| `shellPersistKey` | — | Your AppShell's persisted key prefix, so panel widths SFX changes are restored across reloads |

## Use the engine

```ts
import { renderSfxPatch, encodeWav, type SfxPatch } from '@hudsonkit/sfx/engine'

const patch: SfxPatch = {
  summary: 'soft confirm',
  duration: 0.25,
  layers: [{ name: 'body', source: 'tone', waveform: 'sine', frequency: 660, frequencyEnd: 880, envelope: { attack: 0.004, decay: 0.08, sustain: 0.3, release: 0.12 } }],
}
const buffer = await renderSfxPatch(patch) // stereo AudioBuffer, deterministic per seed
const wav = encodeWav(buffer)
```

## Theming

Styles are scoped under `.sfx-root`. Dark by default; light follows the Hudson theme (`[data-hudson-theme="light"]`). Override `--sfx-sans` / `--sfx-mono` to set the conversation and chrome typefaces.

## Development

```bash
bun install
bun run typecheck && bun run test && bun run build
```

Releases: push a `v*` tag; `.github/workflows/npm-publish.yml` publishes with provenance.

## License

MIT © Arach Tchoupani
