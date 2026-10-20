'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import type { CellBarCell, CellBarTone } from '../../components/ui/cell-bar'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  FACTS,
  ROWS,
  demo,
  type PlanVsActualCopy,
  type PlanVsActualFact,
  type PlanVsActualFormats,
  type PlanVsActualRow,
} from './plan-vs-actual/data'
import { Rows, type PlanVsActualLine } from './plan-vs-actual/rows'
import { Summary, type PlanVsActualMover } from './plan-vs-actual/summary'

/* What each of a set of rows adds up to this year, against its plan: item
 * spend, department budgets, a harvest. On the start side,
 * a row per big one and one for the rest together: each a CellBar of its
 * months (settled solid, forecast hatched) on one shared money scale, in the
 * warning ink when its year runs past its plan and the success ink when
 * under, with the plan as a dashed tick; then the team's year by quarter
 * against the plan. On the end side, the total to date in large mono with how
 * far it runs from the plan to date, the projected year, a few facts, and
 * the biggest movers against plan with why. The head's badge says how far
 * over or under plan the year to date is. The foot carries the insight with
 * Set budget and the primary action (`onSetPlan`, `onAction`). Loading holds
 * the rows and the summary as skeletons, and an error with Retry or the
 * empty message sits over them, all at their own size.
 * Embedded, it stops at its natural width unless `fill`; a narrow card puts
 * the summary under the rows.
 * Reduced motion: the bars and figures are drawn at their values. */

interface PlanVsActualProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate; `currency` prices the figures. */
  copy?: Partial<PlanVsActualCopy>
  /** Formats amounts and month names (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The rows, each with twelve months of actuals and a plan a month. */
  rows?: PlanVsActualRow[]
  /** The year the months are in. Default 2026. */
  year?: number
  /** How many months are settled; the rest are forecast. Default 9 (January to September). */
  settled?: number
  /** How many of the biggest rows get one of their own; the rest share one. Default 3. */
  top?: number
  /** The lines of the summary list after the count of rows over plan. */
  facts?: PlanVsActualFact[]
  /** Which side of the plan is good: `under` (default: spend, a row under its plan is success) or `over` (a yield, a row over its plan is success). Sets the bars' tones, the badge and the movers' inks. */
  better?: 'under' | 'over'
  /** Opens your plan editor. */
  onSetPlan?: () => void
  /** Runs the primary action; the card awaits it. */
  onAction?: () => Promise<unknown> | unknown
  /** How the figures are written; each replaces its default whole. Default: `copy.currency`, whole units, and compact for the ruler. */
  formats?: PlanVsActualFormats
  /** Skeletons in place of the rows and the summary while your data loads. Default false. */
  loading?: boolean
  /** Shown over the rows and the summary when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no rows. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const sum = (values: readonly number[]) => values.reduce((a, b) => a + Math.max(0, b), 0)
/** The scale's end: the next 1, 2, 2.5, 5 or 10 times a power of ten. */
function niceMax(value: number) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const n = value / power
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
}

