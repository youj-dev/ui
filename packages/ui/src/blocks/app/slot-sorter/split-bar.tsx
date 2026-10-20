import type { CSSProperties } from 'react'
import { Hatch } from '../../../components/ui/hatched-bar'
import { cn, toneColor } from '../../../lib/utils'
import type { SlotSorterCopy, SlotSorterSlot } from './data'

interface SplitBarProps {
  slots: readonly SlotSorterSlot[]
  counts: Record<string, number>
  copy: SlotSorterCopy
  /** Formats a count for the legend and the summary. */
  format: (n: number) => string
  /** Reduced motion: the segments jump to their new size. */
  reduced: boolean
  /** Registers a slot's legend entry, which is where a dragged item lands. */
  slotRef: (id: string) => (el: HTMLLIElement | null) => void
  /** A drag is on: the slots that can take an item show it, and the one under the pointer lights. */
  dragging: boolean
  over: string | null
}

const SEGMENT = 'h-2.5 min-w-0 flex-1 basis-0'
const GLIDE = 'transition-[flex-grow] yj-duration-base ease-standard'

/** Today's split as one bar, a segment per slot sized by its count (hatched where the slot is off), and under it the legend: each slot's color, name and count. The legend entries are where a dragged item lands. */
function SplitBar({ slots, counts, copy, format, reduced, slotRef, dragging, over }: SplitBarProps) {
  const summary = slots.map((s) => `${s.label} ${s.off ? copy.slotOff : format(counts[s.id] ?? 0)}`).join(', ')
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={`${copy.splitAria}: ${summary}`} className="flex gap-0.5">
        {slots.map((s) =>
          s.off ? (
            <Hatch key={s.id} className={cn(SEGMENT, !reduced && GLIDE)} style={{ flexGrow: counts[s.id] ?? 0 }} />
          ) : (
            <span
              key={s.id}
              aria-hidden
              className={cn(SEGMENT, !reduced && GLIDE, 'rounded-xs bg-(--tone)')}
              style={{ flexGrow: counts[s.id] ?? 0, '--tone': toneColor(s.tone ?? 'neutral') } as CSSProperties}
            />
          ),
        )}
      </div>
      <ul className="-mx-2 flex flex-wrap gap-x-1 text-ui-sm">
        {slots.map((s) => (
          <li
            key={s.id}
            ref={slotRef(s.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-chip px-2 py-1 text-fg-muted',
              dragging && !s.off && (over === s.id ? 'bg-selected text-fg' : 'bg-hover'),
              !reduced && 'transition-colors yj-duration-fast ease-standard',
            )}
          >
            {s.off ? (
              <Hatch className="size-2" />
            ) : (
              <span aria-hidden className="size-2 shrink-0 rounded-[2px] bg-(--tone)" style={{ '--tone': toneColor(s.tone ?? 'neutral') } as CSSProperties} />
            )}
            {s.label}
            <span className={cn('tabular-nums', s.off ? 'text-fg-subtle' : 'font-medium text-fg')}>{s.off ? copy.slotOff : format(counts[s.id] ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { SplitBar }
