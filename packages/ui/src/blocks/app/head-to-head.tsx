'use client'

import { type ComponentProps, type ReactNode, useId, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DiffBar, diffWinner } from '../../components/ui/diff-bar'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Eyebrow } from '../../components/ui/typography'
import { cn, numberFormat } from '../../lib/utils'
import {
  CONTENDERS,
  DEFAULT_COPY,
  METRICS,
  demo,
  type HeadToHeadContender,
  type HeadToHeadMetric,
  type HeadToHeadCopy,
  type HeadToHeadSide,
} from './head-to-head/data'
import { Quadrant } from './head-to-head/quadrant'

/* Two models (or two runs) side by side, before one ships: each contender
 * with its role, cost and quality, the overall winner marked; then every
 * metric as a DiffBar (A grows to the start from a shared center, B to the
 * end, the better side lit in the accent) with a chip naming the row's
 * winner and its margin; then cost against quality as two dots on a
 * quadrant with the trade-off stated in mono. Choose a side and promote it
 * (Button onAction; swap the demo `wait` with `onChoose`). The bars light
 * outward from the center as they scroll into view. It is built for the compact
 * layout density (ui.css), taken from the page; embedded, it keeps its natural width
 * unless `fill`. Reduced motion: drawn in place. */

interface HeadToHeadProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeadToHeadCopy>
  /** The two sides: A and B. Default: two demo models. */
  contenders?: Record<HeadToHeadSide, HeadToHeadContender>
  /** The rows compared, each with its own values, format and which direction is better. Default: a demo model evaluation. */
  metrics?: HeadToHeadMetric[]
  /** Writes the figures that aren't a metric's own: `x` is the contender's horizontal-axis value under its name (default: US dollars), `xDelta` and `yDelta` the change from A to B beside the trade-off (default: a percent for x, points for y). */
  format?: { x?: (value: number) => string; xDelta?: (from: number, to: number) => string; yDelta?: (from: number, to: number) => string }
  /** Skeletons in place of the comparison while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the comparison when it fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there are no metrics. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Chooses a side; resolve when it's done. Default: a short demo wait. */
  onChoose?: (side: HeadToHeadSide, contender: HeadToHeadContender) => Promise<unknown> | unknown
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'

