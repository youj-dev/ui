'use client'

import { memo, useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react'
import { WEEK_DAYS, weekdayOf, type Cell } from './data'

/* The terrain's days for the keyboard and assistive tech: a visually hidden
 * grid, a row per day of the week (Monday first, as a calendar reads, though
 * the drawing stands the weekend at the back) and a cell per week, each
 * reading spoken with its row and column headers. It is what focus moves
 * through: the selected day is the grid's one tab stop, and the arrow keys
 * move the selection (Home and End to the first and last week, with Ctrl to
 * the grid's corners), so the drawing, the readout and the tooltip follow.
 * The ring shows on the drawing around it. */

export type FocusKind = 'none' | 'pointer' | 'keyboard'

interface TerrainGridProps {
  label: string
  /** How many weeks the grid spans. */
  weeks: number
  /** Monday to Sunday, as spoken: "Monday". */
  weekdays: string[]
  cornerHeader: string
  /** A week's header: "Week of Apr 13". */
  columnName: (col: number) => string
  /** A day's cell, as spoken: "1,305 load, 3 sessions". */
  reading: (cell: Cell) => string
  selected: Cell
  onSelect: (cell: Cell) => void
  onFocusChange: (focus: FocusKind) => void
  /** Bumped when a pointer picks a cell: focus follows it into the grid, so the arrow keys carry on from there. */
  focusSignal: number
}

const keyboardFocus = (el: Element) => {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

/** A day of the week (0 for Monday) and the terrain's row for it are the same count from opposite ends. */
const rowOf = weekdayOf

function TerrainGridImpl({ label, weeks, weekdays, cornerHeader, columnName, reading, selected, onSelect, onFocusChange, focusSignal }: TerrainGridProps) {
  const grid = useRef<HTMLDivElement>(null)
  // Focus a pointer sent in is the pointer's: no ring until a key is pressed.
  const fromPointer = useRef(false)

  useEffect(() => {
    if (!focusSignal) return
    fromPointer.current = true
    grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true })
    fromPointer.current = false
  }, [focusSignal])

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    let day = weekdayOf(selected.row)
    let col = selected.col
    switch (event.key) {
      case 'ArrowRight':
        col = Math.min(weeks - 1, col + 1)
        break
      case 'ArrowLeft':
        col = Math.max(0, col - 1)
        break
      case 'ArrowDown':
        day = Math.min(WEEK_DAYS - 1, day + 1)
        break
      case 'ArrowUp':
        day = Math.max(0, day - 1)
        break
      case 'Home':
        col = 0
        if (event.ctrlKey || event.metaKey) day = 0
        break
      case 'End':
        col = weeks - 1
        if (event.ctrlKey || event.metaKey) day = WEEK_DAYS - 1
        break
      default:
        return
    }
    event.preventDefault()
    onFocusChange('keyboard')
    const row = rowOf(day)
    if (row === selected.row && col === selected.col) return
    onSelect({ row, col })
    event.currentTarget.querySelector<HTMLElement>(`[data-cell="${row}-${col}"]`)?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={grid}
      role="grid"
      aria-label={label}
      data-slot="terrain-grid"
      // Laid out on its own: a new measure rewrites every cell without the page reflowing around it.
      className="sr-only contain-strict"
      onKeyDown={move}
      onFocus={(event: FocusEvent<HTMLDivElement>) => onFocusChange(!fromPointer.current && keyboardFocus(event.target) ? 'keyboard' : 'pointer')}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFocusChange('none')
      }}
    >
      <div role="row">
        <span role="columnheader">{cornerHeader}</span>
        {Array.from({ length: weeks }, (_, col) => (
          <span key={col} role="columnheader">
            {columnName(col)}
          </span>
        ))}
      </div>
      {weekdays.map((name, day) => {
        const row = rowOf(day)
        return <GridRow key={name} name={name} row={row} weeks={weeks} selectedCol={row === selected.row ? selected.col : -1} reading={reading} />
      })}
    </div>
  )
}

/** A day of the week across the weeks. Only the rows the selection leaves or enters re-render as it moves. */
const GridRow = memo(function GridRow({ name, row, weeks, selectedCol, reading }: { name: string; row: number; weeks: number; selectedCol: number; reading: (cell: Cell) => string }) {
  return (
    <div role="row">
      <span role="rowheader">{name}</span>
      {Array.from({ length: weeks }, (_, col) => (
        <span key={col} role="gridcell" data-cell={`${row}-${col}`} tabIndex={col === selectedCol ? 0 : -1} aria-selected={col === selectedCol}>
          {reading({ row, col })}
        </span>
      ))}
    </div>
  )
})

/** Re-renders only when the selection or the readings change, never on hover. */
export const TerrainGrid = memo(TerrainGridImpl)
