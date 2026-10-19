'use client'

import { createElement, Fragment, type ReactNode } from 'react'
import type { HudsonApp } from 'hudsonkit'
import { SfxContent, SfxInspector, SfxLeftPanel } from './ui/slots'
import { toggleSfxPlayback, useSfx } from './ui/store'

function SfxProvider({ children }: { children: ReactNode }) {
  return createElement(Fragment, null, children)
}

const icon = (path: string) => createElement('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
  createElement('path', { d: path }))

/** A ready HudsonApp: projects left, conversation centre, sound pages right. */
export const sfxApp: HudsonApp = {
  id: 'sfx',
  name: 'SFX',
  description: 'Design UI sounds in conversation — one sound or a whole set',
  mode: 'panel',
  multiInstance: 'singleton',
  icon: icon('M3 10v4M7 6v12M11 3v18M15 8v8M19 11v2'),
  manifest: {
    id: 'sfx',
    name: 'SFX',
    description: 'Design UI sounds in conversation',
    mode: 'panel',
    commands: [{ id: 'sfx:play', label: 'Play / pause sound', shortcut: 'Space' }, { id: 'sfx:new', label: 'New conversation' }],
  },
  leftPanel: { title: 'Projects', icon: icon('M3 7h18M3 12h18M3 17h12') },
  rightPanel: { title: 'Sound', icon: icon('M3 10v4M7 6v12M11 3v18M15 8v8M19 11v2') },
  layout: { leftWidth: 280, rightWidth: 520, minPanelWidth: 260, maxPanelWidth: 640 },
  Provider: SfxProvider,
  slots: { LeftPanel: SfxLeftPanel, Content: SfxContent, Inspector: SfxInspector },
  hooks: {
    useCommands: () => [
      { id: 'sfx:play', label: 'Play / pause sound', shortcut: 'Space', action: () => void toggleSfxPlayback() },
      { id: 'sfx:new', label: 'New conversation', action: () => useSfx.getState().reset() },
    ],
    useStatus: () => {
      const thinking = useSfx((s) => s.thinking)
      const ready = useSfx((s) => s.ready.size)
      return thinking
        ? { label: 'composing', color: 'amber' }
        : { label: ready ? `${ready} sound${ready === 1 ? '' : 's'}` : 'ready', color: ready ? 'emerald' : 'neutral' }
    },
    useLayoutMode: () => 'panel',
  },
} as HudsonApp
