'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, HITS, RECENT, TOLERANCE, demo, type DriftHistogramCopy } from './drift-histogram/data'
import { Plate } from './drift-histogram/plate'
import { binHits, capability, centroid, isOut, offsetOf, type DriftHistogramHit } from './drift-histogram/stats'

/* Where a part lands against its tolerance (the demo: a hole's position in
 * mm), and whether the process is walking away from nominal. Above the plate, the drift of the recent parts
 * (how far their center sits from nominal) and the process capability (Cpk,
 * warning under 1.33). The plate is drawn at an angle with a column for every
 * hit counted per 0.01 mm: older ones gray, recent ones in the accent, any
 * outside the dashed tolerance ring in warning, and an arrow from where the
 * older ones centered to where the recent ones do. Below it, the tool offset
 * that would bring the recent center back to nominal, and Apply to send it.
 * The plate is decorative; the figures, the legend and its text say what it
 * shows. Reduced motion: nothing moves.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface DriftHistogramProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<DriftHistogramCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Where each part landed relative to nominal, oldest first. The plate is drawn 0.07 either side of nominal, so scale your values to that and let `format` read them. */
  hits?: DriftHistogramHit[]
  /** How many of the latest hits count as recent. Default 30. */
  recent?: number
  /** The tolerance circle's diameter, in the same unit as the hits. Default 0.1. */
  tolerance?: number
  /** Formats the offsets and the tolerance (default: three decimals, the tolerance two). */
  format?: (value: number) => string
  /** Skeletons in place of the plate and its figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the plate when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no hits. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Called by Apply with the tool offset in mm that would bring the recent center back to nominal; resolve when it is set. Default: a short demo wait. */
  onApply?: (offset: DriftHistogramHit) => Promise<unknown> | unknown
}

function DriftHistogram({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  hits = HITS,
  recent = RECENT,
  tolerance = TOLERANCE,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  onApply,
  className,
  ...rest
}: DriftHistogramProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [applied, setApplied] = useState(false)
  const three = numberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const signed = numberFormat(locale, { signDisplay: 'exceptZero', minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const two = numberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const count = numberFormat(locale)
  const fmtOffset = format ?? three.format
  const fmtSigned = format ?? signed.format
  const fmtTolerance = format ?? two.format

  const latest = hits.slice(-recent)
  const before = hits.slice(0, Math.max(0, hits.length - recent))
  const offset = offsetOf(latest)
  const cpk = capability(latest, tolerance)
  const center = centroid(latest)
  const fix: DriftHistogramHit = { x: -center.x, y: -center.y }
  const out = hits.filter((h) => isOut(h, tolerance)).length
  const cells = binHits(hits, recent, tolerance)
  const noFigures = loading || !!error || hits.length === 0
  const figure = (value: ReactNode, skeleton: string) => (loading ? <Skeleton className={skeleton} /> : noFigures ? <span className="text-fg-subtle">—</span> : value)
  // The plate's room: the same shape it draws in, so the card keeps its size.
  const frame = 'aspect-[274.9/175.7] w-full'
  const drifting = !applied && (out > 0 || cpk < 1.33)
  const cpkTone = cpk >= 1.33 ? 'text-success-text' : cpk >= 1 ? 'text-warning-text' : 'text-danger-text'

  const apply = async () => {
    await (onApply ? onApply(fix) : demo('DriftHistogram: onApply', 1000))
    setApplied(true)
    announce(copy.announceApplied(fmtSigned(fix.x), fmtSigned(fix.y)))
  }

  const card = (
    <Card data-slot="drift-histogram" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <header className="flex items-start justify-between gap-3 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <div className="text-ui text-fg-muted tabular-nums">{figure(copy.subtitle(copy.subject, hits.length), 'h-4 w-32')}</div>
        </div>
        {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          !noFigures && (
            <Badge variant={applied ? 'success' : drifting ? 'warning' : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
              {applied ? copy.corrected : drifting ? copy.drifting : copy.stable}
            </Badge>
          )
        )}
      </header>

      <div className="flex flex-col gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-3xl leading-none font-semibold tracking-tight">{figure(fmtOffset(offset), 'h-7.5 w-20')}</span>
            {!noFigures && <span className="text-ui text-fg-muted">{copy.offsetLabel(latest.length)}</span>}
          </span>
          <span className="text-ui font-medium tabular-nums">
            <span className="text-fg-muted">{copy.capability} </span>
            <span className={noFigures ? undefined : cpkTone}>{figure(two.format(cpk), 'inline-block h-4 w-10 align-middle')}</span>
          </span>
        </div>

        {loading ? (
          <div className={cn(frame, 'relative grid place-items-center')}>
            <span className="sr-only">{copy.loadingLabel}</span>
            <Skeleton className="h-3/5 w-4/5 rounded-full" />
          </div>
        ) : error ? (
          <div className={cn(frame, 'grid place-items-center')}>
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
        ) : hits.length === 0 ? (
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
        ) : (
          <Plate
            cells={cells}
            older={centroid(before)}
            recent={center}
            tolerance={tolerance}
            toleranceText={copy.tolerance(fmtTolerance(tolerance))}
            label={copy.chartLabel(hits.length, before.length, latest.length - latest.filter((h) => isOut(h, tolerance)).length, out, fmtOffset(offset), fmtTolerance(tolerance))}
          />
        )}

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-fg-muted tabular-nums">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-xs bg-fg-subtle" />
            {copy.keyOlder}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-xs bg-accent" />
            {copy.keyRecent}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-xs bg-warning" />
            {copy.keyOut(noFigures ? '—' : count.format(out))}
          </li>
          <li className="flex items-center gap-1.5">
            <svg aria-hidden width={14} height={8} viewBox="0 0 14 8">
              <path d="M0 4H12M9 1L12 4L9 7" fill="none" stroke="var(--color-fg)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copy.keyDrift}
          </li>
        </ul>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div className="flex min-w-0 flex-col">
          <span className="text-ui font-medium">{copy.correction}</span>
          <span className="flex gap-3 text-ui-sm text-fg-muted tabular-nums">
            <span>{noFigures ? <span className="text-fg-subtle">{copy.axis('X', '—')}</span> : copy.axis('X', fmtSigned(fix.x))}</span>
            <span>{noFigures ? <span className="text-fg-subtle">{copy.axis('Y', '—')}</span> : copy.axis('Y', fmtSigned(fix.y))}</span>
          </span>
        </div>
        <AsyncButton disabled={applied || noFigures} onAction={apply} pendingLabel={copy.applying} successLabel={copy.applied}>
          {copy.apply}
        </AsyncButton>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-sm', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { DriftHistogram, type DriftHistogramProps }
export type { DriftHistogramHit, DriftHistogramCopy }
