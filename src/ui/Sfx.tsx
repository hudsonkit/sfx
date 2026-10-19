'use client'

/**
 * SFX — conversation-first sound design.
 *
 * Three panes over one store (store.ts): SfxSidebar (projects,
 * conversations, sounds), SfxThread (chat history + composer, sounds inline
 * as cards with a player and toggles) and SfxPages (pages spun up from cards:
 * the studio player plus the mixer). In the studio they mount in the Hudson
 * shell's left panel, content and inspector; `SfxStandalone` lays them out
 * standalone for demos and embeds.
 *
 * The agent is scripted; every sound is a real patch from the ebook-reader
 * run, rendered and played live.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { downloadBlob, encodeWav, slugify } from '../engine/wav'
import { loudnessDb, renderCached } from '../audio/transport'
import { FullPlayer, InlinePlayer } from './Player'
import { MixRack } from './MixRack'
import { sfxConfig } from './config'
import {
  livePatch,
  PROJECTS,
  SET_BRIEF,
  SET_PROJECT,
  SOUNDS,
  STARTERS,
  stageFromLocation,
  useSfx,
  versionsOf,
  type CardState,
  type SfxSound,
  type SfxStage,
} from './store'
import ebook from '../demo/ebookReader.json'

export type { SfxStage } from './store'

// ── Cards ──────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, children, title }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode; title?: string }) {
  return (
    <button type="button" title={title} className={`sfx-toggle ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      {children}
    </button>
  )
}

function Star({ on }: { on: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden className="sfx-star">
      <path
        d="M6 1.2l1.45 2.95 3.25.47-2.35 2.3.55 3.24L6 8.63 3.1 10.16l.55-3.24L1.3 4.62l3.25-.47z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SoundCard({ sound, state, ready, status, pinned, isOpen, onUpdate, onOpen }: {
  sound: SfxSound
  state: CardState
  ready: boolean
  status?: string | null
  /** An earlier turn's take: show that version as it was, not the live one. */
  pinned?: number
  isOpen?: boolean
  onUpdate: (patch: Partial<CardState>) => void
  onOpen: () => void
}) {
  const versions = versionsOf(sound, state)
  const isPinned = pinned !== undefined && pinned !== state.version
  const patch = !versions.length ? null : isPinned ? versions[pinned] : livePatch(sound, state)
  const hasPrev = versions.length > 1 && !isPinned
  const latest = versions.length - 1
  const edited = !!state.mixes[state.version]
  return (
    <div className={`sfx-card ${ready ? '' : 'is-pending'} ${isOpen && !isPinned ? 'is-open' : ''}`}>
      <div className="sfx-card-head">
        <div className="sfx-min0">
          <p className="sfx-card-name">{sound.name}</p>
          <p className="sfx-card-sub">{sound.trigger}</p>
        </div>
        {ready && patch ? (
          <span className="sfx-card-meta">
            {isPinned ? <span>v{pinned + 1} · </span> : null}
            {edited && !isPinned ? <span className="sfx-edited">edited · </span> : null}
            {patch.layers.length} layers
          </span>
        ) : null}
      </div>
      {ready && patch ? (
        <>
          <InlinePlayer id={isPinned ? `${sound.key}@${pinned}` : sound.key} patch={patch} vary={state.vary} />
          <div className="sfx-card-tools">
            {patch.variation ? (
              <Toggle on={state.vary} onChange={(vary) => onUpdate({ vary })} title="Humanize each play">Vary</Toggle>
            ) : null}
            {hasPrev ? (
              <span className="sfx-ab" role="group" aria-label="Compare with the first version">
                <button type="button" className={state.version === 0 ? 'is-on' : ''} aria-pressed={state.version === 0} onClick={() => onUpdate({ version: 0 })} title="First version">v1</button>
                <button type="button" className={state.version === latest ? 'is-on' : ''} aria-pressed={state.version === latest} onClick={() => onUpdate({ version: latest })} title="Latest version">v{latest + 1}</button>
              </span>
            ) : null}
            <Toggle on={state.kept} onChange={(kept) => onUpdate({ kept })} title="Mark this sound as a keeper">
              <Star on={state.kept} /> {state.kept ? 'Kept' : 'Keep'}
            </Toggle>
            <button type="button" className="sfx-link" onClick={onOpen}>Open ↗</button>
          </div>
        </>
      ) : (
        <>
          <div className="sfx-inline-player sfx-skeleton" aria-hidden>
            <span className="sfx-skeleton-orb" />
            <span className="sfx-skeleton-well" />
          </div>
          <div className="sfx-card-pending"><span className="sfx-dot-pulse" /> {status ?? 'Composing…'}</div>
        </>
      )}
    </div>
  )
}

