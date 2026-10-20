'use client'

import type { ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { MonthForecastCopy } from './data'

/** The theme's label voice (mono capitals in Bezel), so Classic keeps it too. */
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
/** A recessed well: under the surface in dark, a faint gray in light. */
/** The headline figure, large in mono. */
const HEADLINE = 'self-start font-mono text-[2.5rem] leading-none font-medium'
const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'

/** What the figures show: the numbers, skeletons while loading, or a dash when there is nothing (a failure, no data). */
type ProjectionStatus = 'ready' | 'loading' | 'idle'

interface ProjectionProps {
  copy: MonthForecastCopy
  status: ProjectionStatus
  /** The scenario switch, over the figure. */
  control: ReactNode
  /** Where the period lands, and its likely range. */
  projected: number
  low: number
  high: number
  budget: number
  spent: number
  /** Average spend per elapsed day. */
  burn: number
  daysLeft: number
  /** Your own `format` writes the headline as text; without one it is a rolling Counter in the copy's currency. */
  custom: boolean
  /** Whole amounts. */
  money: (amount: number) => string
}

/** The month-end projection, large with its cents muted, how far it lands from the budget, and the figures behind it in a well. */
function Projection({ copy, status, control, projected, low, high, budget, spent, burn, daysLeft, custom, money }: ProjectionProps) {
  const over = projected > budget
  const ready = status === 'ready'
  const none = (width: string) => (status === 'loading' ? <Skeleton className={cn('h-4', width)} /> : <span className="text-fg-subtle">—</span>)
  const rows = [
    { label: copy.spent, value: ready ? money(spent) : none('w-16') },
    { label: copy.budget, value: ready ? money(budget) : none('w-16') },
    { label: copy.burn, value: ready ? money(burn) : none('w-12') },
    { label: copy.daysLeft, value: ready ? numberFormat(copy.locale).format(daysLeft) : none('w-8') },
  ]
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_--spacing(62)] sm:gap-8">
      {/* The switch at the top, the figure at the foot: the column spans the well's height. */}
      <div className="flex min-w-0 flex-col justify-between gap-6">
        {control}
        <div className="flex min-w-0 flex-col gap-3">
          <Eyebrow className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.projected}</Eyebrow>
          {ready ? (
            custom ? (
              <span className={cn(HEADLINE, 'tracking-[-0.03em] text-fg tabular-nums')}>{money(projected)}</span>
            ) : (
              <Counter
                value={projected}
                mode="roll"
                locale={copy.locale}
                format={{ style: 'currency', currency: copy.currency }}
                className={cn(HEADLINE, 'tracking-[-0.03em] text-fg [&_[data-part=decimal]]:text-fg-muted [&_[data-part=fraction]]:text-fg-muted')}
              />
            )
          ) : status === 'loading' ? (
            <Skeleton className="h-10 w-52 self-start" />
          ) : (
            <span className={cn(HEADLINE, 'text-fg-subtle')}>—</span>
          )}
          <div className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-2">
            {ready ? (
              <>
                <Badge variant={over ? 'danger' : 'success'} className="tabular-nums">
                  <BadgeDot />
                  {over ? copy.over(money(projected - budget)) : copy.under(money(budget - projected))}
                </Badge>
                <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.likely(money(low), money(high))}</span>
              </>
            ) : status === 'loading' ? (
              <Skeleton className="h-5 w-40" />
            ) : null}
          </div>
        </div>
      </div>
      <dl className={cn('flex flex-col rounded-xl px-4 py-1', WELL)}>
        {rows.map((row, i) => (
          <div key={row.label} className={cn('flex items-baseline justify-between gap-4 py-2.5', i > 0 && 'border-t border-line')}>
            <Eyebrow render={<dt />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
              {row.label}
            </Eyebrow>
            <dd className="font-mono text-ui text-fg tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { Projection, type ProjectionStatus }
