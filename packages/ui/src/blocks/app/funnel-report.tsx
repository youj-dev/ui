'use client'

import { useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter, Reveal } from '@youj/motion'
import { FunnelIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { StatDelta } from '../../components/ui/stat-card'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { Cohorts } from './funnel-report/cohorts'
import { DEFAULT_COPY, type FunnelReportCopy } from './funnel-report/copy'
import { FIRST_TODAY, pct, report as demoReport, SEGMENT_LIST, type Cohort, type FunnelSegment, type FunnelUpgrade, type Report, type Segment, type Step } from './funnel-report/data'
import { Funnel } from './funnel-report/funnel'
import { StepChanges } from './funnel-report/step-changes'
import { DailyUpgrades, TimeToPaid } from './funnel-report/timing'

/* Loopwork's activation report: how trial teams become paying ones. A
 * platform switch (All, Web, iOS, Android) re-cuts every figure and the new
 * conversion is announced. Up top, the headline numbers count to their
 * values. The funnel is a column chart: who reached each step in the chart
 * palette, the drop-off since the step before hatched above it, and the
 * step's conversion on top; the columns grow and morph when the platform
 * changes. Beside it, a DiffBar per step lights whichever eight weeks
 * converted better. The cohort grid tints each week's retention in the
 * first chart color, fading as teams fall away. Time to paid is a
 * histogram with a draggable window that reports the share converting
 * inside it, and daily upgrades are heat dots on a calendar heatmap. Feed it your
 * data: answer `onSegmentChange` with a new `report` (a `FunnelReportData`
 * from your analytics API), and pass your `segments` and `brand`; every
 * string is in `copy`. It is built for the compact layout density (ui.css),
 * taken from the page, and lays out by its own width, not the window's: from 56rem the
 * headline is one row of four and each chart has its side column beside it.
 * Reduced motion: everything lands in place. */

interface FunnelReportProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no product header of its own. Default true; `false` draws its own page (the product header and a centered canvas). */
  embedded?: boolean
  /** The title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The figures for the segment shown: steps (the first is the funnel's entry, the second trials, the last paid), cohorts, days to paid and daily upgrades. Default: the demo's, computed for the segment. */
  report?: Report
  /** The cuts in the switch. Default: All, Web, iOS and Android. */
  segments?: FunnelSegment[]
  /** The segment shown (controlled); pair it with `onSegmentChange`. */
  segment?: string
  /** The segment shown first. Default `all`. */
  defaultSegment?: Segment | (string & {})
  /** Called with the segment the switch lands on. */
  onSegmentChange?: (segment: string) => void
  /** The last day of the period. Default: the browser's today once mounted (a fixed demo day before, so hydration matches). */
  today?: Date | number
  /** Formats dates and numbers. Default: the YoujProvider locale. */
  locale?: string
  /** The product in the standalone header: its name and mark. Default: Loopwork and a funnel. */
  brand?: { name: string; logo?: ReactNode }
  /** Beside the segment switch: an export button, a date filter. Default: none. */
  actions?: ReactNode
  /** Skeletons in place of the figures while your data loads; the layout holds. Default false. */
  loading?: boolean
  /** Shown in place of the figures when they fail to load, with a retry button when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries loading after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message for a period nobody entered. Default: `copy.empty` and `copy.emptyDetail`. */
  empty?: ReactNode
  /** Any of the report's strings, to rewrite or translate. Default: the demo's English strings. */
  copy?: Partial<FunnelReportCopy>
}

const ONE_DECIMAL = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 } as const
const ratio = (a: number, b: number) => (b ? a / b : 0)

