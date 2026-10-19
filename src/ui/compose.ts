'use client'

/**
 * Compose one sound through the host's AI route: posts an `sfx` toolset turn
 * and reads the UI message stream for the compose_sound tool call. Returns
 * the agent's text and the patch.
 */
import { sfxPatchSchema, type SfxPatch } from '../engine/patch'
import { sfxConfig } from './config'

export interface ComposeTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface ComposeResult {
  text: string
  patch: SfxPatch | null
}

export async function composeSound({ turns, composition, onStatus, signal }: {
  turns: ComposeTurn[]
  /** The sound being refined — the agent edits it in place. */
  composition?: SfxPatch
  onStatus?: (line: string) => void
  signal?: AbortSignal
}): Promise<ComposeResult> {
  const cfg = sfxConfig()
  const res = await fetch(cfg.chatEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      toolset: cfg.toolset,
      ...(cfg.provider ? { provider: cfg.provider } : {}),
      ...(cfg.model ? { model: cfg.model } : {}),
      context: { ...cfg.context, ...(composition ? { composition } : {}) },
      messages: turns.map((t, i) => ({ id: `t${i}`, role: t.role, parts: [{ type: 'text', text: t.text }] })),
    }),
  })
  if (!res.ok || !res.body) throw new Error(`AI route ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffered = ''
  let text = ''
  let status = ''
  let patch: SfxPatch | null = null
  let error: string | null = null

  const handle = (event: Record<string, unknown>) => {
    switch (event.type) {
      case 'reasoning-delta': {
        status += String(event.delta ?? '')
        const last = status.trim().split('\n').pop()
        if (last) onStatus?.(last)
        break
      }
      case 'text-delta':
        text += String(event.delta ?? '')
        break
      case 'tool-input-available':
        if (event.toolName === 'compose_sound') {
          const parsed = sfxPatchSchema.safeParse(event.input)
          if (parsed.success) patch = { ...parsed.data, seed: parsed.data.seed ?? Math.floor(Math.random() * 1e6) }
        }
        break
      case 'tool-input-error':
      case 'error':
        error = String(event.errorText ?? 'compose failed')
        break
    }
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffered += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buffered.indexOf('\n')) !== -1) {
      const line = buffered.slice(0, nl).trim()
      buffered = buffered.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try { handle(JSON.parse(payload)) } catch { /* partial or non-JSON line */ }
    }
  }
  if (!patch && error) throw new Error(error)
  return { text: text.trim(), patch }
}

/**
 * One thing ("a soft bubble pop") vs a set ("sounds for an ebook reader").
 * Sets name an app/flow or several moments; a single sound names one.
 */
export function isSingleSoundPrompt(text: string): boolean {
  const t = text.toLowerCase()
  if (/\b(sounds|set|kit|pack|suite|cues|app|flow|experience|product|game|ui)\b/.test(t)) return false
  if ((t.match(/,/g) ?? []).length >= 2 || /:\s*\w+.*,/.test(t)) return false
  return t.split(/\s+/).length <= 18
}
