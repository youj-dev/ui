'use client'

import { WorldClock, type WorldClockZone } from '@youj/react'

const OFFICES: WorldClockZone[] = [
  { timeZone: 'America/Sao_Paulo', label: 'São Paulo' },
  { timeZone: 'Europe/Stockholm', label: 'Stockholm' },
  { timeZone: 'Asia/Tokyo', label: 'Tokyo' },
]

export default function WorldClockCompact() {
  // One line per office and a slim strip, for a sidebar or a card.
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <WorldClock zones={OFFICES} compact hourCycle={24} />
    </div>
  )
}
