'use client'

import { GradientSlider } from '@youj/react'

export default function GradientSliderTones() {
  return (
    <div className="grid w-full max-w-md gap-8 rounded-2xl border border-line bg-surface p-6">
      <GradientSlider label="Glow" tone="accent" defaultValue={62} zones={[{ label: 'Subtle', to: 33 }, { label: 'Present', to: 66 }, { label: 'Vivid' }]} />
      {/* Status colours only where the far end really is a risk. */}
      <GradientSlider
        label="Auto-merge threshold"
        tone="status"
        defaultValue={0.2}
        min={0}
        max={1}
        step={0.01}
        format={{ style: 'percent' }}
        zones={[{ label: 'Reviewed', to: 0.3 }, { label: 'Sampled', to: 0.7 }, { label: 'Unchecked' }]}
      />
    </div>
  )
}
