'use client'

import { Stat, StatBars, StatBreakdown, StatDelta, StatGroup, StatNote, StatValue } from '../../../components/ui/stat-card'
import { cn } from '../../../lib/utils'
import { DEFAULT_COPY, type OrdersCopy } from './copy'
import { NOW, type Order } from './data'

/* The desk's four numbers, worked out from the orders themselves: orders by
 * the hour over the last day (yesterday's as ticks), paid revenue by day over
 * the week (last week's as ticks), what's waiting to go out split by how far
 * along it is, and returns by week. */

const HOUR = 3_600_000
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/** Counts (or sums) orders into `n` buckets of `size` ms that end `offset` ms before now, oldest first. */
function buckets(now: number, orders: Order[], n: number, size: number, offset = 0, weigh: (o: Order) => number = () => 1) {
  const out = Array.from({ length: n }, () => 0)
  const end = now - offset
  for (const o of orders) {
    const age = end - Date.parse(o.placedAt)
    if (age < 0 || age >= n * size) continue
    out[n - 1 - Math.floor(age / size)]! += weigh(o)
  }
  return out
}

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)
const change = (now: number, before: number) => (before ? (now - before) / before : undefined)

interface OrderStatsProps {
  orders: Order[]
  loading: boolean
  copy?: OrdersCopy
  now?: number
  currency?: string
  className?: string
}

export function OrderStats({ orders, loading, copy = DEFAULT_COPY, now = NOW, currency = 'USD', className }: OrderStatsProps) {
  const compact = { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 } as const
  const paid = orders.filter((o) => o.payment === 'paid')
  const hourly = buckets(now, orders, 24, HOUR)
  const yesterday = buckets(now, orders, 24, HOUR, DAY)
  const daily = buckets(now, paid, 7, DAY, 0, (o) => o.total)
  const lastWeek = buckets(now, paid, 7, DAY, WEEK, (o) => o.total)
  const toPack = paid.filter((o) => o.fulfilment === 'unfulfilled').length
  const packed = paid.filter((o) => o.fulfilment === 'packed').length
  const returned = orders.filter((o) => o.fulfilment === 'returned')
  const weeklyReturns = buckets(now, returned, 8, WEEK)
  const fourWeeks = sum(weeklyReturns.slice(4))
  const fourBefore = sum(weeklyReturns.slice(0, 4))
  const ordersChange = change(sum(hourly), sum(yesterday))
  const revenueChange = change(sum(daily), sum(lastWeek))
  const returnsChange = change(fourWeeks, fourBefore)

  return (
    <StatGroup aria-label={copy.stats} className={cn('grid-cols-1 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <Stat label={copy.ordersToday} action={<span>{copy.hours24}</span>} loading={loading}>
        <StatValue value={sum(hourly)} />
        {ordersChange !== undefined ? <StatDelta value={ordersChange}>{copy.vsYesterday}</StatDelta> : <StatNote>{sum(hourly) ? copy.noneYesterday : copy.noneYet}</StatNote>}
        <StatBars data={hourly} previous={yesterday} label={copy.ordersByHour} />
      </Stat>
      <Stat label={copy.revenue} action={<span>{copy.days7}</span>} loading={loading}>
        <StatValue value={sum(daily)} format={compact} />
        {revenueChange !== undefined ? <StatDelta value={revenueChange}>{copy.vsLastWeek}</StatDelta> : <StatNote>{copy.paidOnly}</StatNote>}
        <StatBars data={daily} previous={lastWeek} tone="accent" label={copy.revenueByDay} />
      </Stat>
      <Stat label={copy.toShip} loading={loading}>
        <StatValue value={toPack + packed} unit={copy.orders(toPack + packed)} />
        <StatNote>{toPack + packed ? copy.waiting : copy.caughtUp}</StatNote>
        <StatBreakdown
          parts={[
            { label: copy.toPack, value: toPack, tone: 'warning' },
            { label: copy.packed, value: packed, tone: 'neutral' },
          ]}
        />
      </Stat>
      <Stat label={copy.returns} action={<span>{copy.weeks8}</span>} loading={loading}>
        <StatValue value={sum(weeklyReturns)} />
        {returnsChange !== undefined ? (
          <StatDelta value={returnsChange} invert>
            {copy.vsFourBefore}
          </StatDelta>
        ) : (
          <StatNote>{copy.noReturns}</StatNote>
        )}
        <StatBars data={weeklyReturns} label={copy.returnsByWeek} />
      </Stat>
    </StatGroup>
  )
}
