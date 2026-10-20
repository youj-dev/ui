'use client'

import { useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { growthForecastLabels, useComponentLabels } from '@youj/core/labels'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { CapsuleStepper } from '../../components/ui/capsule-stepper'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Slider } from '../../components/ui/slider'
import { StatValue } from '../../components/ui/stat-card'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { ProjectionBars } from './compound-projection/bars'
import { DEFAULT_COPY, MAX_YEARS, MIN_YEARS, RATES, demo, type CompoundProjectionCopy, type CompoundProjectionPlan } from './compound-projection/data'
import { groupYears, projectCompound } from './compound-projection/project'

/* What a steady addition grows into. A monthly amount, a number of years
 * and a yearly rate drive a compound projection (`projectCompound`):
 * one rising bar per year, grouped when there are many, the last one
 * highlighted, each showing its total on hover and keyboard focus. The
 * total at the end counts to its new figure as the plan changes and the
 * bars glide to their new heights. The disclaimer sits under the Start
 * action, which runs through AsyncButton; wire it with `onStart`. Loading
 * holds skeletons in the figures, bars and fields; an error with Retry takes
 * the bars' place, at the card's size. A custom `format` writes every total
 * as text (the monthly stepper stays a plain number: it counts what you add,
 * which may not be the unit the total is shown in). Reduced motion: figures
 * and bars land at once.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it stops at its natural width unless `fill`. */

interface CompoundProjectionProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CompoundProjectionCopy>
  /** Formats amounts (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What there is today. Default 2,500. */
  initial?: number
  /** The plan (controlled): the monthly amount, the years and the yearly rate as a fraction. */
  plan?: CompoundProjectionPlan
  /** The plan it opens with. Default 250 a month for 10 years at 7%. */
  defaultPlan?: CompoundProjectionPlan
  /** Called with the plan after any control changes it. */
  onPlanChange?: (plan: CompoundProjectionPlan) => void
  /** The yearly rates the select offers, as fractions, with the plan's own. Default 3%, 5%, 7% and 9%. */
  rates?: readonly number[]
  /** Writes every total, and what was added and gained; with it the end total is text rather than a rolling Counter. Default: whole amounts in `copy.currency` (US dollars). */
  format?: (value: number) => string
  /** Skeletons in place of the figures, bars and fields while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the bars when it fails to load, with Retry when `onRetry` is set; the figures show a dash. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to project (no years). Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Starts the plan; resolve when it's saved. Default: a short demo wait. */
  onStart?: (plan: CompoundProjectionPlan) => Promise<unknown> | unknown
}

/** The skeleton's bars, rising like a projection (percent of the plot's height). */
const SKELETON_BARS = [18, 26, 34, 43, 52, 61, 71, 81, 90, 100]

const PLAN: CompoundProjectionPlan = { monthly: 250, years: 10, rate: 0.07 }

