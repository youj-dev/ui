'use client'

import { useState } from 'react'
import { Swarm } from '@youj/motion/backgrounds'
import { Label, Switch, ToggleGroup, ToggleGroupItem } from '@youj/react'

const DENSITIES = [
  { value: '0.5', label: 'Few' },
  { value: '1', label: 'Default' },
  { value: '2', label: 'Many' },
]
const SIZES = [
  { value: '0.7', label: 'Small' },
  { value: '1', label: 'Default' },
  { value: '1.6', label: 'Large' },
]

export default function SwarmTuning() {
  const [density, setDensity] = useState('1')
  const [size, setSize] = useState('1')
  const [interactive, setInteractive] = useState(true)

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[260px] overflow-hidden">
        <Swarm density={Number(density)} size={Number(size)} interactive={interactive} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line bg-canvas px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Flock</span>
          <ToggleGroup
            variant="segmented"
            size="sm"
            aria-label="Flock size"
            value={[density]}
            onValueChange={(next) => next[0] && setDensity(next[0])}
          >
            {DENSITIES.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className="px-2.5 text-xs">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Boids</span>
          <ToggleGroup variant="segmented" size="sm" aria-label="Boid size" value={[size]} onValueChange={(next) => next[0] && setSize(next[0])}>
            {SIZES.map((option) => (
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
