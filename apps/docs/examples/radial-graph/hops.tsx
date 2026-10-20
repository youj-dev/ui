'use client'

import { useState } from 'react'
import { RadialGraph, SegmentedControl, SegmentedControlItem, type RadialGraphNode } from '@youj/react'

/** A person and the teams around them, two rings deep. */
const NODES: RadialGraphNode[] = [
  { id: 'design', label: 'Design', tone: 'chart-4' },
  { id: 'research', label: 'Research', tone: 'chart-4' },
  { id: 'platform', label: 'Platform', tone: 'chart-5' },
  { id: 'brand', label: 'Brand', via: 'design', tone: 'chart-4' },
  { id: 'motion', label: 'Motion', via: 'design', tone: 'chart-4', ring: 'solid', ringTone: 'accent', state: 'New this week' },
  { id: 'insights', label: 'Insights', via: 'research', tone: 'chart-4' },
  { id: 'infra', label: 'Infra', via: 'platform', tone: 'chart-5' },
  { id: 'data', label: 'Data', via: 'platform', tone: 'chart-5' },
]

export default function RadialGraphHops() {
  const [hops, setHops] = useState('2')
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <SegmentedControl variant="pill" aria-label="Rings" value={hops} onValueChange={setHops}>
        <SegmentedControlItem value="1">1 hop</SegmentedControlItem>
        <SegmentedControlItem value="2">2 hops</SegmentedControlItem>
      </SegmentedControl>
      <RadialGraph center={{ id: 'noor', label: 'Noor Haddad', tone: 'chart-2' }} nodes={NODES} hops={Number(hops)} label="Teams around Noor" />
    </div>
  )
}
