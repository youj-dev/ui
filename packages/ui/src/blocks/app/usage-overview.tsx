'use client'

import { useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { AlertTriangleIcon, CloudIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, type UsageOverviewCopy } from './usage-overview/copy'
import { DailyCost } from './usage-overview/daily-cost'
import {
  BUDGET,
  CAP,
  CYCLE_DAYS,
  DAILY,
  demo,
  INVOICES,
  METERS,
  RESOURCES,
  rangeRows,
  spend,
  TODAY,
  type UsageDay,
  type UsageInvoice,
  type UsageInvoiceStatus,
  type UsageMeter,
  type UsageRange,
  type UsageResource,
} from './usage-overview/data'
import { Invoices } from './usage-overview/invoices'
import { Meters } from './usage-overview/meters'
import { SpendCap } from './usage-overview/spend-cap'
import { SummaryStrip } from './usage-overview/summary-strip'

/* Cumulus's usage and billing page: where a cloud bill comes from before it
 * arrives. A summary strip counts up month-to-date spend against the budget,
 * the projected bill and the days left in the cycle; the cycle's days fill in
 * as dots. Meters for each metered resource fill as they scroll into view,
 * with a mark at the alert threshold: ink below it, amber past it; they sit
 * two abreast, and more once their column is 48rem wide. Daily cost is a
 * stacked bar chart whose 7 d / 30 d / Cycle range sits on a segmented
 * control. A spend-cap slider recomputes the headroom live (a Counter), and a
 * warning opens beneath it (Collapse) once the projection crosses the cap.
 * Invoices download from the side. Pass your metering as `daily`, `meters`
 * and `invoices`, and save with `onSaveCap` and `onDownloadInvoice`; every
 * string is in `copy`. Reduced motion: bars, meters and numbers are drawn at
 * their values.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface UsageOverviewProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no brand header of its own. Default true; `false` draws its own page (the brand header and a centered canvas). */
  embedded?: boolean
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The product in the standalone header. Default: Cumulus, with a cloud. */
  brand?: { name: string; logo?: ReactNode }
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English. */
  copy?: Partial<UsageOverviewCopy>
  /** Formats numbers and money. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The currency costs are in. Default 'USD'. */
  currency?: string
  /** The chart's series, bottom of the stack first. Default: storage, functions, bandwidth and compute. */
  resources?: UsageResource[]
  /** Daily cost by resource, oldest first and ending today; at least the cycle so far, and 30 days for the 30 d range. Default: 40 demo days. */
  daily?: UsageDay[]
  /** The metered allowances. Default: compute, bandwidth, storage and invocations. */
  meters?: UsageMeter[]
  /** Past invoices, newest first. Default: four demo months. */
  invoices?: UsageInvoice[]
  /** The cycle's budget. Default 2,000. */
  budget?: number
  /** Days in the billing cycle. Default 30. */
  cycleDays?: number
  /** Today's day of the cycle, 1-based. Default 27. */
  today?: number
  /** The chart's range (controlled). Default: uncontrolled. */
  range?: UsageRange
  /** The chart's range at first, uncontrolled. Default '30d'. */
  defaultRange?: UsageRange
  /** Called when the range changes. */
  onRangeChange?: (range: UsageRange) => void
  /** The spend cap (controlled). Default: uncontrolled. */
  cap?: number
  /** The spend cap at first, uncontrolled. Default 2,500. */
  defaultCap?: number
  /** Called as the cap slider moves. */
  onCapChange?: (cap: number) => void
  /** The cap slider's bounds and step. Default 1,000 to 4,000 in 100s. */
  capRange?: { min: number; max: number; step: number }
  /** Save cap; the button shows pending, and a rejection's message shows under the title. Default: a short demo wait. */
  onSaveCap?: (cap: number) => Promise<unknown> | unknown
  /** An invoice's download button. Default: a short demo wait. */
  onDownloadInvoice?: (invoice: UsageInvoice) => Promise<unknown> | unknown
  /** Loading: skeleton figures, chart, meters and invoices. Default false. */
  loading?: boolean
  /** Replaces the page's content with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** The error panel's Try again. Default: none. */
  onRetry?: () => void
  /** Replaces the invoice list when there are none. Default: `copy.emptyInvoices`. */
  empty?: ReactNode
  /** Classes on key parts. */
  classNames?: Partial<Record<'header' | 'content', string>>
}

