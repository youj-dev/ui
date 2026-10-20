'use client'

import { Component, lazy, startTransition, Suspense, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Stage } from '@/components/site/stage'
import { cn } from '@/lib/cn'
import { stageBox, stageCapped, type StageReserve } from '@/lib/preview'

export interface PreviewFrameProps {
  name: string
  file: string
  /** Edge-to-edge stage, for backgrounds and full-width compositions. */
  full?: boolean
  /** Minimum stage height in px. */
  height?: number
  /** The demo's measured height on a phone and from `sm` up, when it's more than `height` (lib/stage-heights.json). */
  reserve?: StageReserve
  /** The example's full page. One of the very tall examples (STAGE_CAP_FROM) shows capped, with an Expand to it. */
  view?: string
  /** A page's stories (components/docs/stories-view.tsx): a Story menu in the strip that switches the example on show. */
  story?: {
    value: string
    options: { id: string; label: string }[]
    onChange: (story: string) => void
    named?: boolean
    /** The picked story (`value`) isn't on show yet: the stage breathes until it is (./story-switch). */
    pending?: boolean
    /** A story's item is pointed at or focused: load its demo ahead. */
    onIntent?: (story: string) => void
    /** The frame is live and the browser idle: load what's likely next. */
    onIdle?: () => void
  }
}

/** How far outside the viewport (px) a frame wakes. */
const WAKE_MARGIN = 200
/** What wakes a frame besides scrolling near it: a mouse over it, a key or keyboard focus inside it. */
const WAKE_EVENTS = ['pointerover', 'focusin', 'keydown'] as const
/** The island and the stage with its demo: a chunk of their own, loaded when a frame wakes. */
const Live = lazy(() => import('./preview-live').then((live) => ({ default: live.PreviewLive })))

/** Keeps the shell if the live half fails to load (offline, a stale chunk after a deploy): the page stays up. */
class KeepShell extends Component<{ shell: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.shell : this.props.children
  }
}

/**
 * A docs example that costs the page nothing until a reader nears it. What the
 * page ships and hydrates for it is a shell: the stage as an empty box at its
 * full height (the demo's measured one when that's more than `height`,
 * lib/stage-heights.json, so nothing moves when it fills) and a place for the
 * code. The stage's providers, the demo and the island of controls (Preview
 * and Code, the look, the device, Replay, motion and size, Copy; ./preview-live,
 * with the examples index and each demo behind its own dynamic import) load as
 * a chunk of their own once the frame comes within WAKE_MARGIN of the
 * viewport, or is pointed at, focused or typed into. A page of a dozen
 * examples runs the one or two a reader is at instead of all of them.
 *
 * Each example's island is docked inside its own stage (upright at the right
 * edge from `sm` up, a row under the stage on a phone). Its Code opens the site's large code modal, which
 * fetches the file the first time (lib/code-load.ts). Where there is no
 * IntersectionObserver the frame wakes at once.
 */
export function PreviewFrame(props: PreviewFrameProps) {
  const { name, file, full = false, height = 320, reserve, view, story } = props
  const stage = stageBox(height, reserve, !!view && stageCapped(reserve))
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  const wake = useCallback(() => startTransition(() => setLive(true)), [])

  useEffect(() => {
    const el = root.current
    if (!el || live) return
    if (!window.IntersectionObserver) {
      wake()
      return
    }
    const onEvent = (event: Event) => {
      if (event.type === 'pointerover' && (event as PointerEvent).pointerType !== 'mouse') return
      wake()
    }
    const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && wake(), { rootMargin: `${WAKE_MARGIN}px 0px` })
    observer.observe(el)
    for (const type of WAKE_EVENTS) el.addEventListener(type, onEvent, { capture: true, passive: true })
    return () => {
      observer.disconnect()
      for (const type of WAKE_EVENTS) el.removeEventListener(type, onEvent, { capture: true })
    }
  }, [live, wake])

  const shell = (
    // Busy until the demo arrives, so a screen reader that lands here knows it's coming.
    // It wears the live panel's look (the aurora in light), so the background is there before the demo is.
    <div id={`${id}-panel-preview`} aria-busy data-preview-panel="" data-site-look="" className="relative">
      <Stage data-preview-stage="" data-site-look="" className={cn('relative flex items-center justify-center overflow-hidden font-sans', stage.className)} style={stage.style} />
      {/* The island's place, held until it arrives (a row under the stage on a phone). */}
      <div aria-hidden className="island-dock" style={{ '--strip-bg': 'var(--color-canvas)' } as CSSProperties} />
    </div>
  )

  return (
    // The example's name and page height let scripts/stage-heights.ts measure its demo.
    <div ref={root} data-example={name} data-height={height} className="not-prose my-7">
      <div data-preview-box="" className="preview-box site-card rounded-xl">
        {live ? (
          <KeepShell shell={shell}>
            <Suspense fallback={shell}>
              <Live name={name} file={file} full={full} height={height} reserve={reserve} view={view} story={story} id={id} />
            </Suspense>
          </KeepShell>
        ) : (
          shell
        )}
      </div>
    </div>
  )
}
