'use client'

import { useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useInView } from 'motion/react'
import { coverageMatrixLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, seriesColor } from '../../lib/utils'
import { Hatch } from './hatched-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* How well each thing is covered by each source: rows down the side, columns
 * across the top (their names standing up, over a swatch in their color),
 * and in every cell a well that fills from the bottom by how deep the
 * coverage goes, in its column's color. A cell with nothing is hatched, so a
 * gap reads at a glance; in the selected row the gaps turn to the danger
 * tone, which is the row a suggestion or an action is about.
 * - Selecting: a click on a row (its name or any cell) selects it; Enter or
 *   Space does the same from the keyboard (`value`/`onValueChange`).
 * - Keyboard: one tab stop, the ARIA grid pattern. The arrows move between
 *   the row names and the cells (mirrored in RTL), Home and End go to a
 *   row's ends; focus or hover shows the row, the column and the value.
 * - Semantics: a named grid, a row per row (`aria-selected` on the chosen
 *   one), its header the row's name and every cell named with its column and
 *   value; a summary (how many cells are covered of how many) describes it.
 *   The column names over the grid are decorative: each cell says its own.
 * - Motion: when it scrolls into view the fills rise from the bottom, row
 *   after row, over the slow token; a new value or selection eases on the
 *   fast token. Reduced motion: drawn in place; changes land at once. */

type CoverageMatrixTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface CoverageMatrixColumn {
  id: string
  /** Set upright over the column, and spoken with each of its cells. */
  label: string
  /** Default: its color in `config`, else the chart colors in order. */
  tone?: CoverageMatrixTone
}

interface CoverageMatrixRow {
  id: string
  label: string
  /** One value per column, in the order of `columns`: how deep the coverage goes. 0 or null is none. */
  values: readonly (number | null)[]
}

interface CoverageMatrixProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  rows: readonly CoverageMatrixRow[]
  columns: readonly CoverageMatrixColumn[]
  /** The value of a full cell. Default: the largest value. */
  max?: number
  /** The selected row's id, controlled; `null` for none. */
  value?: string | null
  /** The row selected at first. Default: none. */
  defaultValue?: string | null
  /** Called with the row's id when a row is selected. */
  onValueChange?: (id: string) => void
  /** Formats a covered cell's value in its tooltip and spoken name: "3 rules". Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** What a cell with nothing says, and the key's name for the hatch. Default: the labels' "None". */
  noneLabel?: string
  /** The key's name for a filled cell. Default: the labels' "Fill shows depth". */
  depthLabel?: string
  /** The key under the grid. Default true. */
  legend?: boolean
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name of the grid. Default: the labels' "Coverage matrix". */
  label?: string
  /** A ChartConfig shared with your other charts: a column whose id is a key takes its color, so one series matches across chart types. */
  config?: Readonly<Record<string, { color?: string }>>
}

/** A covered cell's fill never drops below this share, so the shallowest coverage still reads as some. */
const FLOOR = 0.18

