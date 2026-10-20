'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { DotGrid } from '@youj/illustrations'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { CapacityChart } from './tiered-capacity/chart'
import {
  DEFAULT_COPY,
  NEAR_LIMIT,
  REGIONS,
  TIERS,
  shareOf,
  usedOf,
  demo,
  type TieredCapacityCopy,
  type TieredCapacityRegion,
  type TieredCapacityTier,
} from './tiered-capacity/data'
import { CapacityTable, Legend, RegionDetail, splitUnit } from './tiered-capacity/detail'

/* Object storage capacity across regions, drawn as a block of silos: each
 * region an isometric column of its tiers (archive at the base, hot on top)
 * inside a dashed case the height of what's provisioned, so fullness reads
 * as how far a column climbs its case. A case near its ceiling turns
 * warning; past it, danger, with the column through its top. Point at a
 * column, tap it, or move along the region keys with the arrow keys: the
 * others dim and the panel beside the drawing gives its figures (used and
 * provisioned, each tier, when it fills at its current growth). Add capacity
 * provisions a step more for the selected region and its case grows. The
 * drawing is a picture (aria-hidden); the figures are in the panel and in a
 * table for assistive tech. Wire it to your API with `onAddCapacity`. Reduced motion: the columns stand from the start and the
 * selection changes in place.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface TieredCapacityProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<TieredCapacityCopy>
  /** Regions in the order they stand, three to a row. */
  regions?: TieredCapacityRegion[]
  /** The tiers a column stacks, in the key's order (top first, the last is the base), with their colors. Default: hot, warm, cold. */
  tiers?: TieredCapacityTier[]
  /** Writes a figure in your unit ("58 TB", "120 pallets"). Default: terabytes, petabytes from a thousand. */
  format?: (value: number) => string
  /** Skeletons in place of the drawing and the panel while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the drawing when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no regions. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Provisions `copy.addStep` more for a region; resolve when it's done. Default: a short demo wait. */
  onAddCapacity?: (region: TieredCapacityRegion, amount: number) => Promise<unknown> | unknown
  /** Formats every figure (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

/** The region nearest its ceiling: where the eye should start. */
const fullest = (regions: TieredCapacityRegion[]) =>
  regions.reduce<TieredCapacityRegion | undefined>((top, r) => (!top || shareOf(r) > shareOf(top) ? r : top), undefined)

