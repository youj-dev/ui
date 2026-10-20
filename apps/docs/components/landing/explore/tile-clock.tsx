'use client'

import { WorldClock, type WorldClockZone } from '@youj/react'
import { Demo, TileCard } from './demo'

const OFFICES: WorldClockZone[] = [
  { timeZone: 'America/Sao_Paulo', label: 'São Paulo' },
  { timeZone: 'Europe/Stockholm', label: 'Stockholm' },
  { timeZone: 'Asia/Tokyo', label: 'Tokyo' },
]

/** Three offices following the clock, one line each. */
export default function ClockTile() {
  return (
    <Demo>
      <TileCard className="max-w-xl gap-0 p-4">
        <WorldClock zones={OFFICES} compact hourCycle={24} />
      </TileCard>
    </Demo>
  )
}
