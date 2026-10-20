'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { BreakdownList } from '../../components/ui/breakdown-list'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { ShareBar } from '../../components/ui/share-bar'
import { Skeleton } from '../../components/ui/skeleton'
import { StatValue } from '../../components/ui/stat-card'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  LINES,
  PRESETS,
  REGIONS,
  demo,
  type EstimateBuilderBilling,
  type EstimateBuilderCopy,
  type EstimateBuilderFormats,
  type EstimateBuilderValue,
  type EstimateBuilderLine,
  type EstimateBuilderPreset,
  type EstimateBuilderRegion,
  type EstimateBuilderTone,
  type EstimateBuilderUsage,
} from './estimate-builder/data'
import { Usage } from './estimate-builder/usage'

/* What anything priced by the amount will cost: usage pricing, a catering
 * quote, a move. The estimate leads, for one period or twelve (the discount on
 * the longer segment), with the all-in price of the
 * first line's unit under it. A ShareBar splits it by line and a two-column
 * key gives each line's cost and share; pointing at a key row, a usage line
 * or a ruler lights its part of the bar. Below, the usage: a preset switch
 * (Hobby, Startup, Scale) and a ruler per line (Slider variant="ticks") in
 * the line's color, each with its cost and unit price. The region in the
 * head scales every price. The foot says the currency, tax and region, with
 * Reset and Save estimate (`onSave`).
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the figure and the bar are drawn at their values. */

