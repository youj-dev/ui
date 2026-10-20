'use client'

import { type ComponentProps, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  NOW,
  PERIODS,
  PLACES,
  REGIONS,
  SITES,
  figuresOf,
  type ArcGlobeCopy,
  type ArcGlobeNow,
  type ArcGlobePeriod,
  type ArcGlobePlace,
  type ArcGlobeRegion,
  type ArcGlobeSite,
  type ArcGlobeVisit,
} from './arc-globe/data'
import { Feed } from './arc-globe/feed'
import { Globe } from './arc-globe/globe'
import { Head } from './arc-globe/head'
import { Controls } from './arc-globe/controls'
import { Figures } from './arc-globe/figures'
import { Placeholder } from './arc-globe/placeholder'
import { PlaceList, PlaceTable, RegionList, type Formats, type Row } from './arc-globe/panels'
import { useLiveVisits } from './arc-globe/use-live-visits'

/* What comes in from around the world, live. A dot globe lit where it comes
 * from (each place warms the land around it in its region's color, by its
 * share) turns slowly while each new event is thrown across it as an arc,
 * from where it began to the place that serves it, and lands as a ring; each
 * landing adds to the figures, which roll to it. Beside it, the regions (a
 * toggle each: that region comes forward on the globe and the places narrow
 * to it) and the top places (point at or focus one and the globe turns to it;
 * press it to pin it there). Period and site re-cut every figure. The latest
 * events run along the foot; Live pauses the stream. Without `places` the
 * events are a simulated demo stream, under a "Demo data" badge; your places
 * show as given, and your `visits` arc across the globe as they arrive. The
 * globe is a picture with a summary; the lists and a table hold
 * its figures. It is built for the compact layout density (ui.css),
 * taken from the page; embedded, it starts at the cell's edge and stops at its natural
 * width (72rem), or takes the whole cell with `fill`. Reduced motion: one
 * still globe, aimed at once, with the latest visits as whole arcs; figures
 * change in place. */

interface ArcGlobeProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ArcGlobeCopy>
  /** What sends to the globe, each with its 30-day volume and the place that serves it. Default: twenty demo countries, with a simulated stream of visits. */
  places?: ArcGlobePlace[]
  /** The regions the places sit in, with their colors, in the list's order. Default: five world regions. */
  regions?: ArcGlobeRegion[]
  /** The ways to cut the figures, in the select's order. Default: a demo's sites. */
  sites?: ArcGlobeSite[]
  /** The spans of time to cut the figures to, in the toggle's order. Default: 24 hours to 90 days. */
  periods?: ArcGlobePeriod[]
  /** The latest events, newest first: they run along the foot and arc across the globe as they arrive. Default: the demo's simulated stream (only while `places` is not passed). */
  visits?: ArcGlobeVisit[]
  /** How many are happening right now, with its change against an hour ago. Default: the demo's. */
  now?: ArcGlobeNow
  /** Formats the compact figures (`Intl.NumberFormat` options). Default: compact notation. */
  format?: Intl.NumberFormatOptions
  /** Skeletons in place of the globe, the lists and the figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the globe and the lists when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no places. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** The id of the period to start on. Default `30d`, else the first. */
  defaultPeriod?: string
  /** The id of the site to start on. Default `all`, else the first. */
  defaultSite?: string
  /** Let the demo's events stream in and the globe turn (your `places` get no simulated events). Default true. */
  live?: boolean
  /** Shows a dashed "Demo data" badge while the card runs on its demo places and events (no `places` passed). Default true. */
  demoMarker?: boolean
  /** Formats counts, shares and times. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

const TOP = 6
const NO_VISITS: ArcGlobeVisit[] = []
const COMPACT: Intl.NumberFormatOptions = { notation: 'compact', maximumFractionDigits: 1 }
/** Where the globe turns for a region: the middle of its countries. */
const regionAim = (r?: ArcGlobeRegion) => (r && r.lat !== undefined && r.lng !== undefined ? { lon: r.lng, lat: r.lat } : null)
const centreOf = (countries: ArcGlobePlace[]) => {
  const x = countries.reduce((sum, m) => sum + Math.cos((m.lat * Math.PI) / 180) * Math.sin((m.lng * Math.PI) / 180), 0)
  const z = countries.reduce((sum, m) => sum + Math.cos((m.lat * Math.PI) / 180) * Math.cos((m.lng * Math.PI) / 180), 0)
  return { lon: (Math.atan2(x, z) * 180) / Math.PI, lat: countries.reduce((sum, m) => sum + m.lat, 0) / Math.max(1, countries.length) }
}

