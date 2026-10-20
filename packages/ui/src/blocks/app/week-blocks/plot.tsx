'use client'

import type { CSSProperties, KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { stepSelection, toneFill, type WeekSlot } from './model'

/* The week as columns, one per day, the hours down the side. Each entry is a
 * rounded block in its kind's color, placed by its times on a quiet track, and
 * a hairline marks each labelled hour. Today's header is a filled pill and, when
 * the clock is inside the hours shown, a line crosses today's track with its
 * time in the hour gutter (the hour labels beside it step aside). The plot is
 * one tab stop: the arrow keys read an entry at a time, Escape lets go. */

const HEIGHT = 264

interface PlotProps {
  columns: readonly { day: string; name: string; number: string; today: boolean }[]
  slots: readonly WeekSlot[]
  /** The hours shown, as minutes after midnight. */
  shown: readonly [number, number]
  ticks: readonly { minute: number; label: string }[]
  now?: { column: number; minute: number; label: string }
  active: number | null
  onActiveChange: (index: number | null) => void
  label: string
  summaryId: string
}

function Plot({ columns, slots, shown, ticks, now, active, onActiveChange, label, summaryId }: PlotProps) {
  const k = useYouj()
  const span = shown[1] - shown[0]
  const pct = (minute: number) => `${((minute - shown[0]) / span) * 100}%`
  // The hour labels give way to the now label where they would touch it.
  const nearNow = (minute: number) => now !== undefined && Math.abs(minute - now.minute) < (28 / HEIGHT) * span

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepSelection(active, event.key, slots.length)
    if (next === undefined || (next === null && active === null)) return
    event.preventDefault()
    onActiveChange(next)
  }

  return (
    <div
      // Time runs left to right and top to bottom in either direction of text.
      dir="ltr"
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={summaryId}
      tabIndex={0}
      data-slot="week-blocks-plot"
      className="grid w-full touch-pan-y grid-cols-[--spacing(10)_repeat(var(--week-columns),minmax(0,1fr))] gap-x-2 rounded-md outline-hidden select-none focus-ring"
      style={{ '--week-columns': columns.length } as CSSProperties}
      onPointerLeave={() => onActiveChange(null)}
      onBlur={() => onActiveChange(null)}
      onKeyDown={keys}
    >
      <span aria-hidden />
      {columns.map((c) => (
        <div key={c.day} className="flex flex-col items-center gap-1 pb-2 text-ui-xs tabular-nums">
          <span className={c.today ? 'font-medium text-fg' : 'text-fg-muted'}>{c.name}</span>
          <span
            className={cn('grid size-6 place-items-center rounded-full text-ui-sm font-medium', c.today ? 'bg-fg text-canvas' : 'text-fg')}
            data-yj-today={c.today || undefined}
          >
            {c.number}
          </span>
        </div>
      ))}

      <div aria-hidden className="relative text-ui-xs text-fg-muted tabular-nums" style={{ height: HEIGHT }}>
        {ticks.map((t) =>
          nearNow(t.minute) ? null : (
            <span key={t.minute} className="absolute start-0 -translate-y-1/2 leading-none" style={{ top: pct(t.minute) }}>
              {t.label}
            </span>
          ),
        )}
        {now && (
          <span
            data-slot="week-blocks-now-label"
            className="absolute start-0 -translate-y-1/2 leading-none font-medium text-fg"
            style={{ top: pct(now.minute) }}
          >
            {now.label}
          </span>
        )}
      </div>
      <MotionFeatures>
        {columns.map((c, column) => (
          <div key={c.day} aria-hidden className="relative overflow-hidden rounded-lg bg-band" style={{ height: HEIGHT }}>
            {ticks.map((t) => (
              <span key={t.minute} className="absolute inset-x-0 h-px bg-line-subtle" style={{ top: pct(t.minute) }} />
            ))}
            {slots.map((slot, index) =>
              slot.column !== column ? null : (
                <m.div
                  key={index}
                  data-slot="week-blocks-block"
                  data-yj-kind={slot.kind.id}
                  data-active={index === active || undefined}
                  className={cn(
                    'absolute inset-x-1 min-h-1.5 rounded-md transition-[opacity,outline-color] yj-duration-fast ease-standard',
                    'outline-2 outline-offset-1 outline-transparent data-active:outline-fg',
                    active !== null && index !== active && 'opacity-50',
                  )}
                  style={{
                    top: `calc(${pct(slot.from)} + 1px)`,
                    height: `calc(${((slot.to - slot.from) / span) * 100}% - 2px)`,
                    background: toneFill(slot.kind.tone),
                    transformOrigin: 'top',
                  }}
                  initial={k.reduced ? false : { scaleY: 0.8, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    ...k.tween('slow', 'enter'),
                    delay: k.reduced ? 0 : (column * 3 + slots.filter((s, i) => i < index && s.column === column).length) * 0.03,
                  }}
                  onPointerEnter={() => onActiveChange(index)}
                  onPointerDown={() => onActiveChange(index)}
                />
              ),
            )}
            {now && now.column === column && (
              <span
                data-slot="week-blocks-now"
                className={cn('absolute inset-x-0 h-px bg-fg', !k.reduced && 'transition-[top] yj-duration-slow ease-standard')}
                style={{ top: pct(now.minute) }}
              />
            )}
          </div>
        ))}
      </MotionFeatures>
    </div>
  )
}

export { Plot }
