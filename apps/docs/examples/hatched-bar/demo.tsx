'use client'

import { Hatch, HatchedBar } from '@youj/react'

const RUNS = [84.1, 86.9, 85.2, 90.4, 88.6, 91.2, 87.9, 90.8, 92.5, 91.7, 90.9, 92.2, 90.7, 93.1]
const GATE = 90
const scale = (rate: number) => (rate - 80) / 20

export default function HatchedBarDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 text-ui">
      <div className="relative h-32">
        <div aria-hidden className="absolute inset-x-0 border-t border-dashed border-(--color-success)" style={{ bottom: `${scale(GATE) * 100}%` }} />
        <div className="absolute inset-0 flex items-end gap-2">
          {RUNS.map((rate, i) => (
            <HatchedBar
              key={i}
              value={scale(rate)}
              fill={rate < GATE ? 'hatched' : 'solid'}
              tone={i === RUNS.length - 1 ? 'success' : 'neutral'}
              label={`Run ${i + 1}`}
              valueText={`${rate}%`}
              className="h-full w-auto flex-1"
            />
          ))}
        </div>
      </div>
      <div className="flex gap-4 text-ui-sm text-fg-muted">
        <span className="flex items-center gap-1.5">
          <Hatch className="size-3" /> Below the {GATE}% gate
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[2px] bg-success" /> Latest run
        </span>
      </div>
    </div>
  )
}
