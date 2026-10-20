'use client'

import { useState } from 'react'
import { FlowField } from '@youj/motion/backgrounds'
import { Label, Switch, ToggleGroup, ToggleGroupItem } from '@youj/react'

const SCALES = [
  { value: '0.6', label: 'Busy' },
  { value: '1', label: 'Default' },
  { value: '1.8', label: 'Broad' },
]
const TRAILS = [
  { value: '0.5', label: 'Short' },
  { value: '1', label: 'Default' },
  { value: '1.5', label: 'Long' },
]

export default function FlowFieldTuning() {
  const [scale, setScale] = useState('1')
  const [trail, setTrail] = useState('1')
  const [interactive, setInteractive] = useState(true)

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[260px] overflow-hidden">
        <FlowField scale={Number(scale)} trail={Number(trail)} interactive={interactive} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line bg-canvas px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Swirls</span>
          <ToggleGroup variant="segmented" size="sm" aria-label="Swirl size" value={[scale]} onValueChange={(next) => next[0] && setScale(next[0])}>
            {SCALES.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className="px-2.5 text-xs">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Trails</span>
          <ToggleGroup variant="segmented" size="sm" aria-label="Trail length" value={[trail]} onValueChange={(next) => next[0] && setTrail(next[0])}>
            {TRAILS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className="px-2.5 text-xs">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Label className="text-xs font-normal text-fg-muted">
          <Switch size="sm" checked={interactive} onCheckedChange={setInteractive} />
          Pointer
        </Label>
      </div>
    </div>
  )
}
