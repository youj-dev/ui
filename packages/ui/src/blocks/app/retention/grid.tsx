'use client'

import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn, numberFormat } from '../../../lib/utils'
import type { Cohort, Granularity, Measure, RetentionCopy } from './data'

/* The cohort triangle: a row per cohort (its start and size), a column per
 * period since, and the share still active in each cell as a wash of the
 * first chart colour, mixed into the surface (never so strong that the
 * figure loses its contrast on a light chart colour in dark mode). The
 * average row leads, weighted by size. A period still running is hatched and
 * set quieter. Pointing at a cell, or moving the grid's one tab stop with
 * the arrow keys (Home and End along a row, Ctrl+Home and Ctrl+End to the
 * corners), picks it: everything off its row and column steps back, and the
 * chart reads it. The washes sweep in corner to corner the first time the
 * grid is seen; reduced motion shows them at once. */

export interface Cell {
  row: number
  col: number
}

interface GridProps {
  cohorts: Cohort[]
  averages: (number | undefined)[]
  partial: boolean
  measure: Measure
  granularity: Granularity
  active: Cell | null
  onActiveChange: (cell: Cell | null) => void
  /** The keyboard's place, the grid's one tab stop. */
  cursor: Cell
  onCursorChange: (cell: Cell) => void
  dateOf: (iso: string) => string
  copy: RetentionCopy
  /** Its scroller's size: the block holds it still as the cohorts change. */
  className?: string
}

/** A share as a wash, against the highest share after the start: 6% to 45% of the first chart colour in the surface. */
const heat = (share: number, top: number) => `color-mix(in oklab, var(--color-chart-1) ${(6 + Math.min(1, Math.max(0, share / (top || 1))) * 39).toFixed(1)}%, var(--color-surface))`

