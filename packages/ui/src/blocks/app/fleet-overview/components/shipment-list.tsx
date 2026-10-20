'use client'

import { useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { useLocale } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { cn } from '../../../../lib/utils'
import { PORTS } from '../data'
import { DAY, dateFormat, progressOf, type Tracked } from '../model'
import { StatusBadge } from './status-badge'

export function VoyageBar({ ship, progress, className }: { ship: Tracked; progress: number; className?: string }) {
  return (
    <span aria-hidden className={cn('relative h-1 overflow-hidden rounded-full bg-well', className)}>
      <span
        className={cn(
          'absolute inset-0 origin-left rounded-full transition-transform yj-duration-slow ease-standard rtl:origin-right',
          ship.status === 'delayed' ? 'bg-warning' : ship.status === 'arrived' ? 'bg-fg-subtle' : 'bg-accent',
        )}
        style={{ transform: `scaleX(${progress})` }}
      />
    </span>
  )
}

function ShipmentRow({ ship, time, selected, onSelect }: { ship: Tracked; time: number; selected: boolean; onSelect: () => void }) {
  const locale = useLocale()
  // Dates are by the day: the time the row first drew is near enough.
  const [now] = useState(Date.now)
  const progress = progressOf(ship, time)
  const pct = Math.round(progress * 100)
  const from = PORTS[ship.from]!
  const to = PORTS[ship.to]!
  return (
    <button
      type="button"
      data-row=""
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'group/row relative flex w-full flex-col gap-1.5 rounded-lg px-3 py-2.5 text-start focus-ring',
        'transition-colors yj-duration-fast ease-standard hover:bg-hover aria-[current=true]:bg-selected',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-2.5 start-0 w-0.5 rounded-full bg-accent opacity-0 transition-opacity yj-duration-fast ease-standard group-aria-[current=true]/row:opacity-100"
      />
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-ui font-medium text-fg">{ship.vessel}</span>
        {ship.status !== 'on-time' && ship.status !== 'arrived' && <StatusBadge status={ship.status} />}
        <span className="ms-auto shrink-0 text-ui-sm text-fg-muted tabular-nums">
          {ship.status === 'arrived' ? `Since ${dateFormat(locale).format(now - ship.eta * DAY)}` : `ETA ${dateFormat(locale).format(now + ship.eta * DAY)}`}
        </span>
      </span>
      <span className="flex items-center gap-2 text-ui-sm text-fg-muted">
        <span className="sr-only">
          {from.name} to {to.name}, {pct}% of the voyage
        </span>
        <span aria-hidden className="flex shrink-0 items-center gap-1 font-mono text-[11px] tracking-wide">
          {from.code}
          <ArrowRightIcon size={11} className="rtl:-scale-x-100" />
          {to.code}
        </span>
        <VoyageBar ship={ship} progress={progress} className="flex-1" />
        <span aria-hidden className="w-8 text-end tabular-nums">
          {pct}%
        </span>
      </span>
    </button>
  )
}

export function ShipmentList({
  ships,
  time,
  selectedId,
  onSelect,
  empty,
  label,
}: {
  ships: Tracked[]
  time: number
  selectedId: string | null
  onSelect: (id: string) => void
  empty: ReactNode
  label: string
}) {
  // Up and Down move between rows; Enter or Space opens one.
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const rows = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-row]'))
    const index = rows.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    event.preventDefault()
    rows[Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus()
  }
  if (!ships.length) return <>{empty}</>
  return (
    <PresenceList aria-label={label} className="flex flex-col gap-0.5" onKeyDown={onKeyDown}>
      {ships.map((ship) => (
        <PresenceItem key={ship.id}>
          <ShipmentRow ship={ship} time={time} selected={ship.id === selectedId} onSelect={() => onSelect(ship.id)} />
        </PresenceItem>
      ))}
    </PresenceList>
  )
}