function FunnelReport({
  theme,
  embedded = true,
  headingLevel = 1,
  report: reportProp,
  segments = SEGMENT_LIST,
  segment: segmentProp,
  defaultSegment = 'all',
  onSegmentChange,
  today: todayProp,
  locale: localeProp,
  brand,
  actions,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  className,
  ...rest
}: FunnelReportProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const locale = useLocale(localeProp)
  const { announce, announcer } = useAnnouncer()
  // The browser's today, once hydrated: until then a fixed day, so the server's render and the first client render match.
  const now = useNow(0)
  const today = useMemo(() => (todayProp !== undefined ? new Date(todayProp) : now === null ? FIRST_TODAY : new Date(now)), [todayProp, now])
  const [segment, setSegment] = useControllableState<string>(segmentProp, defaultSegment)
  const data = useMemo(() => reportProp ?? demoReport(segment as Segment, today, locale), [reportProp, segment, today, locale])
  const percent = useMemo(() => pct(locale, 1), [locale])
  const steps = data.steps
  const first = steps[0]
  const trials = steps[1] ?? first
  const paid = steps[steps.length - 1]
  const blank = !first?.count

  const choose = (next: string) => {
    setSegment(next)
    onSegmentChange?.(next)
    // Your report for the new segment arrives later; the demo's is known now.
    if (!reportProp) announce(copy.announce(segments.find((s) => s.value === next)?.label ?? next, percent(demoReport(next as Segment, today, locale).conversion)))
  }

  const figures =
    trials && paid
      ? [
          { label: copy.visitorToPaid, value: data.conversion, previous: data.previousConversion, format: ONE_DECIMAL },
          { label: copy.trialsStarted, value: trials.count, previous: trials.previous },
          { label: copy.newPaying, value: paid.count, previous: paid.previous },
          { label: copy.trialToPaid, value: ratio(paid.count, trials.count), previous: ratio(paid.previous, trials.previous), format: ONE_DECIMAL },
        ]
      : []

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
  ) : loading ? (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-28 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))]" />
      {[0, 1].map((row) => (
        <div key={row} className="grid gap-6 @4xl/funnel:grid-cols-[minmax(0,1fr)_--spacing(96)]">
          <Skeleton className="h-80 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))]" />
          <Skeleton className="h-80 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))]" />
        </div>
      ))}
    </div>
  ) : blank ? (
    (empty ?? (
      <Empty className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDetail}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <>
      <section aria-label={copy.headline} className="grid grid-cols-2 overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface @4xl/funnel:grid-cols-4">
        {figures.map((f, i) => (
          <div
            key={f.label}
            role="group"
            aria-label={f.label}
            className={['flex flex-col gap-2 p-4 md:p-5', i % 2 ? 'border-s border-line' : '', i > 1 ? 'border-t border-line @4xl/funnel:border-t-0' : '', i === 2 ? '@4xl/funnel:border-s' : ''].join(' ')}
          >
            <Eyebrow>{f.label}</Eyebrow>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Counter value={f.value} format={f.format} locale={locale} inView={false} className="text-2xl font-semibold tracking-tight text-fg" />
              <StatDelta value={f.previous ? f.value / f.previous - 1 : 0} locale={locale} />
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 @4xl/funnel:grid-cols-[minmax(0,1fr)_--spacing(96)]">
        <Funnel steps={steps} locale={locale} copy={copy} />
        <StepChanges steps={steps} copy={copy} />
      </div>
      <div className="grid gap-6 @4xl/funnel:grid-cols-[minmax(0,1fr)_--spacing(96)]">
        <Cohorts cohorts={data.cohorts} locale={locale} copy={copy} />
        <div className="flex min-w-0 flex-col gap-6">
          <TimeToPaid key={segment} days={data.daysToPaid} locale={locale} copy={copy} />
          <DailyUpgrades upgrades={data.upgrades} locale={locale} copy={copy} />
        </div>
      </div>
    </>
  )

  const controls = (
    <>
      {segments.length > 1 && (
        <SegmentedControl aria-label={copy.platform} value={segment} onValueChange={choose}>
          {segments.map((s) => (
            <SegmentedControlItem key={s.value} value={s.value}>
              {s.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
      {actions}
    </>
  )
  const content = (
    <>
      {body}
      {announcer}
    </>
  )

  const view = embedded ? (
    <AppPage
      {...rest}
      title={copy.title}
      description={copy.description}
      actions={controls}
      headingLevel={headingLevel}
      width="fill"
      className={cn('text-fg', className)}
      classNames={{ body: '@container/funnel' }}
    >
      <div className="flex flex-col gap-6">{content}</div>
    </AppPage>
  ) : (
    <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-8">
          {brand?.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
              <FunnelIcon size={15} />
            </span>
          )}
          <span className="font-semibold tracking-tight whitespace-nowrap">{brand?.name ?? 'Loopwork'}</span>
          <span aria-hidden className="text-fg-muted max-sm:hidden">/</span>
          <span className="truncate text-fg-muted max-sm:hidden">{copy.section}</span>
          <Badge variant="outline" className="ms-auto">
            {copy.badge}
          </Badge>
        </div>
      </header>
      <main aria-labelledby={titleId} className="@container/funnel mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <Reveal inView={false} variant="rise" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Title id={titleId} className="text-2xl font-semibold tracking-tight">
              {copy.title}
            </Title>
            <p className="text-ui text-fg-muted">{copy.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        </Reveal>
        {content}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  FunnelReport,
  type Cohort as FunnelCohort,
  type FunnelReportCopy,
  type FunnelReportProps,
  type FunnelSegment,
  type FunnelUpgrade,
  type Report as FunnelReportData,
  type Step as FunnelStep,
}
