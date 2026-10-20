'use client'

import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'

/* The ranked list, the gauge's words: a mark, the name (and who it comes
 * from), the amount and its share, over a thin line as long as the item is
 * against the largest, in the item's color. The rows are one tab stop; the
 * arrow keys, Home and End move between them, and the row with focus or the
 * pointer is the active one, which the gauge shows too. */

export interface ListRow {
  id: string
  label: string
  detail?: string
  icon?: ReactNode
  /** Formatted. */
  amount: string
  /** Formatted. */
  share: string
  /** How long its line is against the largest, 0 to 1. */
  line: number
  color: string
}

interface ListProps {
  rows: readonly ListRow[]
  active: string | null
  onActive: (id: string | null) => void
  'aria-label': string
  /** No width transition on the lines. */
  reduced: boolean
  /** The height the list keeps, so a period with fewer rows does not shrink the card. */
  rowsKept: number
}

function List({ rows, active, onActive, reduced, rowsKept, 'aria-label': label }: ListProps) {
  const [stop, setStop] = useState(0)
  const current = Math.min(stop, rows.length - 1)

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const to = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: rows.length - 1 }[event.key]
    if (to === undefined) return
    event.preventDefault()
    const next = Math.min(rows.length - 1, Math.max(0, to))
    setStop(next)
    ;(event.currentTarget.children[next] as HTMLElement | undefined)?.focus()
  }

  return (
    <ul
      aria-label={label}
      data-slot="share-gauge-list"
      className="-mx-2 flex flex-col"
      style={{ minHeight: `calc(var(--spacing) * 13 * ${rowsKept})` }}
      onKeyDown={onKeyDown}
      onPointerLeave={() => onActive(null)}
    >
      {rows.map((row, i) => (
        <li
          key={row.id}
          tabIndex={i === current ? 0 : -1}
          data-slot="share-gauge-row"
          data-yj-segment={row.id}
          data-active={row.id === active || undefined}
          className="relative grid h-13 grid-cols-[auto_minmax(0,1fr)_auto_--spacing(11)] items-center gap-x-3 rounded-lg px-2 pb-2 transition-colors yj-duration-fast ease-standard outline-hidden hover:bg-hover data-active:bg-hover focus-ring"
          onPointerEnter={() => onActive(row.id)}
          onFocus={() => {
            setStop(i)
            onActive(row.id)
          }}
          onBlur={() => onActive(null)}
        >
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-well text-fg-muted">
            {row.icon ?? <span className="size-2.5 rounded-full" style={{ background: row.color }} />}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-ui font-medium">{row.label}</span>
            {row.detail && <span className="truncate text-ui-sm text-fg-muted">{row.detail}</span>}
          </span>
          <span className="text-end text-ui font-medium tabular-nums">{row.amount}</span>
          <span className="text-end text-ui-sm text-fg-muted tabular-nums">{row.share}</span>
          <span aria-hidden className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-well">
            <span
              className={cn('block h-full rounded-full', !reduced && 'transition-[width] yj-duration-base ease-standard')}
              style={{ width: `${Math.round(row.line * 1000) / 10}%`, background: row.color }}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}

export { List }
