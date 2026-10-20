'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, ThemeScope, useDirection, useYouj, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { CheckIcon, PlayIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button, buttonVariants } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, POINTS, type HeroSplitCopy, type HeroSplitCta, type HeroSplitFocus, type HeroSplitPoint } from './hero-split/data'
import { DemoProduct } from './hero-split/demo'

/* A split hero whose selling points steer the picture. The pitch sits on
 * the inline start; on the end, the product in a window. Each point is a
 * button that owns a part of that window: pick one (or let the tour go
 * round) and the window's camera glides there, a spring of zoom and pan
 * that never leaves the picture's edges, while that part plays its moment
 * and the rest dims: a preview going from Building to Ready, a rollback
 * landing, the traffic line drawing with the deploy that moved it. The tour
 * fills a line under the point on show; it waits for the window to settle
 * in, holds while keyboard focus is on the points, off screen and in a
 * hidden tab, and stops for good when someone picks a point (Play in the
 * window's title bar starts it again). Pointing at the window pulls the
 * camera back to show all of it.
 *
 * Pass your own `media` (the screen in the window, usually a screenshot) and
 * `points`, each with a `focus` on that screen; a point without one is plain
 * text, and with none the window just shows the picture. Every other string
 * is in `copy`, and `linkComponent` renders the links. Reduced motion: no
 * tour and no camera; the whole window, at rest. */

/** Milliseconds each point is shown while the tour runs, before the Speed control. */
const DWELL = 4800

interface HeroSplitProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width), and the title is an h2. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroSplitCopy>
  /** The selling points under the description: a label, or `{ id, label, focus }`, a button that sends the window's camera to its spot. Empty hides the list. Default: the demo's three. */
  points?: (string | HeroSplitPoint)[]
  /** The point on show (its id), controlled. */
  value?: string
  /** The point on show first, uncontrolled. Default: the first with a focus. */
  defaultValue?: string
  /** Called with the point's id when someone picks one or the tour moves on. */
  onValueChange?: (value: string) => void
  /** Tour the points on its own until someone picks one. Default true (never under reduced motion). */
  autoAdvance?: boolean
  /** The screen in the window, usually your product's screenshot; the points' `focus` is measured on it. Give an image its `alt`. Default: the demo's deploy dashboard (decorative, hidden from assistive tech). */
  media?: ReactNode
  /** The main call to action. Default: "Start for free" to `#signup`. */
  primaryCta?: HeroSplitCta
  /** The second call to action; `null` hides it. Default: "Book a demo" to `#demo`. */
  secondaryCta?: HeroSplitCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** The camera's place for a focus: scaled from the top-left corner, and moved so the spot is centred as far as the picture's edges allow. */
function shot(focus: HeroSplitFocus | undefined, rtl: boolean) {
  if (!focus) return { x: '0%', y: '0%', scale: 1 }
  const zoom = Math.max(1, focus.zoom ?? 1.5)
  const fx = rtl ? 1 - focus.x : focus.x
  return {
    x: `${clamp(0.5 - fx * zoom, 1 - zoom, 0) * 100}%`,
    y: `${clamp(0.5 - focus.y * zoom, 1 - zoom, 0) * 100}%`,
    scale: zoom,
  }
}

