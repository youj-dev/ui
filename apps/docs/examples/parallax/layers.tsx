'use client'

import { useRef } from 'react'
import { Parallax } from '@youj/motion'
import { CheckCircleIcon } from '@youj/icons'

export default function ParallaxLayers() {
  const frame = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={frame}
      role="region"
      aria-label="Deploy preview"
      tabIndex={0}
      className="relative h-[300px] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <div className="relative mx-auto my-24 h-72 w-72 max-w-full">
        {/* Far: the browser window barely moves. */}
        <Parallax container={frame} y={[30, -30]} className="absolute inset-x-0 top-6 rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex gap-1.5 border-b border-line px-3 py-2.5">
            {[0, 1, 2].map((dot) => (
              <span key={dot} aria-hidden className="size-2 rounded-full bg-raised" />
            ))}
          </div>
          <div aria-hidden className="space-y-2 p-4">
            <div className="h-3 w-2/3 rounded bg-raised" />
            <div className="h-3 w-full rounded bg-raised" />
            <div className="h-3 w-5/6 rounded bg-raised" />
            <div className="mt-4 h-20 rounded-lg bg-accent-subtle" />
          </div>
        </Parallax>
        {/* Middle: the toast drifts further. */}
        <Parallax
          container={frame}
          y={[110, -110]}
          className="absolute -end-4 top-44 flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 shadow-md"
        >
          <CheckCircleIcon size={16} className="text-success" />
          <span className="text-xs font-medium text-fg">Deployed in 38s</span>
        </Parallax>
        {/* Near: the badge moves most, and a little sideways. */}
        <Parallax
          container={frame}
          y={[190, -190]}
          x={[-12, 12]}
          className="absolute -start-3 top-2 rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] font-medium text-on-accent shadow-md"
        >
          main · 4f2a91c
        </Parallax>
      </div>
    </div>
  )
}
