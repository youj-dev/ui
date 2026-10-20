'use client'

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { DEFAULT_LOOK, ThemeScope, YoujProvider, useYouj } from '@youj/core'
import type { Scheme } from '@/components/showroom/hooks'
import { cn } from '@/lib/cn'
import { modePreset, sitePreset } from '@/lib/preview'
import { useSiteTheme } from '@/lib/site-theme'
import { labelType, labelValue, loopSeconds, type LoaderEntry, type Look } from './catalog'
import { contextFor, contextLabel } from './context-copy'
import { loadLoader, type LoaderComponent } from './live'
import { Stage } from '@/components/site/stage'

/* The hero's stage: the loader on show, the star, live in the middle of the paper, in the stage's own light or dark,
 * with its own label under it when it's shown. It's drawn at the size set in the panel, the size the code is written
 * with, through its own `size` (a loader is drawn from code, crisp at any size), so a change of size shows at once;
 * past what the room holds (a small screen) it's drawn as large as the room allows.
 *
 * In context (the stage's toolbar) puts it in the app window it would hold still (./context: a deploy, an upload, an
 * assistant at work, a dashboard, a splash), one large window filling the room, the loader as large as before at the
 * middle of its body. There's one loader, laid over the window rather than in it: the window keeps a slot of the
 * loader's box, and the loader sits on the slot, on its paper. So it never restarts: turning context on or off glides
 * it the few px between the two places (a transform, on the slow token) while the window fades in or out around it,
 * and a change of mind mid-way turns it round from where it is. The windows are a chunk of their own, fetched the
 * first time they're asked for (or once the page is idle). A new loader stays hidden until its chunk is in, and the
 * last one holds the stage meanwhile. Reduced motion (the stage's or the site's): no glide, no fade, and the loader's
 * still frame. `rate` plays the stage's clock faster or slower (a closer look; the loop's own pace is `look.cycle`,
 * which goes into the code). Like every loader, it stops while it's off screen or its tab is hidden. */

const loadSurfaces = () => import('./context')
const LoaderContext = lazy(loadSurfaces)

/** Fetches the context windows ahead of their first use (the page calls it once it's idle). */
export const prefetchSurfaces = () => void loadSurfaces().catch(() => {})

/** Room kept clear over the loader (the toolbar) and under it: the island's edge from lg, where it hangs on the stage, a margin under that. */
const CLEAR = { top: 56, island: 48, edge: 16 }
const WIDE = '(min-width: 64rem)'

/** The most the stage can draw a loader at: most of the room's height, narrower for a wide one or one with its label beside it, in 4px steps. */
export function stageFit(room: { w: number; h: number }, aspect: number, beside: boolean) {
  const tall = room.h * 0.74
  const wide = (room.w * (beside ? 0.5 : 0.84)) / aspect
  return Math.max(24, Math.floor(Math.min(tall, wide) / 4) * 4)
}

interface Place {
  x: number
  y: number
}

const samePlace = (a: Place | null, b: Place) => !!a && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5

export interface LoaderStageProps {
  entry: LoaderEntry
  look: Look
  context: boolean
  scheme: Scheme
  /** The stage's reduced motion (the site's own applies as well). */
  reduced: boolean
  /** Playback speed of the stage's clock: 0.5, 1 or 2. */
  rate: number
  /** Holds the loader's current frame. */
  held: boolean
  /** Bumped to play the loop again from the top. */
  replay: number
  /** Whether a loader is on the stage yet, and whether the one asked for came. */
  onStatus?: (status: { ready: boolean; failed: boolean }) => void
}

