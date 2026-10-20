'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { Button, RadarChart } from '@youj/react'
import { useLoop } from '@/components/landing/use-loop'
import { Demo, TileCard, useInUse } from './demo'

const AXES = [
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'speed', label: 'Speed' },
  { id: 'safety', label: 'Safety' },
  { id: 'cost', label: 'Cost' },
  { id: 'recall', label: 'Recall' },
  { id: 'tools', label: 'Tools' },
]

const PROFILES = [
  { id: 'atlas', name: 'Atlas 2', values: [88, 56, 80, 48, 84, 72] },
  { id: 'quill', name: 'Quill S', values: [64, 92, 72, 86, 58, 66] },
]

/** Two assistants on six measures: the shape moves from one profile to the other, on its own or when you choose. */
export default function RadarTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const inUse = useInUse(root)
  const [which, setWhich] = useState(0)
  useLoop(root, k.ms('deliberate') * 9, () => !inUse && setWhich((w) => 1 - w))
  const profile = PROFILES[which]!
  return (
    <Demo>
      <div ref={root} className="w-full max-w-80">
        <TileCard className="gap-2 p-4">
          <div className="flex gap-1.5">
            {PROFILES.map((p, i) => (
              <Button key={p.id} size="sm" variant={i === which ? 'secondary' : 'ghost'} onClick={() => setWhich(i)}>
                {p.name}
              </Button>
            ))}
          </div>
          <RadarChart label="Assistant profile" axes={AXES} series={[{ ...profile, id: 'profile', tone: 'chart-4' }]} max={100} rings={4} />
        </TileCard>
      </div>
    </Demo>
  )
}
