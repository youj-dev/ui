'use client'

import { NoiseField } from '@youj/motion/backgrounds'

const REGIONS = [
  { name: 'Frankfurt', latency: '18 ms' },
  { name: 'Virginia', latency: '24 ms' },
  { name: 'Singapore', latency: '31 ms' },
]

// Summits in the success color, lines in a muted ink: a calm map for a calm status.
const COLORS: [string, string] = ['var(--color-fg-muted)', 'var(--color-success)']

export default function NoiseFieldStatus() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="relative isolate h-36 overflow-hidden border-b border-line">
        <NoiseField colors={COLORS} density={10} interactive={false} />
        <span className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 youj-allow-glass px-2.5 py-1 text-xs font-medium text-fg backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-success" />
          Live
        </span>
      </div>
      <div className="p-5">
        <p className="text-sm font-medium text-fg">All systems operational</p>
        <p className="mt-0.5 text-xs text-fg-muted">99.99% uptime over the last 90 days</p>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {REGIONS.map((region) => (
            <li key={region.name} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-fg">
                <span className="size-1.5 rounded-full bg-success" />
                {region.name}
              </span>
              <span className="font-mono text-xs text-fg-muted">{region.latency}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
