'use client'

import { WaffleChart } from '@youj/react'
import { Demo, TileCard } from './demo'

/** A week's food waste in kilograms, by where it came from: one hex cell a kilo. */
const WASTE = [
  { id: 'trim', name: 'Trim', value: 18 },
  { id: 'plates', name: 'Plates', value: 13 },
  { id: 'bread', name: 'Bread', value: 9 },
]

/** A hex waffle gathered at the center, each part a wedge; point at a part in the legend and it lights. */
export default function WaffleTile() {
  return (
    <Demo>
      <TileCard className="max-w-64 gap-3 p-4">
        <WaffleChart items={WASTE} shape="hex" layout="cluster" columns={12} rows={6} label="Waste by source" formatValue={(v) => `${v} kg`} />
      </TileCard>
    </Demo>
  )
}
