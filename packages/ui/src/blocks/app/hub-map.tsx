'use client'

import { type ComponentProps, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useLocale, useMotionBudget, useYouj, type ThemeInput } from '@youj/core'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  divert,
  drift,
  HUBS,
  LANES,
  METRICS,
  STATUSES,
  THRESHOLDS,
  demo,
  type HubMapCopy,
  type HubMapHub,
  type HubMapLane,
  type HubMapMetric,
  type HubMapStatus,
  type HubMapThresholds,
  type HubMapTone,
} from './hub-map/data'
import { HubDetail, type Formats } from './hub-map/detail'
import { Head } from './hub-map/head'
import { Totals } from './hub-map/totals'
import { HubMapCanvas } from './hub-map/map'
import { DetailPlaceholder, MapPlaceholder } from './hub-map/placeholder'

/* A carrier's hub network at a glance, live: parcels sorted an hour, the
 * share leaving on time, how many hubs are on schedule and the parcels in
 * transit between them; then the world as scanlines with every hub a node
 * (its halo the parcel volume or the delays, its core its on-time health, a
 * ping while it's behind) and the lanes between them as arcs with parcels
 * running the way the freight moves. Pick a hub on the map (click, tap, or
 * arrow keys west to east) and the reticle glides to it, its lanes light
 * while the rest dim, and the panel below gives its figures: throughput over
 * the last hour, on-time rate, parcels delayed, sort capacity and its top
 * lanes with their volume and transit time. Divert sends the picked hub's
 * parcels through its peers and Resume brings them back; swap the demo
 * demo for your API with `onDivert`. Without `hubs` the demo network's
 * figures drift every few seconds, under a "Demo data" badge; pass yours and
 * they show as given; the loops and the drift pause off screen, in a hidden tab and when
 * Live is off. It is built for the compact layout density (ui.css),
 * taken from the page; embedded, it keeps its natural width unless `fill`. Reduced motion: the map is drawn in place, arcs show their
 * direction with a chevron instead of parcels, and figures change in place. */

interface HubMapProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<HubMapCopy>
  /** The hubs, with their figures and status now; re-render with fresh ones to keep it live. Default: nine demo hubs whose figures drift. */
  hubs?: HubMapHub[]
  /** The lanes between hubs, one entry per direction that carries volume. Default: nine demo lanes. */
  lanes?: HubMapLane[]
  /** The last hour's volume per hub id, oldest first, for the panel's sparkline. Default: the demo's, or the volumes you pass as they change. */
  history?: Record<string, number[]>
  /** The states a hub can be in, with their colors. Default: on schedule, delayed, halted. */
  statuses?: HubMapStatus[]
  /** What the halos can show, in the toggle's order. Default: volume and delays. */
  metrics?: HubMapMetric[]
  /** Where readings turn to the warning ink (`health` below, `backlog` and `load` above). Default: 90% on target, 1,000 held up, 85% of capacity. */
  thresholds?: Partial<HubMapThresholds>
  /** Writes volumes and backlogs (`Intl.NumberFormat` options). Default: compact notation. */
  format?: Intl.NumberFormatOptions
  /** Writes a duration (`Intl.NumberFormat` options). Default: hours, narrow. */
  durationFormat?: Intl.NumberFormatOptions
  /** Skeletons in place of the map and the panel while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the map when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no hubs. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** The hub picked first, by id. Default: the first one that isn't healthy, else the busiest. */
  defaultHub?: string
  /** The id of the metric the halos show first. Default: the first. */
  defaultMetric?: string
  /** Let the parcels run and, on the demo hubs, the figures drift every few seconds (yours never drift). Default true. */
  live?: boolean
  /** Acts on a hub (the demo's divert to its peers; `active` true) or undoes it; resolve when it's done. Default: a short demo wait. */
  onAction?: (hub: HubMapHub, active: boolean) => Promise<unknown> | unknown
  /** Shows a dashed "Demo data" badge while the map runs on its demo hubs (no `hubs` or `lanes` passed). Default true. */
  demoMarker?: boolean
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

/** How often the demo figures drift, in milliseconds (scaled by Speed). */
const TICK = 2600
/** Points of throughput history on the sparkline. */
const HISTORY = 24
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

const BADGE_DOT: Record<HubMapTone, string> = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }
const COMPACT: Intl.NumberFormatOptions = { notation: 'compact', maximumFractionDigits: 1 }
const HOURS: Intl.NumberFormatOptions = { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 0 }

const firstPick = (hubs: HubMapHub[], statuses: HubMapStatus[]) =>
  hubs.find((h) => !statuses.find((s) => s.id === h.status)?.healthy)?.id ?? [...hubs].sort((a, b) => b.volume - a.volume)[0]?.id ?? ''

