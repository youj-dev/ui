'use client'

import { useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { cellBarLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, cssVars, numberFormat, toneColor } from '../../lib/utils'
import { Hatch } from './hatched-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* A total built from its periods: one cell per month (or quarter, or sprint),
 * each as wide as its amount, so the bar's length is the total and its
 * rhythm is how it grew. Settled cells are solid in the tone; projected ones
 * are hatched in it. Bars that compare share a scale (`max`), and a `target`
 * (a plan, a budget) is a dashed tick through the bar on the same scale.
 * - Captions: `captions` writes each cell's label and amount under it, for a
 *   few wide cells (quarters); narrow ones show theirs on hover and focus.
 * - Keyboard: one tab stop. The arrow keys walk the cells (mirrored in RTL),
 *   Home and End go to the ends; focus or hover shows the cell's tooltip.
 * - Semantics: a named group described by the total, the projected part and
 *   the target; the cells are a list, each read with its label, amount and
 *   whether it is projected.
 * - Motion: the cells open from the inline start on the smooth spring when
 *   the bar scrolls into view (a clip, so they never stretch), and a new
 *   amount reflows the cells on the slow token.
 * - Reduced motion: drawn at its values; changes land at once. */

type CellBarTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface CellBarCell {
  /** The period: "Mar", "Q3". */
  label: string
  value: number
  /** A forecast rather than an actual: drawn hatched. */
  projected?: boolean
}

interface CellBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  cells: readonly CellBarCell[]
  /** The scale's end, the same for bars that compare. Default: the cells' total (or the target, if larger). */
  max?: number
  /** A plan or budget on the same scale: a dashed tick through the bar. */
  target?: number
  /** Written over the target's tick: "Plan". */
  targetLabel?: string
  /** The cells' color. Default 'accent'. */
  tone?: CellBarTone
  /** Each cell's label and amount under it, for a few wide cells. Default false. */
  captions?: boolean
  /** Writes an amount: "$1,240". Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Cell bar". */
  label?: string
}

