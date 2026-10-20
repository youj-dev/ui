'use client'

import { useState } from 'react'
import { NoiseField } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

const DENSITIES = ['8', '14', '24']
const INTENSITIES = ['0.6', '1', '1.4']

function Setting({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-fg-muted">{label}</span>
      {/* A segmented group can't be emptied: ignore the press that would unselect the current value. */}
      <ToggleGroup variant="segmented" size="sm" aria-label={label} value={[value]} onValueChange={(next) => next[0] && onChange(next[0])}>
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option} className="px-2.5 font-mono text-xs">
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export default function NoiseFieldTuning() {
  const [density, setDensity] = useState('14')
  const [intensity, setIntensity] = useState('1')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[260px] overflow-hidden">
        <NoiseField density={Number(density)} intensity={Number(intensity)} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line bg-canvas px-4 py-3">
        <Setting label="Density" options={DENSITIES} value={density} onChange={setDensity} />
        <Setting label="Intensity" options={INTENSITIES} value={intensity} onChange={setIntensity} />
      </div>
    </div>
  )
}
