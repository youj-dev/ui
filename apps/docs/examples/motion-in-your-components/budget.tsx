'use client'

import { useState } from 'react'
import { YoujProvider, useYouj, useMotionBudget, type QualitySetting } from '@youj/core'
import { TextSplit } from '@youj/motion'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

const HEADLINE = 'Every letter of this long headline rises on its own beat'

function Headline() {
  const { quality, tier } = useMotionBudget()
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <TextSplit key={tier} by="chars" as="p" className="max-w-md text-2xl font-semibold tracking-tight text-balance text-fg">
        {HEADLINE}
      </TextSplit>
      <p className="font-mono text-xs text-fg-muted">
        quality “{quality}” · tier “{tier}” · {tier === 'low' ? 'the stagger fits into six steps' : 'one step per letter'}
      </p>
    </div>
  )
}

export default function MotionBudget() {
  const [quality, setQuality] = useState<QualitySetting>('auto')
  // A nested provider sets all three settings, so carry the outer speed and reduced motion in.
  const k = useYouj()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <ToggleGroup variant="segmented" aria-label="Quality" value={[quality]} onValueChange={(next) => next[0] && setQuality(next[0] as QualitySetting)}>
        <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
        <ToggleGroupItem value="high">High</ToggleGroupItem>
        <ToggleGroupItem value="low">Low</ToggleGroupItem>
      </ToggleGroup>
      <YoujProvider quality={quality} timeScale={k.timeScale} reducedMotion={k.reduced ? 'always' : 'user'}>
        <Headline />
      </YoujProvider>
    </div>
  )
}
