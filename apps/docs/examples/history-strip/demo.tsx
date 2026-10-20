'use client'

import { useState } from 'react'
import { SegmentedControl, SegmentedControlItem, HistoryStrip, type UptimeDay } from '@youj/react'

/** Ninety days ending 28 Sep 2026: quiet, a few short blips, and one long outage `outageAgo` days back. */
function history(outageAgo: number, seed: number): UptimeDay[] {
  let s = seed
  const random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 90 }, (_, i) => {
    const ago = 89 - i
    const date = new Date(2026, 8, 28 - ago)
    const outage = ago === outageAgo
    const minutes = outage ? 192 : ago > 0 && random() < 0.08 ? 1 + Math.floor(random() * 5) : 0
    return {
      date,
      uptime: 1 - minutes / 1440,
      downtimeMinutes: minutes,
      incidents: outage ? 1 : 0,
      ...(outage ? { note: 'Delivery queue stalled; backlog replayed' } : null),
    }
  })
}

const SERVICES = { 'api-gateway': history(23, 3), webhooks: history(41, 7), search: history(64, 11) }
type Service = keyof typeof SERVICES

export default function HistoryStripDemo() {
  const [service, setService] = useState<Service>('webhooks')
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <SegmentedControl aria-label="Service" value={service} onValueChange={(next) => setService(next as Service)} className="self-start">
        {(Object.keys(SERVICES) as Service[]).map((name) => (
          <SegmentedControlItem key={name} value={name} className="font-mono">
            {name}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      {/* A new service sweeps its colours across, oldest day to newest. */}
      <HistoryStrip days={SERVICES[service]} label={`Daily uptime, ${service}`} />
    </div>
  )
}
