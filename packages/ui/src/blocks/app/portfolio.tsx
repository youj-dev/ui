'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { portfolioLabels, useComponentLabels } from '@youj/core/labels'
import { InfoIcon } from '@youj/icons'
import { Counter } from '@youj/motion'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { PortfolioChart } from './portfolio/chart'
import {
  DEFAULT_COPY,
  HOLDINGS,
  MONEY,
  PERIODS,
  SERIES,
  type PortfolioCopy,
  type PortfolioHolding,
  type PortfolioPeriod,
  type PortfolioPoint,
} from './portfolio/data'
import { Change, Holdings } from './portfolio/holdings'

/* A value read at a glance: what it is worth now, how it moved over the
 * period, and what it is made of. The period switch morphs the
 * area chart point by point while its date axis crossfades, and the return
 * and the investments total count to the period's figures; the rows below
 * turn their arrows and colors with it. Hovering the chart scrubs a readout
 * of the value on a date; with the keyboard the chart is one stop and the
 * arrow keys move a focus point (Home and End jump to the ends). Direction is
 * always an arrow glyph and a spoken "Up" or "Down" as well as a color.
 * Amounts follow `format` and the locale (dollars, revenue, spend); dates the
 * locale. Loading, an error with Retry and an empty chart take the chart's
 * place at its size. Reduced motion: values and the chart land at once.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it stops at its natural width unless `fill`. */

interface PortfolioProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<PortfolioCopy>
  /** Formats amounts and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** How the amounts are written (Intl.NumberFormat options). Default: US dollars. */
  format?: Intl.NumberFormatOptions
  /** The spans of time on the switch, each with its date axis and the phrase after the change. Default: 1M, 6M, 1Y, 5Y and Max. */
  periods?: readonly PortfolioPeriod[]
  /** The value per period (by period `id`), oldest point first; the last point is now. Default: a demo series. */
  series?: Record<string, readonly PortfolioPoint[]>
  /** The parts it is made of. Default: five demo parts. */
  holdings?: readonly PortfolioHolding[]
  /** The selected period's `id` (controlled). */
  period?: string
  /** The period's `id` it opens with. Default: the middle one. */
  defaultPeriod?: string
  /** Called with the newly selected period's `id`. */
  onPeriodChange?: (period: string) => void
  /** Skeletons in place of the figures, the chart and the rows while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the chart when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is no series to draw. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const AXIS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

function Portfolio({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  format = MONEY,
  periods = PERIODS,
  series = SERIES,
  holdings = HOLDINGS,
  period: periodProp,
  defaultPeriod,
  onPeriodChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: PortfolioProps) {
  const copy: PortfolioCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const labels = useComponentLabels(portfolioLabels)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [period, setPeriod] = useControllableState(periodProp, defaultPeriod ?? periods[Math.floor((periods.length - 1) / 2)]?.id ?? '')
  const current = periods.find((p) => p.id === period) ?? periods[0]

  const points = series[current?.id ?? period] ?? []
  const ready = !loading && !error && points.length > 0
  const first = points[0]?.v ?? 0
  const now = points.at(-1)?.v ?? 0
  const change = first ? now / first - 1 : 0
  const tone = Math.abs(change) < 0.0005 ? 'flat' : change > 0 ? 'up' : 'down'
  const money = numberFormat(copy.locale, format)
  // The chart's room: the slider and its axis, so the card keeps its size.
  const room = 'relative flex h-46 items-center justify-center'
  const chart = loading ? (
    <div className={room}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <svg aria-hidden preserveAspectRatio="none" viewBox="0 0 100 40" className="absolute inset-x-0 top-0 h-40 w-full overflow-visible">
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={100}
            y1={40 * f}
            y2={40 * f}
            stroke="var(--color-line-subtle)"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <Skeleton
        className="absolute inset-x-0 top-0 h-40 rounded-lg"
        style={{ clipPath: 'polygon(0 78%, 12% 66%, 26% 72%, 40% 52%, 55% 58%, 70% 36%, 84% 42%, 100% 22%, 100% 100%, 0 100%)' }}
      />
    </div>
  ) : error ? (
    <div className={room}>
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
  ) : points.length === 0 ? (
    <div className={cn(room, 'grid')}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  ) : (
    <PortfolioChart series={points} axis={current?.axis ?? AXIS} tone={tone} locale={copy.locale} format={format} />
  )

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-md')}>
      <CardContent className="flex flex-col gap-5">
        <Title id={titleId} className="sr-only">
          {copy.title}
        </Title>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-ui-sm text-fg-muted">{copy.valueLabel}</span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={labels.portfolioInfo}
                    className="grid size-5 place-items-center rounded-full text-fg-subtle hover:text-fg focus-ring"
                  />
                }
              >
                <InfoIcon size={14} />
              </TooltipTrigger>
              <TooltipContent>{copy.valueInfo}</TooltipContent>
            </Tooltip>
          </div>
          {ready ? (
            <Counter
              value={now}
              mode="roll"
              format={format}
              locale={copy.locale}
              inView={false}
              className="self-start font-mono text-4xl leading-none font-medium tracking-[-0.03em]"
            />
          ) : (
            <span className="flex h-9 items-center font-mono text-4xl leading-none font-medium text-fg-subtle">
              {loading ? <Skeleton className="h-8 w-48" /> : '—'}
            </span>
          )}
          <div className="flex min-h-4.25 flex-wrap items-baseline gap-x-2 text-ui-sm text-fg-muted">
            {ready ? (
              <>
                <Change value={change} locale={copy.locale} />
                <span>{[money.format(Math.abs(now - first)), current?.name].filter(Boolean).join(' ')}</span>
              </>
            ) : loading ? (
              <Skeleton className="h-[1lh] w-40" />
            ) : (
              <span className="h-[1lh] text-fg-subtle">—</span>
            )}
          </div>
        </div>

        {chart}

        <SegmentedControl
          aria-label={labels.portfolioPeriod}
          variant="pill"
          value={current?.id ?? period}
          onValueChange={(next) => (setPeriod(next), onPeriodChange?.(next))}
          className="w-full"
        >
          {periods.map((p) => (
            <SegmentedControlItem key={p.id} value={p.id} className="flex-1" disabled={loading}>
              {p.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <Holdings
          holdings={holdings}
          period={current?.id ?? period}
          format={format}
          change={change}
          copy={copy}
          status={ready ? 'ready' : loading ? 'loading' : 'blank'}
          rows={holdings.length || 5}
          heading={embedded ? 'h3' : 'h2'}
        />
      </CardContent>
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

export { Portfolio, type PortfolioProps }
