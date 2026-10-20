'use client'

import { useEffect, useId, useMemo, useState, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { MoreHorizontalIcon, PlayIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DotMap } from '../../components/ui/dot-map'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  demo,
  drift,
  failureRate,
  handle,
  RANGES,
  SNAPSHOTS,
  THRESHOLD,
  type RegionMapCopy,
  type RegionMapRange,
  type RegionMapRegion,
} from './region-map/data'
import { MapPlaceholder, TablePlaceholder } from './region-map/placeholder'
import { RegionTable } from './region-map/region-table'

/* Where an edge network's requests come from, live: the total rate, big and
 * in mono, with its change and a Live pill; the world as a grid of dots with
 * each point of presence lit by its share of the traffic (DotMap); and the
 * regions as a table, busiest first, with their share, rate and p95. The
 * table is the source of truth and the map follows it: hover a row or focus
 * its name and that region lights on the map, under a crosshair; hover the
 * map and the row lights. Without `snapshots` the demo rates drift every few
 * seconds, under a "Demo data" badge: each region sends one pulse and the
 * dots around it brighten or dim. Your snapshots show as given. The
 * range control swaps the snapshot. Reroute traffic moves the slow region's
 * load to its nearest healthy neighbor; swap the demo fallback for your API
 * with `onReroute`. Reduced motion: values change in place, without pulses.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it starts at the cell's edge and stops at its natural width (46rem), or
 * takes the whole cell with `fill`, where from 64rem the map and the table
 * sit side by side instead of the map running the full width. */

interface RegionMapProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<RegionMapCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** A snapshot of the regions per range id, now; re-render with fresh ones to keep it live. Default: ten demo points of presence whose rates drift. */
  snapshots?: Record<string, RegionMapRegion[]>
  /** The spans of time to choose between, in the toggle's order. Default: 5 minutes, 1 hour, 24 hours. */
  ranges?: RegionMapRange[]
  /** Writes the rates (`Intl.NumberFormat` options). Default: compact notation. */
  format?: Intl.NumberFormatOptions
  /** Writes the readings (`Intl.NumberFormat` options). Default: milliseconds. */
  readingFormat?: Intl.NumberFormatOptions
  /** A region is flagged past this reading. Default 180. */
  threshold?: number
  /** Skeletons in place of the map and the table while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the map and the table when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no regions. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** The range shown first, by id. Default: the first. */
  defaultRange?: string
  /** A region pinned from the start, by id: lit on the map with its row marked, as if clicked. For a link from elsewhere (the region an incident hits). Default: none. */
  defaultRegion?: string
  /** Let the demo rates drift every few seconds (yours never drift). Default true. */
  live?: boolean
  /** Shows a dashed "Demo data" badge while the card runs on its demo regions (no `snapshots` passed). Default true. */
  demoMarker?: boolean
  /** Acts on the flagged regions (the demo's reroute); resolve when it's done. Default: a short demo wait. */
  onAction?: (flagged: RegionMapRegion[]) => Promise<unknown> | unknown
}

/** How often the demo rates drift, in milliseconds. */
const TICK = 3200
/** The theme's label voice (mono capitals in Bezel) for Classic; Bezel sets its own. */
const COMPACT: Intl.NumberFormatOptions = { notation: 'compact', maximumFractionDigits: 1 }
const MILLISECONDS: Intl.NumberFormatOptions = { style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 }
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