// ── Plan / export cards ────────────────────────────────────────────────────

function PlanCard({ selected, onToggle, onCompose, locked }: {
  selected: Set<string>
  onToggle: (key: string) => void
  onCompose: () => void
  locked: boolean
}) {
  return (
    <div className="sfx-panel">
      <p className="sfx-eyebrow">Sound palette</p>
      <dl className="sfx-palette">
        {ebook.palette.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p className="sfx-eyebrow sfx-mt">Sounds · {selected.size} of {SOUNDS.length}</p>
      <ul className="sfx-slots">
        {SOUNDS.map((s) => (
          <li key={s.key}>
            <label>
              <input type="checkbox" checked={selected.has(s.key)} disabled={locked} onChange={() => onToggle(s.key)} />
              <span className="sfx-slot-name">{s.name}</span>
              <span className="sfx-slot-trigger">{s.trigger}</span>
            </label>
          </li>
        ))}
      </ul>
      {locked ? null : (
        <div className="sfx-panel-actions">
          <button type="button" className="sfx-primary" onClick={onCompose} disabled={selected.size === 0}>
            Compose {selected.size} sounds
          </button>
          <span className="sfx-hint">or reply to change the plan</span>
        </div>
      )}
    </div>
  )
}

function ExportCard({ keys }: { keys: string[] }) {
  const exportCommand = sfxConfig().exportCommand?.(slugify(ebook.project))
  const states = useSfx((s) => s.cards)
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [takes, setTakes] = useState(4)
  const all = useSfx((s) => s.sounds)
  const sounds = useMemo(() => all.filter((s) => keys.includes(s.key)), [all, keys])

  useEffect(() => {
    let live = true
    Promise.all(sounds.map(async (s) => [s.key, loudnessDb(await renderCached(livePatch(s, states[s.key])))] as const))
      .then((pairs) => { if (live) setLevels(Object.fromEntries(pairs)) })
    return () => { live = false }
  }, [sounds, states])

  return (
    <div className="sfx-panel">
      <p className="sfx-eyebrow">Loudness balance</p>
      <ul className="sfx-levels">
        {sounds.map((s) => {
          const db = levels[s.key]
          const pct = db === undefined ? 0 : Math.max(4, Math.min(100, ((db + 40) / 32) * 100))
          return (
            <li key={s.key}>
              <span className="sfx-slot-name">{s.name}</span>
              <span className="sfx-level"><span style={{ width: `${pct}%` }} /></span>
              <span className="sfx-level-db">{db === undefined ? '…' : `${db.toFixed(1)} dB`}</span>
            </li>
          )
        })}
      </ul>
      <p className="sfx-hint sfx-mt-sm">All takes are peak-normalized today — a per-sound loudness target would let the bookmark sit quieter than the close.</p>
      <p className="sfx-eyebrow sfx-mt">Package</p>
      <div className="sfx-export-row">
        <span>Round-robin takes for varying sounds</span>
        <div className="sfx-seg">
          {[1, 4, 6].map((n) => (
            <button key={n} type="button" className={takes === n ? 'is-on' : ''} onClick={() => setTakes(n)}>{n}</button>
          ))}
        </div>
      </div>
      {exportCommand ? (
        <div className="sfx-code">
          <code>{exportCommand}</code>
          <button type="button" className="sfx-copy" onClick={() => void navigator.clipboard?.writeText(exportCommand)} aria-label="Copy command">Copy</button>
        </div>
      ) : null}
      <div className="sfx-panel-actions">
        <button
          type="button"
          className="sfx-primary"
          onClick={async () => {
            for (const s of sounds) {
              const patch = livePatch(s, states[s.key])
              downloadBlob(encodeWav(await renderCached(patch)), `${slugify(ebook.project)}-${s.key}.wav`)
            }
          }}
        >
          Download WAV pack
        </button>
        <button
          type="button"
          className="sfx-secondary"
          onClick={() => downloadBlob(new Blob([JSON.stringify({
            version: 1,
            kind: 'sfx-set',
            name: ebook.project,
            sounds: sounds.map((s) => ({ name: s.name, key: s.key, patch: livePatch(s, states[s.key]) })),
          }, null, 2)], { type: 'application/json' }), `${slugify(ebook.project)}.sfx-set.json`)}
        >
          Set JSON
        </button>
      </div>
    </div>
  )
}

// ── Right pane: pages spun up from cards ───────────────────────────────────

function SoundPage({ sound, scaleSeconds }: { sound: SfxSound; scaleSeconds?: number }) {
  const state = useSfx((s) => s.cards[sound.key])
  const updateCard = useSfx((s) => s.updateCard)
  const versions = versionsOf(sound, state)
  const patch = livePatch(sound, state)
  const onUpdate = (p: Partial<CardState>) => updateCard(sound.key, p)
  const keptAt = useSfx((s) => s.keptAt[sound.key])
  const pageRef = useRef<HTMLDivElement>(null)
  const [flash, setFlash] = useState(false)
  // Keep as vN: bring the head (and the new version number) into view.
  useEffect(() => {
    if (!keptAt) return
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setFlash(true)
    const t = window.setTimeout(() => setFlash(false), 700)
    return () => window.clearTimeout(t)
  }, [keptAt])
  return (
    <div className="sfx-page" ref={pageRef}>
      <div className="sfx-page-head">
        <div>
          <p className="sfx-page-title">{sound.name}</p>
          <p className="sfx-card-sub">{versions[state.version].summary}</p>
        </div>
        <div className={`sfx-stepper ${flash ? 'is-flash' : ''}`}>
          <button type="button" disabled={state.version === 0} onClick={() => onUpdate({ version: state.version - 1 })} aria-label="Previous version">‹</button>
          <span>v{state.version + 1} of {versions.length}</span>
          <button type="button" disabled={state.version >= versions.length - 1} onClick={() => onUpdate({ version: state.version + 1 })} aria-label="Next version">›</button>
        </div>
      </div>
      <FullPlayer id={sound.key} patch={patch} vary={state.vary} scaleSeconds={scaleSeconds} />
      {patch.variation ? (
        <div className="sfx-card-tools">
          <Toggle on={state.vary} onChange={(vary) => onUpdate({ vary })} title="Humanize each play">Vary {Math.round(patch.variation * 100)}%</Toggle>
        </div>
      ) : null}
      <MixRack soundKey={sound.key} />
      {patch.notes ? <p className="sfx-hint sfx-mt">{patch.notes}</p> : null}
    </div>
  )
}

// ── Panes ──────────────────────────────────────────────────────────────────

/** Boot the shared store once with a stage (prop, then ?stage=). */
export function useSfxBoot(stage?: SfxStage) {
  const boot = useSfx((s) => s.boot)
  useEffect(() => { boot(stage ?? stageFromLocation()) }, [boot, stage])
}

export function SfxSidebar({ brand = false }: { brand?: boolean }) {
  const ready = useSfx((s) => s.ready)
  const cards = useSfx((s) => s.cards)
  const activeTab = useSfx((s) => s.activeTab)
  const sounds = useSfx((s) => s.sounds)
  const title = useSfx((s) => s.title)
  const { reset, openTab } = useSfx.getState()
  const soundList = ready.size > 0 ? (
    <div className="sfx-side-sounds">
      {sounds.filter((s) => ready.has(s.key)).map((s) => (
        <button key={s.key} type="button" className={`sfx-side-sound ${activeTab === s.key ? 'is-active' : ''}`} onClick={() => openTab(s.key)}>
          <span className={`sfx-dot ${cards[s.key].kept ? 'is-kept' : ''}`} />
          {s.name}
        </button>
      ))}
    </div>
  ) : null
  return (
    <aside className="sfx-sidebar">
      {brand ? <div className="sfx-brand"><span className="sfx-brand-mark">◉</span> sfx</div> : null}
      <button type="button" className="sfx-new" onClick={reset}>＋ New</button>
      <nav className="sfx-projects">
        {PROJECTS.map((p, pi) => (
          <div key={p.name} className="sfx-project">
            <p className={`sfx-project-name ${pi === 0 ? 'is-active' : ''}`}>{p.name}</p>
            {p.conversations.map((c, ci) => {
              const active = pi === 0 && ci === 0
              return (
                <div key={c}>
                  <p className={`sfx-convo ${active ? 'is-active' : ''}`}>{active ? title : c}</p>
                  {active ? soundList : null}
                </div>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export function SfxThread() {
  const stage = useSfx((s) => s.stage)
  const messages = useSfx((s) => s.messages)
  const selected = useSfx((s) => s.selected)
  const ready = useSfx((s) => s.ready)
  const thinking = useSfx((s) => s.thinking)
  const draft = useSfx((s) => s.draft)
  const cards = useSfx((s) => s.cards)
  const sounds = useSfx((s) => s.sounds)
  const status = useSfx((s) => s.status)
  const focusKey = useSfx((s) => s.focusKey)
  // A new sound's card carries the live status itself.
  const pendingCard = !!focusKey && !ready.has(focusKey)
  const focusSound = focusKey ? sounds.find((x) => x.key === focusKey) : undefined
  const tabs = useSfx((s) => s.tabs)
  const hasPlan = messages.some((m) => m.role === 'agent' && m.card === 'plan')
  const { send, compose, toggleSelected, openTab, setDraft, updateCard } = useSfx.getState()
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, ready.size, thinking])

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  const empty = messages.length === 0
  const planLocked = stage !== 'plan'
  const composedKeys = useMemo(() => sounds.filter((s) => selected.has(s.key)).map((s) => s.key), [sounds, selected])

  const composer = (
    <form className={`sfx-composer ${empty ? 'sfx-composer--hero' : ''}`} onSubmit={(e) => { e.preventDefault(); send(draft) }}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        rows={empty ? 3 : 1}
        placeholder={empty ? 'Describe one sound, or the app and the moments that need sound…' : focusSound ? `Refine ${focusSound.name.toLowerCase()} — softer, brighter, longer…` : stage === 'plan' && hasPlan ? 'Change the plan, or press Compose…' : 'Ask for changes — name a sound, or the whole set…'}
      />
      <div className="sfx-composer-bar">
        <div className="sfx-composer-chips">
          <span className="sfx-meta-chip" title="The model composing your sounds"><span className="sfx-status-dot" /> {sfxConfig().modelLabel}</span>
          <span className="sfx-meta-chip sfx-kbd-hint">↵ send · ⇧↵ newline · Space play</span>
        </div>
        <button type="submit" className="sfx-send" disabled={!draft.trim() || thinking} aria-label="Send">↑</button>
      </div>
    </form>
  )

  return (
    <main className="sfx-main">
      <header className="sfx-main-head">
        <span className="sfx-crumb">{SET_PROJECT}</span>
        <span className="sfx-crumb-sep">/</span>
        <span className="sfx-crumb-strong">{empty ? 'New conversation' : focusSound ? focusSound.name : `${SET_PROJECT} sounds`}</span>
      </header>

      {empty ? (
        <div className="sfx-hero">
          <h1>What should it sound like?</h1>
          <p>Describe one sound and it gets composed. Describe an app and its moments, and it plans a coherent set. Either way, refine in conversation.</p>
          {composer}
          <div className="sfx-starters">
            {STARTERS.map((s, i) => (
              <button key={s} type="button" className="sfx-starter" onClick={() => send(i === 0 ? SET_BRIEF : s)}>{s}</button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="sfx-thread" ref={threadRef}>
            <div className="sfx-thread-inner">
              {messages.map((m, mi) => m.role === 'user' ? (
                <div key={m.id} className="sfx-msg sfx-msg--user"><div className="sfx-bubble">{m.text}</div></div>
              ) : (
                <div key={m.id} className="sfx-msg sfx-msg--agent">
                  <p className="sfx-agent-text">{m.text}</p>
                  {m.card === 'plan' ? (
                    <PlanCard selected={selected} locked={planLocked} onCompose={compose} onToggle={toggleSelected} />
                  ) : null}
                  {m.card === 'composing' ? (
                    <div className="sfx-cards">
                      {sounds.filter((s) => composedKeys.includes(s.key)).map((s) => (
                        <SoundCard
                          key={s.key}
                          sound={s}
                          state={cards[s.key]}
                          ready={ready.has(s.key)}
                          isOpen={tabs.includes(s.key)}
                          onUpdate={(p) => updateCard(s.key, p)}
                          onOpen={() => openTab(s.key)}
                        />
                      ))}
                    </div>
                  ) : null}
                  {m.card === 'sound' && m.soundKey ? (() => {
                    const s = sounds.find((x) => x.key === m.soundKey)!
                    return (
                      <div className="sfx-cards sfx-cards--single">
                        <SoundCard
                          sound={s}
                          state={cards[s.key]}
                          ready={ready.has(s.key)}
                          status={status}
                          pinned={m.version}
                          isOpen={tabs.includes(s.key)}
                          onUpdate={(p) => updateCard(s.key, p)}
                          onOpen={() => openTab(s.key)}
                        />
                      </div>
                    )
                  })() : null}
                  {m.card === 'export' ? <ExportCard keys={composedKeys} /> : null}
                  {/* Suggestions only while they're the latest turn. */}
                  {m.chips && mi === messages.length - 1 && !thinking ? (
                    <div className="sfx-starters sfx-starters--inline">
                      {m.chips.map((c) => <button key={c} type="button" className="sfx-starter" onClick={() => send(c)}>{c}</button>)}
                    </div>
                  ) : null}
                </div>
              ))}
              {thinking && !pendingCard ? <div className="sfx-msg sfx-msg--agent"><p className="sfx-agent-text sfx-thinking"><span className="sfx-dot-pulse" /> {status ?? 'Thinking…'}</p></div> : null}
            </div>
          </div>
          <div className="sfx-composer-dock">{composer}</div>
        </>
      )}
    </main>
  )
}

export function SfxPages({ empty }: { empty?: ReactNode }) {
  const tabs = useSfx((s) => s.tabs)
  const activeTab = useSfx((s) => s.activeTab)
  const split = useSfx((s) => s.split)
  const sounds = useSfx((s) => s.sounds)
  const { setActiveTab, closeTab, setSplit } = useSfx.getState()
  const shownTabs = split ? tabs.slice(-2) : tabs.filter((k) => k === activeTab)
  const comparing = split && shownTabs.length > 1
  const cards = useSfx((s) => s.cards)
  const [scale, setScale] = useState<number | undefined>()

  // Compare: both sounds on one time scale (the longer one's).
  const shownKey = shownTabs.join('|')
  useEffect(() => {
    if (!comparing) { setScale(undefined); return }
    let live = true
    Promise.all(shownKey.split('|').map((k) => renderCached(livePatch(sounds.find((x) => x.key === k)!, cards[k]))))
      .then((buffers) => { if (live) setScale(Math.max(...buffers.map((b) => b.duration))) })
    return () => { live = false }
  }, [comparing, shownKey, sounds, cards])

  if (tabs.length === 0) return empty ? <>{empty}</> : null

  return (
    <section className="sfx-pane">
      <div className="sfx-tabs">
        {tabs.map((key) => {
          const s = sounds.find((x) => x.key === key)!
          return (
            <div key={key} className={`sfx-tab ${shownTabs.includes(key) ? 'is-active' : ''}`}>
              <button type="button" onClick={() => setActiveTab(key)}>
                {split && shownTabs.length > 1 && shownTabs.includes(key) ? <span className="sfx-tab-ab">{shownTabs.indexOf(key) === 0 ? 'A' : 'B'}</span> : null}
                {s.name}
              </button>
              <button type="button" className="sfx-tab-x" aria-label={`Close ${s.name}`} onClick={() => closeTab(key)}>×</button>
            </div>
          )
        })}
        {tabs.length > 1 ? (
          <button type="button" className={`sfx-split ${split ? 'is-on' : ''}`} onClick={() => setSplit(!split)} title="Compare the last two side by side">
            {split ? 'Single' : 'Compare'}
          </button>
        ) : null}
      </div>
      <div className={`sfx-pages ${split && shownTabs.length > 1 ? 'is-split' : ''}`}>
        {shownTabs.map((key) => <SoundPage key={key} sound={sounds.find((x) => x.key === key)!} scaleSeconds={scale} />)}
      </div>
    </section>
  )
}

/** Standalone three-column layout (no shell) — demos, embeds, previews. */
export function SfxStandalone({ stage }: { stage?: SfxStage }) {
  useSfxBoot(stage)
  const booted = useSfx((s) => s.booted)
  if (!booted) return null
  return (
    <div className="sfx-root sfx-app">
      <SfxSidebar brand />
      <SfxThread />
      <SfxPages />
    </div>
  )
}

/** Flows embeds: one no-props screen per stage of the journey. */
export const StartScreen = () => <SfxStandalone stage="start" />
export const PlanScreen = () => <SfxStandalone stage="plan" />
export const ComposingScreen = () => <SfxStandalone stage="composing" />
export const DetailScreen = () => <SfxStandalone stage="detail" />
export const ExportScreen = () => <SfxStandalone stage="export" />
