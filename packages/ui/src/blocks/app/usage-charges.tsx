'use client'

import { useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { DownloadIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { AppPage } from '../../components/ui/app-page'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { DateRangePicker, type DateRange } from '../../components/ui/date-range-picker'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat } from '../../lib/utils'
import { ChargesChart } from './usage-charges/chart'
import {
  DEFAULT_COPY,
  demo,
  PROJECTS,
  RECORDS,
  SKUS,
  type UsageChargesCopy,
  type UsageChargesProject,
  type UsageChargesRecord,
  type UsageChargesSku,
  type UsageChargesTone,
} from './usage-charges/data'
import { dayRows, filterRecords, fromIso, skuRows, toIso, totalCharge } from './usage-charges/model'
import { SkuTable } from './usage-charges/sku-table'

/* Usage and charges: the settings page that says what a workspace used and
 * what that cost. A date range, a project filter and Export CSV sit over the
 * total charges, with the days beneath as stacked bars by SKU (hover a bar, or
 * focus the chart and walk the days with the arrow keys, for that day's
 * charges), and a table of SKUs below: usage against its allowance as a small
 * ring and figures, what went past it, the charge, and a total row.
 * Pass the metering as `records` (one per day, project and SKU, with its billed
 * `overage`), the products as `skus` and the projects as `projects`: the block
 * filters and sums them, so an app that fetches by range just passes what came
 * back and listens to `onRangeChange` and `onProjectChange`. A SKU's `included`
 * is the allowance for the period the records cover.
 * Empty, loading and error keep the page's size. It is built for the compact
 * layout density (ui.css), taken from the page; embedded, it is a page of the
 * app's frame (AppPage). */

type UsageChargesQuery = { from?: string; to?: string; project: string }

interface UsageChargesProps extends Omit<ComponentProps<'main'>, 'children' | 'title'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) with the range, project and export as its actions, across the whole width. Default true; `false` draws its own page (a canvas, the controls under the title). */
  embedded?: boolean
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<UsageChargesCopy>
  /** Formats numbers, money and dates (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The currency charges are in. Default 'USD'. */
  currency?: string
  /** The metered products, in the table's order. */
  skus?: UsageChargesSku[]
  /** The metering, one record per day, project and SKU. */
  records?: UsageChargesRecord[]
  /** The projects the filter offers, after All projects. */
  projects?: UsageChargesProject[]
  /** The days shown (controlled). Default: uncontrolled, opening on every day in `records`. */
  range?: DateRange | null
  /** Called when the range changes. */
  onRangeChange?: (range: DateRange | null) => void
  /** The project shown (controlled), a project's id or 'all'. Default: uncontrolled, opening on 'all'. */
  project?: string
  /** Called when the project changes. */
  onProjectChange?: (project: string) => void
  /** Export CSV for what the filters show; the button shows pending, success and failure. Default: a short demo wait. */
  onExport?: (query: UsageChargesQuery) => Promise<unknown> | unknown
  /** Shows skeletons in the figures, chart and table. */
  loading?: boolean
  /** A message in place of the page's content when loading failed. */
  error?: ReactNode
  /** Called by the error's Try again. */
  onRetry?: () => void
  /** Replaces the chart's empty state when no usage falls inside the filters. */
  empty?: ReactNode
}

function UsageCharges({
  theme,
  embedded = true,
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  skus = SKUS,
  records = RECORDS,
  projects = PROJECTS,
  range: rangeProp,
  onRangeChange,
  project: projectProp,
  onProjectChange,
  onExport,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: UsageChargesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const span = useMemo(() => {
    const dates = records.map((r) => r.date).sort()
    return dates.length ? { from: fromIso(dates[0] as string), to: fromIso(dates[dates.length - 1] as string) } : null
  }, [records])
  const [range, setRange] = useControllableState<DateRange | null>(rangeProp, span)
  const [project, setProject] = useControllableState(projectProp, 'all')

  const query: UsageChargesQuery = { from: range?.from && toIso(range.from), to: range?.to && toIso(range.to ?? range.from), project }
  const shown = useMemo(() => filterRecords(records, { from: query.from, to: query.to }, project), [records, query.from, query.to, project])
  const rows = useMemo(() => skuRows(shown, skus), [shown, skus])
  const days = useMemo(() => dayRows(shown, skus), [shown, skus])
  const total = totalCharge(rows)
  const billed = useMemo(() => skus.filter((s) => days.some((d) => (d.charges[s.id] ?? 0) > 0)), [skus, days])

  const date = dateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
  const period = range?.from ? copy.period(date.format(range.from), date.format(range.to ?? range.from)) : ''
  const options = [{ value: 'all', label: copy.allProjects }, ...projects.map((p) => ({ value: p.id, label: p.name }))]

  const controls = (
    <>
      <DateRangePicker
        className="w-full sm:w-80"
        value={range}
        onValueChange={(next) => {
          setRange(next)
          onRangeChange?.(next)
        }}
        startLabel={copy.startDate}
        endLabel={copy.endDate}
      />
      <Select
        items={options}
        value={project}
        onValueChange={(value) => {
          setProject(value as string)
          onProjectChange?.(value as string)
        }}
      >
        <SelectTrigger aria-label={copy.projectFilter} className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AsyncButton
        className="sm:ms-auto"
        variant="outline"
        pendingLabel={copy.exporting}
        successLabel={copy.exported}
        onAction={() => (onExport ? onExport(query) : demo('UsageCharges: onExport', 900))}
      >
        <DownloadIcon size={16} />
        {copy.export}
      </AsyncButton>
    </>
  )

  const body = error ? (
    <Card className="min-h-142">
      <Empty className="h-full flex-1">
        <EmptyHeader>
          <EmptyTitle>{error}</EmptyTitle>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button variant="secondary" onClick={onRetry}>
              {copy.retry}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </Card>
  ) : (
    <>
      <Card aria-busy={loading || undefined}>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <p className="text-ui text-fg-muted">{copy.totalCharges}</p>
            <div className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {loading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <Counter value={total} locale={locale} format={{ style: 'currency', currency }} inView={false} duration="slow" />
              )}
            </div>
            <p className="text-ui text-fg-muted tabular-nums">{period || '\u00a0'}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : days.length === 0 ? (
              (empty ?? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ))
            ) : (
              <ChargesChart copy={copy} locale={locale} currency={currency} skus={billed} days={days} total={total} />
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 overflow-hidden py-0">
        <SkuTable copy={copy} locale={locale} currency={currency} rows={rows} total={total} loading={loading} />
      </Card>
    </>
  )

  const view = embedded ? (
    <AppPage
      {...(rest as ComponentProps<'div'>)}
      title={copy.title}
      description={copy.subtitle}
      actions={controls}
      width="fill"
      className={cn('text-fg', className)}
    >
      {loading && <span className="sr-only">{copy.loading}</span>}
      {body}
    </AppPage>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg md:px-8', className)}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 id={titleId} className="text-2xl font-semibold tracking-tight">
              {copy.title}
            </h1>
            <p className="text-ui text-fg-muted">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">{controls}</div>
        </header>
        {loading && <span className="sr-only">{copy.loading}</span>}
        {body}
      </div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { UsageCharges, type UsageChargesProps, type UsageChargesQuery }
export type { UsageChargesCopy, UsageChargesProject, UsageChargesRecord, UsageChargesSku, UsageChargesTone }
