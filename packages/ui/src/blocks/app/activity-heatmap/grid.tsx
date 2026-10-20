'use client'

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/* The grid: a row per weekday, a column per week (or per hour), every
 * cell a step of one chart colour. It's a keyboard grid with one tab stop:
 * the arrow keys move a day or a week (an hour), Home and End go along the
 * row, Ctrl+Home and Ctrl+End to the first and last cell, Page Up and Page
 * Down four columns; each cell is named with its date and value, and Enter
 * picks a day when the app listens. One tip, over the cell pointed at or
 * focused, glides from cell to cell rather than popping per cell. A step
 * picked in the legend lights its cells and steps the rest back. The first
 * time it is seen the cells sweep in, oldest to newest; reduced motion
 * shows them at once. Time reads left to right in either direction of
 * text. */

export interface GridCell {
  key: string
  level: number
  /** The cell for assistive tech: when, and its value. */
  label: string
  /** The tip's two lines. */
  when: string
  value: string
  today?: boolean
}

export interface GridHead {
  key: string
  label: string
  span: number
}

export interface GridRow {
  key: string
  short: string
  full: string
  /** Its name shows (every other weekday); the rest are for assistive tech. */
  shown: boolean
}

export interface Place {
  row: number
  col: number
}

interface GridProps {
  label: string
  summaryId: string
  head: GridHead[]
  rows: GridRow[]
  /** By row, then column; null where there's no day yet. */
  cells: (GridCell | null)[][]
  /** The hours' cells take the room across; days are square. */
  wide: boolean
  /** Where the keyboard starts: today, or the busiest hour. */
  start: Place
  fill: (level: number) => string
  /** The step lit by the legend; the rest step back. */
  lit: number | null
  onPick?: (place: Place) => void
}

interface Tip extends Place {
  x: number
  y: number
  align: 'start' | 'center' | 'end'
  shown: boolean
  /** Appearing: it lands on its cell instead of gliding from the last one. */
  instant: boolean
}

const ALIGN = { start: '-0.75rem', center: '-50%', end: 'calc(-100% + 0.75rem)' }

