'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { animate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { YoujProvider, ThemeScope, useYouj } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { Badge, Button, Input, Switch } from '@youj/react'
import { cn } from '@/lib/cn'
import { PauseButton, StackToggle, ThemeSwatches } from '../stack/controls'
import { LayerStack, type StackLayer } from '../stack/layer-stack'
import type { StackMode } from '../stack/use-stack-progress'
import { crossingAt, liftAt, passFor } from './crossing'

/* One card and the four presets, as planes. The scene arrives apart, the
 * whole diagram in view: the card on top in Graphite, the planes under it.
 * Once it pins under the header, the scroll carries the card down through
 * Terminal, Brutal and Basalt and home to Graphite, and as it crosses
 * each plane that preset wipes over it: color, type, radius and density at
 * once. The trip is measured to the pinned run, so it starts as the scene
 * settles and is home before the scene moves on, and the scene is sized to
 * the viewport, so every plane and the controls stay on screen meanwhile.
 * The swatches take the card straight to a preset, through every plane on
 * the way; the toggle folds the stack into the working card. Reduced motion
 * keeps the diagram still, off the track, and moves the card at a click. */

/** The order the card meets the planes, top first. */
const ORDER: ThemeId[] = ['terminal', 'brutal', 'basalt', 'graphite']
const START: ThemeId = 'graphite'
const CARD_W = 300
/** How far along the pinned run the card is home. It holds there for the rest, so the last crossing reads before the scene moves on. */
const HOME = 0.9
/** Space kept clear under the pinned scene, px. */
const FOOT = 16
/** Less room than this for the stage, px (a phone on its side), and the scene doesn't pin: it scrolls by at its own size. */
const MIN_ROOM = 320

const SWATCHES = ['canvas', 'surface', 'line-strong', 'fg', 'accent', 'success', 'warning', 'danger'] as const

function InviteCard({ live = false }: { live?: boolean }) {
  const id = useId()
  const off = live ? undefined : -1
  return (
    <div className="w-[300px] max-w-full min-w-0 rounded-xl border border-line bg-surface p-4 font-sans text-fg shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_5%,transparent),0_14px_36px_-16px_color-mix(in_oklab,var(--color-shadow)_30%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ui font-semibold">Invite teammates</p>
          <p className="mt-0.5 text-ui-sm text-fg-muted">They join acme on your plan.</p>
        </div>
        <Badge>Pro</Badge>
      </div>
      <div className="mt-3 flex gap-2">
        <Input aria-label="Email" placeholder="name@acme.com" tabIndex={off} className="min-w-0 flex-1" />
        <Button tabIndex={off}>Invite</Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span id={live ? `${id}-share` : undefined} className="text-ui">
          Share usage with them
        </span>
        <Switch defaultChecked aria-labelledby={live ? `${id}-share` : undefined} tabIndex={off} />
      </div>
    </div>
  )
}

/** A picture of the card in a preset: nothing in it moves. */
function Pictured({ theme, timeScale }: { theme: ThemeId; timeScale: number }) {
  return (
    <ThemeScope theme={internalPresetById(theme)}>
      <YoujProvider timeScale={timeScale} reducedMotion="always">
        <InviteCard />
      </YoujProvider>
    </ThemeScope>
  )
}

/**
 * The card on its way down: the preset it's in, and the next one wiping over
 * it from the top edge while it crosses that plane, with a hairline in the
 * new accent where it meets the plane.
 */
function CrossingCard({ passed, wipeRef, timeScale }: { passed: number; wipeRef: RefObject<HTMLDivElement | null>; timeScale: number }) {
  const current = passed === 0 ? START : ORDER[passed - 1]!
  const next = ORDER[passed]
  return (
    <div ref={wipeRef} className="relative">
      <Pictured theme={current} timeScale={timeScale} />
      {next && (
        <>
          <div className="absolute top-0 left-0" style={{ clipPath: 'inset(0 0 calc((1 - var(--wipe, 0)) * 100%) 0)' }}>
            <Pictured theme={next} timeScale={timeScale} />
          </div>
          <ThemeScope theme={internalPresetById(next)}>
            <span
              aria-hidden
              className="absolute inset-x-[-10px] h-px bg-accent shadow-[0_0_12px_1px_var(--color-accent)]"
              style={{ top: 'calc(var(--wipe, 0) * 100%)', opacity: 'clamp(0, calc(min(var(--wipe, 0), 1 - var(--wipe, 0)) * 8), 1)' }}
            />
          </ThemeScope>
        </>
      )}
    </div>
  )
}

