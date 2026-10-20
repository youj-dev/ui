'use client'

import { useState } from 'react'
import { Counter } from '@youj/motion'

export default function CounterRoll() {
  const [period, setPeriod] = useState(0)
  const stats = [
    { label: 'Revenue', value: 48210 + period * 1377, format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const },
    { label: 'Requests', value: 1_240_000_000 + period * 83_000_000, format: { notation: 'compact', maximumFractionDigits: 2 } as const },
    { label: 'Uptime', value: 0.9998 - period * 0.0003, format: { style: 'percent', minimumFractionDigits: 2 } as const },
  ]

  return (
    <div className="@container w-full max-w-xl">
      <div className="grid grid-cols-1 divide-y divide-line rounded-2xl border border-line bg-surface @lg:grid-cols-3 @lg:divide-x @lg:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5">
            <p className="text-xs text-fg-muted">{stat.label}</p>
            <Counter mode="roll" value={stat.value} format={stat.format} locale="en-US" className="mt-1.5 text-3xl font-semibold tracking-tight text-fg" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setPeriod((p) => p + 1)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Next period
        </button>
      </div>
    </div>
  )
}
