'use client'

import type { ReactNode } from 'react'
import { Shimmer, type ShimmerOptions } from '@youj/motion'

const IDLE: NonNullable<ShimmerOptions['idle']>[] = ['subtle', 'visible', 'hidden']
const SPEED: NonNullable<ShimmerOptions['speed']>[] = ['slow', 'base', 'fast']

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs text-fg-muted">{label}</p>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </div>
  )
}

function Tile({ children, ...options }: ShimmerOptions & { children: string }) {
  return (
    <Shimmer {...options} className="grid h-16 place-items-center rounded-xl bg-surface">
      <code className="relative z-2 font-mono text-xs text-fg">{children}</code>
    </Shimmer>
  )
}

export default function ShimmerOptionsDemo() {
  // Hover a tile to intensify it. `hidden` only shows the light on hover and focus.
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Row label="idle">
        {IDLE.map((idle) => (
          <Tile key={idle} idle={idle}>
            {idle}
          </Tile>
        ))}
      </Row>
      <Row label="speed">
        {SPEED.map((speed) => (
          <Tile key={speed} speed={speed} idle="visible">
            {speed}
          </Tile>
        ))}
      </Row>
    </div>
  )
}
