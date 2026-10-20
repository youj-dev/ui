'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { Chart } from './curve-window/chart'
import { AXES, DEFAULT_COPY, SERIES, type CurveWindowAxes, type CurveWindowCopy, type CurveWindowResult, type CurveWindowSeries, type CurveWindowTrace } from './curve-window/data'
import { endOf, withUnit } from './curve-window/geometry'

/* One value against another over the last parts, one series at a time. Pick a
 * series and see its last curves: hairlines that end inside the window, the
 * last one in the accent, and any failed one in danger red with a callout
 * that names the part, its value and why it failed. Above the chart, the
 * last curve as a number with where it ended and its verdict; in the head,
 * how many parts failed across the series. The axes say what is measured
 * (the demo: torque against angle). Loading, an error with Retry and no
 * series take the chart's place at its size. The chart is an image
 * with a text alternative, and the parts are listed in words for assistive
 * tech. Reduced motion: nothing moves.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface CurveWindowProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CurveWindowCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The series to choose from, each with its recent curves and window. */
  series?: CurveWindowSeries[]
  /** The series shown (its `id`), controlled. */
  value?: string
  /** The series shown at first (uncontrolled). Default: the first. */
  defaultValue?: string
  /** Called with the series' id when another is picked. */
  onValueChange?: (id: string) => void
  /** What the two axes measure and how their values read. Default: angle in degrees across, torque in Nm up. */
  axes?: CurveWindowAxes
  /** Skeletons in place of the chart and its figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the chart when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is no series. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function CurveWindow({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  series = SERIES,
  value: valueProp,
  defaultValue,
  onValueChange,
  axes = AXES,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: CurveWindowProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [valueId, setValueId] = useControllableState(valueProp, defaultValue ?? series[0]?.id ?? '')
  const current = series.find((s) => s.id === valueId) ?? series[0]
  const one = numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const whole = numberFormat(locale, { maximumFractionDigits: 0 })
  const [minX, maxX] = axes.x.domain ?? AXES.x.domain ?? [0, 60]
  const [minY, maxY] = axes.y.domain ?? AXES.y.domain ?? [0, 30]
  const stepX = axes.x.step ?? AXES.x.step ?? 20
  const stepY = axes.y.step ?? AXES.y.step ?? 10
  // A value with its unit, and a window's ends as one range.
  const textX = (v: number) => (axes.x.format ? axes.x.format(v) : withUnit(whole.format(v), axes.x.unit))
  const textY = (v: number) => (axes.y.format ? axes.y.format(v) : withUnit(one.format(v), axes.y.unit))
  const range = (axis: CurveWindowAxes['x'], from: number, to: number) =>
    axis.format ? `${axis.format(from)}–${axis.format(to)}` : withUnit(`${whole.format(from)}–${whole.format(to)}`, axis.unit)
  const nok = series.reduce((sum, s) => sum + s.curves.filter((t) => t.result === 'nok').length, 0)
  const last = current?.curves[current.curves.length - 1]
  const [lastX, lastY] = last ? endOf(last.points) : [0, 0]
  const failed = current?.curves.filter((t) => t.result === 'nok').at(-1)
  const nokHere = current ? current.curves.filter((t) => t.result === 'nok').length : 0
  const noFigures = loading || !!error || !current
  const figure = (value: ReactNode, skeleton: string) => (loading ? <Skeleton className={skeleton} /> : noFigures ? <span className="text-fg-subtle">—</span> : value)
  // The chart's room: the same shape it draws in, so the card keeps its size.
  const frame = 'aspect-[320/172] w-full'

  const card = (
    <Card data-slot="curve-window" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{figure(copy.subtitle(current?.curves.length ?? 0), 'h-4 w-40')}</CardDescription>
        <CardAction>
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          {loading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            !noFigures && (
              <Badge variant={nok ? 'danger' : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
                {nok ? copy.nokCount(nok) : copy.allOk}
              </Badge>
            )
          )}
        </CardAction>
      </CardHeader>

      <div className="flex flex-col gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {loading ? (
          <Skeleton className="h-control w-full" />
        ) : (
          <SegmentedControl
            variant="pill"
            aria-label={copy.seriesLabel}
            value={current?.id}
            onValueChange={(id) => {
              setValueId(id)
              onValueChange?.(id)
            }}
          >
            {series.map((s) => (
              <SegmentedControlItem key={s.id} value={s.id} className="flex-1">
                {s.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-4xl leading-[1.1] font-semibold tracking-tight">{figure(axes.y.format ? axes.y.format(lastY) : one.format(lastY), 'h-10 w-20')}</span>
            {!noFigures && <span className="text-ui text-fg-muted">{[axes.y.format ? '' : axes.y.unit, copy.at(textX(lastX))].filter(Boolean).join(' ')}</span>}
          </span>
          {!noFigures && last && (
            <Badge variant={last.result === 'ok' ? 'success' : 'danger'} className="font-sans text-ui tracking-normal normal-case">
              {last.result === 'ok' ? copy.ok : copy.nok}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className={cn(frame, 'relative')}>
            <span className="sr-only">{copy.loadingLabel}</span>
            <svg aria-hidden viewBox="0 0 320 172" className="absolute inset-0 size-full overflow-visible">
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={34} x2={312} y1={10 + i * (140 / 3)} y2={10 + i * (140 / 3)} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" className="stroke-line-strong" />
              ))}
            </svg>
            <Skeleton className="absolute inset-x-[10.6%] top-[34%] h-[26%]" />
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
        ) : !current ? (
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
          <Chart
            series={current}
            failed={failed}
            copy={copy}
            axes={{ minX, maxX, minY, maxY, stepX, stepY }}
            text={{ tickX: (v) => textX(v), tickY: (v) => (axes.y.format ? axes.y.format(v) : String(v)), y: textY }}
            label={copy.chartLabel(current.label, current.curves.length, nokHere, copy.window(range(axes.x, current.window.xFrom, current.window.xTo), range(axes.y, current.window.yFrom, current.window.yTo)), axes.y.label, axes.x.label)}
          />
        )}

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-px w-3.5 bg-fg-subtle" />
            {copy.keyOk}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3.5 bg-accent" />
            {copy.keyLast}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3.5 bg-danger" />
            {copy.keyNok}
          </li>
          <li className="flex items-center gap-1.5">
            <svg aria-hidden width={14} height={9} viewBox="0 0 14 9">
              <rect x={0.5} y={0.5} width={13} height={8} fill="var(--color-success-subtle)" stroke="var(--color-success)" strokeDasharray="2 2" />
            </svg>
            {copy.keyWindow}
          </li>
        </ul>

        <ul aria-label={copy.traceList} className="sr-only">
          {(noFigures ? [] : current?.curves)?.map((c: CurveWindowTrace) => {
            const [x, y] = endOf(c.points)
            return <li key={c.id}>{copy.trace(c.id, c.result === 'ok' ? copy.ok : copy.nok, textY(y), textX(x), c.note ?? '')}</li>
          })}
        </ul>
      </div>
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

export { CurveWindow, type CurveWindowProps }
export type { CurveWindowAxes, CurveWindowCopy, CurveWindowResult, CurveWindowSeries, CurveWindowTrace }
