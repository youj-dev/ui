'use client'

import { Sparkline } from '@youj/react'

const REGIONS = [
  { name: 'us-east', cpu: [42, 48, 51, 47, 55, 61, 58, 64] },
  { name: 'eu-west', cpu: [18, 21, 19, 24, 22, 26, 25, 27] },
]

/* With `domain`, both lines share one scale, so the quieter region reads as quieter. */
export default function SparklineDomain() {
  return (
    <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
      {REGIONS.map((region) => (
        <figure key={region.name} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <figcaption className="flex justify-between text-ui-sm">
            <span className="text-fg-muted">{region.name}</span>
            <span className="font-medium text-fg tabular-nums">{region.cpu[region.cpu.length - 1]}% CPU</span>
          </figcaption>
          <Sparkline data={region.cpu} domain={[0, 100]} className="h-12" label={`${region.name} CPU over the last 8 hours, of 100%`} />
        </figure>
      ))}
    </div>
  )
}
