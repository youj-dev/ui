'use client'

import { AnimatePresence, m } from 'motion/react'
import { useEffect, useMemo, useRef, type ComponentProps, type CSSProperties } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { CheckIcon } from '@youj/icons'
import { segmentedRingLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat, toneColor } from '../../lib/utils'

/* An interval workout on one dial: every interval is an arc as long as it
 * lasts, work and rest in their own colors, round the ring clockwise from
 * the top, inside a ruler of ten-second ticks. Intervals behind you are lit,
 * the current one fills as it runs with a bright head at its edge, and the
 * ones ahead wait in a dim wash of their color, so the shape of the whole
 * session reads at a glance. The center holds the round in big mono, the
 * phase and the time left in it.
 * - It shows `elapsed` (seconds since the start) and keeps no clock of its
 *   own: run the timer in your app, and pause, skip or rewind it by changing
 *   `elapsed`.
 * - Sound and speech: as an interval starts it plays the notify cue and
 *   announces the phase, its length and what comes next; the last three
 *   seconds of each tick; the end plays the success cue.
 * - Motion: the round number rolls to the next. Reduced motion: it changes
 *   in place; the ring always follows the clock directly.
 * - A dial turns clockwise in every script, so the ring keeps its direction
 *   under RTL; the text in the center follows the page. */

type IntervalKind = 'work' | 'rest' | 'warmup' | 'cooldown'
type IntervalTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface SegmentedRingInterval {
  kind: IntervalKind
  /** Seconds. */
  duration: number
  /** What's done in it: "Kettlebell swings". */
  label?: string
  /** Default: work chart-1, rest chart-5, warm-up and cool-down chart-3. */
  tone?: IntervalTone
}

interface SegmentedRingProps extends Omit<ComponentProps<'div'>, 'children'> {
  intervals: SegmentedRingInterval[]
  /** Seconds since the session started. */
  elapsed: number
  /** Accessible name. Default: the labels' "Interval timer". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Plays the notify cue as an interval starts, a tick in its last three seconds and success at the end. Default true. */
  sound?: boolean
}

const KIND_TONE: Record<IntervalKind, IntervalTone> = { work: 'chart-1', rest: 'chart-5', warmup: 'chart-3', cooldown: 'chart-3' }
const toneVar = (tone: IntervalTone) => toneColor(tone, 'var(--color-fg-muted)')

/* Geometry in viewBox units, centered on the hub. */
const VIEW = 128
const RULER = { outer: 123, minor: 119.5, major: 115.5 }
const BAND = { r: 102, width: 15 }
const GAP = 1.4

const f = (n: number) => Math.round(n * 100) / 100
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [f(r * Math.sin(rad)), f(-r * Math.cos(rad))]
}
function arc(r: number, from: number, to: number) {
  const sweep = Math.min(359.99, Math.max(0.01, to - from))
  const [ax, ay] = polar(r, from)
  const [bx, by] = polar(r, from + sweep)
  return `M${ax},${ay} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${bx},${by}`
}