function Grid({ cohorts, averages, partial, measure, granularity, active, onActiveChange, cursor, onCursorChange, dateOf, copy, className }: GridProps) {
  const k = useYouj()
  const ref = useRef<HTMLTableElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const step = k.ms('fast') * 0.18
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const number = numberFormat(copy.locale)
  const columns = Array.from({ length: Math.max(0, ...cohorts.map((c) => c.active.length)) }, (_, i) => i)
  const total = cohorts.reduce((t, c) => t + c.size, 0)
  // Period 0 is everyone, so the ramp spans the shares after it: the washes tell cohorts apart.
  const top = Math.max(0, ...cohorts.flatMap((c) => c.active.slice(1).map((a) => (c.size ? a / c.size : 0))))

  const lastCol = (row: number) => (cohorts[row]?.active.length ?? 1) - 1
  const move = (cell: Cell) => {
    onCursorChange(cell)
    onActiveChange(cell)
    ref.current?.querySelector<HTMLElement>(`[data-yj-cell="${cell.row}-${cell.col}"]`)?.focus()
  }
  const keys = (event: KeyboardEvent) => {
    const { row, col } = cursor
    const last = cohorts.length - 1
    const to: Record<string, Cell | undefined> = {
      ArrowRight: col < lastCol(row) ? { row, col: col + 1 } : undefined,
      ArrowLeft: col > 0 ? { row, col: col - 1 } : undefined,
      ArrowDown: row < last ? { row: row + 1, col: Math.min(col, lastCol(row + 1)) } : undefined,
      ArrowUp: row > 0 ? { row: row - 1, col: Math.min(col, lastCol(row - 1)) } : undefined,
      Home: event.ctrlKey || event.metaKey ? { row: 0, col: 0 } : { row, col: 0 },
      End: event.ctrlKey || event.metaKey ? { row: last, col: lastCol(last) } : { row, col: lastCol(row) },
    }
    if (!(event.key in to)) return
    event.preventDefault()
    const next = to[event.key]
    if (next) move(next)
  }

  const value = (count: number, size: number) => (measure === 'percent' ? percent.format(size ? count / size : 0) : number.format(count))
  const lit = (row: number, col: number) => !active || active.row === row || active.col === col

  return (
    <div className={cn('-mx-1 overflow-x-auto px-1 pb-1 yj-scrollbar', className)}>
      <table
        ref={ref}
        role="grid"
        aria-label={copy.grid}
        data-slot="retention-grid"
        className="w-full border-separate border-spacing-0.5 text-ui-xs tabular-nums"
        onKeyDown={keys}
        onPointerLeave={() => onActiveChange(null)}
      >
        <thead>
          <tr>
            <th scope="col" className="pe-2 text-start font-medium text-fg-muted">
              {copy.cohort}
            </th>
            <th scope="col" className="pe-2 text-end font-medium text-fg-muted">
              {copy.people}
            </th>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                abbr={copy.period[granularity](col)}
                className={cn('min-w-11 px-1 py-1 text-center font-medium transition-colors yj-duration-fast ease-standard', active?.col === col ? 'text-fg' : 'text-fg-muted')}
              >
                {copy.periodShort[granularity](col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr data-slot="retention-average">
            <th scope="row" className="pe-2 text-start font-semibold text-fg">
              {copy.average}
            </th>
            <td className="pe-2 text-end text-fg-muted">{number.format(Math.round(total / Math.max(1, cohorts.length)))}</td>
            {columns.map((col) => (
              <td key={col} className={cn('h-7 rounded-xs text-center font-semibold text-fg transition-opacity yj-duration-fast ease-standard', !lit(-1, col) && 'opacity-45')}>
                {averages[col] === undefined ? '' : percent.format(averages[col]!)}
              </td>
            ))}
          </tr>
          {cohorts.map((cohort, row) => (
            <tr key={cohort.id}>
              <th scope="row" className={cn('pe-2 text-start font-normal whitespace-nowrap transition-colors yj-duration-fast ease-standard', active?.row === row ? 'text-fg' : 'text-fg-muted')}>
                {dateOf(cohort.start)}
              </th>
              <td className="pe-2 text-end text-fg-muted">{number.format(cohort.size)}</td>
              {columns.map((col) => {
                if (col >= cohort.active.length) return <td key={col} />
                const count = cohort.active[col]!
                const share = cohort.size ? count / cohort.size : 0
                const running = partial && col > 0 && col === cohort.active.length - 1
                const here = cursor.row === row && cursor.col === col
                return (
                  <td
                    key={col}
                    data-yj-cell={`${row}-${col}`}
                    data-active={active?.row === row && active.col === col ? '' : undefined}
                    data-yj-partial={running || undefined}
                    tabIndex={here ? 0 : -1}
                    aria-label={copy.cell(dateOf(cohort.start), copy.period[granularity](col), percent.format(share), number.format(count), number.format(cohort.size), running)}
                    className={cn(
                      'relative h-7 rounded-xs text-center outline-hidden transition-opacity yj-duration-fast ease-standard focus-ring',
                      'data-active:ring-[1.5px] data-active:ring-fg data-active:ring-inset',
                      !lit(row, col) && 'opacity-45',
                    )}
                    onPointerEnter={() => onActiveChange({ row, col })}
                    onFocus={() => {
                      onCursorChange({ row, col })
                      onActiveChange({ row, col })
                    }}
                  >
                    <span
                      aria-hidden
                      className={cn('absolute inset-0 rounded-[inherit] transition-opacity ease-enter', col === 0 && 'bg-band', !k.reduced && 'yj-duration-slow')}
                      style={{ backgroundColor: col === 0 ? undefined : heat(share, top), opacity: shown ? 1 : 0, transitionDelay: shown && !k.reduced ? `${Math.round((row + col) * step)}ms` : undefined } as CSSProperties}
                    />
                    {running && (
                      <span aria-hidden className="absolute inset-0 rounded-[inherit] bg-[repeating-linear-gradient(135deg,var(--color-surface)_0_1.5px,transparent_1.5px_5px)]" />
                    )}
                    <span className={cn('relative', running || col === 0 ? 'text-fg-muted' : 'text-fg')}>{value(count, cohort.size)}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { Grid }
