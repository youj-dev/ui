'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { DensityLanes } from '../../components/ui/density-lanes'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Switch } from '../../components/ui/switch'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { DEFAULT_COPY, LANES, type HourLane, type HourLanesCopy, type HourLanesTone } from './hour-lanes/data'

/* When things happen, by lane: DensityLanes with a lane per source (or
 * entrance, or channel) across the day, each swelling where it's busy on one
 * scale, its share of the week under its name, and the busiest bucket flagged
 * through every lane. The Off-hours switch keeps the night in color and
 * quiets the working day, so what happens while nobody is watching stands
 * out. The foot says the peak, the share outside working hours, and which
 * lane leads at night. Loading, an error with Retry and an empty chart take
 * the lanes' place at their size, and the foot's figures follow.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the dots are drawn in place and the highlight lands at once. */

interface HourLanesProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<HourLanesCopy>
  /** Formats shares (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** One lane per source, every lane with the same number of buckets through the day. */
  lanes?: HourLane[]
  /** Off-hours, as the hour they start and the hour they end: [19, 7] is 19:00 to 07:00. Default [19, 7]. */
  offHours?: readonly [number, number]
  /** Formats a count in the cells and the peak flag, before `copy.countLabel` adds the unit. Default: the locale's number format. */
  format?: (count: number) => string
  /** Skeletons in place of the lanes and the foot's figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the lanes when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to draw. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Whether the off-hours are highlighted, when your app owns it. */
  showOffHours?: boolean
  /** Whether the off-hours are highlighted at first. Default false. */
  defaultShowOffHours?: boolean
  /** Called when the Off-hours switch is flipped. */
  onShowOffHoursChange?: (show: boolean) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const clockOf = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`

/** The lanes' room while they are not drawn: what six lanes take, so the card keeps its size. */
const ROOM = 'h-124'

function HourLanes({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  lanes = LANES,
  offHours = [19, 7],
  format,
  loading = false,
  error,
  onRetry,
  empty,
  showOffHours: showProp,
  defaultShowOffHours = false,
  onShowOffHoursChange,
  ...rest
}: HourLanesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const switchId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [show, setShow] = useControllableState(showProp, defaultShowOffHours)
  const count = format ?? numberFormat(locale).format
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const blank = loading || !!error || lanes.length === 0

  // The buckets: their clock labels, a label every six hours, and the off-hours as column ranges.
  const buckets = Math.max(0, ...lanes.map((l) => l.values.length))
  const step = buckets ? 1440 / buckets : 60
  const columns = Array.from({ length: buckets }, (_, i) => clockOf(Math.round(i * step)))
  const ticks = [0, 6, 12, 18, 24].map((h) => ({ at: Math.round((h * 60) / step), label: pad(h) }))
  const [from, to] = offHours
  const fromCol = Math.round((from * 60) / step)
  const toCol = Math.round((to * 60) / step) - 1
  const night: [number, number][] =
    from > to
      ? [
          [fromCol, buckets - 1],
          [0, toCol],
        ]
      : [[fromCol, toCol]]
  const isNight = (c: number) => night.some(([a, b]) => c >= a && c <= b)

  const at = (lane: HourLane, c: number) => Math.max(0, lane.values[c] ?? 0)
  const byColumn = columns.map((_, c) => lanes.reduce((sum, lane) => sum + at(lane, c), 0))
  const total = byColumn.reduce((a, b) => a + b, 0)
  const peak = byColumn.indexOf(Math.max(0, ...byColumn))
  const nightTotal = byColumn.reduce((sum, v, c) => sum + (isNight(c) ? v : 0), 0)
  const nightBy = lanes.map((lane) => lane.values.reduce((sum, _, c) => sum + (isNight(c) ? at(lane, c) : 0), 0))
  const lead = lanes[nightBy.indexOf(Math.max(0, ...nightBy))]

  const dash = <span className="text-fg-subtle">—</span>
  const stats = [
    { label: copy.peakHour, value: <span className="font-mono">{total ? columns[peak] : '—'}</span> },
    { label: copy.offHoursShare, value: <span className="font-mono">{percent.format(total ? nightTotal / total : 0)}</span> },
    {
      label: copy.nightLead,
      value: lead ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden className="size-2 shrink-0 rounded-xs" style={{ background: toneColor(lead.tone) }} />
          <span className="truncate">{lead.label}</span>
        </span>
      ) : (
        '—'
      ),
    },
  ]

  const body = loading ? (
    <div className={cn(ROOM, 'flex flex-col gap-2')}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <div className="h-7 shrink-0" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid flex-1 grid-cols-[--spacing(18)_minmax(0,1fr)] items-center gap-x-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-8" />
          </div>
          <Skeleton className="h-2 rounded-full" />
        </div>
      ))}
      <div className="h-4 shrink-0" />
    </div>
  ) : error ? (
    <div className={cn(ROOM, 'grid place-items-center')}>
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
  ) : lanes.length === 0 ? (
    <div className={cn(ROOM, 'grid')}>
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
    <DensityLanes
      label={copy.chartLabel}
      lanes={lanes}
      columns={columns}
      ticks={ticks}
      locale={locale}
      highlight={show ? night : undefined}
      marker={total ? { column: peak, label: copy.peak(columns[peak] ?? '', copy.countLabel(count(byColumn[peak] ?? 0))) } : undefined}
      formatValue={(v) => copy.countLabel(count(v))}
    />
  )

  const card = (
    <Card data-slot="hour-lanes" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Badge variant="secondary" size="lg" className="font-mono">
            {copy.zone}
          </Badge>
        </CardAction>
      </CardHeader>

      <div className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex items-center gap-2">
          <Switch
            id={switchId}
            size="sm"
            checked={show}
            onCheckedChange={(on) => {
              setShow(on)
              onShowOffHoursChange?.(on)
            }}
          />
          <label htmlFor={switchId} className="text-ui text-fg-muted">
            {copy.offHours}
          </label>
        </div>
        {body}
      </div>

      <footer className="border-t border-line">
        <dl className="grid grid-cols-[repeat(3,minmax(max-content,1fr))]">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn('flex min-w-0 flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-foot-y)', i > 0 && 'border-s border-line')}
            >
              <dt className="truncate">
                <Eyebrow>{stat.label}</Eyebrow>
              </dt>
              <dd className="text-ui-lg text-fg tabular-nums">
                {loading ? <Skeleton className="my-0.5 h-4 w-16" /> : blank ? dash : stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </footer>
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

export { HourLanes, type HourLanesProps }
export type { HourLane, HourLanesCopy, HourLanesTone }