/** Whether the page is showing: loops stop in a hidden tab. */
function usePageVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

function HubMap({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  hubs: ownHubs,
  lanes: ownLanes,
  history: historyProp,
  statuses = STATUSES,
  metrics = METRICS,
  thresholds: thresholdsProp,
  format: volumeFormat = COMPACT,
  durationFormat = HOURS,
  loading = false,
  error,
  onRetry,
  empty,
  defaultHub,
  defaultMetric,
  live: liveProp = true,
  onAction,
  demoMarker = true,
  locale,
  className,
  ...rest
}: HubMapProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  // Without your hubs it runs the demo network, drifting and marked as such; yours show as given.
  const simulated = ownHubs === undefined && ownLanes === undefined
  const hubsProp = ownHubs ?? HUBS
  const lanesProp = ownLanes ?? LANES
  const { tier } = useMotionBudget()
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const mapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(mapRef, { amount: 0.15 })
  const seen = useInView(mapRef, { amount: 0.3, once: true })
  const visible = usePageVisible()
  const [live, setLive] = useState(liveProp)
  const [tick, setTick] = useState(0)
  const [metricId, setMetric] = useState(defaultMetric ?? metrics[0]?.id ?? '')
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0]!
  const thresholds = { ...THRESHOLDS, ...thresholdsProp }
  const statusOf = (h: HubMapHub) => statuses.find((s) => s.id === h.status)
  const [diverted, setDiverted] = useState<string[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const running = live && inView && visible

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTick((t) => t + 1), TICK * k.timeScale)
    return () => clearInterval(id)
  }, [running, k.timeScale])

  const drifted = simulated ? tick : 0
  const view = useMemo(() => {
    const base = drifted ? drift(hubsProp, lanesProp, drifted) : { hubs: hubsProp, lanes: lanesProp }
    return divert(base.hubs, base.lanes, diverted)
  }, [hubsProp, lanesProp, drifted, diverted])

  // Throughput history per hub: seeded from the drift so it opens full, then one point a tick.
  const [history, setHistory] = useState<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {}
    if (simulated) for (let t = 1 - HISTORY; t < 0; t++) for (const h of drift(hubsProp, lanesProp, t).hubs) (out[h.id] ??= []).push(h.volume)
    for (const h of hubsProp) (out[h.id] ??= []).push(h.volume)
    return out
  })
  // One point per change of the figures (a tick, a diversion, new data), none on mount.
  const [plotted, setPlotted] = useState(view)
  if (plotted !== view) {
    setPlotted(view)
    setHistory((h) => Object.fromEntries(view.hubs.map((hub) => [hub.id, [...(h[hub.id] ?? []), hub.volume].slice(-HISTORY)])))
  }

  // A hub changing status is said aloud; the rest of a tick's drift isn't.
  const statusRef = useRef<Map<string, string> | null>(null)
  useEffect(() => {
    const before = statusRef.current
    statusRef.current = new Map(view.hubs.map((h) => [h.id, h.status]))
    if (!before) return
    for (const h of view.hubs)
      if (before.get(h.id) && before.get(h.id) !== h.status)
        announce(`${h.id} ${(statuses.find((s) => s.id === h.status)?.label ?? h.status).toLowerCase()}`)
  }, [view.hubs, announce, statuses])

  const format: Formats = useMemo(() => {
    const compact = numberFormat(copy.locale, volumeFormat)
    const hours = numberFormat(copy.locale, durationFormat)
    const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
    return { compact: compact.format, hours: hours.format, percent: percent.format, options: volumeFormat }
  }, [copy.locale, volumeFormat, durationFormat])

  const pickedId = picked ?? defaultHub ?? firstPick(view.hubs, statuses)
  const hub = view.hubs.find((h) => h.id === pickedId) ?? view.hubs[0]
  const total = view.hubs.reduce((sum, h) => sum + h.volume, 0)
  const health = total ? view.hubs.reduce((sum, h) => sum + h.health * h.volume, 0) / total : 1
  const healthy = view.hubs.filter((h) => statusOf(h)?.healthy && !diverted.includes(h.id)).length
  // On the move: each lane's hourly volume times the hours it takes.
  const inTransit = view.lanes.reduce((sum, l) => sum + l.volume * l.time, 0)
  const bare = loading || !!error || view.hubs.length === 0
  const figure = (value: ReactNode, skeleton: string) =>
    loading ? <Skeleton className={skeleton} /> : error || view.hubs.length === 0 ? <span className="text-fg-subtle">—</span> : value
  const isDiverted = !!hub && diverted.includes(hub.id)

  const stats = [
    { label: copy.health, value: figure(format.percent(health), 'h-6 w-14'), tone: !bare && health < thresholds.health ? 'text-warning-text' : '' },
    {
      label: copy.healthy,
      value: figure(copy.healthyCount(healthy, view.hubs.length), 'h-6 w-16'),
      tone: !bare && healthy < view.hubs.length ? 'text-warning-text' : '',
    },
    { label: copy.inTransit, value: figure(format.compact(inTransit), 'h-6 w-14'), tone: '' },
  ]

  const toggleDivert = async () => {
    if (!hub) return
    await (onAction ? onAction(hub, !isDiverted) : demo('HubMap: onAction', 900))
    setDiverted((ids) => (isDiverted ? ids.filter((id) => id !== hub.id) : [...ids, hub.id]))
    announce(isDiverted ? copy.resumeNote(hub.id) : copy.actionNote(hub.id))
  }

  // Both places keep the size they have with the data.
  const mapState = bare ? (
    <MapPlaceholder loading={loading} error={error} onRetry={onRetry} empty={empty} none={view.hubs.length === 0} copy={copy} />
  ) : null
  const detailState = bare ? <DetailPlaceholder loading={loading} /> : null

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-256')}>
      <Head
        Title={Title}
        titleId={titleId}
        copy={copy}
        count={view.hubs.length}
        marker={simulated && demoMarker}
        live={live}
        onLive={() => setLive((on) => !on)}
      />

      <Totals loading={loading} bare={bare} total={total} volumeFormat={volumeFormat} stats={stats} copy={copy} />

      {/* Flush content (px-0) keeps its own padding in Bezel, so the well sits evenly inset. */}
      <CardContent className="border-t border-line px-0 py-0">
        <div
          ref={mapRef}
          className="m-3 flex min-w-0 flex-col gap-2 rounded-[calc(min(var(--radius-xl),var(--ui--panel-radius-max))-var(--spacing))] bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] px-2 pt-2.5 pb-3 sm:m-4 sm:px-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
            <ul aria-label={copy.legend} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-xs text-fg-muted">
              {statuses.map((s) => (
                <li key={s.id} className="flex items-center gap-1.5">
                  <span aria-hidden className={cn('size-2 rounded-full', BADGE_DOT[s.tone])} />
                  {s.label}
                </li>
              ))}
              <li className="flex items-center gap-1.5 max-sm:hidden">
                <span aria-hidden className="relative h-px w-4 rounded-full bg-accent">
                  <span className="absolute end-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent" />
                </span>
                {copy.arcs}
              </li>
            </ul>
            <SegmentedControl aria-label={copy.metric} size="sm" value={metric.id} onValueChange={(next) => next && setMetric(next)}>
              {metrics.map((m) => (
                <SegmentedControlItem key={m.id} value={m.id} className="px-2.5 text-ui-sm">
                  {m.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
          {mapState ?? (
            <HubMapCanvas
              hubs={view.hubs}
              lanes={view.lanes}
              statuses={statuses}
              selected={hub?.id ?? ''}
              metric={metric}
              diverted={diverted}
              running={running}
              shown={seen || k.reduced}
              light={tier === 'low'}
              copy={copy}
              figure={(h) => (diverted.includes(h.id) ? copy.acted : format.compact(metric.measure === 'volume' ? h.volume : h.backlog))}
              label={(h) =>
                copy.hubLabel(
                  h.id,
                  h.city,
                  diverted.includes(h.id) ? copy.acted : (statusOf(h)?.label ?? h.status),
                  `${format.compact(h.volume)}${copy.unit}`,
                  format.percent(h.health),
                )
              }
              onSelect={setPicked}
            />
          )}
        </div>
      </CardContent>
      {/* Side by side, the hub's detail takes the room of the busiest hub's at 100%: picking another never resizes the card. */}
      <CardContent className="border-t border-line py-(--card-spacing) md:[&>*]:h-37.5">
        {detailState ??
          (hub && (
            <HubDetail
              hub={hub}
              status={statusOf(hub)}
              thresholds={thresholds}
              lanes={view.lanes}
              history={historyProp?.[hub.id] ?? history[hub.id] ?? []}
              diverted={isDiverted}
              copy={copy}
              format={format}
              onSelect={setPicked}
            />
          ))}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 border-t border-line py-[calc(var(--card-spacing)-var(--spacing))]">
        <span className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.updated}</span>
        <div className="flex flex-1 justify-end gap-2">
          <Button variant="secondary">{copy.manifests}</Button>
          <AsyncButton disabled={bare} onAction={toggleDivert} pendingLabel={isDiverted ? copy.resumePending : copy.actionPending}>
            {isDiverted ? copy.resume : copy.action}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const page = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-256', className)}>
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
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { HubMap, type HubMapProps }
export type { HubMapCopy, HubMapHub, HubMapLane, HubMapMetric, HubMapStatus, HubMapThresholds }
