'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { flowLanesLabels, useComponentLabels } from '@youj/core/labels'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { cn, numberFormat, seriesColor } from '../../lib/utils'

/* Where a stream goes: one source on the start side, a shared trunk, then a
 * fan of lanes, one per destination, each ending in a dot beside its name
 * and its rate. Particles ride the lanes from the source, so a busy lane is
 * a dense stream and a quiet one a trickle; the line's weight says the same.
 * Model routing, a load balancer's pools, a queue's consumers.
 * - Pointing: hovering a lane's name, or moving focus onto it, makes it the
 *   active lane (`onActiveChange`): its line and stream stay lit and the rest
 *   quiet, so a table beside it can point at a lane too (`active`). The names
 *   are one tab stop; the arrow keys, Home and End move between them.
 * - Semantics: a named group described by the source, the lane count and the
 *   total; the lanes are a list, each read with its rate and share. The
 *   drawing is decorative.
 * - Motion: when it scrolls into view the lanes draw out from the source on
 *   the deliberate token, a lane after another; the particles cross at one
 *   steady speed (a full width in six deliberate beats), fading in and out at
 *   the ends, and stop while the chart is off screen or `paused`. A new rate
 *   reweights the line on the slow token and reseeds the stream.
 * - Reduced motion: drawn in place, the particles still on their lanes,
 *   spaced by the rate, so the density still reads. */

type FlowLanesTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface FlowLane {
  id: string
  /** The destination: "Kestrel 3 Pro". */
  label: string
  /** Its throughput, in any unit: it sets the line's weight, the stream's density and the share. */
  value: number
  /** Default: its color in `config`, else the chart colors in order. */
  tone?: FlowLanesTone
}

interface FlowLanesProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The node every lane leaves from, named over it: "Gateway". */
  source: string
  lanes: readonly FlowLane[]
  /** The lane to light, by id (controlled); `null` for none. */
  active?: string | null
  /** The lane lit at first (uncontrolled). Default none. */
  defaultActive?: string | null
  /** Called when pointing or focus moves to a lane, or off them (`null`). */
  onActiveChange?: (id: string | null) => void
  /** Stops the particles where they are. They also stop while the chart is off screen or the tab is hidden. */
  paused?: boolean
  /** Writes a rate with its unit: "57/s". Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Flow lanes". */
  label?: string
  /** A ChartConfig shared with your other charts: a lane whose id is a key takes its color, so one series matches across chart types. */
  config?: Readonly<Record<string, { color?: string }>>
}

/** Particles across all lanes, split by share; every lane with any flow keeps one. */
const PARTICLES = 36
/** The source ring and the end dots, in px. */
const SOURCE_R = 4.5
const END_R = 3.5

/** The path of a lane, from the source along the trunk, through its bend, to its end. The trunk runs at least under the source's name (`label` px), so no bend crosses it. */
function lanePath(width: number, height: number, y: number, label: number) {
  const x0 = SOURCE_R + 1
  const sy = height / 2
  const fork = Math.min(width * 0.45, Math.max(x0 + 12, width * 0.2, label + 10))
  const bend = Math.max(24, width * 0.2)
  const end = width - END_R - 1
  const r = (n: number) => Math.round(n * 10) / 10
  return {
    d: `M${r(x0)} ${r(sy)} L${r(fork)} ${r(sy)} C${r(fork + bend / 2)} ${r(sy)} ${r(fork + bend / 2)} ${r(y)} ${r(fork + bend)} ${r(y)} L${r(end)} ${r(y)}`,
    // Close enough for pacing: the bend's chord stands in for its arc.
    length: fork - x0 + Math.hypot(bend, y - sy) + Math.max(0, end - fork - bend),
    end: [end, y] as const,
  }
}

interface ParticleProps {
  d: string
  tone: string
  /** Where on the lane it starts, 0–1. */
  phase: number
  /** One crossing, in ms. */
  duration: number
  running: boolean
  still: boolean
}

