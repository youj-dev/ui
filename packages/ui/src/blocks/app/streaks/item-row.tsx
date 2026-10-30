'use client'

import { m } from 'motion/react'
import type { CSSProperties } from 'react'
import { useYouj } from '@youj/core'
import { StreakCheck, CalendarHeatmap, streakStats } from '../../../components/ui/calendar-heatmap'
import { cn } from '../../../lib/utils'
import { yesterdayOf, type StreaksCopy, type StreaksItem } from './data'

export const toneOf = (item: StreaksItem) => `var(--color-${item.tone})`

interface ItemRowProps {
  item: StreaksItem
  today: string
  selected: boolean
  copy: StreaksCopy
  onSelect: () => void
  onToggle: (done: boolean) => void
}

/** One item for today: its disc, name and streak, the last twelve weeks as mini dots, and Mark done. A subgrid row, so every row's dots line up. */
export function ItemRow({ item, today, selected, copy, onSelect, onToggle }: ItemRowProps) {
  const k = useYouj()
  const stats = streakStats(item.days, today)
  // A run that yesterday broke, still there to save.
  const held = stats.current ? 0 : streakStats(item.days, yesterdayOf(today)).current
  const progress = stats.current ? copy.streak(stats.current) : held ? copy.held(held) : copy.noStreak
  return (
    <m.li
      layout="position"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: k.reduced ? { type: false } : k.tween('fast', 'exit') }}
      transition={k.reduced ? { type: false } : k.tween('base', 'enter')}
      data-selected={selected || undefined}
      className={cn(
        'col-span-full grid grid-cols-subgrid items-center gap-y-2.5 rounded-xl px-3 py-2.5 transition-[background-color,box-shadow] yj-duration-fast ease-standard sm:px-4',
        selected
          ? 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_4%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--item-tone)_28%,transparent)]'
          : 'hover:bg-hover',
      )}
      style={{ '--item-tone': toneOf(item) } as CSSProperties}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={copy.show(`${item.name} ${progress}`)}
        onClick={onSelect}
        className="focus-ring -m-1 flex min-w-0 items-center gap-3 rounded-lg p-1 text-start"
      >
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--item-tone)_18%,transparent)] text-(--item-tone) [&_svg]:size-4">
          {item.icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-ui-lg text-fg">{item.name}</span>{' '}
          <span className={cn('truncate font-mono text-ui-sm tabular-nums', held ? 'text-warning-text' : 'text-fg-muted')}>{progress}</span>
        </span>
      </button>
      <CalendarHeatmap
        days={item.days}
        today={today}
        weeks={12}
        max={item.max}
        tone={item.tone}
        size="sm"
        className="col-start-1 row-start-2 ms-12 sm:col-start-2 sm:row-start-1 sm:ms-0"
      />
      <StreakCheck className="col-start-2 row-start-1 justify-self-end sm:col-start-3" pressed={stats.today} onPressedChange={onToggle} aria-label={copy.markDone(item.name)} />
    </m.li>
  )
}
