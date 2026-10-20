'use client'

import { useCallback, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { Cell } from './data'
import { FLOOR_HEIGHT, MARGIN, SLAB, TALL, frameOf, project, shareOf, type Frame } from './geometry'
import { TerrainGrid, type FocusKind } from './grid'
import { useTerrain } from './use-terrain'

/* The drawing: a canvas of columns on an isometric floor, with its axes in
 * HTML over it (the days along the right edge, the months along the left,
 * the looked-at day and week in ink), a tooltip over the looked-at column,
 * and the grid that keyboard and screen-reader users move through. Anything
 * over the canvas is placed in percentages of the drawing's frame, so it
 * keeps its place at any width without measuring, and the axes thin out as
 * the drawing narrows (container queries). Time reads left to right in
 * either direction of text. */

interface TerrainProps {
  /** Readings: rows (the back first) × weeks. */
  rows: number[][]
  /** The highest any column reaches in any view (geometry's `reachOf`): the drawing's top. */
  reach: number
  /** The ramp's color, a token reference. */
  tone: string
  /** Every tone it may switch to, prepared ahead. */
  tones?: readonly string[]
  selected: Cell
  hovered: Cell | null
  onHover: (cell: Cell | null) => void
  onSelect: (cell: Cell) => void
  /** Each row's short label, the back first: "SUN". */
  rowTicks: string[]
  /** A week's label on the axis: a month where one begins (`major`), else its date, shown while it's looked at. */
  columnTick: (col: number) => { label: string; major: boolean }
  /** The tooltip's text for a cell. */
  tip: (cell: Cell) => ReactNode
  grid: {
    label: string
    weekdays: string[]
    cornerHeader: string
    columnName: (col: number) => string
    reading: (cell: Cell) => string
  }
}

/** An axis label; its ink and its room (below) are the only classes that change, and never conflict. Only its opacity fades. */
const LABEL = 'absolute transition-opacity yj-duration-fast ease-standard'
const ink = (lit: boolean) => (lit ? 'text-fg' : 'text-fg-muted')
/** When an axis label shows, by the drawing's width: always, from 23rem, from 46rem, never. */
const SHOWN = 'opacity-100'
const MID = 'opacity-0 @min-[23rem]:opacity-100'
const WIDE = 'opacity-0 @min-[46rem]:opacity-100'
const HIDDEN = 'opacity-0'

const place = (frame: Frame, point: readonly [number, number]): CSSProperties => {
  const { left, top } = shareOf(frame, point)
  return { left: `${left}%`, top: `${top}%` }
}

export function Terrain({ rows, reach, tone, tones, selected, hovered, onHover, onSelect, rowTicks, columnTick, tip, grid }: TerrainProps) {
  const cols = rows[0]?.length ?? 0
  const frame = useMemo(() => frameOf(rows.length, cols, reach), [rows.length, cols, reach])
  const tipId = useId()
  const [focus, setFocus] = useState<FocusKind>('none')
  const [picks, setPicks] = useState(0)
  // Escape puts the tooltip away until the next cell.
  const [dismissed, setDismissed] = useState<string | null>(null)

  const peak = useMemo(() => Math.max(0, ...rows.flat()), [rows])
  const shares = useMemo(() => {
    const out = new Float32Array(rows.length * cols)
    rows.forEach((line, r) => line.forEach((v, c) => (out[r * cols + c] = peak > 0 ? v / peak : 0)))
    return out
  }, [rows, cols, peak])

  const active = hovered ?? selected
  const looking = hovered !== null || focus === 'keyboard'
  const pick = (cell: Cell) => {
    onSelect(cell)
    setPicks((n) => n + 1)
  }
  const { host, canvas, handlers, forget } = useTerrain({ frame, shares, tone, tones, active, pinned: selected, looking, onHover, onPick: pick })
  // A key moves the selection past a resting pointer's hover.
  const keyed = useCallback(
    (cell: Cell) => {
      forget()
      onHover(null)
      onSelect(cell)
    },
    [forget, onHover, onSelect],
  )

  const key = `${active.row}-${active.col}`
  const open = looking && dismissed !== key
  // The tooltip's anchor: the top of the column's pin, where the column will stand.
  const height = Math.max(FLOOR_HEIGHT, (peak > 0 ? (rows[active.row]?.[active.col] ?? 0) / peak : 0) * TALL)
  const anchor = shareOf(frame, project(active.col + 0.5, active.row + 0.5, height))

  return (
    <div
      ref={host}
      dir="ltr"
      data-slot="terrain"
      data-looking={looking || undefined}
      data-focus={focus === 'keyboard' ? 'keyboard' : undefined}
      className="@container relative w-full touch-manipulation rounded-lg select-none data-[focus=keyboard]:[outline:var(--ui--focus-width)_solid_var(--color-focus)] data-[focus=keyboard]:[outline-offset:var(--ui--focus-offset)]"
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      {...handlers}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />

      {/* The looked-at day and week always show, and the labels next to them step aside. No letter-spacing: it breaks joined scripts. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 font-mono text-ui-xs whitespace-nowrap uppercase tabular-nums">
        {rowTicks.map((label, row) => {
          const lit = row === active.row
          const room = lit ? SHOWN : Math.abs(row - active.row) === 1 || row % 2 ? WIDE : MID
          return (
            <span
              key={label}
              className={`${LABEL} -translate-y-1/2 ${ink(lit)} ${room}`}
              style={place(frame, project(cols + MARGIN + 0.35, row + 0.5, -SLAB))}
            >
              {label}
            </span>
          )
        })}
        {Array.from({ length: cols }, (_, col) => {
          const { label, major } = columnTick(col)
          const lit = col === active.col
          const room = lit ? SHOWN : major && Math.abs(col - active.col) > 2 ? SHOWN : HIDDEN
          return (
            <span
              key={col}
              className={`${LABEL} -translate-x-full ${ink(lit)} ${room}`}
              style={place(frame, project(col + 0.5, rows.length + MARGIN + 0.3, -SLAB))}
            >
              {label}
            </span>
          )
        })}
      </div>

      <Tooltip open={open} onOpenChange={(next, details) => !next && details.reason === 'escape-key' && setDismissed(key)} triggerId={tipId}>
        {/* A full-size layer moved by the anchor's share of the frame: its corner is the point. */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ transform: `translate(${anchor.left}%, ${anchor.top}%)` }}>
          <TooltipTrigger /* youj-allow: physical side, placed at the projected point in px */ id={tipId} render={<span />} className="absolute top-0 left-0 size-px -translate-y-[1.25rem]" />
        </div>
        <TooltipContent side="top">{tip(active)}</TooltipContent>
      </Tooltip>

      <TerrainGrid
        label={grid.label}
        weeks={cols}
        weekdays={grid.weekdays}
        cornerHeader={grid.cornerHeader}
        columnName={grid.columnName}
        reading={grid.reading}
        selected={selected}
        onSelect={keyed}
        onFocusChange={setFocus}
        focusSignal={picks}
      />
    </div>
  )
}