function CellBar({
  cells,
  max: maxProp,
  target,
  targetLabel,
  tone = 'accent',
  captions = false,
  formatValue,
  locale: localeProp,
  label,
  className,
  style,
  ...props
}: CellBarProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(cellBarLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.5 })
  const [focus, setFocus] = useState(0)
  const [handle] = useState(() => TooltipPrimitive.createHandle<number>())

  const format = formatValue ?? numberFormat(locale).format
  const amount = (cell: CellBarCell) => Math.max(0, cell.value)
  const total = cells.reduce((sum, cell) => sum + amount(cell), 0)
  const projected = cells.reduce((sum, cell) => sum + (cell.projected ? amount(cell) : 0), 0)
  const scale = maxProp ?? Math.max(total, target ?? 0)
  const at = (v: number) => `${scale > 0 ? Math.min(100, (Math.max(0, v) / scale) * 100) : 0}%`
  const ink = toneColor(tone)
  const shown = k.reduced || inView
  const stop = Math.min(focus, Math.max(0, cells.length - 1))
  const summary = [labels.cellBarSummary(format(total)), projected > 0 && labels.cellBarProjected(format(projected)), target !== undefined && labels.cellBarTarget(format(target))]
    .filter(Boolean)
    .join(' ')

  const move = (i: number) => {
    setFocus(i)
    cellRefs.current[i]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const last = cells.length - 1
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward || event.key === 'ArrowDown') move(Math.min(last, stop + 1))
    else if (event.key === back || event.key === 'ArrowUp') move(Math.max(0, stop - 1))
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(last)
    else return
    event.preventDefault()
  }

  return (
    <>
      <div
        ref={rootRef}
        role="group"
        aria-label={label ?? labels.cellBar}
        aria-describedby={`${id}-summary`}
        data-slot="cell-bar"
        data-tone={tone}
        className={cn('own:flex w-full min-w-12 flex-col own:gap-1.5', target !== undefined && targetLabel && 'own:pt-5', className)}
        style={{ '--cell-bar-tone': ink, ...style } as CSSProperties}
        {...props}
      >
        <div data-slot="cell-bar-track" className="relative own:h-3.5">
          <MotionFeatures>
            <m.span
              role="list"
              aria-label={label ?? labels.cellBar}
              data-slot="cell-bar-cells"
              className={cn(
                'absolute inset-y-0 start-0 own:flex own:gap-0.5',
                !k.reduced && 'transition-[width] yj-duration-slow ease-standard',
                '[clip-path:inset(0_calc(100%_-_var(--cell-bar-shown)*100%)_0_0)] rtl:[clip-path:inset(0_0_0_calc(100%_-_var(--cell-bar-shown)*100%))]',
              )}
              style={{ width: at(total) }}
              initial={cssVars({ '--cell-bar-shown': k.reduced ? 1 : 0 })}
              animate={cssVars({ '--cell-bar-shown': shown ? 1 : 0 })}
              transition={k.reduced ? { type: false } : k.spring('smooth')}
            >
              {cells.map((cell, i) => (
                <TooltipTrigger
                  key={`${cell.label}-${i}`}
                  handle={handle}
                  payload={i}
                  delay={0}
                  closeDelay={0}
                  render={
                    <span
                      ref={(el: HTMLSpanElement | null) => {
                        cellRefs.current[i] = el
                      }}
                      role="listitem"
                      tabIndex={i === stop ? 0 : -1}
                      aria-label={labels.cellBarItem(cell.label, format(amount(cell)), Boolean(cell.projected))}
                      data-slot="cell-bar-cell"
                      data-yj-projected={cell.projected || undefined}
                      onFocus={() => setFocus(i)}
                      onKeyDown={onKeyDown}
                      className={cn(
                        'relative own:min-w-0.5 own:rounded-[2px] outline-none focus-ring',
                        !k.reduced && 'transition-[flex-grow] yj-duration-slow ease-standard',
                        !cell.projected && 'own:bg-(--cell-bar-tone)',
                      )}
                      style={{ flex: `${amount(cell)} 1 0%` }}
                    />
                  }
                >
                  {cell.projected && <Hatch tone={tone} className="absolute inset-0" />}
                </TooltipTrigger>
              ))}
            </m.span>
          </MotionFeatures>
          {target !== undefined && scale > 0 && (
            <span aria-hidden data-slot="cell-bar-target" className="pointer-events-none absolute own:-inset-y-1 w-0 border-s border-dashed border-fg-muted" style={{ insetInlineStart: at(target) }}>
              {targetLabel && (
                <span
                  data-slot="cell-bar-target-label"
                  className="absolute bottom-full own:mb-0.5 -translate-x-1/2 own:font-mono own:text-ui-xs whitespace-nowrap own:text-fg-muted rtl:translate-x-1/2"
                >
                  {targetLabel}
                </span>
              )}
            </span>
          )}
        </div>
        {captions && (
          <div aria-hidden data-slot="cell-bar-captions" className="own:flex own:gap-0.5" style={{ width: at(total) }}>
            {cells.map((cell, i) => (
              <span
                key={`${cell.label}-${i}`}
                data-slot="cell-bar-caption"
                className="own:flex min-w-0 flex-col own:font-mono own:text-ui-xs own:leading-tight own:tabular-nums"
                style={{ flex: `${amount(cell)} 1 0%` }}
              >
                <span className="truncate own:text-fg-muted">{cell.label}</span>
                <span className="truncate own:text-fg">{format(amount(cell))}</span>
              </span>
            ))}
          </div>
        )}
        <p id={`${id}-summary`} data-slot="cell-bar-summary" className="sr-only">
          {summary}
        </p>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const cell = typeof payload === 'number' ? cells[payload] : undefined
          if (!cell) return null
          return (
            <TooltipContent>
              <span aria-hidden className={cn('own:size-2 own:rounded-xs', cell.projected && 'opacity-50')} style={{ background: ink }} />
              <span className="own:tabular-nums">{labels.cellBarItem(cell.label, format(amount(cell)), Boolean(cell.projected))}</span>
            </TooltipContent>
          )
        }}
      </Tooltip>
    </>
  )
}

export { CellBar, type CellBarCell, type CellBarProps, type CellBarTone }
