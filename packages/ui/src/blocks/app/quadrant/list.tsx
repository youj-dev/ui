'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../../lib/utils'
import { TONES, type Group, type Item } from './data'

/* Beside the field, its items as a list, largest second measure first:
 * the group picked, or all of them. Pointing at a row lights its bubble and
 * the other way round. Each row says its two figures and, with Movement on,
 * the group it came from. When the app listens the rows are buttons on one
 * tab stop (Up and Down, Home and End). It scrolls inside its room. */

interface ListProps {
  heading: string
  items: Item[]
  groupOf: (item: Item) => Group
  /** The group it stood in last period, when Movement is on and it moved. */
  movedFrom: (item: Item) => string | undefined
  active: string | null
  onActive: (id: string | null) => void
  onSelect?: (item: Item) => void
  figure: { x: (v: number) => string; y: (v: number) => string }
}

function List({ heading, items, groupOf, movedFrom, active, onActive, onSelect, figure }: ListProps) {
  const ref = useRef<HTMLUListElement>(null)
  const [cursor, setCursor] = useState(0)
  const at = Math.min(cursor, Math.max(0, items.length - 1))
  const keys = (event: KeyboardEvent) => {
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[event.key]
    if (to === undefined || !onSelect) return
    event.preventDefault()
    const next = Math.min(items.length - 1, Math.max(0, to))
    setCursor(next)
    ref.current?.querySelectorAll<HTMLElement>('button')[next]?.focus()
  }

  return (
    <div data-slot="quadrant-list" className="flex h-full min-h-0 flex-col gap-2">
      <p className="truncate font-(family-name:--yj-label-font) text-ui-xs font-medium tracking-(--yj-label-tracking) text-fg-muted [text-transform:var(--yj-label-case)]">{heading}</p>
      <ul ref={ref} aria-label={heading} tabIndex={onSelect ? undefined : 0} className="-mx-1.5 min-h-0 flex-1 overflow-y-auto px-1.5 yj-scrollbar" onKeyDown={keys}>
        {items.map((item, i) => {
          const moved = movedFrom(item)
          const row = (
            <>
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: TONES[groupOf(item)] }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-fg">{item.label}</span>
                {moved && <span className="truncate text-ui-xs text-fg-muted">{moved}</span>}
              </span>
              <span className="flex shrink-0 flex-col items-end tabular-nums">
                <span className="text-fg">{figure.y(item.y)}</span>
                <span className="text-ui-xs text-fg-muted">{figure.x(item.x)}</span>
              </span>
            </>
          )
          const look = cn('flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-start text-ui-sm transition-colors ease-standard yj-duration-fast', active === item.id && 'bg-hover')
          return (
            <li key={item.id} data-yj-item={item.id} onPointerEnter={() => onActive(item.id)} onPointerLeave={() => onActive(null)}>
              {onSelect ? (
                <button
                  type="button"
                  tabIndex={i === at ? 0 : -1}
                  className={cn(look, 'outline-hidden focus-ring')}
                  onFocus={() => {
                    setCursor(i)
                    onActive(item.id)
                  }}
                  onBlur={() => onActive(null)}
                  onClick={() => onSelect(item)}
                >
                  {row}
                </button>
              ) : (
                <div className={look}>{row}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { List }
