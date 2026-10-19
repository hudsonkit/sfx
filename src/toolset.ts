/**
 * Server-side AI toolset for SFX — register it on the host's chat route under
 * the id the client is configured with (default `sfx`):
 *
 *   import { sfxToolset } from '@hudsonkit/sfx/toolset'
 *   registry.register('sfx', sfxToolset)
 *
 * The client reads the compose_sound tool call from the UI message stream.
 */
import { tool } from 'ai'
import type { ToolsetDefinition } from '@hudsonkit/ai/toolsets'
import { sfxPatchSchema } from './engine/patch'
import { formatSfxDesignGuideForPrompt } from './engine/guide'

export const SFX_SYSTEM_PROMPT = `You are SFX — a sound designer for UI and product audio.

Users describe a moment or a material in plain language; you compose a layered sound with the compose_sound tool. Every compose_sound call replaces the whole sound — the user keeps every earlier version.

## How to work
1. Ask one clarifying question only when the request is genuinely ambiguous.
2. Otherwise call compose_sound with the complete patch — do not only describe it in prose.
3. When a current composition is shown below and the user asks for a change ("warmer", "add a click", "shorter"), start from it: keep what works, change what they asked, and return the full updated patch.
4. After compose_sound, say in one short sentence what you built and which layer does what.

## Response style
- Brief, direct, craft-focused — like a sound engineer, not a marketer. No apologies, no filler.
- Numbers as numbers, not strings.

${formatSfxDesignGuideForPrompt()}`

function context(ctx: Record<string, unknown>): string {
  const composition = ctx.composition
  return composition
    ? `## Current composition (edit this when the user asks for changes)\n${JSON.stringify(composition)}`
    : 'No sound yet — compose a new one from the request.'
}

function tools() {
  return {
    compose_sound: tool({
      description: 'Compose (or recompose) the whole sound as a layered patch.',
      inputSchema: sfxPatchSchema,
      execute: async (args) => ({ applied: true, summary: args.summary, layers: args.layers.length }),
    }),
  }
}

export const sfxToolset: ToolsetDefinition = { system: SFX_SYSTEM_PROMPT, context, tools }
