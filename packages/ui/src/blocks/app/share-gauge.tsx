'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, PERIODS, type ShareGaugeCopy, type ShareGaugeItem, type ShareGaugePeriod } from './share-gauge/data'
import { Gauge, type GaugeSlice } from './share-gauge/gauge'
import { List, type ListRow } from './share-gauge/list'
import { groupTop, percents, spans } from './share-gauge/model'

/* Where a total went, as a half-donut over a ranked list. The biggest few
 * items each take a segment in a chart color and the tail folds into one
 * quiet Other; the middle holds the total (it counts to each new figure) and
 * the period. Under it, every item is a row: its mark, name and maker, its
 * amount and share, and a thin line in its color as long as it is against
 * the largest. Pointing at a segment or a row, or moving to a row with the
 * arrow keys (the list is one tab stop), quiets the rest and puts a tag
 * over the segment, so the two always read as one. Switching the period
 * moves every segment edge on the base token instead of redrawing. It keeps
 * its size whatever the period holds. Reduced motion: it changes in place.
 * Built for the compact layout density, taken from the page; embedded, it
 * stops at its natural width unless `fill`. */

interface ShareGaugeProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ShareGaugeCopy>
  /** Formats amounts (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The stretches of time to switch between, each with what was spent in it. One period leaves the switch out. Default: a demo month, quarter and year. */
  periods?: readonly ShareGaugePeriod[]
  /** The period shown (controlled): an id from `periods`. */
  period?: string
  /** The period it opens with. Default: the first. */
  defaultPeriod?: string
  /** Called with the newly selected period's id. */
  onPeriodChange?: (id: string) => void
  /** How many items take a segment before the rest fold into Other. Default 5. */
  top?: number
  /** Intl.NumberFormat options for every amount. Default: whole `copy.currency`. */
  format?: Intl.NumberFormatOptions
  /** Skeletons in place of the gauge and the list while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the gauge when it fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when the period has no spend. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const OTHER = '__other'
const color = (i: number) => `var(--color-chart-${(i % 5) + 1})`

function ShareGauge({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  periods = PERIODS,
  period: periodProp,
  defaultPeriod,
  onPeriodChange,
  top = 5,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: ShareGaugeProps) {
  const copyLocale = useLocale(locale ?? copyProp?.locale)
  const copy: ShareGaugeCopy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: copyLocale }), [copyProp, copyLocale])
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [periodId, setPeriod] = useControllableState(periodProp, defaultPeriod ?? periods[0]?.id ?? '')
  const [active, setActive] = useState<string | null>(null)
  const period = periods.find((p) => p.id === periodId) ?? periods[0]

  const money = useMemo<Intl.NumberFormatOptions>(() => format ?? { style: 'currency', currency: copy.currency, maximumFractionDigits: 0 }, [format, copy.currency])
  const figure = numberFormat(copy.locale, money)
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 })

  const model = useMemo(() => {
    const { kept, rest, restValue } = groupTop(period?.items ?? [], top)
    const entries: (ShareGaugeItem & { color: string })[] = kept.map((item, i) => ({ ...item, color: color(i) }))
    if (rest.length > 0) entries.push({ id: OTHER, label: copy.other(rest.length), detail: copy.otherDetail, value: restValue, color: 'var(--color-chart-quiet)' })
    const values = entries.map((e) => e.value)
    const shares = percents(values)
    const placed = spans(values)
    const total = values.reduce((sum, v) => sum + v, 0)
    const biggest = Math.max(0, ...values)
    return { entries, shares, placed, total, biggest }
  }, [period, top, copy])

  const slices: GaugeSlice[] = model.entries.map((e, i) => ({ id: e.id, from: model.placed[i]![0], to: model.placed[i]![1], color: e.color }))
  const rows: ListRow[] = model.entries.map((e, i) => ({
    id: e.id,
    label: e.label,
    detail: e.detail,
    icon: e.icon,
    amount: figure.format(e.value),
    share: percent.format(model.shares[i]! / 100),
    line: model.biggest > 0 ? e.value / model.biggest : 0,
    color: e.color,
  }))
  const summary = copy.summary(
    figure.format(model.total),
    period?.name ?? '',
    model.entries.map((e, i) => copy.part(e.label, percent.format(model.shares[i]! / 100))).join(', '),
  )
  const tag = (id: string) => {
    const i = model.entries.findIndex((e) => e.id === id)
    const e = model.entries[i]
    return e ? (
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-2 rounded-full" style={{ background: e.color }} />
        <span className="font-medium">{e.label}</span>
        <span className="tabular-nums">{figure.format(e.value)}</span>
        <span className="text-fg-muted tabular-nums">{percent.format(model.shares[i]! / 100)}</span>
      </span>
    ) : null
  }

  const switcher =
    periods.length > 1 ? (
      <SegmentedControl
        aria-label={copy.periodLabel}
        variant="pill"
        value={period?.id ?? ''}
        onValueChange={(next) => {
          setPeriod(next)
          setActive(null)
          onPeriodChange?.(next)
        }}
      >
        {periods.map((p) => (
          <SegmentedControlItem key={p.id} value={p.id}>
            {p.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    ) : null

  const body = loading ? (
    <div className="flex flex-col gap-5">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="mx-auto aspect-200/108 w-full max-w-88 rounded-t-full rounded-b-lg" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: Math.min(top + 1, 6) }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
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
  ) : model.entries.length === 0 ? (
    (empty ?? (
      <Empty className="rounded-lg bg-well">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <div className="flex flex-col gap-5">
      <Gauge slices={slices} active={active} onActive={setActive} tag={tag} aria-label={summary}>
        <span className="flex flex-col items-center gap-1">
          <Counter value={model.total} mode="roll" format={money} locale={copy.locale} inView={false} className="font-mono text-3xl leading-none font-medium tracking-[-0.03em]" />
          <span className="text-ui-sm text-fg-muted">{period?.name}</span>
        </span>
      </Gauge>
      <List rows={rows} active={active} onActive={setActive} reduced={k.reduced} rowsKept={Math.min(top + 1, 6)} aria-label={copy.listLabel} />
    </div>
  )

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId} className="text-ui-lg font-medium">
            {copy.title}
          </Title>
        </CardTitle>
        {switcher && <CardAction className="self-center">{switcher}</CardAction>}
      </CardHeader>
      <CardContent aria-busy={loading || undefined}>{body}</CardContent>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ShareGauge, type ShareGaugeProps }
export type { ShareGaugeItem, ShareGaugePeriod, ShareGaugeCopy }
