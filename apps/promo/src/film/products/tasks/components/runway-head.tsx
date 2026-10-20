import { FlagIcon } from '@youj/icons'
import { cn } from '@youj/react/lib/utils'
import { dateOf } from '../days'
import type { Verdict } from '../schedule'

const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

/** The days across the top of the runway: today in the accent, the weekends quiet, and the launch flagged in the color of how it stands. */
export function RunwayHead({ today, first, last, launch, verdict, compact }: { today: number; first: number; last: number; launch: number; verdict: Verdict; compact: boolean }) {
  const days = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const pct = (day: number) => `${((day - first) / days.length) * 100}%`
  const tone = verdict.kind === 'late' ? 'text-warning-text' : verdict.kind === 'ready' ? 'text-success-text' : 'text-fg'
  return (
    <div aria-hidden className="relative h-full">
      {days.map((day) => {
        const date = dateOf(today, day)
        const weekend = [0, 6].includes(date.getDay())
        return (
          <span
            key={day}
            className={cn('absolute bottom-2 flex flex-col items-center leading-none tabular-nums', day === 0 ? 'text-accent-text' : weekend ? 'text-fg-subtle' : 'text-fg-muted')}
            style={{ insetInlineStart: pct(day), width: pct(first + 1) }}
          >
            <span className={cn('text-[0.625rem] font-medium tracking-[0.12em] uppercase', compact && 'hidden')}>{day === 0 ? 'Today' : weekday.format(date)}</span>
            <span className={cn('mt-1 text-ui-sm', day === 0 && 'font-semibold', compact && 'text-ui-xs')}>{date.getDate()}</span>
          </span>
        )
      })}
      <span className={cn('absolute top-1.5 flex -translate-x-1/2 items-center gap-1 rounded-full bg-canvas px-1.5 text-ui-xs font-semibold whitespace-nowrap rtl:translate-x-1/2', tone)} style={{ insetInlineStart: `calc(${pct(launch)} + ${((9 / 24) * 100) / days.length}%)` }}>
        <FlagIcon size={11} strokeWidth={2.25} />
        {!compact && 'Launch'}
      </span>
    </div>
  )
}