function CompoundProjection({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  initial = 2500,
  plan: planProp,
  defaultPlan = PLAN,
  onPlanChange,
  rates = RATES,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  onStart,
  className,
  ...rest
}: CompoundProjectionProps) {
  const copy: CompoundProjectionCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const labels = useComponentLabels(growthForecastLabels)
  const titleId = useId()
  const fieldId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [plan, setPlan] = useControllableState(planProp, defaultPlan)
  const change = (next: Partial<CompoundProjectionPlan>) => {
    const merged = { ...plan, ...next }
    setPlan(merged)
    onPlanChange?.(merged)
  }

  const rows = useMemo(
    () => projectCompound({ monthly: plan.monthly, years: plan.years, rate: plan.rate, initial }),
    [plan.monthly, plan.years, plan.rate, initial],
  )
  const status = loading ? 'loading' : error ? 'error' : rows.length === 0 ? 'empty' : 'ready'
  const ready = status === 'ready'
  const end = rows.at(-1) ?? { year: 0, total: initial, added: initial, gain: 0 }
  const currency = useMemo(
    () => ({ style: 'currency', currency: copy.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }) as const,
    [copy.currency],
  )
  const money = numberFormat(copy.locale, currency)
  const format = formatProp ?? money.format
  // The monthly stepper counts what you add, so it shows the number in the unit you add it in.
  const stepperFormat = formatProp ? ({ maximumFractionDigits: 0 } as const) : currency
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const rateItems = useMemo(
    () => Object.fromEntries([...new Set([...rates, plan.rate])].sort((a, b) => a - b).map((r) => [String(r), percent.format(r)])),
    [rates, plan.rate, percent],
  )
  const years = numberFormat(copy.locale)
  const L = {
    contribution: copy.contribution ?? labels.growthContribution,
    rate: copy.rate ?? labels.growthRate,
    years: copy.years ?? labels.growthYears,
    today: copy.today ?? labels.growthToday,
    year: copy.year ?? labels.growthYear,
  }
  const none = <span className="text-fg-subtle">—</span>
  // While loading or failed the fields hold their place without values.
  const locked = loading || !!error
  const lockedValue = loading ? <Skeleton className="h-4 w-24" /> : none

  const field = 'h-control w-full rounded-lg border-transparent bg-well shadow-none'
  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId} className="text-ui-lg font-medium">
            {copy.title}
          </Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        {(ready || status === 'empty' || status === 'loading') && (
          <CardAction>
            {status === 'loading' ? <Skeleton className="h-5.5 w-24 rounded-full" /> : <Badge variant="default">{copy.rateBadge(percent.format(plan.rate))}</Badge>}
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-ui-sm text-fg-muted">{L.today}</span>
              <span className="font-mono text-ui-lg font-medium text-fg-muted tabular-nums">
                {status === 'loading' ? <Skeleton className="my-0.5 h-5 w-16" /> : error ? none : format(initial)}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-ui-sm text-fg-muted">{ready ? L.year(years.format(end.year)) : L.year(years.format(plan.years))}</span>
              {ready ? (
                formatProp ? (
                  <span className="text-4xl leading-[1.1] font-semibold tracking-tight text-accent-text tabular-nums">{format(end.total)}</span>
                ) : (
                  <StatValue value={end.total} format={currency} locale={copy.locale} size="lg" className="text-accent-text" />
                )
              ) : status === 'loading' ? (
                <Skeleton className="h-7.5 w-36" />
              ) : (
                <span className="font-mono text-3xl leading-none font-medium text-fg-subtle">—</span>
              )}
            </div>
          </div>
          <div role={ready ? 'status' : undefined} className="min-h-[1lh] text-ui-sm text-fg-muted">
            {ready ? copy.split(format(end.added), format(end.gain)) : status === 'loading' ? <Skeleton className="h-4 w-56" /> : null}
          </div>
        </div>

        {ready ? (
          <ProjectionBars rows={groupYears(rows)} copy={copy} format={format} />
        ) : (
          <div className="relative flex h-52 items-end gap-2 pt-7">
            {status === 'loading' && <span className="sr-only">{copy.loadingLabel}</span>}
            {status === 'loading' ? (
              <div aria-hidden className="flex h-full w-full items-end gap-2">
                {SKELETON_BARS.map((height, i) => (
                  <Skeleton key={i} className="min-w-0 flex-1 rounded-t-xl rounded-b-sm" style={{ height: `${height}%` }} />
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 grid place-items-center pt-7">
                {error ? (
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
                ) : (
                  (empty ?? (
                    <Empty className="rounded-lg border border-dashed border-line">
                      <EmptyHeader>
                        <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                        <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-[1fr_--spacing(38)] items-center gap-x-3 gap-y-2.5">
          <Label htmlFor={`${fieldId}-monthly`} className="text-ui-sm font-normal text-fg-muted">
            {L.contribution}
          </Label>
          {locked ? (
            <div className={cn(field, 'flex items-center px-3')}>{lockedValue}</div>
          ) : (
            <CapsuleStepper
              id={`${fieldId}-monthly`}
              aria-label={L.contribution}
              value={plan.monthly}
              onValueChange={(next) => next !== null && change({ monthly: next })}
              min={0}
              max={10000}
              step={50}
              largeStep={250}
              format={stepperFormat}
              className={cn(field, 'justify-between p-0.5')}
            />
          )}
          <Label htmlFor={`${fieldId}-rate`} className="text-ui-sm font-normal text-fg-muted">
            {L.rate}
          </Label>
          {locked ? (
            <div className={cn(field, 'flex items-center px-3')}>{lockedValue}</div>
          ) : (
            <Select items={rateItems} value={String(plan.rate)} onValueChange={(next) => next && change({ rate: Number(next) })}>
              <SelectTrigger id={`${fieldId}-rate`} aria-label={L.rate} className={field}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rateItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Label className="text-ui-sm font-normal text-fg-muted">{L.years}</Label>
          <div className={cn(field, 'flex items-center gap-2.5 px-3')}>
            {locked ? (
              lockedValue
            ) : (
              <>
                <Slider
                  aria-label={L.years}
                  min={MIN_YEARS}
                  max={MAX_YEARS}
                  step={1}
                  value={plan.years}
                  onValueChange={(next) => change({ years: Array.isArray(next) ? next[0]! : next })}
                  getAriaValueText={(_, v) => copy.yearsValue(v)}
                  className="min-w-0 flex-1"
                />
                <span className="w-8 shrink-0 text-end font-mono text-ui-sm font-medium tabular-nums">{years.format(plan.years)}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-4">
        <p className="min-w-0 text-ui-xs text-fg-muted">{copy.disclaimer}</p>
        <AsyncButton
          size="sm"
          className="shrink-0"
          disabled={locked}
          pendingLabel={copy.starting}
          successLabel={copy.started}
          onAction={() => (onStart ? onStart(plan) : demo('CompoundProjection: onStart', 900))}
        >
          {copy.start}
        </AsyncButton>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
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

export { CompoundProjection, type CompoundProjectionProps }
export type { CompoundProjectionCopy, CompoundProjectionPlan }
