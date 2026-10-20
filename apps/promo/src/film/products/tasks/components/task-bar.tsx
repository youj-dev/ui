'use client'

import type { KeyboardEvent, PointerEvent } from 'react'
import { motion, useTransform } from 'motion/react'
import { cn } from '@youj/react/lib/utils'
import { PERSON } from '../data'
import { rangeLabel } from '../days'
import type { Placed } from '../schedule'
import type { BarValues } from '../use-bars'

type PointerHandlers = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}

/**
 * A task on the runway: a bar from its first day to its last, in the color
 * of where it stands (to do: a tint; doing: filled as far as it's got; done:
 * quiet; late: warning). Its body drags it along the days and its end
 * stretches it; hovering, focusing or dragging it shows its dates above it.
 */
export function TaskBar({
  placed: p,
  waitsFor,
  onChain,
  values,
  dir,
  today,
  dragging,
  focusable,
  hint,
  move,
  stretch,
  onOpen,
  onKeyDown,
  onFocus,
}: {
  placed: Placed
  waitsFor: string | null
  /** On the critical path: the chain of handoffs that sets when the work is done. */
  onChain: boolean
  values: BarValues
  dir: 1 | -1
  today: number
  dragging: boolean
  focusable: boolean
  hint: string
  move: PointerHandlers
  stretch: PointerHandlers
  onOpen: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onFocus: () => void
}) {
  const t = p.task
  const x = useTransform(values.x, (v) => v * dir)
  const range = rangeLabel(today, p.start, p.end)
  const critical = onChain && t.status !== 'done' && !p.late
  const label = [t.title, PERSON[t.owner].name, range, t.status === 'done' ? 'done' : t.status === 'doing' ? 'in progress' : 'to do', p.late && 'lands after launch', critical && 'on the critical path', waitsFor && `waits for ${waitsFor}`]
    .filter(Boolean)
    .join(', ')

  return (
    <motion.button
      type="button"
      data-task={t.id}
      data-dragging={dragging || undefined}
      tabIndex={focusable ? 0 : -1}
      aria-label={label}
      aria-describedby={hint}
      style={{ x, width: values.w }}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      {...move}
      className="group/bar absolute inset-y-2 start-0 cursor-grab touch-pan-y rounded-md outline-none select-none data-dragging:z-10 data-dragging:cursor-grabbing"
    >
      <span
        data-bar=""
        className={cn(
          'absolute inset-y-0 inset-x-0.5 overflow-hidden rounded-md transition-[box-shadow,background-color] yj-duration-fast ease-standard',
          'group-hover/bar:shadow-sm group-data-dragging/bar:shadow-md',
          'group-focus-visible/bar:outline-2 group-focus-visible/bar:outline-offset-2 group-focus-visible/bar:outline-focus',
          p.late
            ? 'bg-warning-line ring-1 ring-warning ring-inset'
            : t.status === 'done'
              ? 'bg-line-strong'
              : t.status === 'doing'
                ? cn('bg-accent-line ring-1 ring-inset', critical ? 'ring-accent' : 'ring-accent-line')
                : cn('ring-1 ring-inset', critical ? 'bg-accent-subtle ring-accent' : 'bg-accent-subtle ring-accent-line'),
        )}
      >
        {t.status === 'doing' && !p.late && (
          // How far it's got, filled from its start.
          <span className="absolute inset-y-0 start-0 w-full origin-left bg-accent transition-transform yj-duration-deliberate ease-emphasized rtl:origin-right" style={{ transform: `scaleX(${t.progress ?? 0})` }} />
        )}
      </span>
      {/* The end: drag it to change how long the task takes. */}
      <span aria-hidden {...stretch} className="absolute inset-y-0 end-0 z-10 flex w-3 cursor-ew-resize touch-pan-y items-center justify-center">
        <span className="h-2.5 w-0.5 rounded-full bg-fg-subtle opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/bar:opacity-100 group-data-dragging/bar:opacity-100" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute start-0.5 bottom-full mb-1.5 rounded-sm bg-fg px-1.5 py-0.5 text-ui-xs whitespace-nowrap text-canvas tabular-nums opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100 group-data-dragging/bar:opacity-100"
      >
        {range} · {t.days} {t.days === 1 ? 'day' : 'days'}
      </span>
    </motion.button>
  )
}
