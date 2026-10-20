'use client'

import { useState } from 'react'
import { BreakdownList, ShareBar, type BreakdownItem } from '@youj/react'

const CHANNELS: BreakdownItem[] = [
  { label: 'Direct', value: 61_420, tone: 'neutral' },
  { label: 'Partners', value: 38_960 },
  { label: 'Marketplace', value: 21_310 },
  { label: 'Resellers', value: 9_840 },
  { label: 'Other', value: 4_150 },
]
const EUR: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }

export default function BreakdownListDemo() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <section className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-ui-sm text-fg-muted">Bookings by channel, this quarter</span>
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">€135,680</span>
      </div>
      <ShareBar parts={CHANNELS.map((c) => ({ value: c.value, tone: c.tone }))} active={active} className="h-2" />
      <BreakdownList items={CHANNELS} format={EUR} active={active} onActiveChange={setActive} aria-label="Bookings by channel" />
    </section>
  )
}
