import { cn } from '@youj/react/lib/utils'
import { isWeekend } from '../days'
import type { Verdict } from '../schedule'

/**
 * What sits behind the bars: the weekends, a wash over what's already
 * past, the line for now (in the accent), and the launch (in the color of
 * how it stands: ink on time, warning when something lands after it,
 * success when everything's done).
 */
export function RunwayLines({ today, now, first, last, launch, verdict }: { today: number; now: number; first: number; last: number; launch: number; verdict: Verdict }) {
  const count = last - first + 1
  const pct = (day: number) => `${((day - first) / count) * 100}%`
  const days = Array.from({ length: count }, (_, i) => first + i)
  const nowAt = -first + (now - today) / 86_400_000
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {days.map((day) => (
        <span key={day} className={cn('absolute inset-y-0 border-s border-line-subtle', isWeekend(today, day) && 'bg-well')} style={{ insetInlineStart: pct(day), width: pct(first + 1) }} />
      ))}
      <span className="absolute inset-y-0 start-0 bg-transparent" style={{ width: `${(nowAt / count) * 100}%` }} />
      <span className="absolute inset-y-0 w-px bg-accent" style={{ insetInlineStart: `${(nowAt / count) * 100}%` }}>
        <span className="absolute -top-1 -start-[3px] size-[7px] rounded-full bg-accent" />
      </span>
      <span
        className={cn(
          'absolute inset-y-0 w-0.5 -translate-x-1/2 transition-colors yj-duration-slow ease-standard rtl:translate-x-1/2',
          verdict.kind === 'late' ? 'bg-warning' : verdict.kind === 'ready' ? 'bg-success' : 'bg-fg',
        )}
        style={{ insetInlineStart: `calc(${pct(launch)} + ${((9 / 24) * 100) / count}%)` }}
      />
    </div>
  )
}
