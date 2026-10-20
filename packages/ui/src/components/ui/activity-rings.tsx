'use client'

import { animate, m, useInView, useMotionValue, useMotionValueEvent, type UseInViewOptions } from 'motion/react'
import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { MotionFeatures, useSoundCue, type InView, type Size } from '@youj/core'
import { activityRingsLabels, useComponentLabels } from '@youj/core/labels'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'

/* Goals side by side as concentric rings: a day's move, exercise and stand,
 * a team's quotas, a quarter's key results. Each ring is its own goal, a
 * round-capped arc over a faint track of its tone, running clockwise from
 * twelve o'clock. Past its goal a ring keeps going for a second lap over the
 * first, its head casting a small shadow back onto the lap beneath so the
 * overlap reads. The bowl holds a big figure (the pointed ring's share, or the
 * first's) or the app's own content; the legend gives each ring its value,
 * goal and share, and pointing at a ring or its row singles both out.
 * - Motion: the rings fill from zero as they come into view and every later
 *   value retargets from where the ring is, on the smooth spring. A ring that
 *   closes (crosses its goal) gives a short glow and plays the success cue.
 * - Reduced motion: drawn at their values; no glow.
 * - A dial turns clockwise in every script, so the rings keep their direction
 *   under RTL; the bowl and the legend follow the page. */

type ActivityRingTone = 'accent' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'

interface ActivityRing {
  value: number
  /** The goal: the value that closes the ring. */
  max: number
  /** Its name in the legend and to assistive tech: "Move". */
  label: string
  /** A word after the goal when spoken and in the legend: "calories". */
  unit?: string
  /** Default: the chart colors in turn. */
  tone?: ActivityRingTone
  /** A glyph at the ring's start and beside its row in the legend. */
  icon?: ReactNode
}

interface ActivityRingsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Two to four goals, outermost first. */
  rings: readonly ActivityRing[]
  /** The rings' size: `sm`, `default`, `lg` or `xl`. */
  size?: Extract<Size, 'sm' | 'default' | 'lg' | 'xl'>
  /** Where the legend sits: `side` puts it beside the rings when there's room and under them when not, `below` always under. Default `false` (the rings are still spoken). */
  legend?: 'side' | 'below' | false
  /** Intl.NumberFormat options for the values. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** When the rings fill: `false` on mount; `true` (the default) or `{ once, amount, margin }` as they come into view. */
  inView?: InView
  /** Play the success cue when a ring closes. Default true. */
  sound?: boolean
  /** Names the rings for assistive tech. Default: "Activity rings". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Content for the bowl instead of the figure. */
  children?: ReactNode
}

const TONES: ActivityRingTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4']
const toneVar = (tone: ActivityRingTone) => toneColor(tone, 'color-mix(in oklab, var(--color-fg) 75%, transparent)')
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

const SIZE = {
  sm: { root: 'size-24', value: '', caption: '', icons: false },
  default: { root: 'size-40', value: 'own:text-2xl', caption: 'own:text-ui-xs', icons: true },
  lg: { root: 'size-56', value: 'own:text-4xl', caption: 'own:text-ui-sm', icons: true },
  xl: { root: 'size-72', value: 'own:text-5xl', caption: 'own:text-ui', icons: true },
}

/* Geometry in viewBox units, centered on the hub: the outer ring's edge sits at R. */
const R = 100
/** Stroke width and the gap between rings, by how many rings there are. */
const GEOMETRY: Record<number, { thick: number; gap: number }> = { 2: { thick: 22, gap: 5 }, 3: { thick: 17, gap: 4 }, 4: { thick: 14, gap: 3.5 } }
/** The second lap is as far as a ring draws. */
const LAPS = 2
/** A ring at zero still shows its round cap, as a dot. */
const DOT = 0.0001
const f = (n: number) => Math.round(n * 1000) / 1000

