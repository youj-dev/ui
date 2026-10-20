'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { dayRingLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, listFormat, numberFormat } from '../../lib/utils'

/* A day of scheduled runs on a 24-hour dial: midnight at the top, clockwise,
 * a ruler of quarter-hour ticks around the edge with the part of the day
 * already gone shaded along it. Each job has its own thin track inside, its
 * runs drawn as arcs as long as they take (or ticks, for runs without a
 * duration), in the job's tone. Where runs of different jobs collide, a
 * warning wedge crosses the tracks and a marker points at it from outside
 * the ruler. A hand points at now, and the center counts down to the next
 * run (the highlighted job's, when one is highlighted).
 * - Motion: on first view the runs appear as a radar pass (each one a step
 *   later the further round the day it sits, the whole pass spanning the
 *   deliberate token) while the hand turns from midnight to now on the smooth
 *   spring, the elapsed shading riding the same spring. A run that moves
 *   glides round its track; overlaps fade in and out; highlighting cross-fades
 *   the other jobs down.
 * - Reduced motion: drawn in place; the countdown still ticks.
 * - A dial turns clockwise in every script, so the ring keeps its direction
 *   under RTL; the text in the center follows the page. */

type ScheduleTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ScheduleJob {
  id: string
  name: string
  /** When it runs today, in minutes after midnight (0–1439). */
  runs: readonly number[]
  /** How long a run takes, in minutes. With it runs are arcs; without, ticks. */
  duration?: number
  /** Default: the chart colors in turn. */
  tone?: ScheduleTone
  /** Drawn dim and dashed, and never counted as a collision. */
  paused?: boolean
}

interface ScheduleOverlap {
  /** Minutes after midnight; `end` passes 1440 when the collision runs over midnight. */
  start: number
  end: number
  /** The ids of the jobs that collide, in the order given. */
  jobs: string[]
}

interface DayRingProps extends Omit<ComponentProps<'div'>, 'children'> {
  jobs: readonly ScheduleJob[]
  /** The time the hand shows. Default: the live clock. */
  now?: Date | number
  /** The time zone the runs are in. Default: the browser's. */
  timeZone?: string
  /** A job id: its runs stay lit, the others dim, and the center counts down to its next run. */
  highlight?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Daily schedule". */
  label?: string
  /** The center's caption over the countdown. Default: the labels' "Next run". */
  nextLabel?: string
  /** Formats a minute of the day. Default: the locale's 24-hour HH:mm. */
  formatTime?: (minute: number) => string
}

const DAY = 1440
const TONES: ScheduleTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']

/* Geometry in viewBox units, centered on the hub. */
const VIEW = 128
const RULER = { outer: 114, minor: 110.5, hour: 107.5, major: 104.5, label: 96.5, band: 109.25 }
const TRACK = { outer: 86, inner: 50, gap: 10 }
const MARKER = 120.5

const f = (n: number) => Math.round(n * 100) / 100
const angleOf = (minute: number) => (minute / DAY) * 360
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [f(r * Math.sin(rad)), f(-r * Math.cos(rad))]
}
/** An arc from the top, clockwise through `sweep` degrees: rotated into place, so a run that moves glides. */
function arcFromTop(r: number, sweep: number) {
  const s = Math.min(Math.max(sweep, 0.01), 359.9)
  const [x, y] = polar(r, s)
  return `M0,${-r} A${r},${r} 0 ${s > 180 ? 1 : 0} 1 ${x},${y}`
}
function sector(inner: number, outer: number, from: number, to: number) {
  const [ax, ay] = polar(outer, from)
  const [bx, by] = polar(outer, to)
  const [cx, cy] = polar(inner, to)
  const [dx, dy] = polar(inner, from)
  const large = to - from > 180 ? 1 : 0
  return `M${ax},${ay} A${outer},${outer} 0 ${large} 1 ${bx},${by} L${cx},${cy} A${inner},${inner} 0 ${large} 0 ${dx},${dy} Z`
}
const FULL_BAND = `M0,${-RULER.band} A${RULER.band},${RULER.band} 0 1 1 0,${RULER.band} A${RULER.band},${RULER.band} 0 1 1 0,${-RULER.band}`

