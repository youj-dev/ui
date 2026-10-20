'use client'

import { useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { XIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Gauge, type GaugeThreshold } from '../../components/ui/gauge'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { SegmentedMeter } from '../../components/ui/segmented-meter'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  RANGE,
  RANGES,
  SNAPSHOTS,
  STATUSES,
  demo,
  type HealthDialCopy,
  type HealthDialPart,
  type HealthDialRange,
  type HealthDialSignal,
  type HealthDialSnapshot,
  type HealthDialStatus,
} from './health-dial/data'
import { CheckedAgo } from './health-dial/checked-ago'

/* One thing's health, read as a dial beside its signals and the parts it is
 * made of (a service and its regions, a patient and their monitors, a wind
 * farm and its turbines). The head names the subject with when it was last
 * checked, and holds the windows (`ranges`, 15M / 6H / 3D). The dial sits on a
 * zoned Gauge, and beside it each signal is a row of countable cells (past a
 * threshold they light in its tone). Each part is a ruled row with two
 * figures and its status; a status with `action` offers Shift traffic on its
 * own row, which moves the part to the status `then` names. The footer is
 * capacity and Add. A new window springs the dial and sweeps the meters from
 * their edges. Pass your own `subject`, `snapshots`, `ranges`, `statuses` and
 * `capacity`, and wire `onRebalance` and `onAddCapacity` in place of the demo
 * `wait`s; every string is in `copy`. `loading`, `error` and an empty
 * snapshot take the body's place at its size.
 * It is built for the compact layout density (ui.css), taken from the page, sharing
 * Card's sides, bands, rows and corner: on wide screens the head is one line,
 * the window control overhanging its padding; embedded, it sits at the
 * cards' elevation, at its natural width or, with `fill`, the width the app gives it, so it sits level with them, and
 * from 64rem of its own width the signals and the regions sit side by side
 * rather than the meters running the whole width.
 * Reduced motion: every value is drawn in place. */

