'use client'

import { useState } from 'react'
import { SegmentedControl, SegmentedControlItem } from '@youj/react'

const TOTALS: Record<string, { visitors: string; change: string; up: boolean; period: string }> = {
  '24h': { visitors: '1,284', change: '+4.1%', up: true, period: 'the previous 24 hours' },
  '7d': { visitors: '9,630', change: '+12.8%', up: true, period: 'the previous 7 days' },
  '30d': { visitors: '41,907', change: '+8.3%', up: true, period: 'the previous 30 days' },
  '90d': { visitors: '118,442', change: '−2.4%', up: false, period: 'the previous 90 days' },
}

export default function SegmentedControlDemo() {
  const [range, setRange] = useState('7d')
  const total = TOTALS[range]!

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface">
      {/* The range runs the card's width as its header, so its hairline is the card's divider. */}
      <SegmentedControl aria-label="Range" value={range} onValueChange={setRange} className="w-full px-2">
        {Object.keys(TOTALS).map((r) => (
          <SegmentedControlItem key={r} value={r} className="flex-1">
            {r}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <div className="px-5 pt-4 pb-5">
        <p className="text-ui-sm text-fg-muted">Visitors</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-3xl font-semibold tracking-tight text-fg tabular-nums">{total.visitors}</p>
          <span className={`text-ui-sm font-medium tabular-nums ${total.up ? 'text-success-text' : 'text-danger-text'}`}>
            {total.change}
          </span>
        </div>
        <p className="mt-1 text-ui-sm text-fg-muted">vs {total.period}</p>
      </div>
    </div>
  )
}
