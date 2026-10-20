'use client'

import { useState } from 'react'
import { Button, Sparkline } from '@youj/react'

/** A random walk: the next minute of traffic. */
function walk(n: number, start = 40) {
  const out = [start]
  for (let i = 1; i < n; i++) out.push(Math.max(4, out[i - 1]! + (Math.random() - 0.45) * 12))
  return out.map(Math.round)
}

const INITIAL = [38, 42, 40, 47, 45, 51, 49, 56, 54, 60, 58, 63, 61, 67, 70, 72]

export default function SparklineDemo() {
  const [data, setData] = useState(INITIAL)
  const latest = data[data.length - 1]!
  return (
    <div className="flex w-72 flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-ui-sm text-fg-muted">Requests per minute</span>
        <span className="text-ui-lg font-semibold text-fg tabular-nums">{latest}</span>
      </div>
      <Sparkline data={data} className="h-14" label={`Requests per minute, now ${latest}`} />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setData((d) => walk(16, d[d.length - 1]))}>
        New data
      </Button>
    </div>
  )
}
