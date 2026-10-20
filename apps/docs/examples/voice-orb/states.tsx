'use client'

import { useState } from 'react'
import { SegmentedControl, SegmentedControlItem, Slider, VoiceOrb, type VoiceOrbState } from '@youj/react'

const STATES: VoiceOrbState[] = ['idle', 'listening', 'thinking', 'speaking']

export default function VoiceOrbStates() {
  const [state, setState] = useState<VoiceOrbState>('listening')
  const [level, setLevel] = useState(0.4)
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <VoiceOrb state={state} level={level} size="lg" />
      <SegmentedControl value={state} onValueChange={(value) => setState(value as VoiceOrbState)} aria-label="State">
        {STATES.map((s) => (
          <SegmentedControlItem key={s} value={s} className="capitalize">
            {s}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Slider aria-label="Level" value={level} onValueChange={(value) => setLevel(value as number)} min={0} max={1} step={0.01} className="w-56" />
    </div>
  )
}