function SegmentedRing({ intervals, elapsed, label, locale: localeProp, sound = true, className, style, ...props }: SegmentedRingProps) {
  const k = useYouj()
  const labels = useComponentLabels(segmentedRingLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const { announce, announcer } = useAnnouncer()
  const two = useMemo(() => numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }), [locale])
  const num = useMemo(() => numberFormat(locale), [locale])
  const clock = (seconds: number) => {
    const s = Math.max(0, Math.ceil(seconds))
    return `${num.format(Math.floor(s / 60))}:${two.format(s % 60)}`
  }

  const total = intervals.reduce((sum, i) => sum + Math.max(0, i.duration), 0) || 1
  const t = Math.min(total, Math.max(0, elapsed))
  const finished = t >= total
  // Where each interval sits on the dial, and which one is running.
  let start = 0
  const spans = intervals.map((interval, i) => {
    const from = start
    start += Math.max(0, interval.duration)
    return { interval, index: i, from, to: start, tone: toneVar(interval.tone ?? KIND_TONE[interval.kind]) }
  })
  const current = finished ? spans.length - 1 : Math.max(0, spans.findIndex((s) => t < s.to))
  const span = spans[current]
  const progress = span ? Math.min(1, (t - span.from) / Math.max(0.001, span.to - span.from)) : 0
  const left = span ? span.to - t : 0
  const works = spans.filter((s) => s.interval.kind === 'work')
  // The round is the work interval running now, or the one ahead of a warm-up, or the one just done in a rest.
  const round = finished ? works.length : Math.max(1, works.filter((s) => s.from <= t).length || (works.length ? 1 : 0))
  const phase = (kind: IntervalKind) =>
    kind === 'work' ? labels.intervalWork : kind === 'rest' ? labels.intervalRest : kind === 'warmup' ? labels.intervalWarmup : labels.intervalCooldown
  const next = spans[current + 1]?.interval
  const deg = (s: number) => (s / total) * 360
  const gap = spans.length > 1 ? GAP : 0

  // Cues and announcements follow the clock forward; a first render or a rewind stays quiet.
  const last = useRef({ current, finished, second: Math.ceil(left) })
  useEffect(() => {
    const was = last.current
    last.current = { current, finished, second: Math.ceil(left) }
    if (finished && !was.finished) {
      if (sound) cue('success')
      announce(labels.intervalFinished)
    } else if (!finished && current > was.current && span) {
      if (sound) cue('notify')
      announce(labels.intervalStarted(span.interval.label ? `${phase(span.interval.kind)}: ${span.interval.label}` : phase(span.interval.kind), clock(span.to - span.from), next?.label ?? (next && phase(next.kind))))
    } else if (!finished && current === was.current && Math.ceil(left) < was.second && Math.ceil(left) <= 3 && Math.ceil(left) > 0 && sound) cue('tick')
  })

  const head = span ? polar(BAND.r, deg(span.from) + (deg(span.to - span.from) - gap) * progress + gap / 2) : [0, -BAND.r]
  const ticks = Math.min(180, Math.round(total / 10))

  return (
    <MotionFeatures>
      <div
        role="group"
        aria-label={label ?? labels.intervalTimer}
        data-slot="segmented-ring"
        data-phase={finished ? 'done' : span?.interval.kind}
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/segmented-ring relative isolate aspect-square w-full max-w-80 shrink-0', className)}
        style={{ '--interval-tone': span?.tone, ...style } as CSSProperties}
        {...props}
      >
        <svg data-slot="segmented-ring-svg" aria-hidden viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="own:block size-full overflow-visible">
          <g data-slot="segmented-ring-ruler">
            {Array.from({ length: ticks }, (_, i) => {
              const major = i % 6 === 0
              const passed = (i * 10) / total <= t / total
              const [x1, y1] = polar(major ? RULER.major : RULER.minor, (i / ticks) * 360)
              const [x2, y2] = polar(RULER.outer, (i / ticks) * 360)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={major ? 1.5 : 1}
                  strokeLinecap="round"
                  style={{ stroke: `color-mix(in oklab, var(--color-fg) ${major ? 60 : passed ? 38 : 18}%, transparent)` }}
                />
              )
            })}
          </g>
          <circle r={BAND.r - BAND.width / 2 - 7} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={1} className="stroke-line" />

          {spans.map((s) => {
            const from = deg(s.from) + gap / 2
            const to = deg(s.to) - gap / 2
            const state = finished || s.index < current ? 'done' : s.index === current ? 'current' : 'upcoming'
            return (
              <g key={s.index} data-slot="segmented-ring-segment" data-kind={s.interval.kind} data-state={state} style={{ '--segment-tone': s.tone } as CSSProperties}>
                <path
                  d={arc(BAND.r, from, to)}
                  fill="none"
                  strokeWidth={BAND.width}
                  className="transition-[stroke] yj-duration-base ease-standard"
                  style={{
                    stroke:
                      state === 'done'
                        ? 'color-mix(in oklab, var(--segment-tone) 78%, transparent)'
                        : 'color-mix(in oklab, var(--segment-tone) calc(13% + 5% * var(--yj-dark)), transparent)',
                  }}
                />
                {state === 'current' && progress > 0 && (
                  <path data-slot="segmented-ring-progress" d={arc(BAND.r, from, from + (to - from) * progress)} fill="none" strokeWidth={BAND.width} stroke="var(--segment-tone)" />
                )}
              </g>
            )
          })}

          {!finished && span && (
            <g data-slot="segmented-ring-head" transform={`translate(${head[0]} ${head[1]})`}>
              <circle r={BAND.width * 0.72} style={{ fill: 'color-mix(in oklab, var(--interval-tone) 30%, transparent)' }} />
              <circle r={BAND.width / 2 - 1.5} className="fill-fg stroke-surface" strokeWidth={2.5} />
            </g>
          )}
        </svg>

        <div data-slot="segmented-ring-center" aria-hidden className="pointer-events-none absolute inset-0 own:grid place-items-center">
          <div className="own:flex flex-col items-center gap-[2.2cqw] text-center">
            <span
              data-slot="segmented-ring-label"
              className="own:font-(family-name:--yj-label-font) own:text-[clamp(0.625rem,3.6cqw,0.75rem)] own:leading-none own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
            >
              {labels.intervalRound}
            </span>
            {/* A figure reads left to right in every script, like Counter's; its parts are inline, so they never reverse. */}
            <span data-slot="segmented-ring-value" dir="ltr" className="own:font-mono own:leading-none own:font-medium own:tracking-[-0.04em] whitespace-nowrap own:text-fg own:tabular-nums">
              <span className="relative own:inline-grid overflow-hidden align-baseline own:text-[clamp(2.5rem,22cqw,3rem)]">
                <AnimatePresence initial={false} mode="popLayout">
                  <m.span
                    key={round}
                    initial={k.reduced ? false : { y: '60%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={k.reduced ? undefined : { y: '-60%', opacity: 0 }}
                    transition={k.reduced ? { type: false } : k.spring('snappy')}
                  >
                    {num.format(round)}
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="own:text-[clamp(1rem,8cqw,1.75rem)] own:text-fg-muted">/{num.format(works.length)}</span>
            </span>
            <span
              data-slot="segmented-ring-phase"
              className={cn(
                'own:flex items-center gap-[1.4cqw] rounded-[calc(var(--yj-radius)*100)] px-[2.6cqw] py-[1cqw] own:font-mono own:text-[clamp(0.6875rem,4.2cqw,0.9375rem)] own:leading-none own:tabular-nums',
                finished ? 'bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] own:text-success' : 'bg-[color-mix(in_oklab,var(--interval-tone)_16%,transparent)] own:text-fg',
              )}
            >
              {finished ? (
                <>
                  <CheckIcon size={12} />
                  {labels.intervalFinished}
                </>
              ) : (
                <>
                  <span className="size-[0.45em] rounded-full bg-(--interval-tone)" />
                  <span className="own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]">{span && phase(span.interval.kind)}</span>
                  <span className={cn(left <= 3 && left > 0 ? 'own:text-warning' : 'own:text-fg-muted')}>{clock(left)}</span>
                </>
              )}
            </span>
          </div>
        </div>

        <p data-slot="segmented-ring-summary" className="sr-only">
          {finished
            ? labels.intervalFinished
            : `${labels.intervalRoundOf(round, works.length)}. ${span ? phase(span.interval.kind) : ''}, ${labels.intervalLeft(clock(left))}.`}
        </p>
        {announcer}
      </div>
    </MotionFeatures>
  )
}

export { SegmentedRing, type IntervalKind, type SegmentedRingInterval, type SegmentedRingProps, type IntervalTone }
