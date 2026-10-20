'use client'

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronDownIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { cn, initials, toneColor } from '../../../lib/utils'
import type { SlotSorterConfidence, SlotSorterCopy, SlotSorterSlot, SlotSorterItem } from './data'

const LEVEL: Record<SlotSorterConfidence, number> = { low: 1, medium: 2, high: 3 }

/** Three bars, as many lit as the sorting is sure; it says so in words for assistive tech. */
function Signal({ level, label }: { level: SlotSorterConfidence; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex h-3 items-end gap-0.5">
      {['h-1', 'h-2', 'h-3'].map((height, i) => (
        <span key={height} aria-hidden className={cn('w-0.5 rounded-full', height, i < LEVEL[level] ? 'bg-fg-muted' : 'bg-line')} />
      ))}
    </span>
  )
}

interface ItemRowProps {
  item: SlotSorterItem
  slots: readonly SlotSorterSlot[]
  /** The id of the slot it sits in now. */
  current: string
  copy: SlotSorterCopy
  /** Reduced motion: a released row snaps back at once. */
  reduced: boolean
  /** The slot under a point on the screen that can take an item, or null. */
  slotAt: (x: number, y: number) => string | null
  /** A drag began on this row. */
  onDragStart: (id: string) => void
  /** The slot the drag is over, or null. */
  onDragOver: (slot: string | null) => void
  /** The drag ended: the slot it was dropped on, or null for none. */
  onDragEnd: (id: string, slot: string | null) => void
  onMove: (id: string, slot: string) => void
}

/** One item: its name and detail, how sure the sorting is, and the slot it is in. Drag the name and detail onto a slot above, or use the slot button: its menu, or the number keys. */
function ItemRow({ item, slots, current, copy, reduced, slotAt, onDragStart, onDragOver, onDragEnd, onMove }: ItemRowProps) {
  const slot = slots.find((s) => s.id === current) ?? slots[0]!
  const press = useRef<{ x: number; y: number; moving: boolean } | null>(null)
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null)
  const dragging = offset !== null

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    press.current = { x: event.clientX, y: event.clientY, moving: false }
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moving) {
      if (Math.hypot(dx, dy) < 4) return
      start.moving = true
      onDragStart(item.id)
    }
    setOffset({ x: dx, y: dy })
    onDragOver(slotAt(event.clientX, event.clientY))
  }
  const end = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const start = press.current
    press.current = null
    if (!start?.moving) return
    setOffset(null)
    onDragEnd(item.id, cancelled ? null : slotAt(event.clientX, event.clientY))
  }
  const keys = (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = slots[Number(event.key) - 1]
    if (!target || target.off || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    onMove(item.id, target.id)
  }

  return (
    <li data-slot="slot-sorter-item" className="relative h-14">
      {dragging && <span aria-hidden className="absolute inset-y-0 -inset-x-2 rounded-lg border border-dashed border-line-strong" />}
      <div
        data-dragging={dragging || undefined}
        className={cn(
          'relative -mx-2 flex h-full items-center gap-3 rounded-lg px-2',
          'data-dragging:z-10 data-dragging:bg-overlay data-dragging:shadow-lg',
          !reduced && 'transition-[transform,box-shadow,background-color] yj-duration-base ease-standard data-dragging:transition-none',
        )}
        style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
      >
        <div
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={(event) => end(event, false)}
          onPointerCancel={(event) => end(event, true)}
          className={cn('flex min-w-0 flex-1 touch-none items-center gap-3 select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        >
          <Avatar>
            {item.image && <AvatarImage src={item.image} alt="" />}
            <AvatarFallback>{initials(item.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-ui font-medium text-fg">{item.name}</p>
            <p className="truncate text-ui-sm text-fg-muted">{item.detail}</p>
          </div>
        </div>
        <Signal level={item.confidence} label={copy.confidence[item.confidence]} />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="secondary"
                size="xs"
                aria-label={copy.row(item.name, item.detail, slot.label, copy.confidence[item.confidence])}
                onKeyDown={keys}
                className="w-28 justify-between"
              />
            }
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--tone)" style={{ '--tone': toneColor(slot.tone ?? 'neutral') } as CSSProperties} />
              <span className="truncate">{slot.label}</span>
            </span>
            <ChevronDownIcon size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup value={current} onValueChange={(value) => onMove(item.id, value)}>
              <DropdownMenuLabel>{copy.moveTo}</DropdownMenuLabel>
              {slots.map((s, index) => (
                <DropdownMenuRadioItem key={s.id} value={s.id} disabled={s.off}>
                  {s.label}
                  <DropdownMenuShortcut>{index + 1}</DropdownMenuShortcut>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

export { ItemRow }
