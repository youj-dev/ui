'use client'

import { useState } from 'react'
import { BreakdownList, ShareBar, type BreakdownItem } from '@youj/react'
import { Demo } from './demo'

const CHANNELS: BreakdownItem[] = [
  { label: 'Direct', value: 61_420, tone: 'neutral' },
  { label: 'Partners', value: 38_960 },
  { label: 'Marketplace', value: 21_310 },
  { label: 'Resellers', value: 9_840 },
]
const EUR: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }

/** Bookings by channel: point at a row (or focus it) and its segment lights in the bar. */
export default function BreakdownTile() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <Demo>
      <section
        aria-label="Bookings by channel"
        className="flex w-full max-w-80 flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-xs"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-ui-sm text-fg-muted">This quarter</span>
          <span className="font-mono text-xl font-semibold tracking-tight tabular-nums">€131,530</span>
        </div>
        <ShareBar parts={CHANNELS.map((c) => ({ value: c.value, tone: c.tone }))} active={active} className="h-2" />
        <BreakdownList items={CHANNELS} format={EUR} active={active} onActiveChange={setActive} aria-label="Bookings by channel" />
      </section>
    </Demo>
  )
}
