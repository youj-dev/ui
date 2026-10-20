'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { StatGroup } from '../../components/ui/stat-card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEFAULT_RANGE,
  RANGES,
  demoFor,
  headline,
  timeOf,
  type KpiCardsCopy,
  type KpiCardsGranularity,
  type KpiCardsKpi,
  type KpiCardsRange,
  type KpiCardsVariant,
} from './kpi-cards/data'
import { Tile } from './kpi-cards/tile'

/* The numbers a team reads first: one tile per KPI with its figure, rolling
 * to each new value, and its change against the period before, in three
 * looks. `minimal` joins the tiles on hairlines in one panel, figures only.
 * `trend` (the default) gives each its own card and draws its period as a
 * line over a wash, the period before as a dashed ghost, a bucket still
 * filling dashed. `bars` draws a bar per bucket with the period before as a
 * tick on each. In both, the picture is a slider: move along any tile, drag
 * a finger or focus it and use the arrow keys, and every tile reads that
 * bucket at once (its figure, the date and the change against the same
 * bucket before; Escape lets go). A tip beside a label holds its
 * definition. The range switch swaps the window: figures roll, lines morph
 * and the new figures are announced. Feed it `kpis` and `dates` for the
 * range and answer `onRangeChange` with the next ones; every string is in
 * `copy`. It lays out by its own width: one column, two from 28rem, four
 * from 56rem. Built for the compact layout density, taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion:
 * figures and pictures land in place; the crosshair still follows. */

