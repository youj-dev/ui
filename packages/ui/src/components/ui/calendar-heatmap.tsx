'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { m } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { Counter, MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, FlameIcon, SnowflakeIcon } from '@youj/icons'
import { calendarHeatmapLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, numberFormat, toneColor } from '../../lib/utils'
import { buttonVariants } from './button'
import { Eyebrow } from './typography'

/* A habit's days as heat dots: a column per week, a row per weekday, the
 * newest week at the inline end (mirrored in RTL), months over the columns.
 * A dot's heat is how much got done that day, out of `max`; a missed day is a
 * recessed well; a day a freeze token covered is hatched, and keeps the
 * streak alive; days still to come are empty rings.
 * - Today: a ring in the accent. With `onTodayChange` its dot is a toggle:
 *   marking it done pops the dot in on the settle spring with one ripple, and
 *   the new streak is announced. Until then the dot breathes, once a beat.
 * - Keyboard: the days are one tab stop, starting on today. Up and down step
 *   a day, left and right a week (mirrored in RTL), Home and End go to the
 *   first day and to today. The readout under the grid names the day in
 *   focus or under the pointer.
 * - `size="sm"` is a mini grid for a list row: dots only, not interactive.
 * StreakSummary is the flame meter over a grid: the current run in big mono,
 * cells toward the next milestone that warm toward the head as the run grows,
 * and the longest run, the completion rate and the freeze tokens left.
 * StreakCheck is the "Mark done" pill that morphs into a drawn check.
 * Reduced motion: dots and cells light at once, nothing breathes or ripples,
 * the flame holds still. */

type StreakTone = 'accent' | 'success' | 'warning' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface StreakDay {
  /** The day, as an ISO date: "2026-09-28". */
  date: string
  /** How much got done, out of the grid's `max`. Default 1. */
  value?: number
  /** A freeze token covered this day: drawn hatched, and the streak survives it. */
  frozen?: boolean
}

interface StreakStats {
  /** The run that ends today (or yesterday, while today is still open). */
  current: number
  longest: number
  /** Days done over the days since the first one listed, 0–1. */
  rate: number
  /** Whether today is done (or frozen). */
  today: boolean
}

const DAY = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')
/** Days since 1970-01-01 for an ISO date, read as a calendar date. */
const dayOf = (iso: string) => {
  const [y, mo, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y!, mo! - 1, d!) / DAY)
}
/** The browser's local calendar date for a moment. */
const localIso = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
/** 0 is Sunday. 1970-01-01 was a Thursday. */
const weekdayOf = (n: number) => (((n + 4) % 7) + 7) % 7
const isDone = (d: StreakDay | undefined) => !!d && !d.frozen && (d.value ?? 1) > 0
const kept = (d: StreakDay | undefined) => !!d && (!!d.frozen || (d.value ?? 1) > 0)

/** The current and longest runs, the completion rate and whether today counts yet. */
function streakStats(days: StreakDay[], today: string): StreakStats {
  const t = dayOf(today)
  const byDay = new Map(days.map((d) => [dayOf(d.date), d]))
  let current = 0
  for (let n = kept(byDay.get(t)) ? t : t - 1; kept(byDay.get(n)); n--) current++
  const first = Math.min(t, ...byDay.keys())
  let longest = 0
  let run = 0
  let done = 0
  for (let n = first; n <= t; n++) {
    run = kept(byDay.get(n)) ? run + 1 : 0
    longest = Math.max(longest, run)
    if (isDone(byDay.get(n))) done++
  }
  return { current, longest, rate: done / (t - first + 1), today: kept(byDay.get(t)) }
}

/** A recessed well: the page's canvas in dark, a light ink wash in light (SegmentedMeter's off cell). */
const OFF = 'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'
const HATCH =
  'own:[background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--streak-frozen)_75%,transparent)_0_1.5px,transparent_1.5px_4px)] own:bg-[color-mix(in_oklab,var(--streak-frozen)_14%,transparent)]'