function ArcGlobe({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  places: ownPlaces,
  regions = REGIONS,
  sites = SITES,
  periods = PERIODS,
  visits: ownVisits,
  now: nowProp = NOW,
  format: formatProp = COMPACT,
  loading = false,
  error,
  onRetry,
  empty,
  defaultPeriod = '30d',
  defaultSite = 'all',
  live: liveProp = true,
  demoMarker = true,
  locale: localeProp,
  className,
  ...rest
}: ArcGlobeProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale }), [copyProp, locale])
  const k = useYouj()
  // Without your places it streams demo events, marked as such; yours show as given.
  const simulated = ownPlaces === undefined
  const countries = ownPlaces ?? PLACES
  const titleId = useId()
  const feedId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [periodId, setPeriod] = useState(defaultPeriod)
  const [siteId, setSite] = useState(defaultSite)
  const [live, setLive] = useState(liveProp)
  const [region, setRegion] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  // The stream only runs while the card is on screen and the tab is shown.
  const root = useRef<HTMLElement>(null)
  const [onScreen, setOnScreen] = useState(false)
  useEffect(() => {
    const el = root.current
    if (!el) return
    let seen = false
    const sync = () => setOnScreen(seen && !document.hidden)
    const io = new IntersectionObserver(([entry]) => {
      seen = !!entry?.isIntersecting
      sync()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  // The globe throws a visit in the deliberate token's time, 2.8 times over; it lands (and counts) when it arrives.
  const flight = k.reduced ? 0 : k.ms('deliberate') * 2.8
  const visits = useLiveVisits(
    countries,
    (simulated || !!ownVisits) && live && onScreen,
    k.ms('deliberate') * 1.25,
    flight,
    k.ms('deliberate') * 3.75,
    ownVisits,
  )

  const period = periods.find((p) => p.id === periodId) ?? periods[0]!
  const site = sites.find((s) => s.id === siteId) ?? sites[0]
  const part = site?.share ?? 1
  const format = useMemo<Formats>(() => {
    const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
    const signed = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })
    return {
      count: { maximumFractionDigits: 0 },
      compact: formatProp,
      percent: percent.format,
      signed: signed.format,
      locale: copy.locale,
    }
  }, [copy.locale, formatProp])
  const clock = useMemo(() => dateTimeFormat(copy.locale, { timeStyle: 'medium' }), [copy.locale])

  // The period's figures; shares hold still between periods (one visitor doesn't move them), so the globe's light and the bars only change with the period.
  const base = useMemo(() => countries.map((place) => ({ place, ...figuresOf(place, period) })), [countries, period])
  const shares = useMemo(() => {
    const total = base.reduce((sum, r) => sum + r.volume, 0)
    return Object.fromEntries(base.map((r) => [r.place.id, total ? r.volume / total : 0]))
  }, [base])
  const rows = useMemo<Row[]>(
    () =>
      base
        .map((r) => ({
          place: r.place,
          volume: Math.round(r.volume * part) + (visits.added[r.place.id] ?? 0),
          change: r.change,
          share: shares[r.place.id] ?? 0,
        }))
        .sort((a, b) => b.volume - a.volume),
    [base, shares, visits.added, part],
  )
  const totals = useMemo(() => {
    const volume = rows.reduce((sum, r) => sum + r.volume, 0)
    const secondary = base.reduce((sum, f) => sum + f.secondary, 0) * part + visits.units
    const previous = base.reduce((sum, f) => sum + f.volume / (1 + f.change), 0) * part
    const previousSecondary = base.reduce((sum, f) => sum + f.secondary / (1 + f.change * 0.8), 0) * part
    return {
      volume,
      secondary,
      change: previous ? volume / previous - 1 : 0,
      secondaryChange: previousSecondary ? secondary / previousSecondary - 1 : 0,
    }
  }, [base, rows, visits.units, part])
  // Visitors in the last five minutes: the baseline, breathing a little as each batch of visits lands.
  const now = Math.round(nowProp.value * part * (1 + 0.04 * Math.sin(visits.count * 0.9)))
  const regionRows = regions.map((r) => {
    const own = rows.filter((row) => row.place.region === r.id)
    const volume = own.reduce((sum, row) => sum + row.volume, 0)
    const change = volume ? own.reduce((sum, row) => sum + row.change * row.volume, 0) / volume : 0
    return { region: r, volume, change, share: own.reduce((sum, row) => sum + row.share, 0) }
  })
  const top = rows.filter((r) => !region || r.place.region === region).slice(0, TOP)

  const active = hovered ?? preview ?? pinned
  const aimed = countries.find((m) => m.id === (preview ?? pinned))
  const aim = useMemo(
    () =>
      aimed
        ? { lon: aimed.lng, lat: aimed.lat }
        : region
          ? (regionAim(regions.find((r) => r.id === region)) ?? centreOf(countries.filter((m) => m.region === region)))
          : null,
    [aimed, region, regions, countries],
  )
  const activeRow = rows.find((r) => r.place.id === active)
  // The table for assistive tech reads the period's figures, so a landing doesn't redraw its twenty rows.
  const table = useMemo(
    () => (
      <PlaceTable
        rows={base
          .map((r) => ({ place: r.place, volume: Math.round(r.volume * part), change: r.change, share: shares[r.place.id] ?? 0 }))
          .sort((a, b) => b.volume - a.volume)}
        regions={regions}
        copy={copy}
        format={format}
      />
    ),
    [base, shares, part, regions, copy, format],
  )
  const compactFormat = useMemo(() => numberFormat(copy.locale, format.compact), [copy.locale, format.compact])
  const compact = (value: number) => compactFormat.format(value)

  const changePeriod = (next: ArcGlobePeriod) => {
    setPeriod(next.id)
    const volume = countries.reduce((sum, m) => sum + figuresOf(m, next).volume, 0) * part
    announce(copy.announcePeriod(next.name ?? next.label, compact(volume)))
  }
  const pin = (id: string | null) => {
    setPinned((current) => (current === id ? null : id))
    const row = rows.find((r) => r.place.id === id)
    if (row && pinned !== id) announce(copy.announcePlace(row.place.name, compact(row.volume), format.percent(row.share)))
  }
  const pickRegion = (id: string) => {
    setRegion((current) => (current === id ? null : id))
    setPinned(null)
    const row = regionRows.find((r) => r.region.id === id)
    if (row && region !== id) announce(copy.announceRegion(row.region.label, compact(row.volume)))
  }

  const bare = loading || !!error || countries.length === 0
  const state = bare ? (
    <Placeholder loading={loading} error={error} onRetry={onRetry} empty={empty} none={countries.length === 0} copy={copy} />
  ) : null

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-6xl')}>
      <Head
        Title={Title}
        titleId={titleId}
        copy={copy}
        count={countries.length}
        marker={simulated && demoMarker}
        live={live}
        onLive={() => {
          setLive((on) => !on)
          announce(copy.announceLive(!live))
        }}
      />

      <Controls
        periods={periods}
        period={period}
        sites={sites}
        site={site}
        copy={copy}
        onPeriod={changePeriod}
        onSite={(found: ArcGlobeSite) => {
          setSite(found.id)
          announce(copy.announceScope(found.label))
        }}
      />

      <Figures bare={bare} loading={loading} now={now} nowChange={nowProp.change} totals={totals} rate={period.rate} format={format} copy={copy} />

      <CardContent className="grid gap-6 py-(--card-spacing) md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center">
        {state ?? (
          <>
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="w-full max-w-136">
                <Globe
                  places={countries}
                  regions={regions}
                  shares={shares}
                  subscribe={visits.subscribe}
                  turning={live}
                  recent={k.reduced ? visits.settled : NO_VISITS}
                  active={active}
                  aim={aim}
                  focus={region ? regions.findIndex((r) => r.id === region) : -1}
                  label={copy.globe(countries.length, rows[0]?.place.name ?? '')}
                  tag={
                    activeRow && (
                      <span className="flex items-baseline gap-1.5 rounded-sm bg-fg px-1.5 py-0.5 font-mono text-ui-xs whitespace-nowrap text-canvas shadow-sm">
                        <span>{activeRow.place.id}</span>
                        <span className="opacity-65 tabular-nums">{compact(activeRow.volume)}</span>
                      </span>
                    )
                  }
                  onHover={setHovered}
                  onPick={pin}
                />
              </div>
              <p aria-hidden className="font-mono text-ui-xs text-fg-muted">
                {copy.hint}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <RegionList rows={regionRows} selected={region} copy={copy} format={format} onSelect={pickRegion} />
              <PlaceList rows={top} active={active} pinned={pinned} copy={copy} format={format} onPreview={setPreview} onPin={pin} />
            </div>
          </>
        )}
        {!bare && table}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 border-t border-line py-[calc(var(--card-spacing)-var(--spacing))]">
        <Eyebrow id={feedId} render={<h3 />}>
          {copy.latest}
        </Eyebrow>
        {bare ? (
          <div className="py-2 text-ui-sm text-fg-subtle">{loading ? <Skeleton className="h-4 w-48" /> : '—'}</div>
        ) : (
          <Feed visits={visits.settled} places={countries} regions={regions} copy={copy} time={clock} labelId={feedId} />
        )}
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ArcGlobe, type ArcGlobeProps }
export type { ArcGlobeCopy, ArcGlobeNow, ArcGlobePeriod, ArcGlobePlace, ArcGlobeRegion, ArcGlobeSite, ArcGlobeVisit }
