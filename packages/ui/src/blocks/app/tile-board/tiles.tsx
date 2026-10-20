'use client'

import { cn } from '../../../lib/utils'
import { clockText, secondsBetween, type TileBoardCopy, type TileBoardStatus, type TileBoardTile, type TileBoardTone } from './data'

/* The tiles as a grid of buttons, one each. A tile is a name and one line of
 * state: its note (or its cycle time), or for a tile in the alert status a
 * timer for how long it has been so. A bar in the status's tone tops the tile
 * as an echo; the state is always in words. The selected tile is filled (an
 * alert one in its tone's tint). */

const BAR: Record<TileBoardTone, string> = {
  success: 'bg-success',
  neutral: 'bg-fg-subtle',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

const DETAIL_TONE: Record<TileBoardTone, string> = {
  success: 'text-fg-muted',
  neutral: 'text-fg-muted',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
}

const ALERT_FILL: Record<TileBoardTone, string> = {
  success: 'bg-success-subtle',
  neutral: 'bg-selected',
  warning: 'bg-warning-subtle',
  danger: 'bg-danger-subtle',
}

interface TilesProps {
  tiles: TileBoardTile[]
  statuses: TileBoardStatus[]
  selected: string
  /** Tile ids already resolved this session: they show in the resting status. */
  resolved: ReadonlySet<string>
  now: number
  copy: TileBoardCopy
  cycle: (seconds: number) => string
  onSelect: (id: string) => void
}

export function Tiles({ tiles, statuses, selected, resolved, now, copy, cycle, onSelect }: TilesProps) {
  const resting = statuses.find((st) => !st.alert) ?? statuses[0]
  return (
    <div role="group" aria-label={copy.gridLabel} className="grid grid-cols-4 gap-2">
      {tiles.map((tile) => {
        const status = (resolved.has(tile.id) ? resting : statuses.find((st) => st.id === tile.status)) ?? resting
        if (!status) return null
        const detail = status.alert ? clockText(tile.since ? secondsBetween(tile.since, now) : 0) : (tile.note ?? (tile.cycleSeconds ? cycle(tile.cycleSeconds) : ''))
        const on = tile.id === selected
        return (
          <button
            key={tile.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(tile.id)}
            className={cn(
              'focus-ring flex min-w-0 flex-col gap-1.5 rounded-surface px-2.5 pt-2 pb-2.5 text-start transition-colors yj-duration-fast ease-standard',
              on ? (status.alert ? ALERT_FILL[status.tone] : 'bg-selected') : 'bg-well hover:bg-hover',
            )}
          >
            <span aria-hidden className={cn('h-0.5 w-3', BAR[status.tone])} />
            <span className="truncate text-ui font-medium">
              {tile.name}
              <span className="sr-only">, {status.label}</span>
            </span>
            <span className={cn('truncate text-ui-sm tabular-nums', DETAIL_TONE[status.tone])}>{detail}</span>
          </button>
        )
      })}
    </div>
  )
}
