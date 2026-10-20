'use client'

import { useLocale } from '@youj/core'
import { Stat, StatBreakdown, StatDelta, StatGroup, StatMeter, StatNote, StatValue } from '../../../components/ui/stat-card'
import { cn, numberFormat } from '../../../lib/utils'
import { DEFAULT_COPY, SUMMARY, type Customer, type CustomersCopy, type CustomersSummary } from './data'

/* The book at a glance, on one panel: how many accounts and how they're
 * doing, MRR against the quarter's target with a notch where the pace says
 * it should be by this week, how much of it is at risk, and what renews this
 * month. Every figure is worked out from the accounts. */

interface CustomerStatsProps {
  customers: Customer[]
  loading: boolean
  copy?: CustomersCopy
  /** The quarter's target and last month's figures. */
  summary?: CustomersSummary
  locale?: string
  currency?: string
  className?: string
}

export function CustomerStats({ customers, loading, copy = DEFAULT_COPY, summary = SUMMARY, locale: localeProp, currency = 'USD', className }: CustomerStatsProps) {
  const locale = useLocale(localeProp)
  const { mrrTarget: TARGET, quarterPace: PACE, lastMonthCount: LAST_MONTH } = summary
  const usd = { style: 'currency', currency, maximumFractionDigits: 0 } as const
  const compact = { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 } as const
  const short = (n: number) => numberFormat(locale, compact).format(n)
  const count = (health: Customer['health']) => customers.filter((c) => c.health === health).length
  const mrr = customers.reduce((sum, c) => sum + c.mrr, 0)
  const risk = customers.filter((c) => c.health === 'at-risk' || c.health === 'churning')
  const riskMrr = risk.reduce((sum, c) => sum + c.mrr, 0)
  const overdue = customers.filter((c) => c.renewal === 'overdue')
  const month = customers.filter((c) => c.renewal === 'month')
  const renewingMrr = [...overdue, ...month].reduce((sum, c) => sum + c.mrr, 0)
  // An empty book has nothing to compare: the changes give way to notes.
  const any = customers.length > 0

  return (
    <StatGroup aria-label={copy.stats} className={cn('grid-cols-1 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <Stat label={copy.customers} loading={loading}>
        <StatValue value={customers.length} />
        {any ? <StatDelta value={LAST_MONTH ? (customers.length - LAST_MONTH) / LAST_MONTH : 0}>{copy.vsLastMonth}</StatDelta> : <StatNote>{copy.noAccounts}</StatNote>}
        <StatBreakdown
          parts={[
            { label: copy.health.healthy, value: count('healthy'), tone: 'neutral' },
            { label: copy.health.trial, value: count('trial'), tone: 'chart-1' },
            { label: copy.health['at-risk'], value: count('at-risk'), tone: 'warning' },
            { label: copy.health.churning, value: count('churning'), tone: 'danger' },
          ]}
        />
      </Stat>
      <Stat label={copy.mrr} loading={loading}>
        <StatValue value={mrr} format={compact} />
        {any ? <StatDelta value={summary.mrrChange}>{copy.vsLastMonth}</StatDelta> : <StatNote>{copy.nothingBilled}</StatNote>}
        <StatMeter value={mrr} max={TARGET} marker={TARGET * PACE} detail={mrr < TARGET ? copy.toGo(short(TARGET - mrr)) : undefined}>
          {copy.ofTarget(short(TARGET))}
        </StatMeter>
      </Stat>
      <Stat label={copy.atRisk} loading={loading}>
        <StatValue value={risk.length} unit={copy.accounts(risk.length)} />
        {any ? (
          <StatDelta value={summary.riskChange} invert>
            {copy.vsLastMonth}
          </StatDelta>
        ) : (
          <StatNote>{copy.nothingAtRisk}</StatNote>
        )}
        <StatMeter value={riskMrr} max={mrr || 1} tone="warning" detail={numberFormat(locale, usd).format(riskMrr)}>
          {copy.exposed}
        </StatMeter>
      </Stat>
      <Stat label={copy.renewing} loading={loading}>
        <StatValue value={overdue.length + month.length} unit={copy.accounts(overdue.length + month.length)} />
        <StatNote>{copy.upForRenewal(short(renewingMrr))}</StatNote>
        <StatBreakdown
          parts={[
            { label: copy.overdue, value: overdue.length, tone: 'danger' },
            { label: copy.dueThisMonth, value: month.length, tone: 'neutral' },
          ]}
        />
      </Stat>
    </StatGroup>
  )
}