function HeadToHead({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  contenders = CONTENDERS,
  metrics = METRICS,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  onChoose,
  locale,
  className,
  ...rest
}: HeadToHeadProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const results = metrics.map((m) => ({ ...m, winner: diffWinner(m.a, m.b, m.better) }))
  const wins = { a: results.filter((r) => r.winner === 'a').length, b: results.filter((r) => r.winner === 'b').length }
  const overall: HeadToHeadSide | 'even' = wins.a === wins.b ? 'even' : wins.a > wins.b ? 'a' : 'b'
  const [chosen, setChosen] = useState<HeadToHeadSide>(overall === 'a' ? 'a' : 'b')
  const usd = numberFormat(copy.locale, { style: 'currency', currency: 'USD' })
  const blank = loading || Boolean(error) || metrics.length === 0
  const signed = (fraction: number) =>
    numberFormat(copy.locale, { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 0 }).format(fraction)
  const points = (delta: number) =>
    copy.points(numberFormat(copy.locale, { signDisplay: 'exceptZero', maximumFractionDigits: 1 }).format(delta))
  /** The winner's margin, from its side: "+1.2 pt", "−47%". */
  const margin = (r: (typeof results)[number]) => {
    const [mine, theirs] = r.winner === 'a' ? [r.a, r.b] : [r.b, r.a]
    return typeof r.margin === 'function' ? r.margin(mine, theirs) : r.margin === 'points' ? points(mine - theirs) : signed((mine - theirs) / theirs)
  }

  // The comparison's room, so the card keeps its size while it loads, fails or has nothing.
  const placeholder = loading ? (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">{copy.loading}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-44 w-full max-w-88" />
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
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-184')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>
          {loading ? <Skeleton className="h-4 w-32" /> : blank ? <span className="text-fg-subtle">—</span> : copy.subtitle}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      {blank ? (
        <CardContent className="grid min-h-229">{placeholder}</CardContent>
      ) : (
        <>
          <CardContent role="group" aria-label={copy.contenders} className="grid gap-2 sm:grid-cols-2">
            {(['a', 'b'] as const).map((side) => {
              const c = contenders[side]
              return (
                <div
                  key={side}
                  data-slot="head-to-head-contender"
                  data-winner={overall === side || undefined}
                  className={cn(
                    'flex min-w-0 flex-col gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] p-3.5 sm:p-4',
                    WELL,
                    side === 'b' && 'sm:items-end sm:text-end',
                  )}
                >
                  <div className={cn('flex w-full items-center gap-2', side === 'b' && 'sm:flex-row-reverse')}>
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full font-mono text-ui-xs font-medium',
                        overall === side ? 'bg-accent text-on-accent' : 'bg-well text-fg',
                      )}
                    >
                      {copy.sides[side]}
                    </span>
                    <Eyebrow className="truncate">{c.role}</Eyebrow>
                    {overall === side && (
                      <Badge className={cn('ms-auto', side === 'b' && 'sm:ms-0 sm:me-auto')}>
                        <BadgeDot />
                        {copy.winner}
                      </Badge>
                    )}
                  </div>
                  <span className="w-full truncate font-mono text-ui-lg text-fg">{c.name}</span>
                  <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
                    <span className="text-fg">{(format?.x ?? usd.format)(c.x)}</span>
                    {copy.xUnit && ` ${copy.xUnit}`}
                  </span>
                  <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.wins(wins[side], results.length)}</span>
                </div>
              )
            })}
          </CardContent>

          <CardContent role="group" aria-label={copy.metricsLabel}>
            <ul className="flex flex-col">
              {results.map((r) => (
                <li
                  key={r.id}
                  data-slot="head-to-head-metric"
                  className="flex flex-col gap-2 border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <Eyebrow className="truncate">{r.label ?? copy.metrics[r.id] ?? r.id}</Eyebrow>
                      <span className="hidden text-ui-xs text-fg-muted sm:inline">{r.better === 'higher' ? copy.higher : copy.lower}</span>
                    </span>
                    <Badge variant={r.winner === 'even' ? 'secondary' : 'default'} className="shrink-0 font-mono tabular-nums">
                      {r.winner !== 'even' && <BadgeDot />}
                      {r.winner === 'even' ? copy.even : `${copy.sides[r.winner]} ${margin(r)}`}
                    </Badge>
                  </div>
                  <DiffBar
                    a={r.a}
                    b={r.b}
                    better={r.better}
                    format={r.format}
                    locale={copy.locale}
                    names={[copy.sides.a, copy.sides.b]}
                    by={r.winner === 'even' ? undefined : margin(r)}
                    segments={16}
                  />
                </li>
              ))}
            </ul>
          </CardContent>

          <CardContent role="group" aria-label={copy.tradeoff} className="flex flex-col gap-4">
            <Eyebrow>{copy.tradeoff}</Eyebrow>
            <Quadrant contenders={contenders} winner={overall} copy={copy} format={format} />
          </CardContent>
        </>
      )}

      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto basis-full text-ui-sm text-fg-muted sm:basis-auto">
          {loading ? <Skeleton className="h-4 w-40" /> : blank ? <span className="text-fg-subtle">—</span> : copy.status}
        </span>
        <SegmentedControl aria-label={copy.chooseLabel} value={chosen} onValueChange={(next) => setChosen(next as HeadToHeadSide)}>
          {(['a', 'b'] as const).map((side) => (
            <SegmentedControlItem key={side} value={side} className="min-w-10 font-mono">
              {copy.sides[side]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <AsyncButton
          disabled={blank}
          onAction={() => (onChoose ? onChoose(chosen, contenders[chosen]) : demo('HeadToHead: onChoose', 1200))}
          pendingLabel={copy.choosing}
          successLabel={copy.chosen}
        >
          {copy.choose(copy.sides[chosen])}
        </AsyncButton>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-184', className)}>
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

export { HeadToHead, type HeadToHeadProps }
