'use client'

import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useInView } from 'motion/react'
import { SlidingIndicator } from '@youj/motion'
import { useYouj } from '@youj/core'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { cn, numberFormat } from '../../../lib/utils'
import type { Forecast, Goal, GoalsCopy, Status } from './data'

/* The goals as a radio group: each row its name and status, a track with
 * what's done (its colour), where it will land (a paler run on to the
 * forecast) and a notch for an even pace by today, then its progress and its
 * landing in words. The picked goal is the one the burn-up below draws; a
 * highlight glides to it. Arrow keys move the pick, Home and End jump. The
 * tracks fill from the start when they come into view, the forecast a beat
 * behind; reduced motion draws them in place. */

const BADGE: Record<Status, 'success' | 'warning' | 'danger' | 'secondary'> = {
  hit: 'success',
  ahead: 'success',
  'on-track': 'secondary',
  'at-risk': 'warning',
  behind: 'danger',
}

interface RowsProps {
  goals: Goal[]
  forecasts: Forecast[]
  selected: string
  onSelect: (id: string) => void
  figure: (goal: Goal, value: number) => string
  copy: GoalsCopy
}

function Rows({ goals, forecasts, selected, onSelect, figure, copy }: RowsProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 })

  const keys = (event: KeyboardEvent) => {
    const at = goals.findIndex((g) => g.id === selected)
    const to = { ArrowDown: at + 1, ArrowRight: at + 1, ArrowUp: at - 1, ArrowLeft: at - 1, Home: 0, End: goals.length - 1 }[event.key]
    if (to === undefined) return
    event.preventDefault()
    const next = goals[(to + goals.length) % goals.length]!
    onSelect(next.id)
    ref.current?.querySelector<HTMLElement>(`[data-yj-goal="${next.id}"]`)?.focus()
  }

  return (
    <div ref={ref} role="radiogroup" aria-label={copy.goals} data-slot="goals-list" className="relative isolate -mx-2 flex flex-col" onKeyDown={keys}>
      <SlidingIndicator className="rounded-lg bg-band" />
      {goals.map((goal, i) => {
        const f = forecasts[i]!
        const share = goal.target ? f.actual / goal.target : 0
        const lands = goal.target ? f.projected / goal.target : 0
        const pace = goal.target ? f.pace / goal.target : 0
        const progress = copy.of(figure(goal, f.actual), figure(goal, goal.target))
        const landing = f.status === 'hit' ? '' : copy.lands(figure(goal, f.projected))
        const color = `var(--color-${goal.tone ?? `chart-${(i % 5) + 1}`})`
        const checked = goal.id === selected
        return (
          <button
            key={goal.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            aria-label={copy.goal(goal.label, progress, percent.format(share), copy.status[f.status], landing || copy.status.hit)}
            data-yj-goal={goal.id}
            data-status={f.status}
            className="relative flex flex-col gap-2 rounded-lg px-2 py-2.5 text-start outline-hidden focus-ring"
            style={{ '--goal': color } as CSSProperties}
            onClick={() => onSelect(goal.id)}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-ui-sm font-medium text-fg">
                <span aria-hidden className="size-2.5 shrink-0 rounded-xs bg-(--goal)" />
                <span className="truncate">{goal.label}</span>
              </span>
              <Badge variant={BADGE[f.status]} className="shrink-0">
                <BadgeDot />
                {copy.status[f.status]}
              </Badge>
            </span>
            {/* The track: done in the goal's colour, the run to the forecast paler, a notch at an even pace by today. */}
            <span aria-hidden className="relative h-1.5 rounded-full bg-band">
              <span
                className={cn('absolute inset-y-0 start-0 w-full origin-left rounded-full bg-[color-mix(in_oklab,var(--goal)_32%,var(--color-surface))] rtl:origin-right', !k.reduced && 'transition-[scale] ease-enter yj-duration-deliberate')}
                style={{ scale: `${shown ? Math.min(1, lands) : 0} 1`, transitionDelay: shown && !k.reduced ? `${Math.round(k.ms('base'))}ms` : undefined }}
              />
              <span
                className={cn('absolute inset-y-0 start-0 w-full origin-left rounded-full bg-(--goal) rtl:origin-right', !k.reduced && 'transition-[scale] ease-enter yj-duration-deliberate')}
                style={{ scale: `${shown ? Math.min(1, share) : 0} 1` }}
              />
              {f.status !== 'hit' && <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-fg rtl:translate-x-1/2" style={{ insetInlineStart: `${Math.min(1, pace) * 100}%` }} />}
            </span>
            <span className="flex items-baseline justify-between gap-3 text-ui-xs text-fg-muted tabular-nums">
              <span className="truncate">
                <span className="text-fg">{progress}</span> · {percent.format(share)}
              </span>
              <span className="truncate">{landing}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { Rows }