function Grid({ label, summaryId, head, rows, cells, wide, start, fill, lit, onPick }: GridProps) {
  const k = useYouj()
  const wrap = useRef<HTMLDivElement>(null)
  const table = useRef<HTMLTableElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  // Narrower than the year, it scrolls: the newest week starts in view.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [])
  const inView = useInView(table, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [chosen, setCursor] = useState<Place>(start)
  const [tip, setTip] = useState<Tip | null>(null)
  const columns = cells[0]?.length ?? 0
  // The sweep: a column a step, a little later down each column, then every later change on the fast token.
  const step = Math.min(14, k.ms('deliberate') / Math.max(1, columns))
  const [settled, setSettled] = useState(k.reduced)
  useEffect(() => {
    if (!shown || settled) return
    const done = setTimeout(() => setSettled(true), k.ms('slow') + step * (columns + 3))
    return () => clearTimeout(done)
  }, [shown, settled, k, step, columns])

  const valid = (p: Place) => cells[p.row]?.[p.col] != null
  const cursor = valid(chosen) ? chosen : start
  const lastIn = (row: number) => {
    for (let c = columns - 1; c >= 0; c--) if (valid({ row, col: c })) return c
    return 0
  }
  /** The newest cell: the last column's last day so far. */
  const last = (): Place => {
    for (let c = columns - 1; c >= 0; c--) for (let r = rows.length - 1; r >= 0; r--) if (valid({ row: r, col: c })) return { row: r, col: c }
    return { row: 0, col: 0 }
  }
  const show = (place: Place, cell: HTMLElement) => {
    const box = wrap.current?.getBoundingClientRect()
    const r = cell.getBoundingClientRect()
    if (!box) return
    const x = r.left - box.left + r.width / 2
    const align = x < box.width * 0.18 ? 'start' : x > box.width * 0.82 ? 'end' : 'center'
    setTip((prev) => ({ ...place, x, y: r.top - box.top, align, shown: true, instant: !prev?.shown }))
  }
  const hide = () => setTip((prev) => (prev ? { ...prev, shown: false } : prev))
  const go = (place: Place) => {
    setCursor(place)
    const cell = table.current?.querySelector<HTMLElement>(`[data-yj-cell="${place.row}-${place.col}"]`)
    if (!cell) return
    cell.focus()
    show(place, cell)
  }
  const keys = (event: KeyboardEvent) => {
    const { row, col } = cursor
    const far = event.ctrlKey || event.metaKey
    const to: Record<string, Place | undefined> = {
      ArrowRight: { row, col: col + 1 },
      ArrowLeft: { row, col: col - 1 },
      ArrowDown: { row: row + 1, col },
      ArrowUp: { row: row - 1, col },
      Home: far ? { row: 0, col: 0 } : { row, col: 0 },
      End: far ? last() : { row, col: lastIn(row) },
      PageUp: { row, col: Math.max(0, col - 4) },
      PageDown: { row, col: Math.min(lastIn(row), col + 4) },
    }
    if (event.key === 'Escape') return hide()
    if ((event.key === 'Enter' || event.key === ' ') && onPick) {
      event.preventDefault()
      return onPick(cursor)
    }
    if (!(event.key in to)) return
    event.preventDefault()
    const next = to[event.key]!
    if (valid(next)) go(next)
  }

  const head0 = 'h-5 p-0 pb-1 text-start align-bottom text-ui-xs font-normal whitespace-nowrap text-fg-muted'
  return (
    <div ref={wrap} dir="ltr" className="relative flex">
      {/* The weekdays, beside the grid rather than in it, so they stay put while a narrow grid scrolls. */}
      <div aria-hidden className="w-(--label) shrink-0 pt-0.5 text-ui-xs leading-none text-fg-muted">
        <div className="h-5" />
        {rows.map((r) => (
          <div key={r.key} className="flex h-[calc(var(--cell)+var(--gap))] items-center whitespace-nowrap">
            {r.shown ? r.short : ''}
          </div>
        ))}
      </div>
      <div ref={scroller} className="-me-1 min-w-0 flex-1 overflow-x-auto pe-1 pt-0.5 pb-1 yj-scrollbar" onScroll={hide}>
        <table
          ref={table}
          role="grid"
          aria-label={label}
          aria-describedby={summaryId}
          aria-readonly
          data-slot="activity-heatmap-grid"
          className="border-collapse"
          onKeyDown={keys}
          onPointerLeave={hide}
        >
          <thead>
            <tr>
              {head.map((h) =>
                h.span > 1 ? (
                  <th key={h.key} scope="colgroup" colSpan={h.span} className={cn(head0, 'overflow-hidden')}>
                    {h.label}
                  </th>
                ) : (
                  <td key={h.key} className={cn(head0, 'overflow-hidden')} />
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, row) => (
              <tr key={r.key}>
                <th scope="row" abbr={r.full} className="sr-only">
                  {r.short}
                </th>
                {cells[row]!.map((cell, col) => {
                  if (!cell) return <td key={col} className="p-0" />
                  const here = cursor.row === row && cursor.col === col
                  const active = tip?.shown && tip.row === row && tip.col === col
                  const back = lit !== null && cell.level !== lit
                  return (
                    <td
                      key={cell.key}
                      role="gridcell"
                      data-yj-cell={`${row}-${col}`}
                      data-yj-level={cell.level}
                      data-yj-today={cell.today || undefined}
                      data-active={active ? '' : undefined}
                      tabIndex={here ? 0 : -1}
                      aria-label={cell.label}
                      className={cn('rounded-xs p-[calc(var(--gap)/2)] outline-hidden focus-ring', onPick && 'cursor-pointer')}
                      onPointerEnter={(e) => show({ row, col }, e.currentTarget)}
                      onPointerDown={(e) => show({ row, col }, e.currentTarget)}
                      onFocus={(e) => {
                        setCursor({ row, col })
                        show({ row, col }, e.currentTarget)
                      }}
                      onClick={onPick ? () => onPick({ row, col }) : undefined}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'relative block h-(--cell) rounded-xs transition-[opacity,scale,box-shadow]',
                          wide ? 'w-(--wide)' : 'w-(--cell)',
                          shown && !settled ? 'ease-enter yj-duration-slow' : 'ease-standard yj-duration-fast',
                          cell.today && 'ring-[1.5px] ring-fg-muted ring-inset',
                          active && 'z-10 ring-[1.5px] ring-fg ring-inset',
                          active && !k.reduced && 'scale-125',
                        )}
                        style={{
                          backgroundColor: fill(cell.level),
                          opacity: !shown ? 0 : back ? 0.18 : 1,
                          scale: shown ? undefined : '0.4',
                          transitionDelay: shown && !settled && !k.reduced ? `${Math.round((col + row * 0.4) * step)}ms` : undefined,
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tip && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute start-0 top-0 z-20 ease-standard yj-duration-fast',
            tip.instant ? 'transition-none' : 'transition-[translate]',
          )}
          style={{ translate: `${tip.x}px ${tip.y}px` }}
        >
          <div
            data-slot="activity-heatmap-tip"
            data-yj-tone="overlay"
            className={cn(
              'absolute bottom-1.5 flex flex-col gap-0.5 rounded-md border border-line bg-overlay px-2 py-1.5 text-ui-xs whitespace-nowrap text-fg shadow-md transition-opacity ease-standard yj-duration-fast',
              !tip.shown && 'opacity-0',
            )}
            style={{ translate: `${ALIGN[tip.align]} 0` }}
          >
            {(() => {
              const cell = cells[tip.row]?.[tip.col]
              return cell ? (
                <>
                  <span className="text-fg-muted">{cell.when}</span>
                  <span className="font-medium tabular-nums">{cell.value}</span>
                </>
              ) : null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export { Grid }
