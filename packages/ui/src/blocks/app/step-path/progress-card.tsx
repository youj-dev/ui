'use client'

import { Counter } from '@youj/motion'
import { FlameIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { SegmentedMeter } from '../../../components/ui/segmented-meter'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { WEEK_START, todayOf, type StepPathCopy, type StepPathLevel } from './data'

interface ProgressCardProps {
  points: number
  /** Points earned each day this week, Monday first; null for days to come. */
  week: (number | null)[]
  /** Days in a row, today included once it's done. */
  streak: number
  level: StepPathLevel
  /** Points a day aims for. */
  goal: number
  /** Intl.NumberFormat options for every figure of points. */
  format?: Intl.NumberFormatOptions
  copy: StepPathCopy
  /** The heading level under the block's title. */
  heading: 'h2' | 'h3'
  /** While the course loads or fails to, every figure waits (skeleton) or is dashed, and the week is empty. */
  state?: 'loading' | 'error' | 'empty' | null
}

/** The figure that stands for one not there yet. */
function Waiting({ state, className }: { state: 'loading' | 'error' | 'empty'; className: string }) {
  return state === 'loading' ? <Skeleton className={className} /> : <span className="text-fg-subtle">—</span>
}

/** The learner's side of the course: total points toward the next level, the week's streak, and today's goal. */
function ProgressCard({ points, week, streak, level, goal, format, copy, heading: Heading, state = null }: ProgressCardProps) {
  // Today is the last day of the week with a figure.
  const today = todayOf(week)
  const earnedToday = week[today] ?? 0
  const kept = earnedToday > 0
  const day = dateTimeFormat(copy.locale, { weekday: 'narrow' })
  const long = dateTimeFormat(copy.locale, { weekday: 'long' })
  const num = numberFormat(copy.locale, format)
  const days = state ? week.map(() => null) : week

  return (
    <Card size="sm" className="w-full" aria-busy={state === 'loading' || undefined}>
      <CardHeader>
        <CardTitle>
          <Heading>{copy.progress}</Heading>
        </CardTitle>
        <CardDescription>{copy.week}</CardDescription>
        <CardAction>
          <span>{state ? <Waiting state={state} className="h-4 w-14" /> : copy.level(level.number)}</span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>{copy.total}</Eyebrow>
          <div className="flex items-baseline gap-1.5 font-mono text-4xl leading-none font-medium tracking-tight text-fg tabular-nums">
            {state ? (
              <Waiting state={state} className="h-9 w-32" />
            ) : (
              <>
                <Counter value={points} locale={copy.locale} from={points} format={format} />
                <span className="text-ui-lg text-fg-muted">{copy.points}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{copy.toLevel(level.number + 1)}</Eyebrow>
            <span className="font-mono text-ui text-fg tabular-nums">
              {state ? <Waiting state={state} className="inline-block h-4 w-24 align-middle" /> : copy.toGo(num.format(Math.max(0, level.to - points)))}
            </span>
          </div>
          <SegmentedMeter aria-label={copy.toLevel(level.number + 1)} value={state ? level.from : points} min={level.from} max={level.to} segments={25} format={{}} locale={copy.locale} tone="accent" showValue={false} />
        </div>
      </CardContent>

      <CardContent className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>{copy.streak}</Eyebrow>
          <span className="flex items-center gap-1.5 font-mono text-ui-lg text-fg tabular-nums">
            <FlameIcon size={15} className={cn('self-center', kept && !state ? 'text-warning' : 'text-fg-muted')} />
            {state ? <Waiting state={state} className="inline-block h-4 w-14 align-middle" /> : copy.streakDays(streak)}
          </span>
        </div>
        <ol aria-label={copy.thisWeek} className="grid grid-cols-7 gap-1.5">
          {days.map((earned, i) => {
            const date = WEEK_START + i * 86_400_000
            const status = earned === null ? 'future' : earned > 0 ? 'done' : i === today ? 'today' : 'missed'
            return (
              <li key={i} data-state={status} className="flex flex-col items-center gap-1.5">
                {!state && <span className="sr-only">{copy.dayPoints(long.format(date), earned === null || (i === today && !earned) ? null : earned, `${num.format(earned ?? 0)} ${copy.points}`)}</span>}
                <span
                  aria-hidden
                  className={cn(
                    'grid aspect-square w-full max-w-9 place-items-center rounded-full transition-[background-color,color,box-shadow] yj-duration-slow ease-standard',
                    status === 'done' && 'bg-[color-mix(in_oklab,var(--color-warning)_22%,transparent)] text-warning shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-warning)_35%,transparent)]',
                    status === 'today' && 'text-warning shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--color-warning)_70%,transparent)] [background:repeating-conic-gradient(color-mix(in_oklab,var(--color-warning)_14%,transparent)_0_10deg,transparent_10deg_20deg)]',
                    status === 'missed' && 'bg-[color-mix(in_oklab,var(--color-fg)_6%,transparent)] text-fg-subtle',
                    status === 'future' && 'bg-[color-mix(in_oklab,var(--color-fg)_4%,transparent)]',
                  )}
                >
                  {status === 'done' || status === 'today' ? <FlameIcon size={14} /> : status === 'missed' ? <span className="h-px w-2.5 bg-current" /> : null}
                </span>
                <span aria-hidden className={cn('font-mono text-ui-xs', i === today && !state ? 'text-fg' : 'text-fg-muted')}>
                  {day.format(date)}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="text-ui-sm text-fg-muted">{state ? <Waiting state={state} className="inline-block h-3.5 w-48 align-middle" /> : kept ? copy.streakKept : copy.streakHint}</div>
      </CardContent>

      <CardContent className="flex flex-col gap-2.5">
        <div className="flex min-h-5.5 items-center justify-between gap-3">
          <Eyebrow>{copy.dailyGoal}</Eyebrow>
          {state ? (
            <Waiting state={state} className="h-4 w-16" />
          ) : earnedToday >= goal ? (
            <Badge variant="success">
              <BadgeDot />
              {copy.goalMet}
            </Badge>
          ) : (
            <span className="font-mono text-ui text-fg tabular-nums">
              {num.format(earnedToday)}
              <span className="text-fg-muted">
                /{num.format(goal)} {copy.points}
              </span>
            </span>
          )}
        </div>
        <SegmentedMeter aria-label={copy.dailyGoal} value={state ? 0 : Math.min(earnedToday, goal)} max={goal} segments={25} format={{}} locale={copy.locale} tone={!state && earnedToday >= goal ? 'success' : 'neutral'} showValue={false} />
      </CardContent>
    </Card>
  )
}

export { ProgressCard }
