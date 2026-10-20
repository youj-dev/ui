'use client'

import { useId, useMemo, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { LinkIcon, DownloadIcon, MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { DistributionStrip, percentileOf } from '../../components/ui/distribution-strip'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  RANGES,
  SNAPSHOTS,
  TARGET,
  demo,
  type PercentileTrendCopy,
  type PercentileTrendRange,
  type PercentileTrendItem,
  type PercentileTrendSnapshot,
} from './percentile-trend/data'
import { Headline } from './percentile-trend/headline'
import { RouteList } from './percentile-trend/route-list'

/* A spread of timings as an instrument card (latency, wait times, delivery times). The p99 leads, large in mono,
 * with how far it moved since the period before as a soft pill, and p50, p90
 * and the request count beside it. Under it every sampled request is a dot
 * on a log-scaled DistributionStrip, stacked where they crowd, with p50, p90
 * and p99 flagged and the 300 ms objective dashed across (past it the strip
 * is hatched and its dots turn amber); its header counts the share within
 * the objective. Then each route as a well: its p99 and how much of it runs
 * over. The 1H / 24H / 7D track swaps the window: the swarm morphs (each
 * quantile slides to its new place), the markers glide and the figures
 * count, and the new p99 is announced. Set alert runs on Button onAction;
 * swap the demo `wait` with `onSetAlert`. Pass your own `subtitle` and
 * `snapshots`, and wire the menu and Open traces with `onCopyLink`,
 * `onExport` and `onOpenTraces`; every string is in `copy`. It is built for
 * the compact layout density (ui.css), taken from the page; embedded, it keeps its
 * natural width unless `fill`. Reduced motion:
 * every value lands in place. */

interface PercentileTrendProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<PercentileTrendCopy>
  /** The windows on the control, in order. Default: 1H, 24H and 7D. */
  ranges?: PercentileTrendRange[]
  /** A snapshot per window, by the range's `id`. Default: demo data. */
  snapshots?: Record<string, PercentileTrendSnapshot>
  /** The window shown first, uncontrolled. Default: `24h` for the default ranges, else the first. */
  defaultRange?: string
  /** The window shown, controlled: pair it with `onRangeChange`. Default: uncontrolled. */
  range?: string
  /** Called with the window picked. Default: none. */
  onRangeChange?: (range: string) => void
  /** What the card is about, under the title. Default: `copy.subtitle` ("checkout-api · us-east-1"). */
  subtitle?: string
  /** The target: a value at or under it is within. In the figures' unit; default 300 (milliseconds). */
  target?: number
  /** Writes a value as text: the headline, the percentiles, the strip and each item's figure. Default: milliseconds (seconds from 1 s), in the locale. */
  format?: (value: number) => string
  /** "Set alert" for the window shown; resolve when it's saved. Default: a short demo wait. */
  onSetAlert?: (range: string) => Promise<unknown> | unknown
  /** The menu's "Copy link", with the window shown. Default: none. */
  onCopyLink?: (range: string) => void
  /** The menu's "Export samples", with the window shown. Default: none. */
  onExport?: (range: string) => void
  /** "Open traces", with the window shown. Default: none. */
  onOpenTraces?: (range: string) => void
  /** Skeletons in place of the figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the figures when they fail to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when the window has no samples. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Formats every number. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The title's level. Default: 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Classes for the root element (the `section` when embedded, else the page), merged with its own. Default: none. */
  className?: string
}

