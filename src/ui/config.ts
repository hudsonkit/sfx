/**
 * Host configuration. SFX is a client app; the host owns the AI route (a
 * host chat endpoint serving the `sfx` toolset from
 * `@hudsonkit/sfx/toolset`) and anything product-specific.
 */
export interface SfxConfig {
  /** UI message stream endpoint (Vercel AI SDK protocol). */
  chatEndpoint: string
  /** Toolset id the endpoint resolves to the SFX toolset. */
  toolset: string
  /** Optional provider/model hints passed through to the endpoint. */
  provider?: string
  model?: string
  /** Shown in the composer, e.g. "Codex via Scout". */
  modelLabel: string
  /** Extra context merged into every compose request. */
  context?: Record<string, unknown>
  /** A CLI line to install an exported set, e.g. (slug) => `peal add ${slug}`. */
  exportCommand?: (slug: string) => string
  /**
   * hudsonkit AppShell's persisted panel key prefix for the hosting app
   * instance (e.g. `inst:my-app:appshell.my-app`). When set, panel widths the
   * SFX tool changes are restored even across reloads.
   */
  shellPersistKey?: string
}

let config: SfxConfig = {
  chatEndpoint: '/api/ai/chat',
  toolset: 'sfx',
  modelLabel: 'AI',
}

export function configureSfx(next: Partial<SfxConfig>) {
  config = { ...config, ...next }
}

export const sfxConfig = (): SfxConfig => config
