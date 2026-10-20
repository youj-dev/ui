'use client'

import { useId, useMemo, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { StatValue } from '../../components/ui/stat-card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { DAYS, DEFAULT_COPY, GOAL, HOURS, TODAY, calendar, levelOf, quartiles, streaks, timeOf, weekStartOf, type ActivityHeatmapCopy, type ActivityHeatmapDay, type ActivityHeatmapView } from './activity-heatmap/data'
import { Grid, type GridCell, type GridHead, type GridRow } from './activity-heatmap/grid'
import { Legend, type Step } from './activity-heatmap/legend'

/* When it happens. A year of days as a grid, weeks across and weekdays
 * down, each day a step of one chart colour; the steps split the active
 * days into quarters, so a record day can't pale the rest. Over it, the
 * year in four figures: the total, the daily average and the weekday that
 * sells most, the busiest day, and the streak of days at the goal with the
 * longest. Days switches to Hours: the same days as each hour of the week,
 * a day's average, so the busy evenings show. Point at a cell or focus it
 * (one tab stop, arrow keys by day and week) and one tip glides to it; the
 * legend's steps are toggles that light only their days and say how many.
 * Feed it `days` (and `hours` for the Hours view), `today` and a `goal`;
 * `onDaySelect` makes days pickable; every string is in `copy`. Built for
 * the compact layout density, taken from the page; embedded, it keeps its
 * natural width unless `fill`, and the grid scrolls sideways, newest week
 * in view, when it's narrower than the year. It keeps its size in every
 * view and state. Reduced motion: cells and figures land in place. */

type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ActivityHeatmapProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ActivityHeatmapCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What happened each day; a day left out had none. Default: the demo shop's orders. */
  days?: ActivityHeatmapDay[]
  /** Each hour of the week's average per day, Sunday first and midnight first (7 rows of 24): turns on the Hours view. Default: the demo's with the demo's days; none with yours. */
  hours?: number[][]
  /** The last day shown, as an ISO date. Default: the demo's (10 October 2026), else the latest of `days`. */
  today?: string
  /** How many weeks the grid shows, today's last. Default 53, a year. */
  weeks?: number
  /** The weekday each column starts on, 0 (Sunday) to 6. Default: the locale's (Monday where the browser can't tell). */
  weekStart?: number
  /** Intl.NumberFormat options for every value. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** A day at or over it keeps the streak going. Default: the demo's 25 a day; with your days, any activity. */
  goal?: number
  /** Where steps two to four start. Default: the quartiles of the active days. */
  steps?: number[]
  /** The chart colour of the steps. Default `chart-1`. */
  tone?: Tone
  /** The view shown, controlled: pair it with `onViewChange`. Default: uncontrolled. */
  view?: ActivityHeatmapView
  /** The view shown first, uncontrolled. Default `days`. */
  defaultView?: ActivityHeatmapView
  /** Called with the view picked. */
  onViewChange?: (view: ActivityHeatmapView) => void
  /** A day is pressed, or picked with Enter. Default: days aren't pickable. */
  onDaySelect?: (day: ActivityHeatmapDay) => void
  /** Skeletons in place of the figures and the grid while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the grid when the data fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there's no activity. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const DAY = 86_400_000
const HOUR = 3_600_000
const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
const MIX = [30, 52, 76, 100]
/** A Sunday, to name weekdays and hours from. */
const SUNDAY = Date.UTC(2026, 0, 4)
const sum = (values: number[]) => values.reduce((t, v) => t + v, 0)

function ActivityHeatmap({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  days: daysProp,
  hours: hoursProp,
  today: todayProp,
  weeks = 53,
  weekStart: weekStartProp,
  format = WHOLE,
  goal: goalProp,
  steps: stepsProp,
  tone = 'chart-1',
  view: viewProp,
  defaultView = 'days',
  onViewChange,
  onDaySelect,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: ActivityHeatmapProps) {
  const lang = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: lang }), [copyProp, lang])
  const titleId = useId()
  const summaryId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { announce, announcer } = useAnnouncer()
  const demo = daysProp === undefined
  const days = daysProp ?? DAYS
  const hours = hoursProp ?? (demo ? HOURS : undefined)
  const goal = goalProp ?? (demo ? GOAL : undefined)
  const [chosen, setChosen] = useControllableState(viewProp, defaultView)
  const view = hours ? chosen : 'days'
  const [picked, setPicked] = useState<number | null>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const lit = preview ?? picked
  const today = timeOf(todayProp ?? (demo || days.length === 0 ? TODAY : days.reduce((last, d) => (d.date > last ? d.date : last), days[0]!.date)))
  const weekStart = weekStartProp ?? weekStartOf(copy.locale)

  const f = useMemo(() => {
    const at = (options: Intl.DateTimeFormatOptions) => dateTimeFormat(copy.locale, { ...options, timeZone: 'UTC' })
    const hour = at({ hour: 'numeric' })
    const weekday = at({ weekday: 'short' })
    const weekdayLong = at({ weekday: 'long' })
    return {
      number: numberFormat(copy.locale, format),
      decimal: numberFormat(copy.locale, { ...format, minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      count: numberFormat(copy.locale),
      long: at({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      short: at({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      month: at({ month: 'short' }),
      span: at({ month: 'short', day: 'numeric', year: 'numeric' }),
      hour,
      hours: (h: number) => hour.formatRange(SUNDAY + h * HOUR, SUNDAY + (h + 1) * HOUR),
      weekday: (w: number) => weekday.format(SUNDAY + w * DAY),
      weekdayLong: (w: number) => weekdayLong.format(SUNDAY + w * DAY),
    }
  }, [copy.locale, format])

  const model = useMemo(() => calendar(new Map(days.map((d) => [d.date.slice(0, 10), d.value])), today, weeks, weekStart), [days, today, weeks, weekStart])
  const list = useMemo(() => model.columns.flat().filter((d) => d !== null), [model])
  const total = sum(list.map((d) => d.value))
  const busiest = list.reduce((top, d) => (d.value > top.value ? d : top), list[0] ?? { date: '', time: today, value: 0 })
  const streak = streaks(list.map((d) => d.value), goal)
  const weekdayMeans = Array.from({ length: 7 }, (_, w) => {
    const of = list.filter((d) => new Date(d.time).getUTCDay() === w).map((d) => d.value)
    return sum(of) / (of.length || 1)
  })
  const topWeekday = weekdayMeans.indexOf(Math.max(...weekdayMeans))
  const slots = (hours ?? []).flatMap((row, w) => row.map((value, h) => ({ w, h, value })))
  const peak = slots.reduce((top, s) => (s.value > top.value ? s : top), slots[0] ?? { w: 0, h: 0, value: 0 })
  const quiet = slots.reduce((low, s) => (s.value < low.value ? s : low), slots[0] ?? { w: 0, h: 0, value: 0 })

  const values = view === 'days' ? list.map((d) => d.value) : slots.map((s) => s.value)
  const floors = stepsProp ?? quartiles(values)
  const levels = floors.length + 1
  const fillOf = (level: number) =>
    level === 0 ? 'var(--color-band)' : `color-mix(in oklab, var(--color-${tone}) ${levels === 4 ? MIX[level - 1] : Math.round(30 + (70 * (level - 1)) / Math.max(1, levels - 1))}%, var(--color-surface))`
  const shown = view === 'days' ? f.number : f.decimal
  const whole = values.every(Number.isInteger)
  const low = Math.min(...values.filter((v) => v > 0), Infinity)
  const steps: Step[] = Array.from({ length: levels + 1 }, (_, level) => {
    if (level === 0) return { level, name: copy.none[view] }
    const from = level > 1 ? floors[level - 2]! : Number.isFinite(low) ? low : 0
    const to = floors[level - 1]
    const [a, b] = [shown.format(from), to === undefined ? '' : shown.format(whole ? to - 1 : to)]
    return { level, name: copy.step[view](to === undefined ? copy.atLeast(a) : a === b ? a : copy.range(a, b)) }
  })
  const countIn = (level: number) => values.filter((v) => levelOf(v, floors) === level).length

  // The cells, by row then column: rebuilt only when the data, the steps, the view or the words change, never on a hover.
  const floorsKey = floors.join()
  const grid = useMemo(() => {
    const steps = floorsKey ? floorsKey.split(',').map(Number) : []
    const rows: GridRow[] = Array.from({ length: 7 }, (_, row) => {
      const w = (weekStart + row) % 7
      return { key: `${w}`, short: f.weekday(w), full: f.weekdayLong(w), shown: w % 2 === 1 }
    })
    if (view === 'hours' && hours) {
      const head: GridHead[] = [0, 6, 12, 18].map((h) => ({ key: `${h}`, label: f.hour.format(SUNDAY + h * HOUR), span: 6 }))
      const cells = rows.map((r) =>
        Array.from({ length: 24 }, (_, h): GridCell => {
          const value = hours[Number(r.key)]?.[h] ?? 0
          const count = copy.count.hours(f.decimal.format(value), value)
          return { key: `${r.key}-${h}`, level: levelOf(value, steps), label: copy.cell(`${r.full}, ${f.hours(h)}`, count, false), when: `${r.short} · ${f.hours(h)}`, value: count }
        }),
      )
      return { rows, head, cells, start: { row: (peak.w - weekStart + 7) % 7, col: peak.h } }
    }
    const head: GridHead[] = []
    model.columns.forEach((_, c) => {
      const time = model.first + c * 7 * DAY
      const key = `${new Date(time).getUTCFullYear()}-${new Date(time).getUTCMonth()}`
      const last = head.at(-1)
      if (last?.key === key) last.span++
      else head.push({ key, label: f.month.format(time), span: 1 })
    })
    const cells = rows.map((_, row) =>
      model.columns.map((column): GridCell | null => {
        const day = column[row]
        if (!day) return null
        const count = copy.count.days(f.number.format(day.value), day.value)
        const now = day.time === today
        return { key: day.date, level: levelOf(day.value, steps), label: copy.cell(f.long.format(day.time), count, now), when: f.short.format(day.time), value: now ? `${count} · ${copy.soFar}` : count, today: now }
      }),
    )
    const newest = model.columns.at(-1) ?? []
    return { rows, head, cells, start: { row: Math.max(0, newest.filter((d) => d !== null).length - 1), col: model.columns.length - 1 } }
  }, [view, hours, model, floorsKey, f, copy, today, weekStart, peak.w, peak.h])

  const pick = (level: number | null) => {
    setPicked(level)
    announce(level === null ? copy.showingAll : copy.showing(steps[level]!.name, f.count.format(countIn(level))))
  }
  const switchView = (next: string) => {
    setChosen(next as ActivityHeatmapView)
    setPicked(null)
    setPreview(null)
    onViewChange?.(next as ActivityHeatmapView)
  }

  const decimals = { ...format, minimumFractionDigits: 0, maximumFractionDigits: 1 }
  const stats = [
    { key: 'total', label: copy.total, value: total, format, detail: copy.activeDays(f.count.format(list.filter((d) => d.value > 0).length)) },
    { key: 'average', label: copy.average, value: total / (list.length || 1), format: decimals, detail: copy.weekday(f.weekdayLong(topWeekday)) },
    view === 'days'
      ? { key: 'peak', label: copy.busiestDay, value: busiest.value, format, detail: busiest.date ? f.short.format(busiest.time) : '' }
      : { key: 'peak', label: copy.busiestHour, value: peak.value, format: decimals, detail: `${f.weekday(peak.w)} · ${f.hours(peak.h)}` },
    { key: 'streak', label: copy.streak, value: streak.current, format: WHOLE, unit: copy.days(streak.current), detail: copy.best(f.count.format(streak.best), goal === undefined ? '' : f.number.format(goal)) },
  ]
  const summary =
    view === 'days'
      ? copy.summary.days(copy.count.days(f.number.format(total), total), weeks, `${f.long.format(busiest.time)}, ${copy.count.days(f.number.format(busiest.value), busiest.value)}`, f.weekdayLong(topWeekday))
      : copy.summary.hours(`${f.weekdayLong(peak.w)} ${f.hours(peak.h)}`, `${f.weekdayLong(quiet.w)} ${f.hours(quiet.h)}`)

  const content = (
    <div className="flex flex-col gap-4">
      <dl data-slot="activity-heatmap-stats" className="grid grid-cols-2 gap-x-4 gap-y-3 @lg/heatmap:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className="flex min-w-0 flex-col gap-1">
            <dt className="truncate font-(family-name:--yj-label-font) text-ui-xs font-medium tracking-(--yj-label-tracking) text-fg-muted [text-transform:var(--yj-label-case)]">{s.label}</dt>
            <dd className="flex min-w-0 flex-col gap-0.5">
              <StatValue value={s.value} format={s.format} unit={s.unit} locale={copy.locale} size="sm" />
              <span className="min-h-4 truncate text-ui-xs text-fg-muted tabular-nums">{s.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p id={summaryId} className="sr-only">
        {summary}
      </p>
      <Grid
        key={view}
        label={copy.grid[view]}
        summaryId={summaryId}
        head={grid.head}
        rows={grid.rows}
        cells={grid.cells}
        wide={view === 'hours'}
        start={grid.start}
        fill={fillOf}
        lit={lit}
        onPick={
          onDaySelect && view === 'days'
            ? ({ row, col }) => {
                const day = model.columns[col]?.[row]
                if (day) onDaySelect({ date: day.date, value: day.value })
              }
            : undefined
        }
      />
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p aria-hidden data-slot="activity-heatmap-readout" className="min-w-0 truncate text-ui-xs text-fg-muted tabular-nums">
          {lit !== null ? copy.showing(steps[lit]?.name ?? '', f.count.format(countIn(lit))) : stepsProp ? '' : copy.scale}
        </p>
        <Legend steps={steps} fill={fillOf} picked={picked} onPick={pick} onPreview={setPreview} copy={copy} />
      </div>
    </div>
  )

  const state = loading ? (
    <div className="flex h-full flex-col gap-4">
      <span className="sr-only">{copy.loading}</span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 @lg/heatmap:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-6 w-20 rounded-sm" />
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        ))}
      </div>
      <Skeleton className="flex-1 rounded-md" />
      <Skeleton className="ms-auto h-3 w-28 rounded-sm" />
    </div>
  ) : error ? (
    <div className="grid h-full place-items-center">
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
        {onRetry && (
          <AlertAction>
            <Button size="sm" variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          </AlertAction>
        )}
      </Alert>
    </div>
  ) : total === 0 ? (
    (empty ?? (
      <Empty className="h-full rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : null

  const sizes = {
    '--label': '2rem',
    '--gap': '3px',
    '--cell': `clamp(8px, calc((100cqw - var(--label)) / ${weeks} - var(--gap)), 20px)`,
    '--wide': 'calc((100cqw - var(--label)) / 24 - var(--gap))',
  } as CSSProperties

  const card = (
    <Card className={cn('w-full gap-4 text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.description[view](f.span.formatRange(model.first, today))}</CardDescription>
        {hours && (
          <CardAction>
            <SegmentedControl variant="pill" size="sm" aria-label={copy.view} value={view} onValueChange={switchView}>
              {(['days', 'hours'] as const).map((v) => (
                <SegmentedControlItem key={v} value={v} className="px-2.5">
                  {copy.views[v]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </CardAction>
        )}
      </CardHeader>
      <CardContent aria-busy={loading || undefined} className="@container/heatmap" style={sizes}>
        {/* The content always lays out, so a state takes exactly its room: the state hides it and stands over it. */}
        <div className="relative">
          <div aria-hidden={state ? true : undefined} inert={state ? true : undefined} className={cn(state && 'invisible')}>
            {content}
          </div>
          {state && <div className="absolute inset-0">{state}</div>}
        </div>
      </CardContent>
      {announcer}
    </Card>
  )

  const root = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{root}</ThemeScope> : root
}

export { ActivityHeatmap, type ActivityHeatmapProps, type ActivityHeatmapCopy, type ActivityHeatmapDay, type ActivityHeatmapView }