function RegionMap({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  snapshots: ownSnapshots,
  ranges = RANGES,
  format: rateFormat = COMPACT,
  readingFormat = MILLISECONDS,
  threshold = THRESHOLD,
  loading = false,
  error,
  onRetry,
  empty,
  defaultRange,
  defaultRegion,
  live: liveProp = true,
  onAction,
  demoMarker = true,
  className,
  ...rest
}: RegionMapProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  // Without your snapshots it runs the demo regions, drifting and marked as such; yours show as given.
  const simulated = ownSnapshots === undefined
  const snapshots = ownSnapshots ?? SNAPSHOTS
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [rangeId, setRange] = useState(defaultRange ?? ranges[0]?.id ?? '')
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0]
  const [live, setLive] = useState(liveProp)
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [tick, setTick] = useState(0)
  const [rerouted, setRerouted] = useState<string[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(defaultRegion ?? null)

  useEffect(() => {
    if (!simulated || !live || !visible) return
    const id = setInterval(() => setTick((t) => t + 1), TICK)
    return () => clearInterval(id)
  }, [simulated, live, visible])

  // In the demo, rerouted regions hand most of their load to the busiest healthy region and recover their latency.
  const regions = useMemo(() => {
    const shown = (range && snapshots[range.id]) || []
    const base = tick ? drift(shown, tick, threshold) : shown
    return simulated ? handle(base, rerouted, threshold) : base
  }, [simulated, snapshots, range, tick, rerouted, threshold])

  const total = regions.reduce((sum, r) => sum + r.value, 0)
  const slow = regions.filter((r) => r.reading > threshold)
  const reading = total ? regions.reduce((sum, r) => sum + r.reading * r.value, 0) / total : 0
  const change = range?.previous ? total / range.previous - 1 : 0
  const active = hovered ?? pinned

  const number = numberFormat(copy.locale, { maximumFractionDigits: 0 })
  const compact = numberFormat(copy.locale, rateFormat)
  const signed = numberFormat(copy.locale, { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 })
  const percent = numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const readings = numberFormat(copy.locale, readingFormat)
  const [before, after = ''] = copy.footer.split('{count}')
  const dash = <span className="text-fg-subtle">—</span>
  const bare = loading || !!error || regions.length === 0
  const figure = (value: ReactNode, skeleton: string) => (loading ? <Skeleton className={skeleton} /> : error || regions.length === 0 ? dash : value)

  const stats = [
    {
      label: copy.reading,
      // The unit small and muted, whichever side of the figure the locale puts it.
      value: figure(
        readings.formatToParts(reading).map((part, i) =>
          part.type === 'unit' ? (
            <span key={i} className="text-ui-sm font-normal text-fg-muted">
              {part.value}
            </span>
          ) : (
            part.value
          ),
        ),
        'h-6 w-16',
      ),
      tone: !bare && reading > threshold ? 'text-warning-text' : '',
    },
    { label: copy.failures, value: figure(percent.format(failureRate(regions)), 'h-6 w-14'), tone: !bare && slow.length ? 'text-warning-text' : '' },
    { label: copy.regionsLabel, value: figure(copy.regionCount(regions.length, slow.length), 'h-6 w-24'), tone: '' },
  ]

  // Both places keep the size they have with the data.
  const mapState = bare ? (
    <MapPlaceholder loading={loading} error={error} onRetry={onRetry} empty={empty} none={regions.length === 0} copy={copy} />
  ) : null
  const tableState = bare ? <TablePlaceholder loading={loading} /> : null

  const card = (
    <Card
      className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-184', '@5xl/traffic:grid @5xl/traffic:grid-cols-2')}
    >
      <CardHeader className="border-b border-line py-4 @5xl/traffic:col-span-2">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {copy.scope} · {range?.name}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.exportCsv}</DropdownMenuItem>
              <DropdownMenuItem>{copy.openLogs}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 py-(--card-spacing) @5xl/traffic:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow className={VOICE}>{copy.measure}</Eyebrow>
          <SegmentedControl aria-label={copy.range} size="sm" value={range?.id} onValueChange={(next) => next && setRange(next)}>
            {ranges.map((r) => (
              <SegmentedControlItem key={r.id} value={r.id} className="px-2.5 font-mono text-ui-sm">
                {r.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {loading ? (
            <Skeleton className="h-9 w-40" />
          ) : bare ? (
            <p className="h-10 font-mono text-4xl leading-none font-medium text-fg-subtle">—</p>
          ) : (
            <p className="flex items-baseline gap-1.5 font-mono leading-none">
              <Counter
                value={total}
                from={total}
                locale={copy.locale}
                format={rateFormat}
                duration="slow"
                className="text-4xl font-medium tracking-tight"
              />
              <span className="text-ui-lg text-fg-muted">{copy.unit}</span>
            </p>
          )}
          {/* A phrase, not a label: it keeps its case in a theme that sets badges in capitals. */}
          {loading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            !bare && (
              <Badge variant={change >= 0 ? 'success' : 'danger'} className="font-mono tracking-normal normal-case tabular-nums">
                {copy.change(signed.format(change))}
              </Badge>
            )
          )}
          {/* A toggle: pressed while the rates update live. */}
          <Button
            variant="secondary"
            size="xs"
            aria-pressed={live}
            onClick={() => setLive((on) => !on)}
            className="ms-auto gap-2 font-mono text-ui-sm"
          >
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                live ? 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_22%,transparent)]' : 'bg-line-strong',
              )}
            />
            {copy.live}
            {/* Pause while live, play while paused: the one glyph morphs between them. */}
            <PlayIcon size={12} active={live} className="text-fg-muted" />
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-x-4 border-t border-line pt-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={cn('flex min-w-0 flex-col gap-1', i > 0 && 'border-s border-line ps-4')}>
              <dt>
                <Eyebrow className={cn('block truncate', VOICE)}>{stat.label}</Eyebrow>
              </dt>
              <dd className={cn('truncate font-mono text-ui-lg font-medium tabular-nums', stat.tone || 'text-fg')}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>

      {/* Flush content (px-0) keeps its own padding in Bezel, so the well sits evenly inset. */}
      <CardContent className="border-t border-line px-0 py-0 @5xl/traffic:flex @5xl/traffic:flex-col @5xl/traffic:justify-center">
        <div className="m-3 rounded-[calc(var(--radius-xl)-0.25rem)] bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] px-2 pt-2.5 pb-3 sm:m-4 sm:px-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
            <Eyebrow className={VOICE}>{copy.mapLabel}</Eyebrow>
            <Eyebrow className={cn('hidden sm:inline', VOICE)}>{copy.mapHint}</Eyebrow>
          </div>
          {mapState ?? (
            <DotMap
              label={copy.map}
              regions={regions.map((r) => ({
                id: r.id,
                name: r.id,
                lon: r.lng,
                lat: r.lat,
                value: r.value,
                tone: r.reading > threshold ? 'warning' : 'accent',
              }))}
              active={active}
              onActiveChange={setHovered}
              formatValue={(v) => `${compact.format(v)} ${copy.unit}`}
            />
          )}
        </div>
      </CardContent>

      <CardContent className="border-t border-line px-0 py-0 @5xl/traffic:border-s">
        {tableState ?? (
          <RegionTable
            regions={regions}
            threshold={threshold}
            rate={rateFormat}
            reading={readingFormat}
            total={total}
            active={active}
            pinned={pinned}
            copy={copy}
            onHover={setHovered}
            onPin={(id) => setPinned((current) => (current === id ? null : id))}
          />
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 py-4 @5xl/traffic:col-span-2">
        <span className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {before}
          {bare ? '—' : number.format(regions.length)}
          {after}
        </span>
        <div className="flex flex-1 justify-end gap-2">
          <Button variant="secondary">{copy.logs}</Button>
          <AsyncButton
            disabled={!slow.length}
            pendingLabel={copy.actionPending}
            successLabel={copy.actionDone}
            onAction={async () => {
              await (onAction ? onAction(slow) : demo('RegionMap: onAction', 900))
              setRerouted((ids) => [...new Set([...ids, ...slow.map((r) => r.id)])])
            }}
          >
            {copy.action}
          </AsyncButton>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('@container/traffic w-full', !fill && 'max-w-184', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('@container/traffic grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { RegionMap, type RegionMapProps }
export type { RegionMapCopy, RegionMapRange, RegionMapRegion }