function PlanVsActual({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  rows: rowsProp = ROWS,
  year = 2026,
  settled = 9,
  top = 3,
  facts = FACTS,
  onSetPlan,
  onAction,
  better = 'under',
  formats,
  loading = false,
  error,
  onRetry,
  empty,
  ...rest
}: PlanVsActualProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Section = embedded ? 'h3' : 'h2'

  const valueOptions = formats?.value ?? { style: 'currency', currency: copy.currency, maximumFractionDigits: 0 }
  const money = numberFormat(locale, valueOptions).format
  const compact = numberFormat(
    locale,
    formats?.compact ?? { style: 'currency', currency: copy.currency, notation: 'compact', maximumFractionDigits: 1 },
  ).format
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const monthName = (m: number) => dateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(Date.UTC(year, m, 15))
  const cellsOf = (monthly: readonly number[]): CellBarCell[] =>
    Array.from({ length: 12 }, (_, m) => ({ label: monthName(m), value: Math.max(0, monthly[m] ?? 0), projected: m >= settled }))

  // Biggest first; the top ones get a row each and the rest share one.
  const ranked = [...rowsProp].sort((a, b) => sum(b.monthly) - sum(a.monthly))
  const own = ranked.slice(0, top)
  const others = ranked.slice(top)
  const good = (total: number, plan: number) => (better === 'under' ? total <= plan : total >= plan)
  const toneOf = (total: number, plan: number): CellBarTone => (good(total, plan) ? 'success' : 'warning')
  const lines: PlanVsActualLine[] = own.map((item, i) => ({
    id: item.id,
    name: item.name,
    rank: i + 1,
    cells: cellsOf(item.monthly),
    total: sum(item.monthly),
    plan: item.plan * 12,
    tone: toneOf(sum(item.monthly), item.plan * 12),
  }))
  if (others.length) {
    const monthly = Array.from({ length: 12 }, (_, m) => others.reduce((total, item) => total + Math.max(0, item.monthly[m] ?? 0), 0))
    lines.push({
      id: 'others',
      name: copy.others(others.length),
      cells: cellsOf(monthly),
      total: sum(monthly),
      plan: others.reduce((t, a) => t + a.plan * 12, 0),
      tone: 'neutral',
    })
  }
  const scale = niceMax(Math.max(0, ...lines.map((row) => Math.max(row.total, row.plan))))

  const team = Array.from({ length: 12 }, (_, m) => rowsProp.reduce((total, item) => total + Math.max(0, item.monthly[m] ?? 0), 0))
  const quarters: CellBarCell[] = [0, 1, 2, 3].map((q) => ({
    label: copy.quarter(q + 1),
    value: sum(team.slice(q * 3, q * 3 + 3)),
    projected: q * 3 + 3 > settled,
  }))
  const planMonth = rowsProp.reduce((total, item) => total + item.plan, 0)
  const ytd = sum(team.slice(0, settled))
  const planYtd = planMonth * settled
  const drift = planYtd > 0 ? (ytd - planYtd) / planYtd : 0
  const over = rowsProp.filter((item) => sum(item.monthly) > item.plan * 12).length
  const deltas = rowsProp.map((item) => ({ id: item.id, name: item.name, delta: sum(item.monthly) - item.plan * 12, note: item.note }))
  const up = deltas.reduce<PlanVsActualMover | undefined>((best, d) => (d.delta > 0 && (!best || d.delta > best.delta) ? d : best), undefined)
  const down = deltas.reduce<PlanVsActualMover | undefined>((best, d) => (d.delta < 0 && (!best || d.delta < best.delta) ? d : best), undefined)

  const covered = loading || !!error || rowsProp.length === 0

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-4xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading ? <Skeleton className="inline-block h-4 w-24 align-middle" /> : error ? '—' : copy.subtitle(year, rowsProp.length)}
        </CardDescription>
        <CardAction>
          {loading ? (
            <Skeleton className="h-5 w-24 rounded-full" />
          ) : error || rowsProp.length === 0 ? null : (
            <Badge variant={(better === 'under' ? drift <= 0 : drift >= 0) ? 'success' : 'warning'} className="tabular-nums">
              <BadgeDot />
              {drift > 0 ? copy.overPlan(percent.format(drift)) : copy.underPlan(percent.format(-drift))}
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className={cn('@container/spend relative', rowsProp.length === 0 && 'min-h-110')}>
        <div
          aria-hidden={covered || undefined}
          inert={covered || undefined}
          className={cn('grid gap-6 @2xl/spend:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*72)] @2xl/spend:gap-0', covered && 'invisible')}
        >
          <div className="flex min-w-0 flex-col @2xl/spend:pe-6">
            <Rows
              rows={lines}
              scale={scale}
              quarters={quarters}
              planYear={planMonth * 12}
              span={[monthName(0), monthName(11)]}
              money={money}
              compact={compact}
              copy={copy}
              locale={locale}
              heading={Section}
            />
          </div>
          <div className="min-w-0 border-t border-line pt-5 @2xl/spend:border-s @2xl/spend:border-t-0 @2xl/spend:ps-6 @2xl/spend:pt-0">
            <Summary
              ytd={ytd}
              planYtd={planYtd}
              projectedYear={sum(team)}
              facts={[{ id: 'over', label: copy.rowsOver, value: copy.rowsOverValue(over, rowsProp.length), icon: 'gauge' }, ...facts]}
              movers={[up, down].filter((m): m is PlanVsActualMover => Boolean(m))}
              money={money}
              valueOptions={valueOptions}
              better={better}
              copy={copy}
              locale={locale}
              heading={Section}
            />
          </div>
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-0 grid gap-6 px-(--card-spacing) pt-(--card-spacing) pb-3 @2xl/spend:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*72)] @2xl/spend:gap-0">
            <span className="sr-only">{copy.loadingLabel}</span>
            <div className="flex min-w-0 flex-col gap-4 @2xl/spend:pe-6">
              <Skeleton className="h-3 w-48" />
              <div className="flex flex-1 flex-col justify-between gap-3">
                {Array.from({ length: Math.min(top, Math.max(1, rowsProp.length)) + (rowsProp.length > top ? 1 : 0) }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-28 shrink-0" />
                    <Skeleton className="h-6 min-w-0 flex-1" />
                    <Skeleton className="h-3 w-14 shrink-0" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex min-w-0 flex-col gap-4 pt-5 @2xl/spend:ps-6 @2xl/spend:pt-0">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 grid place-items-center px-(--card-spacing)">
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
        )}
        {!loading && !error && rowsProp.length === 0 && (
          <div className="absolute inset-0 grid px-(--card-spacing) pt-(--card-spacing) pb-3">
            {empty ?? (
              <Empty className="rounded-lg border border-dashed border-line">
                <EmptyHeader>
                  <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <span>{copy.insight}</span>
        <div className="ms-auto flex gap-2">
          <Button variant="outline" size="sm" disabled={covered} onClick={() => (onSetPlan ? onSetPlan() : void demo('PlanVsActual: onSetPlan', 0))}>
            {copy.setPlan}
          </Button>
          <AsyncButton
            size="sm"
            disabled={covered}
            onAction={() => (onAction ? onAction() : demo('PlanVsActual: onAction', 900))}
            pendingLabel={copy.acting}
            successLabel={copy.acted}
            errorLabel={(cause) => (cause instanceof Error && cause.message ? cause.message : copy.failed)}
          >
            {copy.action}
          </AsyncButton>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-4xl', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PlanVsActual, type PlanVsActualProps }
export type { PlanVsActualCopy, PlanVsActualFormats, PlanVsActualRow, PlanVsActualFact }
