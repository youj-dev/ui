'use client'

import { useState } from 'react'
import { Counter } from '@youj/motion'

const compact = { notation: 'compact', maximumFractionDigits: 1 } as const

export default function CounterLive() {
  const [requests, setRequests] = useState(1_240_000)

  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-fg-muted">Requests today</p>
      {/* A live region announces the settled value once, never the numbers in between. */}
      <p role="status" className="mt-1">
        <Counter value={requests} from={requests} inView={false} format={compact} locale="en-US" className="text-4xl font-semibold tracking-tight text-fg" />
      </p>
      <div className="mt-5 flex gap-2">
        {[25_000, 250_000].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setRequests((r) => r + step)}
            className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-fg transition-colors yj-duration-fast ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            +{new Intl.NumberFormat('en-US', compact).format(step)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-fg-muted">Press quickly: each count retargets from where it is.</p>
    </div>
  )
}
