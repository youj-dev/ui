'use client'

import { StatCard } from '@youj/react'

/* For latency, churn and cost, down is good: `invert` colors the change by
 * the news, while the arrow still follows the number. */
export default function StatCardInvert() {
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
      <StatCard
        label="Churn rate"
        value={0.031}
        delta={0.14}
        invert
        locale="en-US"
        comparison="vs. last quarter"
        format={{ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
      <StatCard
        label="Cloud spend"
        value={18420}
        previous={21300}
        invert
        locale="en-US"
        comparison="last month"
        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />
    </div>
  )
}
