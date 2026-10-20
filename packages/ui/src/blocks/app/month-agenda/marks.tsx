import type { ReactNode } from 'react'
import { cn, toneColor } from '../../../lib/utils'
import type { MonthAgendaEvent, MonthAgendaMark } from './data'

/* The demo's event marks: plain shapes in each event's tone, drawn here
 * so no real brand appears. An app passes its own `logo` instead. */

const SHAPES: Record<MonthAgendaMark, ReactNode> = {
  ring: <circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeWidth="2.5" />,
  half: (
    <>
      <circle cx="8" cy="8" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2.25a5.75 5.75 0 0 1 0 11.5z" fill="currentColor" />
    </>
  ),
  diamond: <path d="M8 1.5 14.5 8 8 14.5 1.5 8z" fill="currentColor" />,
  kite: <path d="M8 1.5 13.5 6.5 8 14.5 2.5 6.5zM8 1.5v13" fill="currentColor" stroke="var(--color-surface)" strokeWidth="1" />,
  triangle: <path d="M8 2.25 14.25 13.5H1.75z" fill="currentColor" />,
  hex: <path d="M8 1.75 13.5 4.9v6.2L8 14.25 2.5 11.1V4.9z" fill="currentColor" />,
  drop: <path d="M8 1.75c2.6 3.1 4.6 5.6 4.6 7.9A4.6 4.6 0 0 1 3.4 9.65c0-2.3 2-4.8 4.6-7.9z" fill="currentColor" />,
  bars: (
    <>
      <rect x="2" y="7" width="3" height="7" rx="1" fill="currentColor" />
      <rect x="6.5" y="2" width="3" height="12" rx="1" fill="currentColor" />
      <rect x="11" y="4.5" width="3" height="9.5" rx="1" fill="currentColor" />
    </>
  ),
  orbit: (
    <>
      <ellipse cx="8" cy="8" rx="6.5" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-30 8 8)" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
    </>
  ),
}

/** An event's mark at `size` (a size utility): its own logo, else its shape, else its initial. */
function EventMark({ event, className }: { event: MonthAgendaEvent; className?: string }) {
  if (event.logo) return <span className={cn('grid shrink-0 place-items-center *:size-full', className)}>{event.logo}</span>
  const color = toneColor(event.tone ?? 'neutral', 'var(--color-fg-muted)')
  if (!event.mark)
    return (
      <span
        aria-hidden
        className={cn('grid shrink-0 place-items-center rounded-full text-ui-xs leading-none font-semibold text-on-accent', className)}
        style={{ background: color }}
      >
        {event.name.slice(0, 1).toUpperCase()}
      </span>
    )
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn('shrink-0', className)} style={{ color }}>
      {SHAPES[event.mark]}
    </svg>
  )
}

export { EventMark }