function ActivityRings({
  rings,
  size = 'default',
  legend = false,
  format,
  inView: inViewProp,
  sound = true,
  label,
  locale: localeProp,
  children,
  className,
  style,
  ...props
}: ActivityRingsProps) {
  const k = useYouj()
  const labels = useComponentLabels(activityRingsLabels)
  const locale = useLocale(localeProp)
  const id = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.4 })
  const seen = useInView(ref, { once: when.once, amount: when.amount, margin: when.margin as UseInViewOptions['margin'] })
  const active = k.reduced || !when.onView || seen
  const [pointed, setPointed] = useState<number | null>(null)

  const s = SIZE[size]
  const { thick, gap } = GEOMETRY[Math.min(4, Math.max(2, rings.length))]!
  const number = numberFormat(locale, format ?? { maximumFractionDigits: 0 })
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const items = rings.map((ring, i) => {
    const share = ring.max > 0 ? Math.max(0, ring.value) / ring.max : 0
    const goal = ring.unit ? `${number.format(ring.max)} ${ring.unit}` : number.format(ring.max)
    return {
      ring,
      share,
      tone: ring.tone ?? TONES[i % TONES.length]!,
      radius: R - thick / 2 - i * (thick + gap),
      goal,
      spoken: labels.activityRingsValue(ring.label, number.format(ring.value), goal, percent.format(share)),
    }
  })
  const focus = pointed != null ? items[pointed] : items[0]
  const point = (i: number | null) => () => setPointed(i)
  const hub = R - rings.length * (thick + gap)

  const dial = (
    <div
      role="group"
      aria-label={label ?? labels.activityRings}
      data-slot="activity-rings-dial"
      className={cn('relative own:grid shrink-0 place-items-center', s.root)}
      onPointerLeave={point(null)}
    >
      <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="absolute inset-0 size-full overflow-visible">
        <defs>
          {/* The head of a second lap casts its shadow forward, onto the lap beneath it. */}
          <filter id={`${id}-cap`} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy={thick * 0.18} stdDeviation={thick * 0.14} style={{ floodColor: 'var(--color-shadow)', floodOpacity: 0.55 }} />
          </filter>
        </defs>
        {items.map((item, i) => (
          <Ring
            key={i}
            index={i}
            {...item}
            thick={thick}
            target={active ? Math.min(item.share, LAPS) : 0}
            dimmed={pointed != null && pointed !== i}
            filter={`url(#${id}-cap)`}
            sound={sound}
            onPoint={point(i)}
          />
        ))}
      </svg>
      {s.icons &&
        items.map((item, i) =>
          item.ring.icon ? (
            <span
              key={i}
              aria-hidden
              data-slot="activity-rings-icon"
              className="pointer-events-none absolute left-1/2 own:grid -translate-x-1/2 -translate-y-1/2 place-items-center own:text-canvas [&_svg]:size-full"
              style={{ top: `${((R - item.radius) / (2 * R)) * 100}%`, width: `${((thick * 0.62) / (2 * R)) * 100}%`, aspectRatio: '1' }}
            >
              {item.ring.icon}
            </span>
          ) : null,
        )}
      {(children != null || size !== 'sm') && (
        <div
          data-slot="activity-rings-center"
          className="pointer-events-none relative own:flex flex-col items-center justify-center own:gap-1.5 own:text-center"
          style={{ width: `${(hub / R) * 85}%` }}
        >
          {children ??
            (focus && (
              <>
                <span data-slot="activity-rings-value" className={cn('own:block own:leading-none own:font-semibold own:tracking-[-0.03em] own:text-fg own:tabular-nums', s.value)}>
                  {percent.format(focus.share)}
                </span>
                <span data-slot="activity-rings-caption" dir="auto" className={cn('max-w-full truncate own:leading-none own:text-fg-muted', VOICE, s.caption)}>
                  {focus.ring.label}
                </span>
              </>
            ))}
        </div>
      )}
    </div>
  )

  const root = {
    ref,
    'data-slot': 'activity-rings',
    'data-size': size,
    style,
    ...props,
  }
  if (!legend)
    return (
      <MotionFeatures>
        <div {...root} className={cn('own:inline-flex', className)}>
          {dial}
        </div>
      </MotionFeatures>
    )

  // The legend sits beside the rings when there's room (a container query on the root's own width), else under them.
  return (
    <MotionFeatures>
      <div {...root} data-yj-legend={legend} className={cn('@container/activity-rings w-full min-w-0', className)}>
        <div className={cn('own:flex flex-col items-center gap-5', legend === 'side' && '@[28rem]/activity-rings:flex-row @[28rem]/activity-rings:gap-8')}>
          {dial}
          <ul data-slot="activity-rings-legend" className="own:flex w-full max-w-80 min-w-0 flex-1 flex-col" onPointerLeave={point(null)}>
            {items.map((item, i) => (
              <li
                key={i}
                tabIndex={0}
                data-slot="activity-rings-item"
                data-highlighted={pointed === i || undefined}
                data-closed={item.share >= 1 || undefined}
                className={cn(
                  'flex min-h-10 min-w-0 items-center gap-3 border-t border-line py-2 own:rounded-sm transition-opacity yj-duration-fast ease-standard first:border-t-0 focus-ring',
                  pointed != null && pointed !== i && 'opacity-45',
                )}
                style={{ '--ring-tone': toneVar(item.tone) } as CSSProperties}
                onPointerEnter={point(i)}
                onFocus={point(i)}
                onBlur={point(null)}
              >
                {item.ring.icon ? (
                  <span aria-hidden data-slot="activity-rings-swatch" className="own:grid size-4 shrink-0 place-items-center own:text-(--ring-tone) [&_svg]:size-full">
                    {item.ring.icon}
                  </span>
                ) : (
                  <span aria-hidden data-slot="activity-rings-swatch" className="size-2.5 shrink-0 own:rounded-full bg-(--ring-tone)" />
                )}
                <span data-slot="activity-rings-label" dir="auto" className={cn('min-w-0 flex-1 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
                  {item.ring.label}
                </span>
                <span data-slot="activity-rings-amount" dir="auto" className="shrink-0 own:text-ui own:text-fg own:tabular-nums">
                  <span className="own:font-medium">{number.format(item.ring.value)}</span>
                  <span className="own:text-fg-muted"> / {item.goal}</span>
                </span>
                <span data-slot="activity-rings-share" dir="auto" className="w-12 shrink-0 own:text-end own:text-ui-sm own:text-fg-muted own:tabular-nums">
                  {percent.format(item.share)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MotionFeatures>
  )
}

interface RingProps {
  index: number
  ring: ActivityRing
  share: number
  tone: ActivityRingTone
  radius: number
  spoken: string
  thick: number
  /** Where the arc heads, in laps (0 to 2). */
  target: number
  dimmed: boolean
  filter: string
  sound: boolean
  onPoint: () => void
}

/** One goal: its track, the first lap, the second lap over it with the shadowed head, and the closing glow. */
function Ring({ index, ring, share, tone, radius, spoken, thick, target, dimmed, filter, sound, onPoint }: RingProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const progress = useMotionValue(k.reduced ? target : 0)
  const lap1 = useRef<SVGCircleElement>(null)
  const lap2 = useRef<SVGCircleElement>(null)
  const head = useRef<SVGGElement>(null)
  const [glow, setGlow] = useState(0)

  useEffect(() => {
    if (k.reduced) {
      progress.jump(target)
      return
    }
    const run = animate(progress, target, k.spring('smooth'))
    return () => run.stop()
  }, [target, k, progress])

  // The arcs follow the spring frame by frame through their attributes; a render draws where the spring is.
  const paint = (t: number) => {
    lap1.current?.setAttribute('stroke-dasharray', `${f(Math.max(DOT, Math.min(t, 1)))} 2`)
    const second = Math.min(Math.max(t - 1, 0), 1)
    lap2.current?.setAttribute('stroke-dasharray', `${f(Math.max(DOT, second))} 2`)
    head.current?.setAttribute('transform', `rotate(${f(second * 360)})`)
    head.current?.setAttribute('opacity', t > 1 ? '1' : '0')
    lap2.current?.setAttribute('opacity', t > 1 ? '1' : '0')
  }
  const last = useRef(progress.get())
  useMotionValueEvent(progress, 'change', (t) => {
    if (!k.reduced && last.current < 1 && t >= 1) {
      setGlow((n) => n + 1)
      if (sound) cue('success')
    }
    last.current = t
    paint(t)
  })

  const color = toneVar(tone)
  const first = progress.get()
  const arc = { r: radius, fill: 'none', strokeWidth: thick, strokeLinecap: 'round' as const, pathLength: 1 }
  return (
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: an SVG group is not interactive; it carries the ring as a meter
    <g
      role="meter"
      aria-label={ring.label}
      aria-valuemin={0}
      aria-valuemax={ring.max}
      aria-valuenow={Math.min(Math.max(ring.value, 0), ring.max)}
      aria-valuetext={spoken}
      data-slot="activity-rings-ring"
      data-index={index}
      data-tone={tone}
      data-closed={share >= 1 || undefined}
      data-yj-over={share > 1 || undefined}
      className="transition-opacity yj-duration-fast ease-standard"
      style={{ opacity: dimmed ? 0.3 : 1, color }}
      transform="rotate(-90)"
    >
      <circle
        data-slot="activity-rings-track"
        {...arc}
        stroke={`color-mix(in oklab, ${color} 20%, transparent)`}
        pointerEvents="stroke"
        onPointerEnter={onPoint}
      />
      <circle ref={lap1} data-slot="activity-rings-arc" {...arc} stroke="currentColor" strokeDasharray={`${f(Math.max(DOT, Math.min(first, 1)))} 2`} pointerEvents="none" />
      {/* The head of the second lap: a cap-sized dot at its end, with the shadow, under the arc's own end. */}
      <g ref={head} opacity={first > 1 ? 1 : 0} transform={`rotate(${f(Math.min(Math.max(first - 1, 0), 1) * 360)})`} pointerEvents="none">
        <circle data-slot="activity-rings-head" cx={radius} cy={0} r={thick / 2} fill="currentColor" filter={filter} />
      </g>
      <circle
        ref={lap2}
        data-slot="activity-rings-overlap"
        {...arc}
        stroke="currentColor"
        opacity={first > 1 ? 1 : 0}
        strokeDasharray={`${f(Math.max(DOT, Math.min(Math.max(first - 1, 0), 1)))} 2`}
        pointerEvents="none"
      />
      {glow > 0 && (
        <m.circle
          key={glow}
          data-slot="activity-rings-glow"
          aria-hidden
          r={radius}
          fill="none"
          stroke="currentColor"
          pointerEvents="none"
          initial={{ opacity: 0.6, strokeWidth: thick }}
          animate={{ opacity: 0, strokeWidth: thick * 2.4 }}
          transition={k.tween('deliberate', 'enter')}
          style={{ filter: `blur(${f(thick * 0.2)}px)` }}
        />
      )}
    </g>
  )
}

export { ActivityRings, type ActivityRingsProps, type ActivityRing, type ActivityRingTone }
