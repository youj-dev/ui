'use client'

import { Treemap } from '@youj/react'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format

export default function TreemapTones() {
  return (
    <Treemap
      className="w-full max-w-xl"
      aspect={2.6}
      label="Spend by line item"
      formatValue={usd}
      highlight="bandwidth"
      items={[
        { id: 'compute', name: 'Compute', value: 4200, tone: 'chart-1' },
        { id: 'database', name: 'Database', value: 2100, tone: 'chart-2' },
        { id: 'bandwidth', name: 'Bandwidth', value: 1500, tone: 'warning' },
        { id: 'support', name: 'Support', value: 900, tone: 'chart-3' },
        { id: 'failed', name: 'Failed jobs', value: 640, tone: 'danger' },
        { id: 'credits', name: 'Credits', value: 400, tone: 'success' },
      ]}
    />
  )
}
