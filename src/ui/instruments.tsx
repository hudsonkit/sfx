'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function StudioLed({ on, tone = 'blue' }: { on?: boolean; tone?: 'blue' | 'amber' | 'green' }) {
  return (
    <span
      className={cn(
        'sfx-inst-led',
        on && tone === 'blue' && 'sfx-inst-led--on',
        on && tone === 'amber' && 'sfx-inst-led--amber',
        on && tone === 'green' && 'sfx-inst-led--green',
      )}
      aria-hidden
    />
  )
}

export function StudioRack({
  label,
  readout,
  children,
  className,
}: {
  label: string
  readout?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('sfx-inst-rack', className)}>
      <div className="sfx-inst-rack-header">
        <div className="sfx-inst-rack-title">
          <StudioLed on />
          <span className="sfx-inst-rack-label">{label}</span>
        </div>
        {readout ? <div className="sfx-inst-rack-readout">{readout}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function StudioScopeWell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sfx-inst-scope-well', className)}>{children}</div>
}

type PadTone = 'default' | 'amber' | 'muted'

export function StudioPadTray({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sfx-inst-pad-tray', className)}>{children}</div>
}

export function StudioPad({
  active,
  tone = 'default',
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; tone?: PadTone }) {
  return (
    <button
      type="button"
      className={cn(
        'sfx-inst-pad',
        active && 'sfx-inst-pad--active',
        tone !== 'default' && `sfx-inst-pad--${tone}`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function StudioTransportDeck({
  onStop,
  onPlay,
  onPause,
  isPlaying,
  disabled,
}: {
  onStop: () => void
  onPlay: () => void
  onPause: () => void
  isPlaying: boolean
  disabled?: boolean
}) {
  return (
    <div className="sfx-inst-deck">
      <button
        type="button"
        onClick={onStop}
        disabled={disabled}
        className="sfx-inst-transport sfx-inst-transport--aux"
        title="Stop"
      >
        <span className="sfx-inst-transport-ring" aria-hidden />
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
          <rect x="4" y="4" width="10" height="10" rx="1" />
        </svg>
      </button>

      {isPlaying ? (
        <button
          type="button"
          onClick={onPause}
          className="sfx-inst-transport sfx-inst-transport--main sfx-inst-transport--pause"
          title="Pause"
        >
          <span className="sfx-inst-transport-ring" aria-hidden />
          <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="5" height="16" rx="1" />
            <rect x="15" y="5" width="5" height="16" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          disabled={disabled}
          className="sfx-inst-transport sfx-inst-transport--main"
          title="Play"
        >
          <span className="sfx-inst-transport-ring" aria-hidden />
          <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden>
            <path d="M9 6.5v13l10-6.5-10-6.5z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export { StudioKnob } from './knob'

export function StudioModuleTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; icon?: ReactNode }>
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <div className="sfx-inst-module-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn('sfx-inst-module-tab', activeId === tab.id && 'sfx-inst-module-tab--active')}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}