const toneColor = (tone: ScheduleTone) => (tone.startsWith('chart') ? `var(--color-${tone})` : tone === 'neutral' ? 'var(--color-fg-subtle)' : 'var(--color-accent)')
const toneOf = (job: ScheduleJob, index: number) => job.tone ?? TONES[index % TONES.length]!

/** Where runs of two or more jobs collide. A run without a duration takes a minute; paused jobs never collide. */
function findOverlaps(jobs: readonly ScheduleJob[]): ScheduleOverlap[] {
  const events: { at: number; job: string; delta: 1 | -1 }[] = []
  for (const job of jobs) {
    if (job.paused) continue
    const length = Math.min(DAY, Math.max(1, job.duration ?? 0))
    for (const run of job.runs) {
      const start = ((run % DAY) + DAY) % DAY
      const end = start + length
      // A run that crosses midnight wraps round to the start of the day.
      const parts: [number, number][] = end > DAY ? [[start, DAY], [0, end - DAY]] : [[start, end]]
      for (const [a, b] of parts) events.push({ at: a, job: job.id, delta: 1 }, { at: b, job: job.id, delta: -1 })
    }
  }
  // Ends before starts at the same minute, so runs that only touch don't collide.
  events.sort((a, b) => a.at - b.at || a.delta - b.delta)
  const active = new Map<string, number>()
  const order = jobs.map((j) => j.id)
  const found: ScheduleOverlap[] = []
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!
    active.set(e.job, (active.get(e.job) ?? 0) + e.delta)
    if (!active.get(e.job)) active.delete(e.job)
    const next = events[i + 1]
    if (!next || next.at === e.at || active.size < 2) continue
    const ids = order.filter((id) => active.has(id))
    const last = found.at(-1)
    if (last && last.end === e.at) {
      last.end = next.at
      for (const id of ids) if (!last.jobs.includes(id)) last.jobs.push(id)
      last.jobs.sort((a, b) => order.indexOf(a) - order.indexOf(b))
    } else found.push({ start: e.at, end: next.at, jobs: ids })
  }
  // One collision across midnight, not two halves.
  const first = found[0]
  const last = found.at(-1)
  if (found.length > 1 && first!.start === 0 && last!.end === DAY) {
    last!.end = DAY + first!.end
    for (const id of first!.jobs) if (!last!.jobs.includes(id)) last!.jobs.push(id)
    found.shift()
  }
  return found
}

/** Minutes after midnight in a time zone, with seconds as a fraction. */
function minuteOfDay(time: number, timeZone: string | undefined) {
  if (!timeZone) {
    const d = new Date(time)
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  }
  const parts = dateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(time)
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return (part('hour') % 24) * 60 + part('minute') + part('second') / 60
}

/** Days since the epoch in the runs' own time zone, so the hand's dial turns over at their midnight. */
function dayIndex(time: number, minute: number) {
  const epochMinutes = time / 60_000
  let offset = (minute - (epochMinutes % DAY)) % DAY
  if (offset > DAY / 2) offset -= DAY
  if (offset <= -DAY / 2) offset += DAY
  return Math.floor((epochMinutes + offset) / DAY)
}

/** The next start after `minute` (tomorrow's first when today's are done), as minutes from now. */
function nextStart(runs: readonly number[], minute: number) {
  let best = Infinity
  for (const run of runs) {
    const ahead = run > minute ? run - minute : run + DAY - minute
    if (ahead < best) best = ahead
  }
  return best
}