function PercentileTrend({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  ranges = RANGES,
  snapshots = SNAPSHOTS,
  defaultRange,
  range: rangeProp,
  onRangeChange,
  subtitle,
  target = TARGET,
  format,
  onSetAlert,
  onCopyLink,
  onExport,
  onOpenTraces,
  loading = false,
  error,
  onRetry,
  empty,
  locale,
  headingLevel,
  className,
  ...rest
}: PercentileTrendProps) {
  // The parts read the locale from the copy.
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [range, setRangeInner] = useControllableState(rangeProp, defaultRange ?? (ranges === RANGES ? '24h' : ranges[0]!.id))
  const setRange = (next: string) => {
    setRangeInner(next)
    onRangeChange?.(next)
  }
  const { announce, announcer } = useAnnouncer()

  const snap = snapshots[range]
  const blank = loading || Boolean(error) || !snap || snap.samples.length === 0
  const stats = useMemo(() => {
    const samples = snap?.samples ?? []
    const [p50, p90, p99] = [50, 90, 99].map((p) => percentileOf(samples, p))
    return { p50: p50!, p90: p90!, p99: p99! }
  }, [snap])

  const number = numberFormat(copy.locale)
  const compact = numberFormat(copy.locale, { notation: 'compact', maximumSignificantDigits: 3 })
  const ms = numberFormat(copy.locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 })
  const percent = numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

  const choose = (next: string) => {
    setRange(next)
    const samples = snapshots[next]?.samples ?? []
    const within = samples.length ? samples.filter((v) => v <= target).length / samples.length : 0
    const picked = ranges.find((r) => r.id === next)
    announce(copy.announcement(picked?.name ?? picked?.label ?? next, (format ?? ms.format)(percentileOf(samples, 99)), percent.format(within)))
  }

  // The figures' room, so the card keeps its size while it loads, fails or has nothing.
  const placeholder = loading ? (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">{copy.loading}</span>
      <div className="flex items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="flex w-48 flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-5" />
          ))}
        </div>
      </div>
      <Skeleton className="h-36 w-full" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    </div>
  ) : error ? (
    <div className="grid place-items-center">
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
  ) : (
    <div className="grid">
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-160')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{subtitle ?? copy.subtitle}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopyLink?.(range)}>
                <LinkIcon size={14} /> {copy.copyLink}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.(range)}>
                <DownloadIcon size={14} /> {copy.exportSamples}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <SegmentedControl aria-label={copy.range} value={range} onValueChange={choose} className="w-full">
          {ranges.map((r) => (
            <SegmentedControlItem key={r.id} value={r.id} className="flex-1 tabular-nums">
              {r.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        {!blank && (
          <Headline p50={stats.p50} p90={stats.p90} p99={stats.p99} previous={snap.previous} count={snap.count} format={format} copy={copy} />
        )}
      </CardContent>

      {blank ? (
        <CardContent className="grid min-h-134">{placeholder}</CardContent>
      ) : (
        <>
          <CardContent>
            <DistributionStrip samples={snap.samples} slo={target} format={format} label={copy.strip} />
          </CardContent>

          <CardContent>
            <RouteList
              items={snap.items}
              target={target}
              format={format}
              copy={copy}
              headingAs={headingLevel ? (`h${headingLevel + 1}` as 'h2' | 'h3' | 'h4') : undefined}
            />
          </CardContent>
        </>
      )}

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className="tabular-nums">
          {loading ? (
            <Skeleton className="h-4 w-56" />
          ) : blank ? (
            <span className="text-fg-subtle">—</span>
          ) : (
            <>
              {copy.sampled(number.format(snap.samples.length), compact.format(snap.count))} · {copy.updated(snap.updated)}
            </>
          )}
        </span>
        <div className="ms-auto flex gap-2">
          <Button variant="secondary" disabled={blank} onClick={() => onOpenTraces?.(range)}>
            {copy.openTraces}
          </Button>
          <AsyncButton
            disabled={blank}
            onAction={() => (onSetAlert ? onSetAlert(range) : demo('PercentileTrend: onSetAlert', 900))}
            pendingLabel={copy.settingAlert}
            successLabel={copy.alertSet}
          >
            {copy.setAlert}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
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

export {
  PercentileTrend,
  type PercentileTrendProps,
  type PercentileTrendCopy,
  type PercentileTrendRange,
  type PercentileTrendItem,
  type PercentileTrendSnapshot,
}
