'use client'

import { useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { lollipopChartLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, cssVars, numberFormat, toneColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* Many items on one value scale, each a dot on a stem from a baseline: how
 * far each SLO's budget is from spent, each team's score from par. Sorted,
 * it reads as a curve from the worst to the best, the stems below the
 * baseline in one direction and above in the other; each dot takes its
 * item's tone (a status, a chart color).
 * - Selection: one item can be picked (`value`): its column gets a band, its
 *   dot a ring, and a pill over the plot names it with its value, so a table
 *   beside the chart can follow it (and lead it).
 * - Keyboard: a listbox, one tab stop. The arrow keys walk the items
 *   (mirrored in RTL), Home and End go to the ends, Enter or Space picks;
 *   focus or hover shows the item's tooltip.
 * - Semantics: options named with their label and value, described by the
 *   count and the range; the axis and stems are decorative.
 * - Motion: when it scrolls into view the stems grow from the baseline and
 *   the dots ride them out on the smooth spring; the selection band glides
 *   on the base token. Reduced motion: drawn in place; changes land at once. */

type LollipopTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface LollipopDatum {
  id: string
  label: string
  value: number
  /** Default 'accent'. */
  tone?: LollipopTone
}

interface LollipopChartProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  data: readonly LollipopDatum[]
  /** Order the items by value, lowest first or highest first. Default: the data's order. */
  sort?: 'ascending' | 'descending'
  /** The picked item's id (controlled); `null` for none. */
  value?: string | null
  /** The item picked at first (uncontrolled). Default none. */
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** The value scale. Default: the data's range with the baseline, rounded out to the ticks. */
  domain?: readonly [number, number]
  /** Where the stems start. Default 0. */
  baseline?: number
  /** Values on the axis. Default: about five even steps across the domain. */
  ticks?: readonly number[]
  /** Writes a value in the tooltip, the pill and the spoken text. Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Writes an axis tick. Default: `formatValue`. */
  formatTick?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Lollipop chart". */
  label?: string
}

/** Even, round steps covering [lo, hi]: 1, 2, 2.5 or 5 times a power of ten. */
function niceTicks(lo: number, hi: number, count = 5) {
  const span = hi - lo || Math.abs(hi) || 1
  const raw = span / Math.max(1, count - 1)
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((n) => n * power).find((s) => s >= raw) ?? raw
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  return Array.from({ length: Math.round((end - start) / step) + 1 }, (_, i) => Math.round((start + i * step) * 1e9) / 1e9)
}

function LollipopChart({
  data,
  sort,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  domain: domainProp,
  baseline = 0,
  ticks: ticksProp,
  formatValue,
  formatTick,
  locale: localeProp,
  label,
  className,
  style,
  ...props
}: LollipopChartProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(lollipopChartLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const [selected, setSelected] = useControllableState(valueProp, defaultValue)
  const [focus, setFocus] = useState<number | null>(null)
  const [handle] = useState(() => TooltipPrimitive.createHandle<number>())

  const format = formatValue ?? numberFormat(locale).format
  const tick = formatTick ?? format
  const items = sort ? [...data].sort((a, b) => (sort === 'ascending' ? a.value - b.value : b.value - a.value)) : [...data]
  const values = items.map((d) => d.value)
  const ticks = ticksProp ?? (domainProp ? niceTicks(domainProp[0], domainProp[1]) : niceTicks(Math.min(baseline, ...values), Math.max(baseline, ...values)))
  const [lo, hi] = domainProp ?? [Math.min(...ticks), Math.max(...ticks)]
  const y = (v: number) => `${((hi - Math.min(hi, Math.max(lo, v))) / (hi - lo || 1)) * 100}%`
  const x = (i: number) => `${((i + 0.5) / items.length) * 100}%`
  const picked = items.findIndex((d) => d.id === selected)
  const stop = focus ?? (picked >= 0 ? picked : 0)
  const shown = k.reduced || inView

  const pick = (i: number) => {
    const next = items[i]?.id ?? null
    setSelected(next)
    onValueChange?.(next)
  }
  const move = (i: number) => {
    setFocus(i)
    optionRefs.current[i]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = items.length - 1
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward || event.key === 'ArrowDown') move(Math.min(last, stop + 1))
    else if (event.key === back || event.key === 'ArrowUp') move(Math.max(0, stop - 1))
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(last)
    else if (event.key === 'Enter' || event.key === ' ') pick(stop)
    else return
    event.preventDefault()
  }

  if (!items.length)
    return (
      <div data-slot="lollipop-chart" className={cn('own:grid h-64 place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted', className)} style={style} {...props}>
        {labels.noData}
      </div>
    )

  const at = picked >= 0 ? items[picked] : undefined
  const flagEdge = picked >= 0 ? (picked + 0.5) / items.length : 0.5

  return (
    <>
      <div
        ref={rootRef}
        data-slot="lollipop-chart"
        className={cn('own:grid h-64 min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] own:gap-x-3', className)}
        style={style}
        {...props}
      >
        {/* The pill over the plot: the picked item and its value. */}
        <div aria-hidden data-slot="lollipop-chart-flag-row" className="relative col-start-2 row-start-1 h-8">
          {at && (
            <span
              data-slot="lollipop-chart-flag"
              data-yj-tone="inverse"
              className={cn(
                'absolute top-0 own:flex max-w-full items-center own:gap-1.5 own:rounded-full bg-inverse own:px-2.5 own:py-1 own:text-ui-sm whitespace-nowrap own:text-fg own:shadow-sm',
                !k.reduced && 'transition-[inset-inline-start,translate] yj-duration-base ease-standard',
                flagEdge < 0.25 ? '' : flagEdge > 0.75 ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
              )}
              style={{ insetInlineStart: flagEdge < 0.25 ? '0%' : flagEdge > 0.75 ? '100%' : x(picked) }}
            >
              <span className="own:font-mono own:font-medium own:tabular-nums">{format(at.value)}</span>
              <span aria-hidden className="own:size-1 own:rounded-full bg-current opacity-50" />
              <span className="truncate">{at.label}</span>
            </span>
          )}
        </div>
        <div aria-hidden data-slot="lollipop-chart-axis" className="relative col-start-1 row-start-2 own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
          {/* The widest tick, unseen, gives the column its width. */}
          <span className="invisible own:block h-0 whitespace-nowrap">{ticks.map(tick).reduce((a, b) => (b.length > a.length ? b : a), '')}</span>
          {ticks.map((t) => (
            <span key={t} className="absolute end-0 -translate-y-1/2 whitespace-nowrap" style={{ top: y(t) }}>
              {tick(t)}
            </span>
          ))}
        </div>
        <MotionFeatures>
          <m.div
            role="listbox"
            aria-label={label ?? labels.lollipopChart}
            aria-describedby={`${id}-summary`}
            data-slot="lollipop-chart-plot"
            className="relative col-start-2 row-start-2"
            onKeyDown={onKeyDown}
            initial={cssVars({ '--lollipop-shown': k.reduced ? 1 : 0 })}
            animate={cssVars({ '--lollipop-shown': shown ? 1 : 0 })}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
          >
            {ticks.map((t) => (
              <span
                key={t}
                aria-hidden
                data-slot="lollipop-chart-grid"
                className={cn('absolute inset-x-0 border-t', t === baseline ? 'border-line-strong' : 'border-dashed border-line-subtle')}
                style={{ top: y(t) }}
              />
            ))}
            {!ticks.includes(baseline) && <span aria-hidden data-slot="lollipop-chart-baseline" className="absolute inset-x-0 border-t border-line-strong" style={{ top: y(baseline) }} />}
            {at && (
              <span
                aria-hidden
                data-slot="lollipop-chart-band"
                className={cn('absolute inset-y-0 own:w-5 -translate-x-1/2 own:rounded-full bg-band rtl:translate-x-1/2', !k.reduced && 'transition-[inset-inline-start] yj-duration-base ease-standard')}
                style={{ insetInlineStart: x(picked) }}
              />
            )}
            {items.map((d, i) => {
              const ink = toneColor(d.tone ?? 'accent', 'var(--color-fg-muted)')
              const isPicked = i === picked
              const top = y(d.value)
              const base = y(baseline)
              return (
                <TooltipTrigger
                  key={d.id}
                  handle={handle}
                  payload={i}
                  delay={0}
                  closeDelay={0}
                  render={
                    <div
                      ref={(el: HTMLDivElement | null) => {
                        optionRefs.current[i] = el
                      }}
                      role="option"
                      aria-selected={isPicked}
                      aria-label={labels.unitChartItem(d.label, format(d.value), false)}
                      tabIndex={i === stop ? 0 : -1}
                      data-slot="lollipop-chart-item"
                      data-state={isPicked ? 'selected' : undefined}
                      onFocus={() => setFocus(i)}
                      onClick={() => pick(i)}
                      className="absolute inset-y-0 -translate-x-1/2 cursor-pointer own:rounded-full outline-none focus-ring rtl:translate-x-1/2"
                      style={{ insetInlineStart: x(i), width: `max(${(1 / items.length) * 100}%, 12px)`, '--lollipop-ink': ink } as CSSProperties}
                    />
                  }
                >
                  <span
                    aria-hidden
                    data-slot="lollipop-chart-stem"
                    className="absolute start-1/2 w-0 border-s border-dashed border-fg-subtle"
                    style={{
                      top: `calc(${base} + (min(${top}, ${base}) - ${base}) * var(--lollipop-shown))`,
                      bottom: `calc(100% - ${base} - (max(${top}, ${base}) - ${base}) * var(--lollipop-shown))`,
                    }}
                  />
                  <span
                    aria-hidden
                    data-slot="lollipop-chart-dot"
                    className={cn(
                      'absolute start-1/2 -translate-x-1/2 -translate-y-1/2 own:rounded-full bg-(--lollipop-ink) rtl:translate-x-1/2',
                      !k.reduced && 'transition-[width,height,box-shadow] yj-duration-fast ease-standard',
                      isPicked ? 'own:size-3 shadow-[0_0_0_3px_var(--color-surface),0_0_0_4.5px_var(--lollipop-ink)]' : 'own:size-2',
                    )}
                    style={{ top: `calc(${base} + (${top} - ${base}) * var(--lollipop-shown))` }}
                  />
                </TooltipTrigger>
              )
            })}
          </m.div>
        </MotionFeatures>
        <p id={`${id}-summary`} data-slot="lollipop-chart-summary" className="sr-only">
          {labels.lollipopChartSummary(items.length, format(Math.min(...values)), format(Math.max(...values)))}
        </p>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const d = typeof payload === 'number' ? items[payload] : undefined
          if (!d) return null
          return (
            <TooltipContent>
              <span aria-hidden className="own:size-2 own:rounded-full" style={{ background: toneColor(d.tone ?? 'accent', 'var(--color-fg-muted)') }} />
              <span className="own:tabular-nums">{labels.unitChartItem(d.label, format(d.value), false)}</span>
            </TooltipContent>
          )
        }}
      </Tooltip>
    </>
  )
}


export { LollipopChart, type LollipopChartProps, type LollipopDatum, type LollipopTone }
