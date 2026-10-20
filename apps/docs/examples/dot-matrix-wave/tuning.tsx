'use client'

import { useState } from 'react'
import { DotMatrixWave } from '@youj/motion/backgrounds'
import { Label, Switch, ToggleGroup, ToggleGroupItem } from '@youj/react'

const SPACINGS = ['14', '22', '32']

export default function DotMatrixWaveTuning() {
  const [spacing, setSpacing] = useState('22')
  const [ambient, setAmbient] = useState(true)

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[260px] overflow-hidden">
        <DotMatrixWave spacing={Number(spacing)} ambient={ambient} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line bg-canvas px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Spacing</span>
          <ToggleGroup variant="segmented" size="sm" aria-label="Spacing" value={[spacing]} onValueChange={(next) => next[0] && setSpacing(next[0])}>
            {SPACINGS.map((option) => (
              <ToggleGroupItem key={option} value={option} className="px-2.5 font-mono text-xs">
                {option}px
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Label className="text-xs font-normal text-fg-muted">
          <Switch size="sm" checked={ambient} onCheckedChange={setAmbient} />
          Ambient pulses
        </Label>
      </div>
    </div>
  )
}