function TieredCapacity({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  regions: initial = REGIONS,
  tiers = TIERS,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  onAddCapacity,
  locale,
  className,
  ...rest
}: TieredCapacityProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  // Capacity added here sits on top of your regions, so fresh data from your app still lands.
  const [added, setAdded] = useState<Record<string, number>>({})
  const regions = useMemo(() => initial.map((r) => (added[r.id] ? { ...r, provisioned: r.provisioned + added[r.id]! } : r)), [initial, added])
  const [picked, setSelected] = useState<string | null>(null)
  const selected = picked ?? fullest(regions)?.id ?? ''
  const [pointing, setPointing] = useState(false)
  const [focused, setFocused] = useState(false)

  const format = useMemo(() => {
    const tb = numberFormat(copy.locale, { style: 'unit', unit: 'terabyte', maximumFractionDigits: 0 }).format
    const pb = numberFormat(copy.locale, { style: 'unit', unit: 'petabyte', maximumFractionDigits: 2 }).format
    const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 }).format
    return { size: formatProp ?? ((n: number) => (n >= 1000 ? pb(n / 1000) : tb(n))), percent }
  }, [copy.locale, formatProp])

  const region = regions.find((r) => r.id === selected) ?? regions[0]
  const used = regions.reduce((sum, r) => sum + usedOf(r), 0)
  const provisioned = regions.reduce((sum, r) => sum + r.provisioned, 0)
  const over = regions.filter((r) => shareOf(r) > 1).length
  const near = regions.filter((r) => shareOf(r) >= NEAR_LIMIT && shareOf(r) <= 1).length
  const total = splitUnit(format.size(used))

  const add = async () => {
    if (!region) return
    await (onAddCapacity ? onAddCapacity(region, copy.addStep) : demo('TieredCapacity: onAddCapacity', 900))
    setSelected(region.id)
    setAdded((all) => ({ ...all, [region.id]: (all[region.id] ?? 0) + copy.addStep }))
    announce(copy.added(format.size(copy.addStep), region.name))
  }

  const frame = 'grid min-h-101 place-items-center md:col-span-full'
  const state = loading ? (
    <>
      <div className="flex min-w-0 flex-col items-center gap-4">
        <span className="sr-only">{copy.loadingLabel}</span>
        <div className="flex h-90 items-end gap-5">
          {[290, 190, 245, 155, 235, 110].map((h, i) => (
            <Skeleton key={i} style={{ height: h }} className="w-12" />
          ))}
        </div>
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
    </>
  ) : error ? (
    <div className={frame}>
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
  ) : regions.length === 0 ? (
    <div className={cn(frame, 'grid')}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  ) : null

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle(regions.length)}</CardDescription>
        <CardAction>
          {/* The head's status line takes the danger or warning ink over Bezel's muted one. */}
          {loading ? (
            <Skeleton className="h-4 w-28" />
          ) : error || !regions.length ? (
            <span className="text-fg-subtle">—</span>
          ) : (
            <span className={cn(over ? 'text-danger!' : near ? 'text-warning!' : 'text-fg-muted')}>
              {over ? copy.overLimit(over) : near ? copy.nearLimit(near) : copy.allClear}
            </span>
          )}
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <Eyebrow render={<p />}>{copy.used}</Eyebrow>
          {loading ? (
            <>
              <Skeleton className="mt-1 h-9 w-36" />
              <Skeleton className="mt-2 h-5.5 w-44" />
            </>
          ) : error || !regions.length ? (
            <>
              <p className="mt-1 font-mono text-4xl leading-none font-medium text-fg-subtle">—</p>
              <p aria-hidden className="mt-2 h-5.5" />
            </>
          ) : (
            <>
              <p className="mt-1 font-mono text-4xl leading-none font-medium tracking-tight tabular-nums">
                {total.value} <span className="ms-1 text-lg text-fg-muted">{total.unit}</span>
              </p>
              <p className="mt-2 text-ui text-fg-muted">{copy.ofProvisioned(format.size(provisioned))}</p>
            </>
          )}
        </div>
        <Legend tiers={tiers} copy={copy} />
      </CardContent>

      <CardContent className="relative isolate grid gap-6 overflow-hidden md:grid-cols-[minmax(0,1fr)_--spacing(56)] md:items-center">
        <DotGrid gap={18} />
        {state ?? (
          <>
            <div className="flex min-w-0 flex-col items-center gap-4">
              <CapacityChart
                regions={regions}
                tiers={tiers}
                selected={region?.id ?? ''}
                pinLabel={(r) => `${r.id} · ${format.percent(shareOf(r))}`}
                inspecting={pointing || focused}
                onSelect={setSelected}
                onInspect={setPointing}
              />
              <div
                className="yj-scrollbar max-w-full overflow-x-auto p-0.5"
                onPointerEnter={() => setPointing(true)}
                onPointerLeave={() => setPointing(false)}
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
                }}
              >
                <SegmentedControl aria-label={copy.regions} value={region?.id} onValueChange={setSelected}>
                  {regions.map((r) => (
                    // shape: region tabs set their own padding; the control's own padding or case sits on a more specific selector than a className, so `!` wins; kept because moving it into the recipe layer must not change what shows
                    <SegmentedControlItem
                      key={r.id}
                      value={r.id}
                      aria-label={copy.regionButton(r.id.toUpperCase(), r.name, format.percent(shareOf(r)))}
                      onFocus={() => setSelected(r.id)}
                      onPointerEnter={() => setSelected(r.id)}
                      className={cn(
                        'px-2.5! font-mono tracking-[0.08em] uppercase sm:px-3.5!',
                        shareOf(r) > 1 ? 'text-danger' : shareOf(r) >= NEAR_LIMIT ? 'text-warning' : undefined,
                      )}
                    >
                      {r.id}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              </div>
            </div>
            {region && <RegionDetail region={region} tiers={tiers} copy={copy} format={format} />}
            <CapacityTable regions={regions} tiers={tiers} copy={copy} format={format} />
          </>
        )}
      </CardContent>

      <CardFooter className="flex-wrap">
        <span className="me-auto basis-full font-mono text-ui-sm text-fg-muted uppercase sm:basis-auto">{copy.updated}</span>
        <Button variant="secondary">{copy.rebalance}</Button>
        <AsyncButton onAction={add} pendingLabel={copy.adding}>
          {copy.addCapacity}
        </AsyncButton>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
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

export { TieredCapacity, type TieredCapacityProps }
export type { TieredCapacityCopy, TieredCapacityRegion, TieredCapacityTier }
