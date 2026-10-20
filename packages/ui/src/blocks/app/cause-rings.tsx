'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { SparkleIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { CAUSES, DEFAULT_COPY, INSIGHT_COUNT, type CauseRingsCause, type CauseRingsCopy } from './cause-rings/data'
import { Donut, Hatch } from './cause-rings/donut'
import { topShare } from './cause-rings/geometry'

/* Why something was lost (line stops, churn, tickets): the period's total and
 * how it moved, then a donut of two rings. The inner ring is the causes, solid
 * and sized by figure; the outer ring splits each cause into where it came from,
 * the three largest hatched (lines, dots, crosses) in the cause's color. The
 * legend lists every cause with its figure; selecting one lights its arcs,
 * names it in the middle and lists its contributors under the chart. The pill
 * at the foot says how few causes make up most of the loss. Patterns and a
 * hairline edge carry the meaning, so it reads in either theme and in print;
 * the legend is the chart's text equivalent. Loading (ring guides), an error with
 * Retry and an empty message take the chart's room at its size. Reduced
 * motion: no fades.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface CauseRingsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CauseRingsCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The causes, in any order: the ring places the largest first. */
  causes?: CauseRingsCause[]
  /** Formats a cause's figure and the total. Default: the locale's number format; the unit lives in `copy.total` and `copy.share`. */
  format?: (value: number) => string
  /** How many of the largest causes the footer's insight sums. Default 3. */
  insightCount?: number
  /** Ring guides in place of the chart while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the chart when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no causes. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** How the total moved since the last period, as a fraction (-0.14 is 14% down). A fall is the good direction here. Default -0.14; `null` hides it. */
  change?: number | null
  /** The cause lit at first. Default: the largest. */
  defaultActive?: string
  /** Called with the cause's id when a legend item is selected, and with null when it is cleared. */
  onActiveChange?: (id: string | null) => void
}

/** The chart's room: the square the donut draws in, so the card keeps its size. */
const frame = 'relative mx-auto aspect-square w-full max-w-60'

/** A ring guide for the loading chart: a skeleton ring of `size` (of the square), `thickness` of its radius. */
function RingGuide({ size, thickness }: { size: string; thickness: string }) {
  const mask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}), black calc(100% - ${thickness}))`
  return <Skeleton className="absolute start-1/2 top-1/2 -translate-1/2 rounded-full rtl:translate-x-1/2" style={{ width: size, height: size, mask, WebkitMask: mask }} />
}

function CauseRings({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  causes: causesProp = CAUSES,
  format,
  insightCount = INSIGHT_COUNT,
  loading = false,
  error,
  onRetry,
  empty,
  change = -0.14,
  defaultActive,
  onActiveChange,
  className,
  ...rest
}: CauseRingsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const patternId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const causes = [...causesProp].sort((a, b) => b.value - a.value)
  const [picked, setPicked] = useState<string | null>(defaultActive ?? null)
  const total = causes.reduce((sum, c) => sum + c.value, 0)
  const lit = causes.find((c) => c.id === picked) ?? causes[0]
  const count = { format: format ?? numberFormat(locale).format }
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const signed = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' })
  const insight = Math.min(insightCount, causes.length)
  const unready = loading || !!error || causes.length === 0
  const dash = <span className="text-fg-subtle">—</span>
  const pick = (id: string) => {
    const next = picked === id ? null : id
    setPicked(next)
    onActiveChange?.(next)
  }

  const card = (
    <Card data-slot="cause-rings" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <header className="flex flex-col gap-1 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.subtitle}</p>
      </header>

      <div className="flex flex-col gap-5 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {loading ? (
            <Skeleton className="h-7.5 w-32" />
          ) : (
            <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{unready ? dash : copy.total(count.format(total))}</span>
          )}
          {change !== null &&
            (loading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              !unready && <span className={cn('text-ui tabular-nums', change <= 0 ? 'text-success-text' : 'text-danger-text')}>{copy.change(signed.format(change), copy.versus)}</span>
            ))}
        </div>

        {loading ? (
          <div className={frame}>
            <span className="sr-only">{copy.loadingLabel}</span>
            <RingGuide size="93.3%" thickness="21.4%" />
            <RingGuide size="68.3%" thickness="29.3%" />
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
        ) : causes.length === 0 ? (
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
          <Donut
            causes={causes}
            active={picked}
            label={copy.chartLabel(copy.total(count.format(total)), causes.map((c) => copy.share(c.label, count.format(c.value), percent.format(total ? c.value / total : 0))).join('; '))}
          >
            {lit && (
              <>
                <span className="text-ui text-fg-muted">{lit.label}</span>
                <span className="text-2xl leading-tight font-semibold tabular-nums">{percent.format(total ? lit.value / total : 0)}</span>
              </>
            )}
          </Donut>
        )}

        {loading ? (
          <div className="flex flex-wrap gap-x-1 gap-y-0.5">
            {[24, 28, 20, 24].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-chip" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        ) : (
          <ul aria-label={copy.legendLabel} className={cn('-mx-2 flex flex-wrap gap-x-1 gap-y-0.5', unready && 'min-h-14.5')}>
            {!error &&
              causes.map((cause) => (
                <li key={cause.id}>
                  <button
                    type="button"
                    aria-pressed={lit?.id === cause.id}
                    onClick={() => pick(cause.id)}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-ui tabular-nums transition-colors yj-duration-fast ease-standard hover:bg-hover aria-pressed:bg-selected"
                  >
                    <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(cause.tone) }} />
                    <span className="text-fg-muted">{cause.label}</span>{' '}
                    <span className="font-medium">{count.format(cause.value)}</span>
                  </button>
                </li>
              ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
            {[
              { rank: 1, label: copy.patternTop },
              { rank: 2, label: copy.patternSecond },
              { rank: 3, label: copy.patternThird },
            ].map(({ rank, label }) => (
              <li key={rank} className="flex items-center gap-1.5">
                <svg width={14} height={14} viewBox="0 0 14 14">
                  <defs>
                    <Hatch id={`${patternId}${rank}`} color="var(--color-fg-muted)" rank={rank} />
                  </defs>
                  <rect width={14} height={14} fill={`url(#${patternId}${rank})`} stroke="var(--color-fg-muted)" strokeWidth={1} />
                </svg>
                {label}
              </li>
            ))}
          </ul>
          <p aria-live="polite" className="min-h-5 text-ui text-fg-muted">
            {unready
              ? null
              : lit?.contributors?.length
                ? copy.contributors(
                    [...lit.contributors]
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((p) => `${p.label} ${count.format(p.value)}`)
                      .join(' · '),
                  )
                : copy.legendHint}
          </p>
        </div>
      </div>

      <footer className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        {loading ? (
          <Skeleton className="h-9 w-full rounded-chip" />
        ) : (
          <p className="flex items-center gap-2 rounded-chip bg-accent-subtle px-3 py-2 text-ui text-accent-text">
            <SparkleIcon aria-hidden size={16} className="shrink-0" />
            <span>{unready ? dash : copy.insight(insight, percent.format(topShare(causes.map((c) => c.value), insight)))}</span>
          </p>
        )}
      </footer>
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

export { CauseRings, type CauseRingsProps }
export type { CauseRingsCause, CauseRingsCopy }