export function LoaderStage({ entry, look, context, scheme, reduced: stageReduced, rate, held, replay, onStatus }: LoaderStageProps) {
  const site = useYouj()
  const siteDark = useSiteTheme().dark
  const reduced = stageReduced || site.reduced
  const preset = modePreset(scheme === 'dark')
  const themed = preset !== modePreset(siteDark)
  // Youj is scoped to the site's own preset, so the stage takes Youj's accent (Graphite's blue in light, Basalt's amber in dark).
  const youj = preset === modePreset(scheme === 'dark')

  // The loader on the stage: the one asked for once its chunk is in, the last one until then.
  const [shown, setShown] = useState<{ entry: LoaderEntry; Component: LoaderComponent } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setFailed(null)
    loadLoader(entry.id).then(
      (Component) => live && setShown({ entry, Component }),
      () => live && setFailed(entry.id),
    )
    return () => {
      live = false
    }
  }, [entry])
  const ready = shown?.entry.id === entry.id
  const report = useRef(onStatus)
  report.current = onStatus
  useEffect(() => report.current?.({ ready, failed: failed === entry.id }), [ready, failed, entry.id])

  const on = shown?.entry ?? entry
  const copy = contextFor(on)
  // The windows' chunk is asked for the first time context is on.
  const [wanted, setWanted] = useState(context)
  if (context && !wanted) setWanted(true)

  const stage = useRef<HTMLDivElement>(null)
  const art = useRef<HTMLDivElement>(null)
  // The slot is state, not a ref: it arrives with the windows' chunk, and the loader is placed once it's there.
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)
  // The room the toolbar and the island leave, the drawing's width over its height (read off it once it's drawn), and
  // the loader's whole box (its drawing and its label), which the slot keeps room for.
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null)
  const [aspect, setAspect] = useState<{ id: string; value: number } | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [paper, setPaper] = useState<string | null>(null)
  // It glides only for a change of context; anything else (a new loader, a resize) puts it there at once.
  const [glide, setGlide] = useState(false)

  const beside = look.label.show && (look.label.position === 'start' || look.label.position === 'end')
  const known = aspect?.id === on.id
  // The size set, as large as the room allows.
  const size = room ? Math.min(look.size, stageFit(room, known ? aspect.value : 1, beside)) : null

  const measure = useCallback(() => {
    const el = stage.current
    const box = art.current
    if (!el || !box) return
    const s = el.getBoundingClientRect()
    if (!s.width || !s.height) return
    const bottom = window.matchMedia(WIDE).matches ? CLEAR.island : CLEAR.edge
    const free = s.height - CLEAR.top - bottom
    setRoom((was) => (was && was.w === s.width && was.h === free ? was : { w: s.width, h: free }))
    // A wide loader is drawn narrower: its width over its height, once there's a drawing to read it off.
    const drawing = box.querySelector<HTMLElement>('.yj-anim__art')
    if (drawing?.offsetHeight) {
      const value = Math.round((drawing.offsetWidth / drawing.offsetHeight) * 100) / 100
      const id = box.dataset.id!
      setAspect((was) => (was && was.id === id && was.value === value ? was : { id, value }))
    }
    const w = box.offsetWidth
    const h = box.offsetHeight
    if (!w || !h) return
    setNatural((was) => (was && was.w === w && was.h === h ? was : { w, h }))
    if (context) {
      const hole = slot?.getBoundingClientRect()
      // Before the window has come, the loader stays where it is.
      if (!hole?.width) return
      const next = { x: hole.left - s.left, y: hole.top - s.top }
      setPlace((was) => (samePlace(was, next) ? was : next))
      setPaper(slot?.closest('[data-loader-paper]')?.getAttribute('data-loader-paper') ?? null)
    } else {
      const next = { x: (s.width - w) / 2, y: CLEAR.top + (free - h) / 2 }
      setPlace((was) => (samePlace(was, next) ? was : next))
      setPaper(null)
    }
  }, [context, slot])

  // Placed before the first paint, and again whenever the stage, the slot or the loader's own box changes size.
  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(() => measure())
    for (const el of [stage.current, slot, art.current]) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [measure, shown, size])

  // A change of context glides; the glide ends with the move. A new loader lands at once, even mid-glide.
  const last = useRef({ context, id: on.id })
  useLayoutEffect(() => {
    const was = last.current
    last.current = { context, id: on.id }
    if (was.id !== on.id) setGlide(false)
    else if (was.context !== context) setGlide(!reduced)
  }, [context, on.id, reduced])

  const Loader = shown?.Component
  // The loop's speed over its own tempo, as the code writes it (the same for the last loader while the next comes).
  const speed = Math.round((loopSeconds(entry) / look.cycle) * 100) / 100

  return (
    <YoujProvider timeScale={site.timeScale / rate} reducedMotion={reduced ? 'always' : 'user'} look={DEFAULT_LOOK}>
      <ThemeScope theme={themed || youj ? sitePreset(preset) : undefined}>
        <Stage
          ref={stage}
          theme={themed || youj ? preset : undefined}
          mode={scheme}
          data-slot="loader-stage"
          className="absolute inset-0 overflow-hidden text-fg"
          // In the site's own look the plate's aurora (ShowroomHero) shows through; a themed stage keeps its own page.
          style={themed ? undefined : { background: 'transparent' }}
        >
          {/* The loader on a dotted plate, in Raw and In context alike, clear close around the middle (the aurora needs none). */}
          {themed && <div aria-hidden className="dot-grid dots-edge pointer-events-none absolute inset-0" />}
          {/* The window around it: laid out while it's away (so the slot is known before it shows), faded in and out,
              filling the room between the toolbar and the island. */}
          {wanted && (
            <div
              className={cn(
                'absolute inset-x-0 top-[3.25rem] bottom-4 flex justify-center px-3 sm:top-14 sm:bottom-12 sm:px-[clamp(1.25rem,5%,3.5rem)]',
                'transition-[opacity,visibility] duration-(--yj-duration-slow) ease-standard',
                !context && 'invisible opacity-0',
                reduced && 'transition-none',
              )}
            >
              <Suspense fallback={null}>
                <LoaderContext
                  copy={copy}
                  caption={!look.label.show}
                  slot={<div ref={setSlot} style={{ width: natural?.w ?? size ?? 0, height: natural?.h ?? size ?? 0 }} />}
                />
              </Suspense>
            </div>
          )}

          {/* The loader: in the middle, or over its slot. Hidden until it's placed; a picture (the hero names it). */}
          <div
            aria-hidden
            data-slot="stage-loader"
            onTransitionEnd={(e) => e.target === e.currentTarget && setGlide(false)}
            className={cn(
              'absolute top-0 left-0',
              glide && 'transition-transform duration-(--yj-duration-slow) ease-emphasized',
              (!place || !Loader || !known) && 'invisible',
            )}
            style={{ transform: place ? `translate(${place.x}px, ${place.y}px)` : undefined }}
          >
            <div
              ref={art}
              key={on.id}
              data-id={on.id}
              className={cn('w-max', !reduced && 'swap-in')}
              style={{ '--yj-anim-paper': paper ?? 'var(--color-canvas)' } as CSSProperties}
            >
              {Loader && size !== null && (
                <Loader
                  key={replay}
                  size={size}
                  speed={speed}
                  color={look.ink}
                  accentColor={look.accent}
                  colors={youj ? undefined : look.colors}
                  paused={held}
                  label={labelValue(look.label)}
                  showLabel={look.label.show}
                  labelPosition={look.label.position}
                  labelEffect={look.label.effect}
                  style={labelType(look.label) as CSSProperties}
                />
              )}
            </div>
          </div>

          <p className="sr-only">{context ? contextLabel(on.title, copy) : `${on.title}, on its own.`}</p>
          {failed === entry.id && (
            <p className="absolute inset-x-0 bottom-16 px-6 text-center type-small text-fg-muted">This loader didn’t load. Check your connection and pick it again.</p>
          )}
        </Stage>
      </ThemeScope>
    </YoujProvider>
  )
}
