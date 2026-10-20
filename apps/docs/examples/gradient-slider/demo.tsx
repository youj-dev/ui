'use client'

import { useState } from 'react'
import { GradientSlider } from '@youj/react'

const ZONES = [{ label: 'Literal', to: 0.4 }, { label: 'Balanced', to: 0.95 }, { label: 'Exploratory' }]

export default function GradientSliderDemo() {
  const [creativity, setCreativity] = useState(0.65)
  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6">
      <GradientSlider label="Creativity" value={creativity} onValueChange={setCreativity} min={0} max={1.5} step={0.05} ticks={15} zones={ZONES} />
    </div>
  )
}