interface KpiCardsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<KpiCardsCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The tiles, in order, each with one reading per bucket. Default: the demo shop's revenue, new customers, conversion and refund rate. */
  kpis?: KpiCardsKpi[]
  /** When each bucket starts (ISO dates, read as UTC), shared by every KPI. Default: the demo's for the range. */
  dates?: string[]
  /** How long a bucket is, for the dates. Default: the demo's for the range, else `day`. */
  granularity?: KpiCardsGranularity
  /** `minimal` (figures on hairlines), `trend` (a line each) or `bars` (a bar per bucket). Default `trend`. */
  variant?: KpiCardsVariant
  /** The last bucket is still filling (today): its segment dashed, read "so far". Default: true with the demo's data, else false. */
  partial?: boolean
  /** The windows the range switch offers; fewer than two hides it. Default: 7D, 30D and 90D. */
  ranges?: KpiCardsRange[]
  /** The id of the window shown, controlled: pair it with `onRangeChange`. Default: uncontrolled. */
  range?: string
  /** The window shown first, uncontrolled. Default `30d`. */
  defaultRange?: string
  /** Called with the window picked; answer with that window's `kpis` and `dates`. */
  onRangeChange?: (range: string) => void
  /** Each tile holds a skeleton while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the tiles when they fail to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there are no KPIs. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const SHORT: Record<KpiCardsGranularity, Intl.DateTimeFormatOptions> = {
  hour: { hour: 'numeric' },
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
}
const LONG: Record<KpiCardsGranularity, Intl.DateTimeFormatOptions> = {
  hour: { weekday: 'short', hour: 'numeric', minute: '2-digit' },
  day: { weekday: 'short', month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'long', year: 'numeric' },
}

const NO_DATES: string[] = []

function KpiCards({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  kpis: kpisProp,
  dates: datesProp,
  granularity: granularityProp,
  variant = 'trend',
  partial: partialProp,
  ranges = RANGES,
  range: rangeProp,
  defaultRange = DEFAULT_RANGE,
  onRangeChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: KpiCardsProps) {
  const copyLocale = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: copyLocale }), [copyProp, copyLocale])
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { announce, announcer } = useAnnouncer()
  const [range, setRange] = useControllableState(rangeProp, defaultRange)
  const [active, setActive] = useState<number | null>(null)

  const demo = kpisProp === undefined
  const kpis = kpisProp ?? demoFor(range).kpis
  const dates = datesProp ?? (demo ? demoFor(range).dates : NO_DATES)
  const granularity = granularityProp ?? (demo ? demoFor(range).granularity : 'day')
  const partial = partialProp ?? demo

  const written = useMemo(() => {
    const as = (options: Intl.DateTimeFormatOptions) => dateTimeFormat(copy.locale, { ...options, timeZone: 'UTC' })
    const short = as(SHORT[granularity])
    const long = as(LONG[granularity])
    const times = dates.map(timeOf)
    const first = times[0]
    const last = times.at(-1)
    return {
      long: (i: number) => (times[i] === undefined ? '' : granularity === 'week' ? copy.weekOf(long.format(times[i])) : long.format(times[i])),
      ends: [first === undefined ? '' : short.format(first), last === undefined ? '' : short.format(last)] as [string, string],
      period: first === undefined || last === undefined ? '' : first === last ? short.format(first) : short.formatRange(first, last),
    }
  }, [dates, granularity, copy])

  const pick = (next: string) => {
    const picked = ranges.find((r) => r.id === next)
    setRange(next)
    setActive(null)
    onRangeChange?.(next)
    if (!demo) return
    // The demo knows the new window at once; your data arrives with the next render.
    const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
    const figures = demoFor(next).kpis.map((kpi) => {
      const value = headline(kpi.series, kpi.aggregate, kpi.value)
      const before = kpi.previous ? headline(kpi.previous, kpi.aggregate, kpi.previousValue) : undefined
      const change = before ? value / before - 1 : 0
      const moved = Math.abs(change) < 0.0005 ? '' : `, ${(change > 0 ? copy.up : copy.down)(percent.format(Math.abs(change)))}`
      return `${kpi.label} ${numberFormat(copy.locale, kpi.format).format(value)}${moved}`
    })
    announce(copy.announcement((picked?.name ?? picked?.label ?? next), figures.join('; ')))
  }

  const tile = (kpi: KpiCardsKpi, i: number) => (
    <Tile
      key={kpi.id}
      kpi={kpi}
      index={i}
      variant={variant}
      partial={partial}
      comparison={ranges.find((r) => r.id === range)?.comparison ?? copy.versus}
      active={active}
      onActiveChange={setActive}
      dateOf={written.long}
      ends={written.ends}
      loading={loading}
      copy={copy}
    />
  )
  // While loading without data, the tiles you'll get hold their places.
  const shown = loading && kpis.length === 0 ? demoFor(range).kpis.map((kpi) => ({ ...kpi, series: [], previous: undefined })) : kpis

  const body = error ? (
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
  ) : !loading && kpis.length === 0 ? (
    (empty ?? (
      <Empty className="rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : variant === 'minimal' ? (
    <StatGroup className="@md/kpis:grid-cols-2 @4xl/kpis:grid-cols-4">{shown.map(tile)}</StatGroup>
  ) : (
    <div className="grid gap-3 @md/kpis:grid-cols-2 @4xl/kpis:grid-cols-4">
      {shown.map((kpi, i) => (
        <Card key={kpi.id} size="sm" className="gap-0 py-0 *:data-[slot=stat]:p-(--card-spacing)">
          {tile(kpi, i)}
        </Card>
      ))}
    </div>
  )

  const content = (
    <div data-slot="kpi-cards" data-variant={variant} className="@container/kpis flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Title id={titleId} className="text-ui-lg leading-snug font-semibold tracking-tight text-fg">
            {copy.title}
          </Title>
          {written.period && <p className="text-ui text-fg-muted tabular-nums">{written.period}</p>}
        </div>
        {ranges.length > 1 && (
          <SegmentedControl variant="pill" size="sm" aria-label={copy.range} value={range} onValueChange={pick}>
            {ranges.map((r) => (
              <SegmentedControlItem key={r.id} value={r.id} className="px-2.5 tabular-nums">
                {r.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </div>
      <div aria-busy={loading || undefined} className="contents">
        {loading && <span className="sr-only">{copy.loading}</span>}
        {body}
      </div>
      {announcer}
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full text-fg', !fill && 'max-w-5xl', className)}>
      {content}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      <div className={cn('w-full', !fill && 'max-w-5xl')}>{content}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { KpiCards, type KpiCardsProps, type KpiCardsCopy, type KpiCardsKpi, type KpiCardsRange, type KpiCardsVariant, type KpiCardsGranularity }
