'use client'

import { useState } from 'react'
import { SeatMap, type SeatMapRow, type SeatMapTier } from '@youj/react'

const TIERS: SeatMapTier[] = [
  { id: 'front', name: 'Front stalls', price: 68 },
  { id: 'stalls', name: 'Stalls', price: 48 },
  { id: 'rear', name: 'Rear', price: 32 },
]

const TAKEN = new Set(['A4', 'A5', 'A6', 'B6', 'B7', 'C1', 'C2', 'C9', 'D5', 'D6', 'E10', 'F3', 'F4', 'F11', 'G7', 'G8'])
const ROWS: SeatMapRow[] = 'ABCDEFG'.split('').map((letter, r) => ({
  id: letter,
  label: letter,
  seats: Array.from({ length: 12 }, (_, i) => ({
    id: `${letter}${i + 1}`,
    number: i + 1,
    tier: r < 2 ? 'front' : r < 5 ? 'stalls' : 'rear',
    unavailable: TAKEN.has(`${letter}${i + 1}`),
  })),
}))

export default function SeatMapDemo() {
  const [picked, setPicked] = useState(['D8', 'D9'])
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' })
  const total = picked.reduce((sum, id) => sum + (TIERS.find((t) => t.id === ROWS.flatMap((r) => r.seats).find((s) => s.id === id)?.tier)?.price ?? 0), 0)
  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <SeatMap rows={ROWS} tiers={TIERS} aisles={[3, 9]} value={picked} onValueChange={setPicked} max={6} locale="en-GB" />
      <p className="flex justify-between border-t border-line pt-3 font-mono text-ui-sm text-fg-muted tabular-nums">
        <span>{picked.join(' · ') || 'No seats yet'}</span>
        <span className="text-fg">{money.format(total)}</span>
      </p>
    </div>
  )
}
