'use client'

import { useState } from 'react'
import { basalt, cinnabar, graphite, heather, meadow, seaglass, ThemeScope } from '@youj/core'
import { SegmentedControl, SegmentedControlItem, VoiceOrb } from '@youj/react'

const PRESETS = { basalt, graphite, cinnabar, seaglass, heather, meadow }
type PresetId = keyof typeof PRESETS

export default function VoiceOrbPalettes() {
  const [id, setId] = useState<PresetId>('cinnabar')
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <ThemeScope theme={PRESETS[id]}>
        <div className="grid w-full place-items-center rounded-2xl border border-line bg-canvas p-6 text-fg">
          <VoiceOrb state="thinking" size="xl" />
        </div>
      </ThemeScope>
      <SegmentedControl value={id} onValueChange={(value) => setId(value as PresetId)} aria-label="Theme">
        {Object.keys(PRESETS).map((preset) => (
          <SegmentedControlItem key={preset} value={preset} className="capitalize">
            {preset}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  )
}
