'use client'

import { useState } from 'react'
import { DotMap, type DotMapRegion } from '@youj/react'

const REGIONS: DotMapRegion[] = [
  { id: 'iad', name: 'iad', lon: -77.04, lat: 38.9, value: 12_400 },
  { id: 'fra', name: 'fra', lon: 8.68, lat: 50.11, value: 9_800 },
  { id: 'sfo', name: 'sfo', lon: -122.42, lat: 37.77, value: 8_900 },
  { id: 'nrt', name: 'nrt', lon: 139.69, lat: 35.68, value: 6_100 },
  { id: 'sin', name: 'sin', lon: 103.82, lat: 1.35, value: 4_300 },
  { id: 'gru', name: 'gru', lon: -46.63, lat: -23.55, value: 2_700, tone: 'warning' },
  { id: 'syd', name: 'syd', lon: 151.21, lat: -33.87, value: 1_900 },
]
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export default function DotMapDemo() {
  const [active, setActive] = useState<string | null>(null)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <DotMap regions={REGIONS} active={active} onActiveChange={setActive} label="Requests by region" formatValue={(v) => `${compact.format(v)} rps`} />
      {/* The list holds the figures; the map follows it. */}
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {REGIONS.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onFocus={() => setActive(r.id)}
              onBlur={() => setActive(null)}
              onPointerEnter={() => setActive(r.id)}
              onPointerLeave={() => setActive(null)}
              data-on={active === r.id}
              className="flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1.5 font-mono text-ui outline-none focus-visible:ring-2 focus-visible:ring-focus data-[on=true]:bg-hover"
            >
              {r.name}
              <span className="text-fg-muted tabular-nums">{compact.format(r.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