/** A preset as a plane: its canvas, lit by its accent, its name in its own type, its palette. */
function PresetPlane({ id }: { id: ThemeId }) {
  const theme = internalPresetById(id)
  return (
    <ThemeScope theme={theme}>
      <div
        className="absolute -inset-x-9 -inset-y-7 rounded-2xl border border-line-strong bg-band font-sans"
        style={{
          backgroundImage: 'radial-gradient(80% 70% at 0% 0%, color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 70%)',
        }}
      >
        <p className="absolute top-3 left-4 text-[17px] leading-none font-semibold tracking-[-0.01em] text-fg">{theme.name}</p>
        <div className="absolute right-4 bottom-3 flex gap-1">
          {SWATCHES.map((token) => (
            <span
              key={token}
              className="size-3 rounded-[min(var(--radius-sm),3px)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_14%,transparent)]"
              style={{ background: `var(--color-${token})` }}
            />
          ))}
        </div>
      </div>
    </ThemeScope>
  )
}

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>['offset']>

interface Fit {
  /** The stage's room under the header once the controls have theirs, px; undefined until measured. */
  room?: number
  /** The pinned run, as scroll offsets on the track: from the scene pinning to the track letting it go. */
  pin?: ScrollOffset
}

/**
 * Fits the scene to the viewport and measures its pinned run. Remeasured
 * when the viewport, the scene or its controls (which wrap when narrow)
 * change size.
 */
function useFit(scene: RefObject<HTMLElement | null>, controls: RefObject<HTMLElement | null>): Fit {
  const [fit, setFit] = useState<Fit>({})
  useLayoutEffect(() => {
    const el = scene.current
    const bar = controls.current
    if (!el || !bar) return
    const update = () => {
      // Where it pins: the sticky offset under the header, resolved to px.
      const top = parseFloat(getComputedStyle(el).top) || 0
      const room = document.documentElement.clientHeight - top - bar.offsetHeight - FOOT
      const pin: ScrollOffset = [`start ${top}px` as const, `end ${top + el.offsetHeight}px` as const]
      setFit((f) => (f.room === room && f.pin?.join() === pin.join() ? f : { room, pin }))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    observer.observe(bar)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [scene, controls])
  return fit
}

/**
 * The stack rests apart: the diagram. The toggle folds it into the working
 * card and back on the smooth spring (at once under reduced motion); once the
 * scene has left the view, it's apart again.
 */
function useApart(target: RefObject<HTMLElement | null>) {
  const k = useYouj()
  const explode = useMotionValue(1)
  const [mode, setMode] = useState<StackMode>('exploded')

  useEffect(() => {
    const to = mode === 'exploded' ? 1 : 0
    if (k.reduced) {
      explode.set(to)
      return
    }
    const run = animate(explode, to, k.spring('smooth'))
    return () => run.stop()
  }, [mode, k, explode])

  useEffect(() => {
    const el = target.current
    if (!el || mode === 'exploded' || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) setMode('exploded')
    })
    io.observe(el)
    return () => io.disconnect()
  }, [target, mode])

  return { explode, mode, choose: setMode }
}

/** The pass down the stack: the scroll's over `offset`, until a swatch takes over (and until the scene has left the view). */
function usePass(target: RefObject<HTMLElement | null>, offset: ScrollOffset) {
  const k = useYouj()
  const { scrollYProgress } = useScroll({ target, offset })
  const trip = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v / HOME)))
  const smooth = useSpring(trip, k.spring('smooth'))
  const pass = useMotionValue(0)
  const [manual, setManual] = useState<number | null>(null)
  const following = manual === null && !k.reduced

  useEffect(() => {
    if (!following) return
    pass.set(smooth.get())
    return smooth.on('change', (v) => pass.set(v))
  }, [following, smooth, pass])

  useEffect(() => {
    if (following) return
    const to = manual ?? 0
    if (k.reduced) {
      pass.set(to)
      return
    }
    // Longer trips take longer: a slow step per plane or so, so every crossing reads.
    const distance = Math.abs(to - pass.get())
    const run = animate(pass, to, { type: 'tween', duration: k.duration('slow') * (1 + 4 * distance), ease: k.ease('emphasized') })
    return () => run.stop()
  }, [following, manual, k, pass])

  useEffect(() => {
    const el = target.current
    if (!el || manual === null || k.reduced || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) setManual(null)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [target, manual, k.reduced])

  return { pass, manual, setManual }
}

