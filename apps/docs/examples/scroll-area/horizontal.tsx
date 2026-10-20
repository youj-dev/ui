'use client'

import { useId } from 'react'
import { Badge, ScrollArea } from '@youj/react'

const REGIONS = [
  { code: 'iad1', city: 'Washington, D.C.', latency: 18, primary: true },
  { code: 'sfo1', city: 'San Francisco', latency: 64 },
  { code: 'gru1', city: 'São Paulo', latency: 121 },
  { code: 'fra1', city: 'Frankfurt', latency: 92 },
  { code: 'cdg1', city: 'Paris', latency: 88 },
  { code: 'bom1', city: 'Mumbai', latency: 187 },
  { code: 'hnd1', city: 'Tokyo', latency: 162 },
  { code: 'syd1', city: 'Sydney', latency: 204 },
]

export default function ScrollAreaHorizontal() {
  const titleId = useId()

  return (
    <div className="w-full max-w-lg">
      <p id={titleId} className="mb-2 text-ui font-medium text-fg">
        Function regions
      </p>
      {/* Shift and the wheel, a trackpad, or focus the strip and use the arrow keys. */}
      <ScrollArea orientation="horizontal" aria-labelledby={titleId} className="rounded-xl border border-line bg-surface">
        <ul className="flex w-max gap-2 p-3">
          {REGIONS.map((region) => (
            <li key={region.code} className="flex w-36 shrink-0 flex-col gap-1 rounded-lg border border-line bg-canvas px-3 py-2.5">
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-ui-sm text-fg">{region.code}</span>
                {region.primary && <Badge>Primary</Badge>}
              </span>
              <span className="truncate text-ui-sm text-fg-muted">{region.city}</span>
              <span className="font-mono text-ui-xs text-fg-muted tabular-nums">{region.latency} ms</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
