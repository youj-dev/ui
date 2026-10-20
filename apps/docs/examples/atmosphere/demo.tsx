'use client'

import { useState } from 'react'
import { cinnabar, meadow, sandstone, ThemeScope, umber } from '@youj/core'
import { Atmosphere, type AtmosphereScene } from '@youj/motion/backgrounds'
import { SegmentedControl, SegmentedControlItem, StatBreakdown, StatCard } from '@youj/react'

// Each scene with the preset of its name: the card's colors come from the same Wada combination as the ground.
const PRESETS = { meadow, sandstone, cinnabar, umber }

const SOURCES = [
  { label: 'Direct', value: 7012 },
  { label: 'Search', value: 4969 },
  { label: 'Referral', value: 3129 },
  { label: 'Social', value: 2025 },
  { label: 'Email', value: 1271 },
]

export default function AtmosphereDemo() {
  const [scene, setScene] = useState<AtmosphereScene>('meadow')
  return (
    <ThemeScope theme={PRESETS[scene]}>
      <section className="relative isolate grid min-h-[440px] w-full place-items-center gap-5 overflow-hidden px-6 py-10 rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
        <Atmosphere scene={scene} />
        <StatCard
          className="w-full max-w-sm shadow-xl"
          label="Visitors by source"
          value={18406}
          delta={0.124}
          comparison="vs. last week"
          chart={<StatBreakdown parts={SOURCES} />}
        />
        <SegmentedControl aria-label="Scene" value={scene} onValueChange={(value) => setScene(value as AtmosphereScene)} className="shadow-lg">
          {Object.keys(PRESETS).map((id) => (
            <SegmentedControlItem key={id} value={id} className="capitalize">
              {id}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </section>
    </ThemeScope>
  )
}