interface EstimateBuilderProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (512px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate; `currency` prices the lines. */
  copy?: Partial<EstimateBuilderCopy>
  /** Formats amounts and prices (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The lines of the bill, each with its ruler and price. */
  lines?: EstimateBuilderLine[]
  /** The usage presets on the switch; the second is where the card starts. */
  presets?: EstimateBuilderPreset[]
  /** The regions in the head's picker; each scales every price. */
  regions?: EstimateBuilderRegion[]
  /** The usage per line, when your app owns it; pair with `onUsageChange`. */
  usage?: EstimateBuilderUsage
  /** The usage at first. Default: the second preset's (the first's when there is one). */
  defaultUsage?: EstimateBuilderUsage
  onUsageChange?: (usage: EstimateBuilderUsage) => void
  /** The region at first, by id. Default: the first. */
  defaultRegion?: string
  onRegionChange?: (region: string) => void
  /** Monthly or annual at first. Default monthly. */
  defaultBilling?: EstimateBuilderBilling
  onBillingChange?: (billing: EstimateBuilderBilling) => void
  /** The annual discount, 0–1. Default 0.15. */
  annualDiscount?: number
  /** Show the switch between one period and twelve. Default true; false for a quote with a single price. */
  showBilling?: boolean
  /** Saves the estimate; the card awaits it. */
  onSave?: (estimate: EstimateBuilderValue) => Promise<unknown> | unknown
  /** How the amounts are written; each replaces its default whole. Default: `copy.currency`, whole units for amounts and two decimals for unit prices. */
  formats?: EstimateBuilderFormats
  /** Skeletons in place of the estimate and the usage lines while your data loads. Default false. */
  loading?: boolean
  /** Shown over the card's body when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no lines. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function EstimateBuilder({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  lines = LINES,
  presets = PRESETS,
  regions = REGIONS,
  usage: usageProp,
  defaultUsage,
  onUsageChange,
  defaultRegion,
  onRegionChange,
  defaultBilling = 'monthly',
  onBillingChange,
  annualDiscount = 0.15,
  showBilling = true,
  onSave,
  formats,
  loading = false,
  error,
  onRetry,
  empty,
  ...rest
}: EstimateBuilderProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const start = defaultUsage ?? (presets[1] ?? presets[0])?.usage ?? {}
  const [usage, setUsageState] = useControllableState(usageProp, start)
  const [regionId, setRegionId] = useState(defaultRegion ?? regions[0]?.id ?? '')
  const [billing, setBillingState] = useState(defaultBilling)
  const [active, setActive] = useState<number | null>(null)

  const region = regions.find((r) => r.id === regionId) ?? regions[0]
  const factor = region?.factor ?? 1
  const valueOf = (u: EstimateBuilderUsage, line: EstimateBuilderLine) => u[line.id] ?? line.min
  const costsOf = (u: EstimateBuilderUsage) =>
    Object.fromEntries(lines.map((line) => [line.id, valueOf(u, line) * (line.perMonth ?? 1) * line.price * factor])) as Record<string, number>
  const costs = costsOf(usage)
  const monthly = lines.reduce((sum, line) => sum + (costs[line.id] ?? 0), 0)
  const totalFor = (m: number, b: EstimateBuilderBilling) => (b === 'annual' ? m * 12 * (1 - annualDiscount) : m)
  const total = totalFor(monthly, billing)
  const preset = presets.find((p) => lines.every((line) => valueOf(p.usage, line) === valueOf(usage, line)))
  const first = lines[0]
  const firstUnits = first ? valueOf(usage, first) * (first.perMonth ?? 1) : 0

  const amountOptions = formats?.amount ?? { style: 'currency', currency: copy.currency, maximumFractionDigits: 0 }
  const unitPriceOptions = formats?.unitPrice ?? { style: 'currency', currency: copy.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }
  const money = numberFormat(locale, amountOptions)
  const cents = numberFormat(locale, unitPriceOptions)
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const period = (b: EstimateBuilderBilling) => (b === 'annual' ? copy.perYear : copy.perMonth)

  const setUsage = (next: EstimateBuilderUsage) => {
    setUsageState(next)
    onUsageChange?.(next)
  }
  const pickPreset = (id: string) => {
    const next = presets.find((p) => p.id === id)
    if (!next) return
    setUsage({ ...next.usage })
    announce(
      copy.announce(
        money.format(
          totalFor(
            lines.reduce((sum, line) => sum + (costsOf(next.usage)[line.id] ?? 0), 0),
            billing,
          ),
        ),
        period(billing),
      ),
    )
  }
  const setBilling = (next: EstimateBuilderBilling) => {
    setBillingState(next)
    onBillingChange?.(next)
    announce(copy.announce(money.format(totalFor(monthly, next)), period(next)))
  }
  const save = () => {
    const estimate: EstimateBuilderValue = { usage, region: region?.id ?? '', billing, monthly, total }
    return onSave ? onSave(estimate) : demo('EstimateBuilder: onSave', 900)
  }
  const covered = loading || !!error || lines.length === 0
  const failure = (cause: unknown) => (cause instanceof Error && cause.message ? cause.message : copy.failed)

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-lg')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardAction>
          <Select
            items={regions.map((r) => ({ value: r.id, label: r.label }))}
            value={regionId}
            onValueChange={(next) => {
              if (!next) return
              setRegionId(next as string)
              onRegionChange?.(next as string)
            }}
          >
            <SelectTrigger size="sm" variant="ghost" aria-label={copy.region}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      {covered ? (
        <CardContent
          className="relative flex flex-col gap-(--card-spacing)"
          style={{ minHeight: `calc(var(--spacing) * ${65.75 + 15.25 * (lines.length || 4)})` }}
        >
          {loading ? (
            <>
              <span className="sr-only">{copy.loadingLabel}</span>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Array.from({ length: lines.length || 4 }, (_, i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
              </div>
              <ul className="flex flex-col divide-y divide-line">
                {Array.from({ length: lines.length || 4 }, (_, i) => (
                  <li key={i} className="flex items-center gap-4 py-2.5">
                    <Skeleton className="h-8 w-24 shrink-0" />
                    <Skeleton className="h-3 min-w-0 flex-1" />
                    <Skeleton className="h-5 w-16 shrink-0" />
                  </li>
                ))}
              </ul>
            </>
          ) : error ? (
            <div className="absolute inset-0 grid place-items-center p-(--card-spacing)">
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
            <div className="absolute inset-0 grid p-(--card-spacing)">
              {empty ?? (
                <Empty className="rounded-lg border border-dashed border-line">
                  <EmptyHeader>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}
        </CardContent>
      ) : (
        <>
          <CardContent className="@container flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Eyebrow>{copy.estimated}</Eyebrow>
                <StatValue value={total} from={total} format={amountOptions} locale={locale} unit={period(billing)} />
                {first && firstUnits > 0 && (
                  <Eyebrow className="tabular-nums">{copy.allIn(cents.format(monthly / firstUnits), first.priceUnit)}</Eyebrow>
                )}
              </div>
              {showBilling && (
                <SegmentedControl
                  variant="pill"
                  size="sm"
                  aria-label={copy.billing}
                  value={billing}
                  onValueChange={(next) => setBilling(next as EstimateBuilderBilling)}
                >
                  <SegmentedControlItem value="monthly">{copy.monthly}</SegmentedControlItem>
                  <SegmentedControlItem value="annual">
                    {copy.annual}
                    {annualDiscount > 0 && (
                      <span className="font-mono text-ui-xs text-success-text tabular-nums">{copy.discount(percent.format(annualDiscount))}</span>
                    )}
                  </SegmentedControlItem>
                </SegmentedControl>
              )}
            </div>
            <ShareBar
              parts={lines.map((line) => ({ value: costs[line.id] ?? 0, tone: line.tone, label: line.label }))}
              active={active}
              label={copy.breakdown}
              className="h-2"
            />
            <BreakdownList
              aria-label={copy.breakdown}
              columns={2}
              // Side by side (each column 14rem or more), the last row of the first column loses its hairline too.
              className="@min-[29.5rem]:[&>li:nth-last-child(2)]:after:hidden" // youj-allow: fixed size, BreakdownList's two-column width (2 × 14rem + its gap); a container query can't read --spacing
              items={lines.map((line) => ({ label: line.label, value: totalFor(costs[line.id] ?? 0, billing), tone: line.tone }))}
              format={amountOptions}
              locale={locale}
              active={active}
              onActiveChange={setActive}
            />
          </CardContent>

          <CardContent>
            <Usage
              lines={lines}
              usage={usage}
              onUsageChange={(id, value) => setUsage({ ...usage, [id]: value })}
              costs={Object.fromEntries(lines.map((line) => [line.id, totalFor(costs[line.id] ?? 0, billing)]))}
              factor={factor}
              presetName={preset?.label ?? null}
              presetControl={
                <SegmentedControl variant="pill" size="sm" aria-label={copy.presets} value={preset?.id ?? ''} onValueChange={pickPreset}>
                  {presets.map((p) => (
                    <SegmentedControlItem key={p.id} value={p.id}>
                      {p.label}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              }
              onActiveChange={setActive}
              copy={copy}
              locale={locale}
              amountOptions={amountOptions}
              unitPriceOptions={unitPriceOptions}
              heading={embedded ? 'h3' : 'h2'}
            />
          </CardContent>
        </>
      )}

      <CardFooter className="flex-wrap justify-between gap-3">
        <span>{copy.caption(copy.currency, region?.label ?? '')}</span>
        <div className="ms-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={covered || lines.every((line) => valueOf(usage, line) === valueOf(start, line))}
            onClick={() => setUsage({ ...start })}
          >
            {copy.reset}
          </Button>
          <AsyncButton size="sm" disabled={covered} onAction={save} pendingLabel={copy.saving} successLabel={copy.saved} errorLabel={failure}>
            {copy.save}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-lg', className)}>
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

export { EstimateBuilder, type EstimateBuilderProps }
export type {
  EstimateBuilderBilling,
  EstimateBuilderCopy,
  EstimateBuilderValue,
  EstimateBuilderLine,
  EstimateBuilderPreset,
  EstimateBuilderRegion,
  EstimateBuilderTone,
  EstimateBuilderUsage,
}
