'use client'

import { CellBar } from '@youj/react'

const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`

export default function CellBarQuarters() {
  return (
    <div className="w-full max-w-lg">
      <CellBar
        cells={[
          { label: 'Q1', value: 4180 },
          { label: 'Q2', value: 4620 },
          { label: 'Q3', value: 5240 },
          { label: 'Q4', value: 5710, projected: true },
        ]}
        target={18400}
        targetLabel="Plan"
        tone="chart-2"
        captions
        formatValue={usd}
        label="Spend by quarter"
      />
    </div>
  )
}
