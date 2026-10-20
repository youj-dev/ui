'use client'

import { ShareBar, type ShareBarTone } from '@youj/react'

const PLANS: { name: string; mrr: string; share: number; tone: ShareBarTone }[] = [
  { name: 'Business', mrr: '€41,630', share: 0.412, tone: 'accent' },
  { name: 'Team', mrr: '€29,810', share: 0.295, tone: 'chart-2' },
  { name: 'Enterprise', mrr: '€19,390', share: 0.192, tone: 'chart-3' },
  { name: 'Starter', mrr: '€7,960', share: 0.079, tone: 'warning' },
  { name: 'Legacy', mrr: '€2,230', share: 0.022, tone: 'neutral' },
]
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 })

export default function ShareBarDemo() {
  return (
    <ul className="flex w-full max-w-md flex-col divide-y divide-line rounded-xl border border-line bg-surface px-4 text-ui">
      {PLANS.map((row) => (
        <li key={row.name} className="flex items-center gap-4 py-2.5">
          <span className="w-24 truncate">{row.name}</span>
          <span className="w-16 text-end font-mono text-fg-muted tabular-nums">{row.mrr}</span>
          {/* The percentage beside it says the value, so the bar is decorative. */}
          <ShareBar value={row.share} segments={24} tone={row.tone} className="flex-1" />
          <span className="w-12 text-end font-mono tabular-nums">{pct.format(row.share)}</span>
        </li>
      ))}
    </ul>
  )
}
