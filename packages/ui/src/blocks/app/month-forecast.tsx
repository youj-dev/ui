'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronDownIcon, MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { ForecastBand, type ForecastPoint } from '../../components/ui/forecast-band'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import {
  ACTUAL,
  BUDGET,
  BUDGETS,
  DEFAULT_COPY,
  FORECASTS,
  SCALE_MAX,
  SCENARIOS,
  SERIES,
  START,
  demo,
  type MonthForecastCopy,
  type MonthForecastScenario,
  type MonthForecastSeries,
} from './month-forecast/data'
import { Projection } from './month-forecast/projection'
import { SeriesList } from './month-forecast/series-list'

/* A month's running total, read as where it will land. The month-end
 * projection leads, large in mono with its cents muted, with how far it
 * lands from the budget as a soft pill and its likely range; beside it, the
 * figures behind it in a well. The ForecastBand draws spend so far, the
 * forecast with its likely range over a hatched projection, the budget, and
 * the day the forecast crosses it (the marker pulses once as it lands).
 * Per series, spent is solid and the rest of the projection hatched. The
 * scenario switch (your `scenarios`) morphs the forecast: the figure rolls
 * to its new value, the pill turns, and the crossing marker leaves when the
 * forecast stays under. Loading holds skeletons in the figures, chart and
 * bars; an error with Retry or no data takes the chart's place, all at the
 * card's size. A custom `format` writes every amount as text. Adjust budget moves the line, and
 * the marker glides to its new day and pulses once. Set alert runs through
 * Button onAction; wire it with `onSetAlert`. Reduced motion:
 * everything is drawn in place.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

/** The chart's room: legend, plot and axis. */
const CHART_SIZE = 'h-67'

