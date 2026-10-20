'use client'

import { useState } from 'react'
import { Button, Stat, StatBars, StatBreakdown, StatDelta, StatGroup, StatMeter, StatNote, StatValue } from '@youj/react'

const usd = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 } as const

interface Reading {
  mrr: number
  mrrChange: number
  orders: number[]
  lastWeek: number[]
  latency: number
  health: [number, number, number]
}

const FIRST: Reading = {
  mrr: 121_140,
  mrrChange: 0.064,
  orders: [182, 204, 197, 221, 236, 214, 248],
  lastWeek: [171, 188, 201, 194, 210, 205, 219],
  latency: 184,
  health: [41, 15, 8],
}

/** The next live reading: figures drift and the week gains a day. */
function next(r: Reading): Reading {
  const drift = (n: number, spread: number) => Math.max(0, Math.round(n * (1 + (Math.random() - 0.45) * spread)))
  return {
    mrr: drift(r.mrr, 0.04),
    mrrChange: Math.round((Math.random() - 0.3) * 200) / 1000,
    orders: [...r.orders.slice(1), drift(r.orders.at(-1)!, 0.2)],
    lastWeek: [...r.lastWeek.slice(1), drift(r.lastWeek.at(-1)!, 0.1)],
    latency: drift(r.latency, 0.18),
    health: [drift(r.health[0], 0.1), drift(r.health[1], 0.3), drift(r.health[2], 0.4)],
  }
}

export default function StatDesk() {
  const [r, setReading] = useState(FIRST)
  const [loading, setLoading] = useState(false)
  const orders = r.orders.reduce((a, b) => a + b, 0)
  const before = r.lastWeek.reduce((a, b) => a + b, 0)

  const refetch = () => {
    setLoading(true)
    setTimeout(() => {
      setReading(next)
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setReading(next)}>
          Next reading
        </Button>
        <Button variant="ghost" size="sm" onClick={refetch}>
          Refetch
        </Button>
      </div>
      <StatGroup aria-label="This week" className="grid-cols-1 sm:grid-cols-2">
        <Stat label="Monthly recurring revenue" loading={loading}>
          <StatValue locale="en-US" value={r.mrr} format={usd} />
          <StatDelta locale="en-US" value={r.mrrChange}>
            vs. last month
          </StatDelta>
          <StatMeter locale="en-US" value={r.mrr} max={130_000} marker={120_000}>
            of the $130K target
          </StatMeter>
        </Stat>
        <Stat label="Orders" action={<span>7 days</span>} loading={loading}>
          <StatValue locale="en-US" value={orders} />
          <StatDelta locale="en-US" value={(orders - before) / before}>
            vs. last week
          </StatDelta>
          <StatBars data={r.orders} previous={r.lastWeek} tone="accent" label="Orders by day this week, with last week's as ticks" />
        </Stat>
        <Stat label="p95 latency" loading={loading}>
          <StatValue locale="en-US" value={r.latency} format={{ style: 'unit', unit: 'millisecond', unitDisplay: 'short' }} />
          <StatDelta locale="en-US" value={(r.latency - 176) / 176} invert>
            vs. yesterday
          </StatDelta>
          <StatMeter locale="en-US" value={r.latency} max={250} tone={r.latency > 225 ? 'danger' : r.latency > 200 ? 'warning' : 'neutral'}>
            of the 250 ms budget
          </StatMeter>
        </Stat>
        <Stat label="Accounts" loading={loading}>
          <StatValue locale="en-US" value={r.health[0] + r.health[1] + r.health[2]} />
          <StatNote>by health</StatNote>
          <StatBreakdown
            locale="en-US"
            parts={[
              { label: 'Healthy', value: r.health[0], tone: 'neutral' },
              { label: 'At risk', value: r.health[1], tone: 'warning' },
              { label: 'Churning', value: r.health[2], tone: 'danger' },
            ]}
          />
        </Stat>
      </StatGroup>
    </div>
  )
}