/** The heat of a done dot, by level: how much of the tone over the well. */
const HEAT = [0, 30, 52, 76, 100]
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

type DayState = 'done' | 'missed' | 'frozen' | 'future'

interface CalendarHeatmapProps extends Omit<ComponentProps<'div'>, 'children'> {
  days: StreakDay[]
  /** The newest day, as an ISO date. Default: today in the browser's time zone, once the page is live. */
  today?: string
  /** Weeks shown, oldest first. Default 26. */
  weeks?: number
  /** The value that fills a dot. Default 1 (done or not). */
  max?: number
  /** Done dots' color. Default 'accent'. */
  tone?: StreakTone
  /** 'sm' is a mini grid for a list row: dots only, not interactive. Default 'default'. */
  size?: 'default' | 'sm'
  /** The first day of the week: 0 Sunday, 1 Monday. Default 1. */
  weekStart?: 0 | 1
  /** Makes today's dot a toggle, called with whether today is now done. */
  onTodayChange?: (done: boolean) => void
  /** The grid's accessible name. Default "Daily history". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
}

function CalendarHeatmap({
  days,
  today: todayProp,
  weeks = 26,
  max = 1,
  tone = 'accent',
  size = 'default',
  weekStart = 1,
  onTodayChange,
  label,
  locale: localeProp,
  className,
  style,
  ...props
}: CalendarHeatmapProps) {
  const k = useYouj()
  const labels = useComponentLabels(calendarHeatmapLabels)
  const locale = useLocale(localeProp)
  const clock = useNow(todayProp ? 0 : 60_000)
  const { announce, announcer } = useAnnouncer()
  const refs = useRef(new Map<number, HTMLButtonElement>())
  const [active, setActive] = useState<number>()
  const [pointed, setPointed] = useState<number>()
  const [focused, setFocused] = useState<number>()
  const [popped, setPopped] = useState(false)

  const byDay = new Map(days.map((d) => [dayOf(d.date), d]))
  const latest = Math.max(...byDay.keys(), 0)
  const t = todayProp ? dayOf(todayProp) : clock !== null ? dayOf(localIso(clock)) : latest
  const lastCol = t - ((weekdayOf(t) - weekStart + 7) % 7)
  const first = lastCol - (weeks - 1) * 7
  const small = size === 'sm'
  const interactive = !small

  const date = dateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  const month = dateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
  const weekday = dateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })

  const stateOf = (n: number): DayState => {
    if (n > t) return 'future'
    const d = byDay.get(n)
    return d?.frozen ? 'frozen' : isDone(d) ? 'done' : 'missed'
  }
  const levelOf = (n: number) => {
    const v = byDay.get(n)?.value ?? 1
    return Math.max(1, Math.min(4, Math.ceil((v / (max || 1)) * 4)))
  }
  const spokenState = (n: number) => {
    const s = stateOf(n)
    if (s === 'frozen') return labels.streakFrozen
    // Today isn't missed while it's still open: its dot offers the mark instead.
    if (s === 'missed') return n === t ? (onTodayChange ? labels.streakMarkDone : '') : labels.streakMissed
    if (s === 'future') return ''
    return max > 1 ? labels.streakPartial(byDay.get(n)?.value ?? 1, max) : labels.streakDone
  }
  // Today's name stays put as it toggles; aria-pressed carries the state.
  const nameOf = (n: number) =>
    n === t && onTodayChange ? labels.streakDay(`${labels.streakToday}, ${date.format(n * DAY)}`, labels.streakMarkDone) : labels.streakDay(date.format(n * DAY), spokenState(n) || labels.streakMissed)

  const doneToday = stateOf(t) === 'done' || stateOf(t) === 'frozen'
  const tabStop = active !== undefined && active >= first && active <= t ? active : t

  const toggleToday = () => {
    if (!onTodayChange) return
    const next = !doneToday
    setPopped(next)
    onTodayChange(next)
    const after = streakStats(next ? [...days.filter((d) => dayOf(d.date) !== t), { date: localIsoOfDay(t), value: max }] : days.filter((d) => dayOf(d.date) !== t), localIsoOfDay(t))
    announce(next ? labels.streakTodayDone(after.current) : labels.streakTodayUndone)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = Number((e.target as HTMLElement).dataset.day)
    if (!interactive || Number.isNaN(at)) return
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const moves: Record<string, number> = {
      ArrowUp: at - 1,
      ArrowDown: at + 1,
      ArrowLeft: at + (rtl ? 7 : -7),
      ArrowRight: at + (rtl ? -7 : 7),
      Home: first,
      End: t,
    }
    const next = moves[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = Math.min(t, Math.max(first, next))
    setActive(target)
    refs.current.get(target)?.focus()
  }

  // Months over the columns where they begin, skipping one too close to the last; the leading month when there's room.
  const months: { col: number; text: string }[] = []
  for (let c = 0; c < weeks; c++) {
    const firstOfMonth = Array.from({ length: 7 }, (_, i) => first + c * 7 + i).find((n) => new Date(n * DAY).getUTCDate() === 1)
    if (firstOfMonth === undefined || (months.length && c - months.at(-1)!.col < 3)) continue
    months.push({ col: c, text: month.format(firstOfMonth * DAY) })
  }
  if (!months.length || months[0]!.col >= 3) months.unshift({ col: 0, text: month.format(first * DAY) })
  const weekdayRows = [0, 1, 2, 3, 4, 5, 6].filter((r) => [1, 3, 5].includes((weekStart + r) % 7))

  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const n = first + i
    const state = stateOf(n)
    const level = state === 'done' ? levelOf(n) : 0
    const isToday = n === t
    const dotClass = cn(
      'own:block size-full own:rounded-full transition-[background-color,box-shadow,scale] yj-duration-fast ease-standard',
      state === 'missed' && OFF,
      state === 'frozen' && HATCH,
      state === 'future' && 'own:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_9%,transparent)]',
    )
    const dotStyle = state === 'done' ? { backgroundColor: `color-mix(in oklab, var(--streak-tone) ${HEAT[level]}%, var(--streak-off))` } : undefined
    const inner =
      isToday && state === 'done' && popped && !k.reduced ? (
        <>
          <m.span
            data-slot="calendar-heatmap-dot"
            className={dotClass}
            style={dotStyle}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={k.spring('settle')}
          />
          <m.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-(--streak-tone)"
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={k.tween('slow', 'exit')}
          />
        </>
      ) : (
        <span data-slot="calendar-heatmap-dot" className={dotClass} style={dotStyle}>
          {isToday && state === 'missed' && onTodayChange && !k.reduced && (
            <m.span
              aria-hidden
              className="block size-full rounded-full bg-accent-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: k.duration('deliberate') * 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </span>
      )
    const place = { gridColumnStart: Math.floor(i / 7) + (small ? 1 : 2), gridRowStart: ((weekdayOf(n) - weekStart + 7) % 7) + (small ? 1 : 2) }
    const common = {
      'data-slot': 'calendar-heatmap-day',
      'data-state': state,
      'data-level': level || undefined,
      'data-today': isToday || undefined,
      className: cn(
        'relative own:grid aspect-square place-items-center own:rounded-full',
        // A narrow grid keeps more of each cell for the dot, so it still reads.
        small ? 'size-(--streak-mini)' : 'own:p-[10%] own:@lg:p-[21%]',
        isToday && (small ? 'own:shadow-[0_0_0_1px_var(--color-accent)]' : 'own:shadow-[0_0_0_1.5px_var(--color-accent)]'),
      ),
      style: place,
    }
    if (!interactive) return <span key={n} {...common}>{inner}</span>
    const toggle = isToday && !!onTodayChange
    return (
      <button
        key={n}
        type="button"
        ref={(el: HTMLButtonElement | null) => void (el ? refs.current.set(n, el) : refs.current.delete(n))}
        data-day={n}
        {...common}
        className={cn(common.className, 'focus-ring outline-offset-1', state === 'future' ? 'cursor-default' : toggle ? 'cursor-pointer' : 'cursor-default')}
        tabIndex={n === tabStop ? 0 : -1}
        disabled={state === 'future'}
        aria-label={state === 'future' ? date.format(n * DAY) : nameOf(n)}
        aria-pressed={toggle ? doneToday : undefined}
        aria-disabled={!toggle && state !== 'future' ? true : undefined}
        onFocus={() => (setActive(n), setFocused(n))}
        onBlur={() => setFocused(undefined)}
        onPointerEnter={() => setPointed(n)}
        onPointerLeave={() => setPointed(undefined)}
        onClick={toggle ? toggleToday : undefined}
      >
        {inner}
      </button>
    )
  })

  const vars = {
    '--streak-tone': toneColor(tone),
    '--streak-frozen': 'var(--color-chart-5)',
    '--streak-off': 'color-mix(in oklab, var(--color-canvas) calc(100% * var(--yj-dark)), color-mix(in oklab, var(--color-fg) 9%, transparent))',
    ...style,
  } as CSSProperties

  if (small)
    return (
      <div
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        data-slot="calendar-heatmap"
        data-size="sm"
        className={cn('own:grid w-fit gap-0.5 [--streak-mini:5px]', className)}
        style={{ gridTemplateColumns: `repeat(${weeks}, var(--streak-mini))`, gridTemplateRows: 'repeat(7, var(--streak-mini))', ...vars }}
        {...props}
      >
        {cells}
      </div>
    )

  // The readout names the day under the pointer or in focus; at rest the legend has the row.
  const readoutDay = pointed ?? focused
  const readoutState = readoutDay === undefined ? '' : spokenState(readoutDay)
  return (
    <MotionFeatures>
      <div
        role="group"
        aria-label={label ?? labels.calendarHeatmap}
        data-slot="calendar-heatmap"
        data-size="default"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container own:flex min-w-0 flex-col gap-3', className)}
        style={vars}
        onKeyDown={onKeyDown}
        {...props}
      >
        <div data-slot="calendar-heatmap-body" className="own:grid gap-x-[3px] gap-y-[3px]" style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(0, 1fr))` }}>
          {months.map((mo) => (
            <span
              key={mo.col}
              aria-hidden
              data-slot="calendar-heatmap-month"
              className={cn('col-span-3 row-start-1 pb-1 own:text-ui-xs whitespace-nowrap own:text-fg-muted', VOICE)}
              style={{ gridColumnStart: mo.col + 2 }}
            >
              {mo.text}
            </span>
          ))}
          {weekdayRows.map((row) => (
            <span
              key={row}
              aria-hidden
              data-slot="calendar-heatmap-weekday"
              className={cn('col-start-1 self-center pe-2 own:text-ui-xs own:leading-none whitespace-nowrap own:text-fg-muted', VOICE)}
              style={{ gridRowStart: row + 2 }}
            >
              {weekday.format((first + row) * DAY)}
            </span>
          ))}
          {cells}
        </div>
        <div data-slot="calendar-heatmap-footer" className="own:flex min-h-5 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p aria-hidden data-slot="calendar-heatmap-readout" className="own:flex min-w-0 items-baseline gap-2 own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">
            {readoutDay !== undefined && (
              <>
                <span className="own:text-fg">{readoutDay === t ? labels.streakToday : date.format(readoutDay * DAY)}</span>
                {readoutState && (
                  <>
                    <span className="own:text-fg-subtle">·</span>
                    <span className={cn(stateOf(readoutDay) === 'done' && 'own:text-fg')}>{readoutState}</span>
                  </>
                )}
              </>
            )}
          </p>
          <div aria-hidden data-slot="calendar-heatmap-legend" className="own:flex items-center gap-3 own:font-mono own:text-ui-xs own:text-fg-muted">
            {max > 1 ? (
              <span className="own:flex items-center gap-1.5">
                <span className={VOICE}>{labels.streakLess}</span>
                {HEAT.map((h, i) => (
                  <span
                    key={i}
                    className={cn('size-2.5 rounded-full', i === 0 && OFF)}
                    style={i ? { backgroundColor: `color-mix(in oklab, var(--streak-tone) ${h}%, var(--streak-off))` } : undefined}
                  />
                ))}
                <span className={VOICE}>{labels.streakMore}</span>
              </span>
            ) : (
              <>
                <span className="own:flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-(--streak-tone)" />
                  <span className={VOICE}>{labels.streakDone}</span>
                </span>
                <span className="own:flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-full', OFF)} />
                  <span className={VOICE}>{labels.streakMissed}</span>
                </span>
              </>
            )}
            <span className="own:flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-full', HATCH)} />
              <span className={VOICE}>{labels.streakFrozen}</span>
            </span>
            <span className="own:flex items-center gap-1.5">
              <span className="size-2.5 rounded-full shadow-[0_0_0_1.5px_var(--color-accent)]" />
              <span className={VOICE}>{labels.streakToday}</span>
            </span>
          </div>
        </div>
        {announcer}
      </div>
    </MotionFeatures>
  )
}

const localIsoOfDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)

/** A figure's words around its number: "23 days" → "", " days"; muted beside a Counter. */
function around(text: string) {
  const match = /\p{Nd}[\p{Nd}\s.,٫٬]*/u.exec(text)
  return match ? { before: text.slice(0, match.index), after: text.slice(match.index + match[0].trimEnd().length) } : { before: '', after: ` ${text}` }
}

interface StreakSummaryProps extends Omit<ComponentProps<'div'>, 'children'> {
  days: StreakDay[]
  /** The newest day, as an ISO date. Default: today in the browser's time zone. */
  today?: string
  /** Freeze tokens: how many are left, of how many the period allows. */
  freezes?: { left: number; total: number }
  /** The runs the flame meter counts toward. Default 7, 30, 100 and 365 days. */
  milestones?: number[]
  /** Default: the YoujProvider locale. */
  locale?: string
}

/** The flame meter: the current run in big mono, cells toward the next milestone warming to the head, and the longest run, the rate and the freezes left. */
function StreakSummary({ days, today: todayProp, freezes, milestones = [7, 30, 100, 365], locale: localeProp, className, ...props }: StreakSummaryProps) {
  const k = useYouj()
  const labels = useComponentLabels(calendarHeatmapLabels)
  const locale = useLocale(localeProp)
  const clock = useNow(todayProp ? 0 : 60_000)
  const today = todayProp ?? (clock !== null ? localIso(clock) : days.map((d) => d.date).sort().at(-1) ?? '1970-01-01')
  const stats = streakStats(days, today)
  const next = milestones.find((m) => m > stats.current) ?? milestones.at(-1) ?? 7
  const segments = Math.min(next, 30)
  const lit = Math.min(segments, Math.floor((stats.current / next) * segments))
  const heat = Math.min(1, stats.current / next)
  // The first paint sweeps the run in from its tail; after that a new day lights on its own.
  const [phase, setPhase] = useState<'off' | 'sweep' | 'live'>('off')
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPhase('sweep'))
    const done = setTimeout(() => setPhase('live'), k.ms('deliberate') + k.ms('base'))
    return () => (cancelAnimationFrame(frame), clearTimeout(done))
  }, [])
  const on = phase !== 'off' || k.reduced ? lit : 0
  const step = k.reduced || phase === 'live' ? 0 : k.ms('deliberate') / Math.max(1, lit)
  const unit = around(labels.streakDays(stats.current))
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })

  return (
    <MotionFeatures>
      <div
        data-slot="streak-summary"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container own:flex flex-col gap-4 [--streak-flame:var(--color-warning)] [--streak-frozen:var(--color-chart-5)]', className)}
        {...props}
      >
        <div className="own:flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="own:flex min-w-0 flex-col gap-2">
            <Eyebrow>{labels.streakCurrent}</Eyebrow>
            <p data-slot="streak-summary-value" className="own:flex items-center gap-2.5 own:font-mono own:text-4xl own:leading-none own:font-medium own:tracking-tight own:text-fg own:tabular-nums">
              <m.span
                aria-hidden
                data-slot="streak-summary-flame-icon"
                className={cn('own:grid shrink-0 place-items-center', stats.current ? 'own:text-(--streak-flame)' : 'own:text-fg-subtle')}
                animate={{ scale: 0.8 + 0.4 * heat }}
                transition={k.reduced ? { type: false } : k.spring('snappy')}
              >
                <FlameIcon size={30} trigger={stats.current && !k.reduced ? 'loop' : 'none'} />
              </m.span>
              <span className="own:flex items-baseline">
                {unit.before && <span className="own:me-1.5 own:text-[0.5em] own:text-fg-muted">{unit.before.trim()}</span>}
                <Counter value={stats.current} locale={locale} inView={false} duration="base" />
                <span className="own:ms-1.5 own:text-[0.5em] own:font-normal own:tracking-normal own:text-fg-muted">{unit.after.trim()}</span>
              </span>
            </p>
          </div>
          <span data-slot="streak-summary-milestone" className={cn('own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums', VOICE)}>
            {labels.streakMilestone(next)}
          </span>
        </div>

        <div data-slot="streak-summary-meter" aria-hidden className="own:flex h-2.5 gap-0.75">
          {Array.from({ length: segments }, (_, i) => {
            const lights = i < on
            const head = lights && i === on - 1
            return (
              <span
                key={i}
                data-slot="streak-summary-cell"
                data-state={lights ? 'on' : 'off'}
                className={cn('relative min-w-0 flex-1 own:rounded-[2px] transition-[background-color,box-shadow] yj-duration-fast ease-standard', !lights && OFF)}
                style={{
                  backgroundColor: lights ? `color-mix(in oklab, var(--streak-flame) ${Math.round(38 + (62 * (i + 1)) / Math.max(1, on))}%, transparent)` : undefined,
                  boxShadow: head ? '0 0 10px color-mix(in oklab, var(--streak-flame) 55%, transparent)' : undefined,
                  transitionDelay: step && lights ? `${Math.round(i * step)}ms` : undefined,
                }}
              >
                {head && phase === 'live' && !k.reduced && (
                  // The run just grew: the new head flares once.
                  <m.span
                    key={stats.current}
                    className="absolute inset-0 rounded-[inherit] bg-(--streak-flame)"
                    initial={{ opacity: 0.9, scaleY: 1.8 }}
                    animate={{ opacity: 0, scaleY: 1 }}
                    transition={k.tween('slow', 'exit')}
                  />
                )}
              </span>
            )
          })}
        </div>

        <dl data-slot="streak-summary-stats" className="own:grid grid-cols-2 gap-2 @md:grid-cols-3 [&>:nth-child(3)]:col-span-2 @md:[&>:nth-child(3)]:col-span-1">
          {[
            { key: 'longest', label: labels.streakLongest, value: <DaysFigure text={labels.streakDays(stats.longest)} /> },
            { key: 'rate', label: labels.streakRate, value: percent.format(stats.rate) },
            ...(freezes
              ? [
                  {
                    key: 'freezes',
                    label: labels.streakFreezes,
                    value: (
                      <span className="own:flex items-center gap-2">
                        <span aria-hidden className="own:flex gap-1">
                          {Array.from({ length: freezes.total }, (_, i) => (
                            <span
                              key={i}
                              data-slot="streak-summary-token"
                              data-state={i < freezes.left ? 'on' : 'off'}
                              className={cn(
                                'own:grid size-5 place-items-center own:rounded-full transition-[background-color,color,opacity] yj-duration-base ease-standard',
                                i < freezes.left ? 'own:bg-[color-mix(in_oklab,var(--streak-frozen)_22%,transparent)] own:text-(--streak-frozen)' : cn(HATCH, 'own:text-transparent opacity-60'),
                              )}
                            >
                              <SnowflakeIcon size={12} strokeWidth={2} />
                            </span>
                          ))}
                        </span>
                        <span className="own:text-ui-sm own:text-fg-muted">{labels.streakFreezesLeft(freezes.left)}</span>
                      </span>
                    ),
                  },
                ]
              : []),
          ].map((stat) => (
            <div key={stat.key} data-slot="streak-summary-stat" className="own:flex min-w-0 flex-col gap-1.5 own:rounded-xl own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] own:px-3.5 own:py-2.5">
              <Eyebrow render={<dt />} className="truncate">
                {stat.label}
              </Eyebrow>
              <dd className="min-w-0 truncate own:font-mono own:text-ui-lg text-fg own:tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </MotionFeatures>
  )
}

/** A count of days with its words muted: "41 days". */
function DaysFigure({ text }: { text: string }) {
  const unit = around(text)
  return (
    <span>
      {unit.before && <span className="own:text-ui-sm own:text-fg-muted">{unit.before}</span>}
      {text.slice(unit.before.length, text.length - unit.after.length)}
      <span className="own:text-ui-sm own:text-fg-muted">{unit.after}</span>
    </span>
  )
}

interface StreakCheckProps extends Omit<TogglePrimitive.Props, 'children'> {
  /** Default 'sm'. */
  size?: 'sm' | 'default'
  /** The label while not done. Default "Mark done". */
  label?: string
  /** The label once done. Default "Done". */
  doneLabel?: string
  /** With sound on, marking plays `toggleOn` and unmarking `toggleOff`. Default true. */
  sound?: boolean
}

/** "Mark done" as a pill that morphs into a drawn check and "Done" (aria-pressed). */
/** The button's name, led by the word it shows when the name doesn't already hold it. */
const named = (name: string, shown: string) => (name.toLowerCase().includes(shown.toLowerCase()) ? name : `${shown}, ${name}`)

function StreakCheck({ size = 'sm', label, doneLabel, sound = true, pressed, onPressedChange, className, ...props }: StreakCheckProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const labels = useComponentLabels(calendarHeatmapLabels)
  const ref = useRef<HTMLButtonElement>(null)
  const [radius, setRadius] = useState<string>()
  useLayoutEffect(() => {
    if (ref.current) setRadius(getComputedStyle(ref.current).borderRadius || undefined)
  }, [])
  const morph = useMorphRoot(radius)
  const on = !!pressed
  return (
    <MotionFeatures features="max">
      <TogglePrimitive
        ref={ref}
        render={<m.button {...morph} />}
        pressed={pressed}
        onPressedChange={(next, details) => {
          onPressedChange?.(next, details)
          if (sound && !details.isCanceled) cue(next ? 'toggleOn' : 'toggleOff')
        }}
        data-slot="button"
        data-variant={on ? 'ghost' : 'secondary'}
        data-size={size}
        data-streak-check=""
        data-reduced-motion={k.reduced || undefined}
        aria-label={named(props['aria-label'] ?? label ?? labels.streakMarkDone, on ? (doneLabel ?? labels.streakDone) : (label ?? labels.streakMarkDone))}
        className={cn(
          buttonVariants({ variant: on ? 'ghost' : 'secondary', size }),
          'overflow-hidden',
          on && 'own:bg-success-subtle own:text-success-text own:hover:bg-success-line own:hover:text-success-text',
          className,
        )}
        {...props}
      >
        <MorphLabel value={on ? 'done' : 'todo'}>
          {on ? (
            <>
              <CheckIcon size={14} strokeWidth={2.25} trigger={k.reduced ? 'none' : 'mount'} />
              {doneLabel ?? labels.streakDone}
            </>
          ) : (
            <>
              <span aria-hidden className="size-3 rounded-full shadow-[inset_0_0_0_1.5px_currentColor] opacity-70" />
              {label ?? labels.streakMarkDone}
            </>
          )}
        </MorphLabel>
      </TogglePrimitive>
    </MotionFeatures>
  )
}

export { StreakCheck, CalendarHeatmap, StreakSummary, streakStats, type StreakCheckProps, type StreakDay, type CalendarHeatmapProps, type StreakStats, type StreakSummaryProps, type StreakTone }
