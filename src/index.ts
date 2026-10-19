/**
 * @hudsonkit/sfx — conversation-first sound design for Hudson apps.
 *
 *   import { sfxApp, configureSfx } from '@hudsonkit/sfx'
 *   import '@hudsonkit/sfx/styles.css'
 *
 * Engine only (no React): '@hudsonkit/sfx/engine'. Server toolset: '@hudsonkit/sfx/toolset'.
 */
export { sfxApp } from './app'
export { configureSfx, sfxConfig, type SfxConfig } from './ui/config'
export { SfxLeftPanel, SfxContent, SfxInspector } from './ui/slots'
export { SfxSidebar, SfxThread, SfxPages, SfxStandalone, useSfxBoot } from './ui/Sfx'
export { useSfx, toggleSfxPlayback, type SfxStage, type SfxSound, type CardState, type Message } from './ui/store'
export { InlinePlayer, FullPlayer, usePlayhead } from './ui/Player'
export { MixRack } from './ui/MixRack'
export { drawScope, drawTimeline, waveformData } from './ui/scope'
export { composeSound, isSingleSoundPrompt } from './ui/compose'
export * from './engine'
