'use client'

import type { ReactNode } from 'react'
import { Counter, Stagger } from '@youj/motion'
import { Progress } from '../../../components/ui/progress'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { UsageOverviewCopy } from './copy'

interface SummaryStripProps {
  copy: UsageOverviewCopy
  locale: string
  currency: string
  /** Month-to-date spend, the projected bill and the budget. */
  spent: number
  projected: number
  budget: number
  cycleDays: number
  today: number
  loading?: boolean
}

function SummaryStrip({ copy, locale, currency, spent, projected, budget, cycleDays, today, loading }: SummaryStripProps) {
  const share = budget > 0 ? spent / budget : 0
  const money = { style: 'currency', currency } as const
  const money0 = { style: 'currency', currency, maximumFractionDigits: 0 } as const
  const figure = (node: ReactNode, size: string) => (loading ? <Skeleton className={cn('w-32', size)} /> : node)
  return (
    <section aria-label={copy.cycle} aria-busy={loading || undefined} className="grid overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface md:grid-cols-[1.4fr_1fr_1fr]">
      <div role="group" aria-label={copy.monthToDate} className="flex flex-col gap-3 px-(--ui--panel-x) py-(--ui--panel-y)">
        <Eyebrow>{copy.monthToDate}</Eyebrow>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {figure(<Counter value={spent} locale={locale} format={money} className="text-4xl font-semibold tracking-tight text-fg" />, 'h-10')}
          <span className="text-ui text-fg-muted">
            {copy.ofBudget} <Counter value={budget} locale={locale} format={money0} /> {copy.budget}
          </span>
        </div>
        <Progress value={loading ? 0 : Math.round(share * 100)} aria-label={copy.budgetUsed} className="[&_[data-slot=progress-track]]:h-1" />
      </div>
      <div role="group" aria-label={copy.projected} className="flex flex-col gap-1 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) md:border-t-0 md:border-s">
        <Eyebrow>{copy.projected}</Eyebrow>
        {figure(<Counter value={projected} locale={locale} format={money0} className="text-2xl font-semibold tracking-tight text-fg" />, 'h-8')}
        <span className={cn('text-ui-sm', !loading && projected > budget ? 'text-warning-text' : 'text-fg-muted')}>
          {loading ? null : projected > budget ? copy.overBudget(numberFormat(locale, money0).format(projected - budget)) : copy.withinBudget}
        </span>
      </div>
      <div role="group" aria-label={copy.billingCycle} className="flex flex-col gap-2 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) md:border-t-0 md:border-s">
        <Eyebrow>{copy.resets}</Eyebrow>
        <span className="text-2xl font-semibold tracking-tight text-fg">
          <Counter value={cycleDays - today} locale={locale} mode="roll" /> <span className="text-ui font-normal text-fg-muted">{copy.daysLeft}</span>
        </span>
        {/* Two rows whatever the cycle's length: 30 days are 15 a row, 31 are 16 and 15. */}
        <Stagger aria-hidden step="tight" variant="scale" className="mt-auto grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(cycleDays / 2)}, minmax(0, 1fr))` }}>
          {Array.from({ length: cycleDays }, (_, i) => (
            <span key={i} className={cn('block aspect-square rounded-xs', i < today ? 'bg-accent' : 'bg-well', i === today - 1 && 'ring-2 ring-accent-line')} />
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export { SummaryStrip }