/** One particle riding its lane's path on a looping Web Animation (offset-distance); still, it rests at its phase. */
function Particle({ d, tone, phase, duration, running, still }: ParticleProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const run = useRef<Animation | null>(null)
  // Whether the stream runs: kept for a new animation (declared first, so it is current when one starts), and applied to the running one.
  const live = useRef(running)
  useEffect(() => {
    live.current = running
    if (running) run.current?.play()
    else run.current?.pause()
  }, [running])
  // A new path needs no new animation: offset-distance runs along whatever path the style gives.
  useEffect(() => {
    const el = ref.current
    if (!el || still || typeof el.animate !== 'function') return
    const animation = el.animate(
      [
        { offsetDistance: '0%', opacity: 0 },
        { opacity: 1, offset: 0.06 },
        { opacity: 1, offset: 0.9 },
        { offsetDistance: '100%', opacity: 0 },
      ],
      { duration, iterations: Number.POSITIVE_INFINITY, delay: -phase * duration, easing: 'linear' },
    )
    if (!live.current) animation.pause()
    run.current = animation
    return () => {
      animation.cancel()
      run.current = null
    }
  }, [duration, phase, still])
  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="flow-lanes-particle"
      // youj-allow: physical side the path's origin is the plot's top left; the plot mirrors itself under RTL
      className="absolute top-0 left-0 own:size-1.5 own:rounded-full"
      style={{ offsetPath: `path('${d}')`, offsetRotate: '0deg', offsetDistance: still ? `${Math.round(phase * 100)}%` : undefined, background: tone }}
    />
  )
}