function UsageOverview({
  theme,
  embedded = true,
  headingLevel = 1,
  brand,
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  resources = RESOURCES,
  daily = DAILY,
  meters = METERS,
  invoices = INVOICES,
  budget = BUDGET,
  cycleDays = CYCLE_DAYS,
  today = TODAY,
  range: rangeProp,
  defaultRange = '30d',
  onRangeChange,
  cap: capProp,
  defaultCap = CAP,
  onCapChange,
  capRange = { min: 1000, max: 4000, step: 100 },
  onSaveCap,
  onDownloadInvoice,
  loading = false,
  error,
  onRetry,
  empty,
  classNames,
  className,
  ...rest
}: UsageOverviewProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const Title = `h${headingLevel}` as 'h1'
  const [range, setRange] = useControllableState(rangeProp, defaultRange)
  const [cap, setCap] = useControllableState(capProp, defaultCap)
  const [failure, setFailure] = useState<string | null>(null)
  const spent = useMemo(() => Math.round(spend(daily.slice(-today)) * 100) / 100, [daily, today])
  const projected = today > 0 ? Math.round((spent / today) * cycleDays) : 0
  const rows = useMemo(() => rangeRows(daily, range, today), [daily, range, today])

  /** Awaits the app's callback; a rejection's message shows under the title, and the button shows its error. */
  const run = async (task: () => unknown) => {
    setFailure(null)
    try {
      await task()
    } catch (reason) {
      setFailure(reason instanceof Error && reason.message ? reason.message : String(reason))
      throw reason
    }
  }

  const body = error ? (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface px-(--ui--panel-x) py-(--ui--panel-y)">
      <p className="flex items-center gap-2 font-medium text-fg">
        <AlertTriangleIcon size={16} className="text-danger-text" />
        {copy.loadFailed}
      </p>
      {typeof error === 'string' ? <p className="text-ui text-fg-muted">{error}</p> : error}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {copy.retry}
        </Button>
      )}
    </div>
  ) : (
    <>
      <SummaryStrip copy={copy} locale={locale} currency={currency} spent={spent} projected={projected} budget={budget} cycleDays={cycleDays} today={today} loading={loading} />
      <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(88)]', classNames?.content)}>
        <div className="flex min-w-0 flex-col gap-6">
          <DailyCost
            copy={copy}
            locale={locale}
            currency={currency}
            resources={resources}
            rows={rows}
            range={range}
            onRangeChange={(next) => {
              setRange(next)
              onRangeChange?.(next)
            }}
            loading={loading}
          />
          <Meters copy={copy} locale={locale} meters={meters} loading={loading} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SpendCap
            copy={copy}
            locale={locale}
            currency={currency}
            cap={cap}
            onCapChange={(next) => {
              setCap(next)
              onCapChange?.(next)
            }}
            {...capRange}
            projected={projected}
            cycleDays={cycleDays}
            onSave={() => run(() => (onSaveCap ? onSaveCap(cap) : demo('Usage: onSaveCap', 800)))}
          />
          <Invoices
            copy={copy}
            locale={locale}
            currency={currency}
            invoices={invoices}
            onDownload={(invoice) => run(() => (onDownloadInvoice ? onDownloadInvoice(invoice) : demo('Usage: onDownloadInvoice', 600)))}
            loading={loading}
            empty={empty}
          />
        </div>
      </div>
    </>
  )

  const failed = failure && (
    <p role="alert" className="text-ui-sm text-danger-text">
      {failure}
    </p>
  )
  if (embedded) {
    const view = (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.subtitle}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
        classNames={{ header: classNames?.header }}
      >
        {failed}
        {body}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
            {brand?.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
                <CloudIcon size={16} />
              </span>
            )}
            <span className="font-semibold tracking-tight">{brand?.name ?? 'Cumulus'}</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="truncate text-fg-muted">{copy.workspace}</span>
            <Badge variant="outline" className="ms-auto">
              {copy.plan}
            </Badge>
          </div>
        </header>
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
          <Reveal inView={false} variant="rise" className={cn('flex flex-col gap-1', classNames?.header)}>
            <Title className="text-2xl font-semibold tracking-tight">{copy.title}</Title>
            <p className="text-ui text-fg-muted">{copy.subtitle}</p>
            {failed}
          </Reveal>
          {body}
        </main>
      </div>
    </ThemeScope>
  )
}

export {
  UsageOverview,
  type UsageOverviewProps,
  type UsageOverviewCopy,
  type UsageDay,
  type UsageInvoice,
  type UsageInvoiceStatus,
  type UsageMeter,
  type UsageRange,
  type UsageResource,
}