export function ThemeLayers({ className }: { className?: string }) {
  const k = useYouj()
  const captionId = useId()
  const track = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const controls = useRef<HTMLDivElement>(null)
  const wipe = useRef<HTMLDivElement>(null)
  const { room, pin } = useFit(scene, controls)
  const fits = room === undefined || room >= MIN_ROOM
  const pinned = !k.reduced && fits
  const { explode, mode, choose } = useApart(track)
  // Unpinned, the trip runs while the scene crosses the viewport instead.
  const { pass, manual, setManual } = usePass(track, pinned && pin ? pin : ['start end', 'end start'])
  const lift = useTransform(pass, (p) => liftAt(p, ORDER.length))
  const [paused, setPaused] = useState(false)

  // How far down it is: a render only when it passes a plane; the wipe is written straight to the card.
  const [passed, setPassed] = useState(0)
  useEffect(() => {
    const apply = (p: number) => {
      const at = crossingAt(p, ORDER.length)
      setPassed(at.passed)
      wipe.current?.style.setProperty('--wipe', at.wipe.toFixed(4))
    }
    apply(pass.get())
    return pass.on('change', apply)
  }, [pass])
  const current: ThemeId = passed === 0 ? START : ORDER[passed - 1]!
  // On a swatch's trip, the swatches mark where the card is headed, not the plane it's passing, so a click on that plane's swatch still counts.
  const headed = manual === null ? undefined : ORDER.find((_, i) => passFor(i, ORDER.length) === manual)

  const layers = useMemo<StackLayer[]>(() => {
    const presets: StackLayer[] = [...ORDER].reverse().map((id) => {
      const theme = internalPresetById(id)
      return {
        id,
        name: theme.name,
        detail: `${theme.motionPersonality} · ${theme.radius} radius · ${theme.controlSize}`,
        content: <PresetPlane id={id} />,
        sheet: false,
        anchor: [CARD_W + 36, 150] as const,
      }
    })
    return [
      ...presets,
      {
        id: 'card',
        name: 'Card',
        detail: 'one set of components',
        content: <CrossingCard passed={passed} wipeRef={wipe} timeScale={k.timeScale} />,
        sheet: false,
        label: false,
        lift,
      },
    ]
  }, [passed, k.timeScale, lift])

  const working = useMemo(
    () => (
      <ThemeScope theme={internalPresetById(current)}>
        <InviteCard live />
      </ThemeScope>
    ),
    [current],
  )

  return (
    <figure aria-labelledby={captionId} className={cn('not-prose relative m-0', className)}>
      {/* The track: room for the scene (46rem is the most it measures, stage and
          controls) and a screen's scroll after it, which the card's trip takes
          with the scene pinned. Its height doesn't hang on the scene's, so
          nothing below moves when the stage measures itself. */}
      <div ref={track} className={cn(pinned && 'h-[calc(100svh+46rem)]')}>
        <div ref={scene} className={cn('top-[calc(var(--header-height,3.5rem)+1rem)]', pinned && 'sticky')}>
          <LayerStack
            layers={layers}
            explode={explode}
            width={CARD_W}
            height={196}
            gap={92}
            bleed={40}
            maxHeight={fits ? room : undefined}
            restAt="center"
            live={!paused}
            assembled={working}
          />
          <div ref={controls} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 pt-2 pb-4">
            <StackToggle mode={mode} onChange={choose} labels={['Assembled', 'Layers']} />
            <span aria-hidden className="h-4 w-px bg-line max-sm:hidden" />
            <ThemeSwatches
              value={headed ?? current}
              onChange={(id) => {
                if (mode === 'assembled') choose('exploded')
                setManual(passFor(ORDER.indexOf(id), ORDER.length))
              }}
            />
            <PauseButton paused={paused} onChange={setPaused} disabled={k.reduced} />
            <p aria-hidden className="w-full text-center font-sans text-[11px] text-fg-muted">
              card in <span className="text-fg">{internalPresetById(current).name}</span>
            </p>
          </div>
        </div>
      </div>
      <figcaption id={captionId} className="sr-only">
        One card, built from Youj components (a badge, an input, a button and a switch), over four theme presets stacked as planes:
        Terminal, Brutal, Basalt and Graphite. As the card passes down through each plane it takes on that preset: its colors, its
        type, its corner radius and its density. It is in {internalPresetById(current).name} now.
      </figcaption>
    </figure>
  )
}
