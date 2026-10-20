'use client'

import { useCallback, useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { StatValue } from '../../components/ui/stat-card'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { Burnup } from './goals/burnup'
import { DEFAULT_COPY, GOALS, PERIOD, forecast, timeOf, type GoalsCopy, type GoalsGoal, type GoalsStatus } from './goals/data'
import { Rows } from './goals/rows'

/* The period's targets and where each will land. Every goal is a row: its
 * status (hit, ahead, on track, at risk or behind, from where the recent
 * rate takes it), a track filled with what's done and run on, paler, to the
 * forecast, a notch where an even pace would be by today, and its progress
 * and landing in words. Pick one (a press, or the arrow keys: the rows are a
 * radio group with a highlight that glides) and the burn-up under them
 * draws it: the total so far, the even pace to the target, the target, and
 * from today the forecast inside a widening fan of its likely range, with a
 * dot where it crosses. Over the chart, its landing, what it needs a week
 * against what it has made a week, and the days left; under its heading, the
 * day it hits the target or how short it falls. Feed it `goals` (a target and
 * what each day added) and the period's `start` and `end`; the picked goal
 * is `goal` with `onGoalChange`, and every string is in `copy`. Built for
 * the compact layout density, taken from the page; embedded, it keeps its
 * natural width unless `fill`. Reduced motion: tracks and lines land in
 * place. */

interface GoalsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<GoalsCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The goals, each a target and what every day of the period so far added. Default: the demo's second-half goals. */
  goals?: GoalsGoal[]
  /** The period's first day (ISO). Default: the demo's, 1 July 2026. */
  start?: string
  /** The period's last day (ISO). Default: the demo's, 31 December 2026. */
  end?: string
  /** The goal the burn-up draws, controlled: pair it with `onGoalChange`. Default: uncontrolled. */
  goal?: string
  /** The goal drawn first, uncontrolled. Default: the first. */
  defaultGoal?: string
  /** Called with the goal picked. */
  onGoalChange?: (id: string) => void
  /** Skeletons in place of the goals while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the goals when they fail to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there are no goals. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const DAY = 86_400_000

function Goals({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  goals = GOALS,
  start = PERIOD.start,
  end = PERIOD.end,
  goal: goalProp,
  defaultGoal,
  onGoalChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: GoalsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [picked, setPicked] = useControllableState(goalProp, defaultGoal ?? goals[0]?.id ?? '')
  const from = timeOf(start)
  const total = Math.max(1, Math.round((timeOf(end) - from) / DAY) + 1)
  const forecasts = useMemo(() => goals.map((g) => forecast(g, total)), [goals, total])
  const index = Math.max(0, goals.findIndex((g) => g.id === picked))
  const goal = goals[index]
  const f = forecasts[index]
  const elapsed = Math.max(0, ...goals.map((g) => g.daily.length))

  const figure = useCallback((g: GoalsGoal, value: number) => numberFormat(copy.locale, g.format ?? { maximumFractionDigits: 0 }).format(value), [copy.locale])
  const dates = useMemo(() => {
    const day = dateTimeFormat(copy.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const month = dateTimeFormat(copy.locale, { month: 'short', timeZone: 'UTC' })
    const months: { day: number; label: string }[] = []
    const first = new Date(from)
    for (let m = 0; ; m++) {
      const t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + m, 1)
      const d = Math.round((t - from) / DAY)
      if (d >= total) break
      if (d >= 0) months.push({ day: d, label: month.format(t) })
    }
    return { at: (d: number) => day.format(from + Math.max(0, Math.round(d) - 1) * DAY), span: day.formatRange(from, from + (total - 1) * DAY), months }
  }, [copy.locale, from, total])

  const pick = (id: string) => {
    setPicked(id)
    onGoalChange?.(id)
  }
  const color = (i: number) => `var(--color-${goals[i]?.tone ?? `chart-${(i % 5) + 1}`})`
  const status = (s: GoalsStatus, g: GoalsGoal, fc: NonNullable<typeof f>) =>
    s === 'hit' ? copy.reached(dates.at(fc.crossing ?? elapsed)) : fc.crossing !== undefined && fc.crossing <= total ? copy.crosses(dates.at(fc.crossing)) : copy.misses(figure(g, g.target - fc.projected))

  const body = loading ? (
    <div className="flex flex-col gap-4">
      <span className="sr-only">{copy.loading}</span>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
      <Skeleton className="h-48 rounded-lg" />
    </div>
  ) : error ? (
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
  ) : !goal || !f ? (
    (empty ?? (
      <Empty className="rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <div className="flex flex-col gap-5">
      <Rows goals={goals} forecasts={forecasts} selected={goal.id} onSelect={pick} figure={figure} copy={copy} />
      <div data-slot="goals-detail" className="flex flex-col gap-4 border-t border-line pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-ui font-semibold text-fg">{goal.label}</h3>
          <p className={cn('text-ui-sm', f.status === 'behind' ? 'text-danger-text' : f.status === 'at-risk' ? 'text-warning-text' : 'text-fg-muted')}>{status(f.status, goal, f)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @md/goals:grid-cols-4">
          {[
            { label: copy.projected, value: f.status === 'hit' ? f.actual : f.projected, unit: numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 }).format((f.status === 'hit' ? f.actual : f.projected) / (goal.target || 1)) },
            { label: copy.neededPerWeek, value: f.needed * 7 },
            { label: copy.soFarPerWeek, value: f.rate * 7 },
            { label: copy.daysLeft, value: Math.max(0, total - elapsed), plain: true },
          ].map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col gap-1">
              <dt className="truncate font-(family-name:--yj-label-font) text-ui-xs font-medium tracking-(--yj-label-tracking) text-fg-muted [text-transform:var(--yj-label-case)]">{stat.label}</dt>
              <dd>
                {/* A count reads whole from ten up ("116 a week"); below that a decimal says something ("0.5 deals"). */}
                <StatValue value={stat.value} format={goal.format && !stat.plain ? goal.format : { maximumFractionDigits: stat.plain || Math.abs(stat.value) >= 10 ? 0 : 1 }} unit={stat.unit} locale={copy.locale} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
        <div aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-xs text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color(index) }} />
            {copy.actual}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 border-t-[1.5px] border-dashed" style={{ borderColor: color(index) }} />
            {copy.forecast}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 border-t-[1.5px] border-dotted border-fg-subtle" />
            {copy.pace}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 border-t-[1.5px] border-dashed border-fg-muted" />
            {copy.target}
          </span>
        </div>
        <Burnup
          goal={goal}
          forecast={f}
          total={total}
          months={dates.months}
          tick={(v) => numberFormat(copy.locale, { ...goal.format, notation: 'compact', maximumFractionDigits: 1, maximumSignificantDigits: undefined }).format(v)}
          color={color(index)}
          title={copy.chart(goal.label)}
          summary={copy.summary(figure(goal, f.actual), figure(goal, goal.target), figure(goal, f.pace), figure(goal, f.projected), figure(goal, f.low), figure(goal, f.high))}
          copy={copy}
        />
      </div>
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-4 text-fg', !embedded && !fill && 'max-w-160')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.description(dates.span, Math.min(elapsed, total), total)}</CardDescription>
      </CardHeader>
      <CardContent aria-busy={loading || undefined} className="@container/goals">
        {body}
      </CardContent>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Goals, type GoalsProps, type GoalsCopy, type GoalsGoal, type GoalsStatus }