interface MonthForecastProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (704px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<MonthForecastCopy>
  /** The running total at the end of each elapsed day, the last being today. */
  actual?: readonly number[]
  /** The ways the rest of the period could go, switched between at the top. Default: current pace and a savings plan. */
  scenarios?: readonly MonthForecastScenario[]
  /** The rest of the period per scenario id, as ForecastBand takes it. */
  forecasts?: Record<string, readonly ForecastPoint[]>
  /** The parts the total is made of, drawn as bars. */
  series?: readonly MonthForecastSeries[]
  /** The period's first day. Default: 1 September 2026. */
  start?: string
  /** The budget it opens with. Default 12,000. */
  budget?: number
  /** The budgets the menu offers, with the current one. Default 11,000 to 14,000. */
  budgets?: readonly number[]
  /** The chart's top, held across scenarios and budgets so the axis stays still. Default 15,000. */
  max?: number
  /** The id of the scenario it opens with. Default: the first. */
  defaultScenario?: string
  /** Writes every amount; with it the headline is text rather than a rolling Counter. Default: US dollars in the locale's number format. */
  format?: (value: number) => string
  /** Skeletons in place of the figures, chart and bars while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the chart when it fails to load, with Retry when `onRetry` is set; the figures show a dash. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is no data. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Sets an alert at the budget; resolve when it's saved. Default: a short demo wait. */
  onSetAlert?: (budget: number) => Promise<unknown> | unknown
  /** Formats every amount (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function MonthForecast({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  actual = ACTUAL,
  forecasts = FORECASTS,
  scenarios = SCENARIOS,
  series = SERIES,
  start = START,
  budget: initialBudget = BUDGET,
  budgets = BUDGETS,
  max = SCALE_MAX,
  defaultScenario,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  onSetAlert,
  locale,
  className,
  ...rest
}: MonthForecastProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [picked, setScenario] = useState(defaultScenario)
  const scenario = scenarios.some((s) => s.id === picked) ? picked! : (scenarios[0]?.id ?? '')
  const [budget, setBudget] = useState(initialBudget)
  const { announce, announcer } = useAnnouncer()

  const format = useMemo(() => ({ style: 'currency', currency: copy.currency }) as const, [copy.currency])
  const money = useMemo(
    () => formatProp ?? numberFormat(copy.locale, { ...format, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format,
    [formatProp, copy.locale, format],
  )
  const status = loading ? 'loading' : error ? 'error' : actual.length === 0 || !forecasts[scenario] ? 'empty' : 'ready'
  const ready = status === 'ready'
  const forecast = forecasts[scenario] ?? []
  const spent = actual.at(-1) ?? 0
  const end = forecast.at(-1) ?? { value: spent, low: spent, high: spent }
  const verdict = end.value > budget ? copy.over(money(end.value - budget)) : copy.under(money(budget - end.value))

  // Spoken after a new scenario or budget, never on the first render.
  const spoken = ready ? copy.announce(money(end.value), verdict) : ''
  const lastSpoken = useRef(spoken)
  useEffect(() => {
    if (spoken === lastSpoken.current) return
    lastSpoken.current = spoken
    if (spoken) announce(spoken)
  }, [spoken, announce])

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-176')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.exportCsv}</DropdownMenuItem>
              <DropdownMenuItem>{copy.viewDetails}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Projection
          copy={copy}
          control={
            <SegmentedControl aria-label={copy.scenario} value={scenario} onValueChange={setScenario} disabled={!ready} className="w-full sm:w-fit">
              {scenarios.map((s) => (
                <SegmentedControlItem key={s.id} value={s.id} className="flex-1 sm:flex-none">
                  {s.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          }
          status={status === 'loading' ? 'loading' : ready ? 'ready' : 'idle'}
          custom={!!formatProp}
          projected={end.value}
          low={end.low}
          high={end.high}
          budget={budget}
          spent={spent}
          burn={actual.length ? spent / actual.length : 0}
          daysLeft={forecast.length}
          money={money}
        />
      </CardContent>

      <CardContent>
        {ready ? (
          <ForecastBand
            actual={actual}
            forecast={forecast}
            budget={budget}
            start={start}
            max={max}
            format={formatProp ? undefined : format}
            formatValue={formatProp}
            locale={copy.locale}
            label={copy.chart}
          />
        ) : (
          <div className="relative">
            {/* The chart's own size, drawn from skeleton or invisible, so the message sits in the room the chart takes. */}
            <div aria-hidden className={cn(CHART_SIZE, 'flex flex-col gap-3', status !== 'loading' && 'invisible')}>
              <Skeleton className="h-5 w-72 max-w-full" />
              <Skeleton className="min-h-0 flex-1" />
              <Skeleton className="h-4 w-full" />
            </div>
            {loading && <span className="sr-only">{copy.loadingLabel}</span>}
            {error ? (
              <div className="absolute inset-0 grid place-items-center">
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
            ) : status === 'empty' ? (
              <div className="absolute inset-0 grid place-items-center">
                {empty ?? (
                  <Empty className="rounded-lg border border-dashed border-line">
                    <EmptyHeader>
                      <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                      <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>

      <CardContent>
        <SeriesList series={series} scenario={scenario} copy={copy} money={money} placeholder={ready ? undefined : loading ? 'loading' : 'blank'} />
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className="me-auto text-ui-sm text-fg-muted">{copy.updated}</span>
        <div className="ms-auto flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" disabled={!ready} />}>
              {copy.adjust}
              <ChevronDownIcon size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={String(budget)} onValueChange={(value) => setBudget(Number(value))}>
                <DropdownMenuLabel>{copy.budgetMenu}</DropdownMenuLabel>
                {[...new Set([...budgets, budget])]
                  .sort((a, b) => a - b)
                  .map((option) => (
                    <DropdownMenuRadioItem key={option} value={String(option)}>
                      {money(option)}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <AsyncButton
            pendingLabel={copy.settingAlert}
            successLabel={copy.alertSet}
            disabled={!ready}
            onAction={() => (onSetAlert ? onSetAlert(budget) : demo('MonthForecast: onSetAlert', 900))}
          >
            {copy.setAlert}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-176', className)}>
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

export { MonthForecast, type MonthForecastProps }
export type { MonthForecastCopy, MonthForecastScenario, MonthForecastSeries }