interface HealthDialProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1` (its sections an `h3` instead of an `h2`), and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the width the page gives it (a grid cell), not its natural width. Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HealthDialCopy>
  /** The windows to read over, in the control's order. Default: 15 minutes, 6 hours, 3 days. */
  ranges?: HealthDialRange[]
  /** A snapshot per window, keyed by the range's id. Default: demo data. */
  snapshots?: Record<string, HealthDialSnapshot>
  /** The states a part can be in. Default: nominal, lagging (offers the action, then isolated) and isolated. */
  statuses?: HealthDialStatus[]
  /** The window shown first, uncontrolled (a range id). Default `6h`, else the first. */
  defaultRange?: string
  /** The window shown, controlled: pair it with `onRangeChange`. Default: uncontrolled. */
  range?: string
  /** Called with the window picked. Default: none. */
  onRangeChange?: (range: string) => void
  /** The subject's name, set in mono under the title. Default: `copy.subject` ("payments-api"). */
  subject?: string
  /** Writes the two figures beside each part, whole (`format.measures`, [first, second]). Default: the first compact with `copy.firstMeasure`, the second in milliseconds with `copy.secondMeasure`. */
  format?: { measures?: [(value: number) => string, (value: number) => string] }
  /** Skeletons in place of the signals and the parts while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the signals and the parts when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when the window has no snapshot. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Moves a part off the load of its status's `action`; resolve when done, reject to show the button's error. Default: a short demo wait. */
  onRebalance?: (part: HealthDialPart) => Promise<unknown> | unknown
  /** Adds capacity, with the count it will reach; resolve when done, reject to show the button's error. Default: a short demo wait. */
  onAddCapacity?: (capacity: number) => Promise<unknown> | unknown
  /** Formats every number. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The title's level; the parts heading is one below. Default: 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Classes for the root element (the card when embedded, else the page), merged with its own. Default: none. */
  className?: string
  /** How much capacity it runs (the footer's count). Default 9. */
  capacity?: number
  /** Seconds since the last check, when the block mounts. Default 4. */
  checkedAgo?: number
  /** Called by the close button. Without it the button isn't shown. */
  onClose?: () => void
}

/** The body's room when an error or nothing takes its place. */
const BODY = 'min-h-82 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)'
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const DOT = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', muted: 'bg-line-strong' } as const
const STATE = { success: 'success', warning: 'warning', danger: 'danger', muted: 'secondary' } as const

function HealthDial({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  ranges = RANGES,
  snapshots = SNAPSHOTS,
  statuses = STATUSES,
  defaultRange,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  range: rangeProp,
  onRangeChange,
  subject,
  onRebalance,
  onAddCapacity,
  locale: localeProp,
  headingLevel,
  capacity: capacityProp = 9,
  checkedAgo = 4,
  onClose,
  className,
  ...rest
}: HealthDialProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy = { ...DEFAULT_COPY, ...copyProp, locale }
  const titleId = useId()
  const indexId = useId()
  const partsId = useId()
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = `h${level}` as 'h1' | 'h2' | 'h3'
  const SectionTitle = `h${level + 1}` as 'h2' | 'h3' | 'h4'
  const [range, setRangeInner] = useControllableState(rangeProp, defaultRange ?? (ranges.some((r) => r.id === RANGE) ? RANGE : (ranges[0]?.id ?? RANGE)))
  const setRange = (next: string) => {
    setRangeInner(next)
    onRangeChange?.(next)
  }
  const [capacity, setCapacity] = useState(capacityProp)
  const [settled, setSettled] = useState<string[]>([])
  // Each check starts the "checked … ago" count over: the count remounts under a new key.
  const [checks, setChecks] = useState(0)

  const snap = snapshots[range]
  const statusOf = (id: string): HealthDialStatus => statuses.find((st) => st.id === id) ?? { id, label: id, tone: 'muted' }
  // A part the action moved shows the status its old one names.
  const parts = (snap?.parts ?? []).map((p) => (settled.includes(p.id) ? { ...p, status: statusOf(p.status).then ?? p.status } : p))
  const ms = numberFormat(locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short' })
  const rate = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
  const measure = [format?.measures?.[0] ?? ((n: number) => copy.firstMeasure(rate.format(n))), format?.measures?.[1] ?? ((n: number) => copy.secondMeasure(ms.format(n)))] as const
  const state = loading ? 'loading' : error ? 'error' : !snap || (snap.signals.length === 0 && snap.parts.length === 0) ? 'empty' : 'ready'
  const bands: GaugeThreshold[] = [
    { value: 0, tone: 'danger', label: copy.critical },
    { value: 50, tone: 'warning', label: copy.strained },
    { value: 80, tone: 'success', label: copy.nominal },
  ]
  const check = () => setChecks((n) => n + 1)

  const card = (
    <article
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/health-dial w-full overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        // It stops at its natural width unless it fills the cell the app gives it, like the cards beside it.
        !fill && 'max-w-160',
        embedded ? 'shadow-sm' : 'shadow-lg',
        embedded && className,
      )}
    >
      {/* The window control sits at the head's end; on a phone it drops under the title and the close button keeps its corner. */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 px-(--ui--panel-x) py-(--ui--panel-head-y) sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ui text-fg-muted">
            <span className="font-mono text-fg">{subject ?? copy.subject}</span>
            <span aria-hidden>·</span>
            <span aria-live="off" className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              <CheckedAgo key={checks} from={checks === 0 ? checkedAgo : 0} copy={copy} locale={locale} />
            </span>
          </p>
        </div>
        <SegmentedControl
          size="sm"
          aria-label={copy.range}
          value={range}
          onValueChange={(next) => (setRange(next), check())}
          className="col-span-full row-start-2 justify-self-start sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:my-[calc(var(--spacing)*-1.5*var(--ui--compact))]"
        >
          {ranges.map((r) => (
            <SegmentedControlItem key={r.id} value={r.id} className="tabular-nums">
              {r.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        {onClose && (
          <Button variant="ghost" size="icon-sm" aria-label={copy.close} onClick={onClose} className="col-start-2 row-start-1 sm:col-start-3">
            <XIcon size={14} />
          </Button>
        )}
      </header>

      {/* Wide (64rem of the card), the signals and the parts share a row, split by a hairline, so the meters keep a readable length. */}
      {state === 'ready' && (
      <div className="@5xl/health-dial:grid @5xl/health-dial:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section aria-label={copy.signals} className="grid gap-6 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-9">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Eyebrow id={indexId} className={cn('text-ui-sm text-fg-muted', VOICE)}>
              {copy.index}
            </Eyebrow>
            <Gauge value={snap!.index} size="default" gradient thresholds={bands} aria-labelledby={indexId} locale={locale} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            {snap!.signals.map((signal) => (
              <SegmentedMeter key={signal.id} label={signal.label} value={signal.value} max={signal.max} thresholds={signal.thresholds} format={signal.format} segments={30} locale={locale} />
            ))}
          </div>
        </section>

        <section aria-labelledby={partsId} className="border-t border-line px-(--ui--panel-x) pt-(--ui--panel-y) pb-1 @5xl/health-dial:border-s">
          <Eyebrow render={<SectionTitle id={partsId} />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
            {copy.parts}
          </Eyebrow>
          {/* One grid for every row, so the rates, the latencies and the states line up in columns. */}
          <ul className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 divide-y divide-line sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]">
            {parts.map((part, i) => {
              const st = statusOf(part.status)
              const settledNow = settled.includes(part.id)
              return (
              <li key={part.id} data-status={part.status} className="col-span-full grid min-h-(--ui--row) grid-cols-subgrid items-center py-0.5">
                <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT[st.tone])} />
                <span className={cn('min-w-0 flex-1 truncate font-mono text-ui-lg', st.tone === 'muted' ? 'text-fg-muted' : 'text-fg')}>
                  {part.label}
                </span>
                <span className="hidden text-end font-mono text-ui text-fg-muted tabular-nums sm:inline">{measure[0](part.measures[0])}</span>
                <span className="hidden text-end font-mono text-ui text-fg-muted tabular-nums sm:inline">{measure[1](part.measures[1])}</span>
                <span className="flex flex-col items-end gap-0.5">
                  <Badge variant={STATE[st.tone]} className="font-mono tracking-normal normal-case">
                    {st.label}
                  </Badge>
                  <span className="font-mono text-ui-sm text-fg-muted tabular-nums sm:hidden">{measure[1](part.measures[1])}</span>
                </span>
                {statusOf(snap!.parts[i]?.status ?? '').action ? (
                  <AsyncButton
                    size="sm"
                    variant="secondary"
                    // On a phone the action takes its own line under the part. Once the part is
                    // settled it hides but keeps its column, so the rows don't shift under the pointer.
                    className={cn(
                      'col-start-2 col-span-2 mt-1 justify-self-start sm:col-span-1 sm:col-start-auto sm:mt-0',
                      settledNow && 'invisible max-sm:hidden',
                    )}
                    disabled={settledNow}
                    aria-label={copy.rebalanceFrom(part.label)}
                    pendingLabel={copy.rebalancing}
                    errorLabel={copy.failed}
                    onAction={async () => {
                      await (onRebalance ? onRebalance(snap!.parts[i]!) : demo('HealthDial: onRebalance', 900))
                      setSettled((ids) => [...ids, part.id])
                      check()
                    }}
                  >
                    {copy.rebalance}
                  </AsyncButton>
                ) : (
                  <span aria-hidden className="hidden sm:block" />
                )}
              </li>
            )})}
          </ul>
        </section>
      </div>
      )}
      {state === 'loading' && (
        <div aria-busy className="min-h-82 @5xl/health-dial:grid @5xl/health-dial:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <section aria-label={copy.signals} className="grid gap-6 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-9">
            <span className="sr-only">{copy.loadingLabel}</span>
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Skeleton className="h-3 w-20" />
              {/* The dial's own arc (its radius, stroke and box), as an outline. */}
              <svg aria-hidden viewBox="-107 -107 214 109" className="block w-52 overflow-visible">
                <path d="M-92,0 A92,92 0 0 1 92,0" fill="none" strokeWidth={6} vectorEffect="non-scaling-stroke" className="stroke-line-strong" strokeDasharray="2 4" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </section>
          <section aria-hidden className="border-t border-line px-(--ui--panel-x) pt-(--ui--panel-y) pb-1 @5xl/health-dial:border-s">
            <Skeleton className="h-3 w-16" />
            <ul className="mt-1.5 divide-y divide-line">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex min-h-(--ui--row) items-center gap-3 py-0.5">
                  <Skeleton className="size-1.5 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="ms-auto h-4 w-16" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {state === 'error' && (
        <div className={cn(BODY, 'grid place-items-center')}>
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
      )}
      {state === 'empty' && (
        <div className={cn(BODY, 'grid')}>
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

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div className="flex items-baseline gap-2.5">
          <Eyebrow className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.capacity}</Eyebrow>
          <span className="font-mono text-ui-lg text-fg tabular-nums">
            {loading ? <Skeleton className="h-5 w-16" /> : error ? <span className="text-fg-subtle">—</span> : copy.capacityValue(capacity)}
          </span>
        </div>
        <AsyncButton
          pendingLabel={copy.adding}
          errorLabel={copy.failed}
          onAction={async () => {
            await (onAddCapacity ? onAddCapacity(capacity + 1) : demo('HealthDial: onAddCapacity', 900))
            setCapacity((n) => n + 1)
            check()
          }}
        >
          {copy.addCapacity}
        </AsyncButton>
      </footer>
    </article>
  )

  const view = embedded ? (
    card
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HealthDial, type HealthDialProps, type HealthDialCopy, type HealthDialPart, type HealthDialRange, type HealthDialSignal, type HealthDialSnapshot, type HealthDialStatus }