function FlowLanes({
  source,
  lanes,
  active: activeProp,
  defaultActive = null,
  onActiveChange,
  paused = false,
  formatValue,
  locale: localeProp,
  label,
  config,
  className,
  style,
  ...props
}: FlowLanesProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const labels = useComponentLabels(flowLanesLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const sourceRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0, label: 0 })
  const [onScreen, setOnScreen] = useState(true)
  const [active, setActive] = useControllableState(activeProp, defaultActive)
  const [stop, setStop] = useState(0)

  useResizeMeasure(plotRef, (el) => {
    const next = { width: el.clientWidth, height: el.clientHeight, label: sourceRef.current?.offsetWidth ?? 0 }
    setSize((s) => (s.width === next.width && s.height === next.height && s.label === next.label ? s : next))
  })
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    return observeOnScreen(el, setOnScreen)
  }, [])

  const format = formatValue ?? numberFormat(locale).format
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const value = (lane: FlowLane) => Math.max(0, lane.value)
  const total = lanes.reduce((sum, lane) => sum + value(lane), 0)
  const top = Math.max(0, ...lanes.map(value))
  const toneOf = (lane: FlowLane, i: number) => seriesColor(lane.tone, config, lane.id, i, 'var(--color-fg-muted)')
  const shown = k.reduced || inView
  const still = k.reduced
  const running = shown && onScreen && !paused
  const { width, height, label: labelWidth } = size
  const pitch = lanes.length ? height / lanes.length : 0
  // One steady speed for every lane: a full width in six deliberate beats.
  const speed = width / Math.max(1, k.ms('deliberate') * 6)
  const tabStop = Math.min(stop, Math.max(0, lanes.length - 1))

  const point = (next: string | null) => {
    if (next === active) return
    setActive(next)
    onActiveChange?.(next)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, i: number) => {
    const last = lanes.length - 1
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? Math.min(last, i + 1)
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? Math.max(0, i - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined
    if (next === undefined) return
    event.preventDefault()
    rows.current[next]?.focus()
  }

  if (!lanes.length || total <= 0)
    return (
      <div role="group" aria-label={label ?? labels.flowLanes} data-slot="flow-lanes" className={cn('own:w-full', className)} style={style} {...props}>
        <div data-slot="flow-lanes-empty" className="own:grid h-28 place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted">
          {labels.noData}
        </div>
      </div>
    )

  const paths = lanes.map((_, i) => (width && pitch ? lanePath(width, height, (i + 0.5) * pitch, labelWidth) : null))
  // Whole particles per lane by share, at least one for any flow.
  const counts = lanes.map((lane) => (value(lane) > 0 ? Math.max(1, Math.round((value(lane) / total) * PARTICLES)) : 0))
  const stateOf = (lane: FlowLane) => (active == null ? undefined : active === lane.id ? 'active' : 'inactive')

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label ?? labels.flowLanes}
      aria-describedby={`${id}-summary`}
      data-slot="flow-lanes"
      className={cn('own:grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] own:gap-x-3', '[--flow-lanes-pitch:calc(var(--spacing)*(8_-_var(--ui--compact,0)))]', className)}
      style={style}
      {...props}
    >
      <div
        ref={plotRef}
        aria-hidden
        data-slot="flow-lanes-plot"
        className="relative min-w-24 rtl:-scale-x-100"
        style={{ height: `calc(var(--flow-lanes-pitch) * ${lanes.length})` }}
      >
        <span
          ref={sourceRef}
          data-slot="flow-lanes-source"
          // youj-allow: physical side the plot mirrors itself under RTL, so the source sits at its left in both
          className="absolute left-0 own:font-mono own:text-ui-xs own:text-fg-muted own:uppercase own:tracking-wider whitespace-nowrap rtl:-scale-x-100"
          style={{ bottom: `calc(50% + ${SOURCE_R + 6}px)` }}
        >
          {source}
        </span>
        {width > 0 && (
          <MotionFeatures>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 own:block overflow-visible">
              {lanes.map((lane, i) => {
                const path = paths[i]
                if (!path) return null
                const share = value(lane) / (top || 1)
                return (
                  <g
                    key={lane.id}
                    data-slot="flow-lanes-lane"
                    data-state={stateOf(lane)}
                    className="transition-opacity yj-duration-fast ease-standard data-[state=inactive]:opacity-25"
                    style={{ color: toneOf(lane, i) }}
                  >
                    <m.path
                      d={path.d}
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeOpacity={stateOf(lane) === 'active' ? 0.7 : 0.38}
                      strokeWidth={1 + share * 2}
                      className="transition-[stroke-width,stroke-opacity] yj-duration-slow ease-standard"
                      initial={{ pathLength: k.reduced ? 1 : 0 }}
                      animate={{ pathLength: shown ? 1 : 0 }}
                      transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'enter'), delay: i * k.stagger('base') }}
                    />
                    <circle cx={path.end[0]} cy={path.end[1]} r={END_R} fill="currentColor" />
                  </g>
                )
              })}
              <circle data-slot="flow-lanes-source-node" cx={SOURCE_R + 1} cy={height / 2} r={SOURCE_R} className="fill-surface stroke-fg-muted" strokeWidth={1.5} />
            </svg>
          </MotionFeatures>
        )}
        <div
          data-slot="flow-lanes-stream"
          className={cn('absolute inset-0 transition-opacity yj-duration-slow ease-standard', shown ? 'opacity-100' : 'opacity-0')}
          style={{ transitionDelay: shown && !k.reduced ? `${k.ms('deliberate')}ms` : undefined }}
        >
          {lanes.map((lane, i) => {
            const path = paths[i]
            if (!path || !counts[i]) return null
            const duration = Math.max(400, path.length / (speed || 1))
            return (
              <span
                key={lane.id}
                data-slot="flow-lanes-particles"
                data-state={stateOf(lane)}
                className="absolute inset-0 transition-opacity yj-duration-fast ease-standard data-[state=inactive]:opacity-20"
              >
                {Array.from({ length: counts[i]! }, (_, p) => (
                  <Particle
                    key={p}
                    d={path.d}
                    tone={toneOf(lane, i)}
                    // Spread evenly, offset per lane so the trunk carries a mix.
                    phase={(p + (i * 0.37) % 1) / counts[i]!}
                    duration={duration}
                    running={running}
                    still={still}
                  />
                ))}
              </span>
            )
          })}
        </div>
      </div>
      <ul
        data-slot="flow-lanes-list"
        className="own:grid min-w-0"
        style={{ gridAutoRows: 'var(--flow-lanes-pitch)' } as CSSProperties}
        onPointerLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) point(null)
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) point(null)
        }}
      >
        {lanes.map((lane, i) => (
          <li
            key={lane.id}
            ref={(el) => {
              rows.current[i] = el
            }}
            data-slot="flow-lanes-item"
            data-state={stateOf(lane)}
            tabIndex={i === tabStop ? 0 : -1}
            aria-label={labels.flowLanesItem(lane.label, format(value(lane)), percent.format(value(lane) / total))}
            onPointerEnter={() => point(lane.id)}
            onFocus={() => {
              setStop(i)
              point(lane.id)
            }}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={cn(
              'group/lane own:-mx-1.5 own:flex min-w-0 items-center own:gap-3 own:rounded-md own:px-1.5 own:text-ui focus-ring',
              'transition-[background-color,opacity] yj-duration-fast ease-standard data-[state=active]:bg-hover data-[state=inactive]:opacity-60',
            )}
          >
            <span data-slot="flow-lanes-label" className="min-w-0 flex-1 truncate own:text-fg">
              {lane.label}
            </span>
            <span data-slot="flow-lanes-value" className="shrink-0 own:font-mono own:text-ui-sm own:text-fg-muted own:group-data-[state=inactive]/lane:text-fg own:tabular-nums">
              {format(value(lane))}
            </span>
          </li>
        ))}
      </ul>
      <p id={`${id}-summary`} data-slot="flow-lanes-summary" className="sr-only">
        {labels.flowLanesSummary(source, lanes.length, format(total))}
      </p>
    </div>
  )
}

export { FlowLanes, type FlowLane, type FlowLanesProps, type FlowLanesTone }