function DayRing({ jobs, now: nowProp, timeZone, highlight, locale: localeProp, label, nextLabel, formatTime, className, style, ...props }: DayRingProps) {
  const k = useYouj()
  const labels = { ...useComponentLabels(dayRingLabels) }
  if (nextLabel) labels.nextRun = nextLabel
  const locale = useLocale(localeProp)
  const descriptionId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  // The radar pass only staggers the first reveal; runs and overlaps that come later appear at once.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!shown || entered) return
    const timer = setTimeout(() => setEntered(true), k.ms('deliberate') + k.ms('slow'))
    return () => clearTimeout(timer)
  }, [shown, entered, k])
  const clock = useNow(nowProp === undefined ? 1000 : 0)
  const time = nowProp === undefined ? clock : typeof nowProp === 'number' ? nowProp : nowProp.getTime()

  const clockTime = useMemo(
    () => formatTime ?? ((minute: number) => dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(Date.UTC(2000, 0, 1, 0, minute))),
    [formatTime, locale],
  )
  const two = useMemo(() => numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }), [locale])
  const list = useMemo(() => listFormat(locale, { type: 'conjunction' }), [locale])

  const overlaps = useMemo(() => findOverlaps(jobs), [jobs])
  const minute = time === null ? null : minuteOfDay(time, timeZone)
  const active = jobs.filter((j) => !j.paused && j.runs.length > 0)
  const totalRuns = active.reduce((sum, j) => sum + j.runs.length, 0)

  // The next run: the highlighted job's, or the soonest of all.
  const focus = highlight ? active.find((j) => j.id === highlight) : undefined
  const candidates = focus ? [focus] : active
  let next: { job: ScheduleJob; ahead: number } | undefined
  if (minute !== null) {
    for (const job of candidates) {
      const ahead = nextStart(job.runs, minute)
      if (!next || ahead < next.ahead) next = { job, ahead }
    }
  }
  const countdown = (() => {
    if (!next || minute === null) return undefined
    const seconds = Math.max(0, Math.ceil(next.ahead * 60))
    return `${two.format(Math.floor(seconds / 3600))}:${two.format(Math.floor((seconds % 3600) / 60))}:${two.format(seconds % 60)}`
  })()
  const nextAt = next && minute !== null ? clockTime(Math.round(minute + next.ahead) % DAY) : undefined
  const [before = '', after = ''] = labels.runsIn('\u0001').split('\u0001')

  // The hand counts whole minutes on an unwrapped dial, so midnight turns on instead of spinning back.
  const day = time === null || minute === null ? 0 : dayIndex(time, minute)
  const handAngle = minute === null ? 0 : day * 360 + angleOf(Math.floor(minute))
  const dayStart = day * 360
  const elapsed = minute === null ? 0 : minute / DAY

  const count = jobs.length
  const gap = count > 1 ? Math.min(TRACK.gap, (TRACK.outer - TRACK.inner) / (count - 1)) : 0
  const width = Math.max(2.5, Math.min(5, gap ? gap * 0.52 : 5))
  const radiusOf = (i: number) => TRACK.outer - i * gap
  const innermost = radiusOf(Math.max(0, count - 1))
  const pass = k.reduced || entered ? 0 : k.ms('deliberate')

  return (
    <MotionFeatures>
      <div
        ref={ref}
        role="img"
        aria-label={label ?? labels.dayRing}
        aria-describedby={descriptionId}
        data-slot="day-ring"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/day-ring relative isolate aspect-square w-full max-w-80 shrink-0', className)}
        style={style}
        {...props}
      >
        <svg data-slot="day-ring-svg" aria-hidden viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="own:block size-full overflow-visible">
          <g data-slot="day-ring-ruler">
            <circle r={RULER.outer} fill="none" vectorEffect="non-scaling-stroke" className="stroke-line" strokeWidth={1} />
            {minute !== null && (
              <m.path
                data-slot="day-ring-elapsed"
                d={FULL_BAND}
                fill="none"
                strokeWidth={RULER.outer - RULER.major}
                style={{ stroke: 'color-mix(in oklab, var(--color-fg) calc(5% + 3% * var(--yj-dark)), transparent)' }}
                initial={k.reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: shown ? elapsed : 0 }}
                transition={k.reduced ? { type: false } : k.spring('smooth')}
              />
            )}
            {Array.from({ length: 96 }, (_, i) => {
              const major = i % 24 === 0
              const hour = i % 4 === 0
              const [x1, y1] = polar(major ? RULER.major : hour ? RULER.hour : RULER.minor, i * 3.75)
              const [x2, y2] = polar(RULER.outer, i * 3.75)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={major ? 1.75 : hour ? 1.25 : 1}
                  strokeLinecap="round"
                  style={{ stroke: `color-mix(in oklab, var(--color-fg) ${major ? 72 : hour ? 42 : 20}%, transparent)` }}
                />
              )
            })}
            {[0, 6, 12, 18].map((h) => {
              const [x, y] = polar(RULER.label, h * 15)
              return (
                <text
                  key={h}
                  data-slot="day-ring-hour"
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-fg-muted own:font-mono own:text-[8.5px] own:tabular-nums"
                >
                  {two.format(h)}
                </text>
              )
            })}
          </g>

          {jobs.map((job, index) => (
            <circle
              key={job.id}
              data-slot="day-ring-track"
              data-job={job.id}
              r={radiusOf(index)}
              fill="none"
              strokeWidth={width}
              className="stroke-[color-mix(in_oklab,var(--color-canvas)_calc(85%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_8%,transparent))] transition-opacity yj-duration-fast ease-standard"
              style={{ opacity: !highlight || highlight === job.id ? 1 : 0.4 }}
            />
          ))}

          <AnimatePresence>
            {overlaps.map((o) => {
              const from = angleOf(o.start)
              // A collision of a few minutes still reads as a zone, not a needle.
              const mid = (from + angleOf(o.end)) / 2
              const half = Math.max((angleOf(o.end) - from) / 2 + 1.5, 4)
              // The zone brackets the colliding jobs' tracks only, so it points at who collides.
              const radii = o.jobs.map((id) => radiusOf(Math.max(0, jobs.findIndex((j) => j.id === id))))
              const inner = Math.min(...radii) - width / 2 - 2.5
              const outer = Math.max(...radii) + width / 2 + 2.5
              return (
                <m.g
                  key={`${o.start}-${o.jobs.join('+')}`}
                  data-slot="day-ring-overlap"
                  data-jobs={o.jobs.join(' ')}
                  initial={k.reduced ? false : { opacity: 0 }}
                  animate={{ opacity: shown ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: (from / 360) * (pass / 1000) }}
                >
                  <path
                    d={sector(inner, outer, mid - half, mid + half)}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    style={{
                      fill: 'color-mix(in oklab, var(--color-warning) calc(10% + 8% * var(--yj-dark)), transparent)',
                      stroke: 'color-mix(in oklab, var(--color-warning) 70%, transparent)',
                    }}
                  />
                  <path d="M0,-116.5 L-3.4,-123.5 L3.4,-123.5 Z" transform={`rotate(${f(mid)})`} strokeLinejoin="round" strokeWidth={1.5} className="fill-warning stroke-warning" />
                </m.g>
              )
            })}
          </AnimatePresence>

          {jobs.map((job, index) => {
            const r = radiusOf(index)
            const tone = toneOf(job, index)
            const lit = !highlight || highlight === job.id
            const sweep = job.duration ? angleOf(Math.min(job.duration, DAY - 1)) : 0
            return (
              <g
                key={job.id}
                data-slot="day-ring-runs"
                data-job={job.id}
                data-tone={tone}
                data-paused={job.paused || undefined}
                data-highlighted={highlight === job.id || undefined}
                data-dimmed={!lit || undefined}
                className="transition-opacity yj-duration-fast ease-standard"
                style={{ opacity: lit ? (job.paused ? 0.34 : 1) : 0.16, '--day-ring-tone': toneColor(tone) } as CSSProperties}
              >
                {job.runs.map((run, i) => {
                  const angle = angleOf(((run % DAY) + DAY) % DAY)
                  // The group turns the run into place (so a moved run glides); the mark fades in on the radar pass.
                  const mark = {
                    'data-slot': 'day-ring-run',
                    'data-minute': run,
                    className: 'transition-opacity yj-duration-base ease-enter',
                    style: { opacity: shown ? 1 : 0, transitionDelay: pass ? `${Math.round((angle / 360) * pass)}ms` : undefined },
                  }
                  return (
                    <g
                      key={i}
                      className="transition-transform yj-duration-slow ease-standard"
                      style={{ transform: `rotate(${f(angle)}deg)`, transformBox: 'view-box', transformOrigin: '0px 0px' }}
                    >
                      {sweep ? (
                        <path
                          {...mark}
                          d={arcFromTop(r, sweep)}
                          fill="none"
                          strokeWidth={width}
                          strokeLinecap={job.paused ? 'butt' : 'round'}
                          strokeDasharray={job.paused ? '1.5 2' : undefined}
                          stroke="var(--day-ring-tone)"
                        />
                      ) : (
                        <line
                          {...mark}
                          x1={0}
                          y1={job.paused ? -r : f(-r - width / 2 - 0.75)}
                          x2={0}
                          y2={job.paused ? -r : f(-r + width / 2 + 0.75)}
                          strokeWidth={job.paused ? 1.8 : 1.4}
                          strokeLinecap="round"
                          stroke="var(--day-ring-tone)"
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {minute !== null && (
            <m.g
              data-slot="day-ring-hand"
              data-minute={Math.floor(minute)}
              initial={k.reduced ? false : { rotate: dayStart }}
              animate={{ rotate: shown ? handAngle : dayStart }}
              transition={k.reduced ? { type: false } : k.spring('smooth')}
            >
              {/* The hand's box is the whole dial, so it turns about the hub whichever box Motion rotates it in. */}
              <circle r={MARKER} fill="none" stroke="none" />
              <line x1={0} y1={f(-(innermost - width / 2 - 2))} x2={0} y2={-RULER.outer - 3} vectorEffect="non-scaling-stroke" strokeWidth={1.5} strokeLinecap="round" className="stroke-fg" />
              <circle cy={-RULER.outer - 3} r={3} className="fill-fg stroke-surface" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </m.g>
          )}
        </svg>

        {minute !== null && (
          <div data-slot="day-ring-center" aria-hidden className="pointer-events-none absolute inset-0 own:grid place-items-center">
            <div className="own:flex max-w-[36%] flex-col items-center gap-[1.2cqw] text-center">
              <span
                data-slot="day-ring-label"
                className="own:font-(family-name:--yj-label-font) own:text-[clamp(0.625rem,3.4cqw,0.75rem)] own:leading-none own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
              >
                {labels.nextRun}
              </span>
              <span data-slot="day-ring-next" className="max-w-full truncate own:font-mono own:text-[clamp(0.6875rem,4.2cqw,0.9375rem)] own:leading-tight own:text-fg">
                {next ? next.job.name : '—'}
              </span>
              {countdown && (
                <span className="own:flex items-baseline gap-[0.35em] own:font-mono own:text-[clamp(0.625rem,3.4cqw,0.75rem)] own:leading-none own:text-fg-muted">
                  {before.trim() && <span>{before.trim()}</span>}
                  <span data-slot="day-ring-value" className="own:text-[clamp(0.875rem,6cqw,1.5rem)] own:font-medium own:tracking-[-0.02em] own:text-fg own:tabular-nums">
                    {countdown}
                  </span>
                  {after.trim() && <span>{after.trim()}</span>}
                </span>
              )}
            </div>
          </div>
        )}

        <div id={descriptionId} data-slot="day-ring-description" className="sr-only">
          <p>{labels.scheduleRuns(totalRuns)}</p>
          <p>{labels.scheduleOverlaps(overlaps.length)}</p>
          {next && nextAt && <p>{`${labels.nextRun}: ${labels.scheduleRunAt(next.job.name, nextAt)}`}</p>}
          {overlaps.map((o) => (
            <p key={`${o.start}-${o.jobs.join('+')}`}>
              {labels.scheduleOverlapAt(list.format(o.jobs.map((id) => jobs.find((j) => j.id === id)?.name ?? id)), clockTime(o.start % DAY))}
            </p>
          ))}
        </div>
      </div>
    </MotionFeatures>
  )
}

export { DayRing, findOverlaps, type ScheduleJob, type ScheduleOverlap, type DayRingProps, type ScheduleTone }
