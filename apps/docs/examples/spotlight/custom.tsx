'use client'

import { useRef } from 'react'
import { useSpotlight } from '@youj/motion'

const STATS = [
  { label: 'Regions', value: '18' },
  { label: 'Median latency', value: '42 ms' },
  { label: 'Cache hit rate', value: '96.4%' },
]

export default function SpotlightCustom() {
  const ref = useRef<HTMLDivElement>(null)
  // Only the tracker: it writes --yj-spot-x and --yj-spot-y onto this element for the CSS below.
  useSpotlight(ref)

  return (
    <div ref={ref} data-yj-spot-card="" className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface">
      {/* The resting dot grid, in the line color. */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--color-line-strong)_1px,transparent_1px)] [background-size:14px_14px]"
      />
      {/* The same grid in the accent, masked to a circle around the pointer. */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:14px_14px] [mask-image:radial-gradient(150px_circle_at_var(--yj-spot-x,-999px)_var(--yj-spot-y,-999px),black,transparent)]"
      />
      <div className="relative flex h-56 flex-col justify-between p-5">
        <div>
          <p className="text-sm font-medium text-fg">Edge network</p>
          <p className="mt-0.5 text-sm text-fg-muted">Every request is served from the region nearest the visitor.</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-fg-muted">{s.label}</dt>
              <dd className="font-mono text-lg font-medium text-fg">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
