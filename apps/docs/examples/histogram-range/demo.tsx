'use client'

import { useState } from 'react'
import { HistogramRange } from '@youj/react'

/** Uploads per size bin, 0 to 64 MB in 40 bins: most files small, a long tail of big ones. */
const UPLOADS = Array.from({ length: 40 }, (_, i) => {
  const x = (i + 0.5) * (64 / 40)
  const mu = Math.log(9) + 0.62 ** 2
  return Math.round((Math.exp(-((Math.log(x) - mu) ** 2) / (2 * 0.62 ** 2)) / (x * 0.62 * Math.sqrt(2 * Math.PI))) * 48_600 * (64 / 40))
})

export default function HistogramRangeDemo() {
  const [range, setRange] = useState<[number, number]>([4.8, 38])

  return (
    <div className="w-full max-w-lg">
      <HistogramRange
        label="File size"
        bins={UPLOADS}
        min={0}
        max={64}
        step={0.1}
        value={range}
        onValueChange={setRange}
        format={(v) => `${v.toFixed(1)} MB`}
        formatTick={(v) => (v === 0 ? '0' : `${v} MB`)}
        ticks={[0, 16, 32, 48, 64]}
      />
    </div>
  )
}
