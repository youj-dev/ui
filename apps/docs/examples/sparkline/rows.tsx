'use client'

import { Sparkline } from '@youj/react'

const SERVICES = [
  { name: 'api.acme.dev', trend: [120, 132, 128, 141, 150, 147, 162], color: 'var(--color-chart-1)' },
  { name: 'edge-eu-west', trend: [88, 84, 90, 79, 76, 81, 72], color: 'var(--color-chart-4)' },
  { name: 'cdn-assets', trend: [40, 41, 39, 44, 43, 46, 48], color: 'var(--color-chart-3)' },
]

export default function SparklineRows() {
  return (
    <ul className="w-full max-w-sm divide-y divide-line rounded-xl border border-line bg-surface text-ui">
      {SERVICES.map((row) => (
        <li key={row.name} className="flex items-center gap-4 px-4 py-2.5">
          <span className="flex-1 truncate">{row.name}</span>
          {/* Decorative: the number beside it says what the line shows. */}
          <Sparkline data={row.trend} color={row.color} area={false} className="h-6 w-24" />
          <span className="w-10 text-end text-fg-muted tabular-nums">{row.trend[row.trend.length - 1]}</span>
        </li>
      ))}
    </ul>
  )
}
