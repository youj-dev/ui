'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { YoujProvider, useSoundCue, useYouj } from '@youj/core'
import { CheckIcon, LinkIcon } from '@youj/icons'
import { Segmented, TabList } from '@/components/ui/controls'
import { playgroundSnippet } from './code'
import { CodePanel } from './code-panel'
import { PersonalitiesView } from './personalities'
import { PresenceView } from './presence'
import { ReducedView } from './reduced'
import { SpringsView } from './springs'
import { StaggerView } from './stagger'
import { DEFAULT_STATE, parseState, serializeState, TABS, type PlaygroundState, type PlaygroundTab } from './state'
import { TweensView } from './tweens'
import type { ViewProps } from './views'
import { copyToast } from '@/lib/copy-toast'

/* The Motion playground: every token of the motion contract on a stage, with
 * the code it takes beside notes on how it works. The views run inside a
 * YoujProvider of their own, so its Speed multiplies onto the site's clock
 * and the site's reduced motion reaches every stage. The state is the link:
 * read before the first paint and written back as it changes. */

const TAB_LABELS: Record<PlaygroundTab, string> = {
  springs: 'Springs',
  tweens: 'Tweens',
  stagger: 'Stagger',
  personalities: 'Personalities',
  presence: 'Presence',
  reduced: 'Reduced motion',
}

const VIEWS: Record<PlaygroundTab, ComponentType<ViewProps>> = {
  springs: SpringsView,
  tweens: TweensView,
  stagger: StaggerView,
  personalities: PersonalitiesView,
  presence: PresenceView,
  reduced: ReducedView,
}

type Speed = '0.25' | '0.5' | '1' | '2'
const SPEEDS: { value: Speed; label: string; title: string }[] = [
  { value: '0.25', label: '¼×', title: 'Quarter speed' },
  { value: '0.5', label: '½×', title: 'Half speed' },
  { value: '1', label: '1×', title: 'Normal speed' },
  { value: '2', label: '2×', title: 'Double speed' },
]

export function MotionPlayground() {
  const id = useId()
  const site = useYouj()
  const [state, setState] = useState<PlaygroundState>(DEFAULT_STATE)
  const [page, setPage] = useState<string | null>(null)
  const [speed, setSpeed] = useState<Speed>('1')

  // The link's state, read before the first paint so a shared view never flashes the default one.
  useLayoutEffect(() => {
    setState(parseState(window.location.search))
    setPage(`${window.location.origin}${window.location.pathname}`)
  }, [])

  // Written back as it changes, replacing the entry: trying values isn't navigation.
  const search = serializeState(state)
  useEffect(() => {
    if (!page) return
    const timer = setTimeout(() => {
      const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
      if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, '', next)
    }, 150)
    return () => clearTimeout(timer)
  }, [search, page])

  const update = useCallback((patch: Partial<PlaygroundState>) => setState((s) => ({ ...s, ...patch })), [])
  const View = VIEWS[state.tab]

  return (
    <div data-motion-playground className="not-prose overflow-hidden rounded-xl border border-line bg-surface">
      {/* The tabs run on the bar's hairline; when the settings run out of room they wrap onto a row above. */}
      <div className="flex flex-wrap-reverse items-end gap-x-2 border-b border-line px-2">
        <TabList
          idBase={id}
          label="Playground"
          value={state.tab}
          onChange={(tab) => update({ tab })}
          tabs={TABS.map((tab) => ({ value: tab, label: TAB_LABELS[tab] }))}
          className="max-w-full"
        />
        <div className="ms-auto flex h-control-lg items-center gap-1.5">
          <Segmented label="Speed" numeric options={SPEEDS} value={speed} onChange={setSpeed} />
          <ShareLink href={page ? `${page}${search ? `?${search}` : ''}` : null} />
        </div>
      </div>

      {TABS.map((tab) => (
        <div key={tab} role="tabpanel" id={`${id}-panel-${tab}`} aria-labelledby={`${id}-tab-${tab}`} hidden={tab !== state.tab}>
          {tab === state.tab &&
            (page ? (
              <YoujProvider timeScale={site.timeScale / Number(speed)} reducedMotion={site.reduced ? 'always' : 'user'}>
                <View state={state} update={update} />
                <CodePanel snippet={playgroundSnippet(state, site.motionPersonality)} />
              </YoujProvider>
            ) : (
              <div className="min-h-[46rem] bg-canvas" />
            ))}
        </div>
      ))}
    </div>
  )
}

/** Copies the link to this view: every choice on screen, nothing of the viewer's own. */
function ShareLink({ href }: { href: string | null }) {
  const k = useYouj()
  const cue = useSoundCue()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    if (!href) return
    try {
      await navigator.clipboard.writeText(href)
    } catch {
      cue('error')
      return
    }
    cue('success')
    copyToast('Link copied', 'To this motion.')
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!href}
      aria-label={copied ? 'Link copied' : 'Copy a link to this view'}
      title="Copy a link to this view"
      className="icon-button rounded-md pointer-coarse:size-10"
    >
      {copied ? <CheckIcon size={15} strokeWidth={1.75} trigger="mount" className="text-success-text" /> : <LinkIcon size={15} strokeWidth={1.6} />}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Link copied to the clipboard' : ''}
      </span>
    </button>
  )
}