function HeroSplit({
  theme,
  embedded = false,
  copy: copyProp,
  points: pointsProp = POINTS,
  value: valueProp,
  defaultValue,
  onValueChange,
  autoAdvance = true,
  media,
  primaryCta = { label: 'Start for free', href: '#signup' },
  secondaryCta = { label: 'Book a demo', href: '#demo' },
  linkComponent: Link = 'a',
  headingLevel = embedded ? 2 : 1,
  className,
  ...rest
}: HeroSplitProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const points = pointsProp.map((p) => (typeof p === 'string' ? { id: p, label: p } : p))
  const steerable = points.filter((p) => p.focus)
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? steerable[0]?.id ?? '')
  const index = Math.max(0, steerable.findIndex((p) => p.id === value))
  const shown = steerable[index]
  const [visit, setVisit] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  // The camera waits for the window to rise in before its first move.
  const [settled, setSettled] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const visible = useVisible(root)
  const tourable = autoAdvance && !k.reduced && steerable.length > 1
  const touring = tourable && !stopped
  const go = (id: string) => {
    setValue(id)
    setVisit((n) => n + 1)
    onValueChange?.(id)
  }

  useEffect(() => {
    if (k.reduced) return
    const timer = setTimeout(() => setSettled(true), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  }, [k])

  // The line under the point on show is the tour's clock: when it fills, the camera moves on.
  const clock = useRef<Animation | null>(null)
  useEffect(() => {
    if (!touring) return
    const line = [...(root.current?.querySelectorAll<HTMLElement>('[data-yj-progress]') ?? [])].find((el) => el.dataset.yjProgress === value)
    if (!line || typeof line.animate !== 'function') return
    const animation = line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DWELL * k.timeScale, easing: 'linear', fill: 'forwards' })
    clock.current = animation
    animation.finished.then(
      () => go(steerable[(index + 1) % steerable.length]!.id),
      () => {},
    )
    return () => {
      animation.cancel()
      clock.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the tour restarts on these; what it steps through is read as it runs
  }, [touring, value, visit, k])
  useEffect(() => {
    const animation = clock.current
    if (!animation) return
    if (hovering || focused || !visible || !settled) animation.pause()
    else animation.play()
  }, [hovering, focused, visible, settled, value, visit, touring])

  const lens = settled && !hovering && !k.reduced ? shown?.focus : undefined

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('relative text-fg', !embedded && 'overflow-hidden bg-canvas', className)}>
      <div
        ref={root}
        className={cn(
          'grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16',
          !embedded && 'mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28',
        )}
      >
        <Stagger inView={false} variant="rise" className="flex min-w-0 flex-col items-start gap-6">
          {copy.badge && <Badge variant="default">{copy.badge}</Badge>}
          <Title id={titleId} className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
            {copy.headline}
          </Title>
          <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          {points.length > 0 && (
            <ul
              aria-label={copy.pointsLabel}
              className="flex w-full max-w-md flex-col gap-0.5"
              onFocus={(event) => event.target.matches(':focus-visible') && setFocused(true)}
              onBlur={(event) => !event.currentTarget.contains(event.relatedTarget as Node | null) && setFocused(false)}
            >
              {points.map((point) => {
                const on = !!point.focus && point.id === shown?.id
                const mark = (
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full transition-colors yj-duration-base ease-standard',
                      on ? 'bg-accent text-on-accent' : 'bg-accent-subtle text-accent',
                    )}
                  >
                    <CheckIcon size={12} strokeWidth={2.25} />
                  </span>
                )
                if (!point.focus)
                  return (
                    <li key={point.id} className="flex items-center gap-2.5 py-1.5 text-ui text-fg">
                      {mark}
                      {point.label}
                    </li>
                  )
                return (
                  <li key={point.id}>
                    <button
                      type="button"
                      aria-current={on ? 'true' : undefined}
                      onClick={() => {
                        setStopped(true)
                        go(point.id)
                      }}
                      className="group/point flex w-full items-start gap-2.5 rounded-md py-1.5 text-start text-ui focus-ring"
                    >
                      {mark}
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-px">
                        <span className={cn('transition-colors yj-duration-fast ease-standard', on ? 'text-fg' : 'text-fg-muted group-hover/point:text-fg')}>{point.label}</span>
                        <span aria-hidden className={cn('relative block h-px overflow-hidden bg-line', !(on && touring) && 'invisible')}>
                          <span data-yj-progress={point.id} className="absolute inset-0 origin-left bg-accent rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({ size: 'lg' })}>
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </Stagger>
        <Reveal inView={false} variant="rise" delay={4} delayStep="loose" className="min-w-0">
          <div
            className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl shadow-fg/10"
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
          >
            <div className="flex h-10 items-center gap-3 border-b border-line ps-4 pe-1">
              <span aria-hidden className="flex w-12 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2.5 rounded-full bg-well" />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-ui-sm text-fg-muted">{copy.url}</span>
              <span className="flex w-12 justify-end">
                {tourable && (
                  <Button variant="ghost" size="icon-sm" aria-label={touring ? copy.pause : copy.play} onClick={() => setStopped(touring)}>
                    <PlayIcon size={14} active={touring} />
                  </Button>
                )}
              </span>
            </div>
            <div data-slot="camera" className="relative overflow-hidden">
              <MotionFeatures>
                <m.div initial={false} animate={shot(lens, rtl)} transition={k.tween('deliberate', 'emphasized')} style={{ originX: 0, originY: 0 }}>
                  {media === undefined ? (
                    <div aria-hidden inert>
                      <DemoProduct focus={lens ? (shown?.id ?? null) : null} visit={visit} />
                    </div>
                  ) : (
                    media
                  )}
                </m.div>
              </MotionFeatures>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HeroSplit }
export type { HeroSplitProps, HeroSplitCopy, HeroSplitCta, HeroSplitPoint, HeroSplitFocus }
