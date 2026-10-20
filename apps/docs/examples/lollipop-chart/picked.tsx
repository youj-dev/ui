'use client'

import { useState } from 'react'
import { LollipopChart, type LollipopDatum } from '@youj/react'

/** A made-up bakery chain's shops, the share of the week's waste budget left. */
const SHOPS: LollipopDatum[] = [
  { id: 'dock', label: 'Dock Street', value: -0.42 },
  { id: 'park', label: 'Park Row', value: 0.18 },
  { id: 'mill', label: 'Mill Square', value: 0.64 },
  { id: 'bridge', label: 'Bridge End', value: -0.11 },
  { id: 'hill', label: 'Hill Road', value: 0.37 },
  { id: 'market', label: 'Market Hall', value: 0.81 },
].map((shop) => ({ ...shop, tone: shop.value < 0 ? 'danger' : shop.value < 0.25 ? 'warning' : 'success' }))

const percent = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`

export default function LollipopChartPicked() {
  const [picked, setPicked] = useState<string | null>('bridge')
  return (
    <div className="grid w-full max-w-lg gap-3">
      <LollipopChart
        data={SHOPS}
        sort="ascending"
        domain={[-1, 1]}
        ticks={[-1, -0.5, 0, 0.5, 1]}
        value={picked}
        onValueChange={setPicked}
        formatValue={percent}
        label="Waste budget left by shop"
      />
      <p className="text-ui-sm text-fg-muted">Picked: {SHOPS.find((shop) => shop.id === picked)?.label ?? 'none'}</p>
    </div>
  )
}
