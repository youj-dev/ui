'use client'

import { useEffect, useState } from 'react'
import { Progress, ProgressLabel, ProgressValue } from '@youj/react'

// A render that measures its frames, then finalizes with no number to show.
const STEPS = [4, 9, 6, 12, 3, 8, 11, 5, 7, 10, 6, 9, 10]

export default function ProgressTicks() {
  const [step, setStep] = useState(0)
  const rendered = Math.min(100, STEPS.slice(0, step).reduce((sum, n) => sum + n, 0))

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s > STEPS.length + 4 ? 0 : s + 1)), 480)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="grid w-full max-w-md gap-6 rounded-xl border border-line bg-surface p-5">
      <Progress variant="ticks" value={rendered}>
        <ProgressLabel>Rendering frames</ProgressLabel>
        <ProgressValue />
      </Progress>
      {/* Indeterminate: a wave of lit ticks travels until there is a number. */}
      <Progress variant="ticks" size="sm" ticks={56} tone="neutral" value={rendered < 100 ? null : 100}>
        <ProgressLabel>{rendered < 100 ? 'Waiting to encode' : 'Encoded'}</ProgressLabel>
      </Progress>
    </div>
  )
}