function CoverageMatrix({
  rows,
  columns,
  max: maxProp,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  formatValue,
  noneLabel,
  depthLabel,
  legend = true,
  locale: localeProp,
  label,
  config,
  className,
  style,
  ...props
}: CoverageMatrixProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(coverageMatrixLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef(new Map<string, HTMLDivElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [selected, setSelected] = useControllableState<string | null>(valueProp, defaultValue)
  const [focus, setFocus] = useState<[number, number]>([0, 0])
  const [handle] = useState(() => TooltipPrimitive.createHandle<string>())

  const cols = columns.length
  const none = noneLabel ?? labels.coverageMatrixNone
  const format = formatValue ?? numberFormat(locale).format
  const valueOf = (row: CoverageMatrixRow, c: number) => Math.max(0, row.values[c] ?? 0)
  const top = maxProp ?? Math.max(0, ...rows.flatMap((row) => columns.map((_, c) => valueOf(row, c))))
  const covered = rows.reduce((sum, row) => sum + columns.filter((_, c) => valueOf(row, c) > 0).length, 0)
  const toneOf = (c: number) => seriesColor(columns[c]?.tone, config, columns[c]?.id ?? '', c, 'var(--color-fg-muted)')
  const spoken = (row: CoverageMatrixRow, c: number) => {
    const v = valueOf(row, c)
    return `${columns[c]?.label}: ${v > 0 ? format(v) : none}`
  }

  // Focus moves over a grid whose column -1 is the row names.
  const [fr, fc] = [Math.min(focus[0], rows.length - 1), Math.min(focus[1], cols - 1)]
  const keyOf = (r: number, c: number) => `${r}:${c}`
  const move = (r: number, c: number) => {
    setFocus([r, c])
    cellRefs.current.get(keyOf(r, c))?.focus()
  }
  const select = (r: number) => {
    const row = rows[r]
    if (!row) return
    setSelected(row.id)
    onValueChange?.(row.id)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) move(fr, Math.min(cols - 1, fc + 1))
    else if (event.key === back) move(fr, Math.max(-1, fc - 1))
    else if (event.key === 'ArrowDown') move(Math.min(rows.length - 1, fr + 1), fc)
    else if (event.key === 'ArrowUp') move(Math.max(0, fr - 1), fc)
    else if (event.key === 'Home') move(fr, -1)
    else if (event.key === 'End') move(fr, cols - 1)
    else if (event.key === 'Enter' || event.key === ' ') select(fr)
    else return
    event.preventDefault()
  }
  const register = (r: number, c: number) => (el: HTMLDivElement | null) => {
    if (el) cellRefs.current.set(keyOf(r, c), el)
    else cellRefs.current.delete(keyOf(r, c))
  }
  const template = { gridTemplateColumns: `minmax(0,1fr) repeat(${cols}, var(--coverage-matrix-cell))` } as CSSProperties

  if (rows.length === 0 || cols === 0)
    return (
      <div
        role="group"
        aria-label={label ?? labels.coverageMatrix}
        data-slot="coverage-matrix"
        className={cn('own:w-full', className)}
        style={style}
        {...props}
      >
        <div
          data-slot="coverage-matrix-empty"
          className="own:grid aspect-[3/2] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
        >
          {labels.noData}
        </div>
      </div>
    )

  return (
    <>
      <div
        ref={rootRef}
        data-slot="coverage-matrix"
        className={cn(
          // 32px cells, 24px in a container under 24rem so the row names keep their room on a phone.
          '@container own:flex w-full min-w-0 flex-col own:gap-3 [--coverage-matrix-cell:--spacing(8)]',
          className,
        )}
        style={style}
        {...props}
      >
        <div
          role="grid"
          aria-label={label ?? labels.coverageMatrix}
          aria-describedby={`${id}-summary`}
          data-slot="coverage-matrix-grid"
          onKeyDown={onKeyDown}
          className="own:flex flex-col own:gap-1 @max-sm:[--coverage-matrix-cell:--spacing(6)]"
        >
          <div aria-hidden data-slot="coverage-matrix-columns" className="own:grid own:gap-x-1.5 own:px-1.5" style={template}>
            <span />
            {columns.map((column, c) => (
              <span key={column.id} className="own:flex flex-col items-center justify-end own:gap-1.5">
                <span className="own:text-ui-sm own:text-fg-muted [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{column.label}</span>
                <span className="own:size-2 own:rounded-xs" style={{ background: toneOf(c) }} />
              </span>
            ))}
          </div>
          {rows.map((row, r) => {
            const isSelected = row.id === selected
            return (
              <div
                key={row.id}
                role="row"
                aria-selected={isSelected}
                data-slot="coverage-matrix-row"
                data-state={isSelected ? 'selected' : undefined}
                onClick={() => select(r)}
                className={cn(
                  'own:grid cursor-pointer items-center own:gap-x-1.5 own:rounded-md own:px-1.5 own:py-1 transition-colors yj-duration-fast ease-standard',
                  isSelected ? 'bg-selected' : 'hover:bg-hover',
                )}
                style={template}
              >
                <div
                  ref={register(r, -1)}
                  role="rowheader"
                  tabIndex={fr === r && fc === -1 ? 0 : -1}
                  onFocus={() => setFocus([r, -1])}
                  data-slot="coverage-matrix-label"
                  className={cn(
                    'own:line-clamp-2 min-w-0 own:rounded-xs own:text-ui own:leading-tight text-pretty outline-none focus-ring',
                    isSelected ? 'own:font-medium own:text-fg' : 'own:text-fg-muted',
                  )}
                >
                  {row.label}
                </div>
                {columns.map((column, c) => {
                  const v = valueOf(row, c)
                  const fill = v > 0 && top > 0 ? Math.max(FLOOR, Math.min(1, v / top)) : 0
                  const tone = toneOf(c)
                  return (
                    <TooltipTrigger
                      key={column.id}
                      handle={handle}
                      payload={keyOf(r, c)}
                      delay={0}
                      closeDelay={0}
                      render={
                        <div
                          ref={register(r, c)}
                          role="gridcell"
                          tabIndex={fr === r && fc === c ? 0 : -1}
                          aria-label={spoken(row, c)}
                          data-slot="coverage-matrix-cell"
                          data-state={v > 0 ? 'covered' : 'none'}
                          onFocus={() => setFocus([r, c])}
                          className={cn(
                            'relative aspect-square own:overflow-hidden own:rounded-md outline-none focus-ring',
                            v === 0 && cn('border border-dashed', isSelected ? 'border-danger-line' : 'border-line-strong'),
                          )}
                          style={
                            v > 0 ? { background: `color-mix(in oklab, ${tone} calc(14% + 8% * var(--yj-dark)), var(--color-surface))` } : undefined
                          }
                        >
                          {v > 0 ? (
                            <span
                              data-slot="coverage-matrix-fill"
                              className={cn(
                                'absolute inset-x-0 bottom-0 own:rounded-[inherit]',
                                !k.reduced && 'transition-[height] yj-duration-slow ease-emphasized',
                              )}
                              style={{
                                background: tone,
                                height: `${(shown ? fill : 0) * 100}%`,
                                transitionDelay: shown && !k.reduced ? `${Math.round((r / rows.length) * k.ms('base'))}ms` : undefined,
                              }}
                            />
                          ) : (
                            <Hatch tone={isSelected ? 'danger' : 'neutral'} className="size-full own:rounded-none" />
                          )}
                        </div>
                      }
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
        {legend && (
          <ul
            aria-hidden
            data-slot="coverage-matrix-legend"
            className="own:flex flex-wrap items-center own:gap-x-4 own:gap-y-1 own:text-ui-sm own:text-fg-muted"
          >
            <li className="own:flex items-center own:gap-1.5">
              <span className="relative size-3.5 overflow-hidden own:rounded-xs border border-dashed border-line-strong">
                <Hatch className="size-full own:rounded-none" />
              </span>
              {none}
            </li>
            <li className="own:flex items-center own:gap-1.5">
              <span className="relative size-3.5 overflow-hidden own:rounded-xs bg-band">
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-fg-muted" />
              </span>
              {depthLabel ?? labels.coverageMatrixDepth}
            </li>
          </ul>
        )}
        <p id={`${id}-summary`} data-slot="coverage-matrix-summary" className="sr-only">
          {labels.coverageMatrixSummary(covered, rows.length * cols)}
        </p>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          if (typeof payload !== 'string') return null
          const [r, c] = payload.split(':').map(Number) as [number, number]
          const row = rows[r]
          if (!row) return null
          const v = valueOf(row, c)
          return (
            <TooltipContent data-slot="coverage-matrix-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
              <span>{row.label}</span>
              <span className="own:flex items-center gap-1.5 own:font-normal opacity-75">
                <span aria-hidden className="own:size-2 own:rounded-xs" style={{ background: toneOf(c) }} />
                {columns[c]?.label} · <span className="own:tabular-nums">{v > 0 ? format(v) : none}</span>
              </span>
            </TooltipContent>
          )
        }}
      </Tooltip>
    </>
  )
}

export { CoverageMatrix, type CoverageMatrixColumn, type CoverageMatrixProps, type CoverageMatrixRow, type CoverageMatrixTone }
