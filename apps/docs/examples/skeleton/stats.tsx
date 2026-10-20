'use client'

import { useEffect, useState } from 'react'
import { ContentSwap } from '@youj/motion'
import { RefreshIcon } from '@youj/icons'
import { Button, Skeleton } from '@youj/react'

// Each tile has its own query, and each one answers in its own time.
const STATS = [
  { label: 'Requests', value: '1.28M', change: '+12% from yesterday', latency: 600 },
  { label: 'Bandwidth', value: '48.2 GB', change: '+4% from yesterday', latency: 1400 },
  { label: 'Error rate', value: '0.03%', change: 'Same as yesterday', latency: 2300 },
]

function StatSkeleton() {
  return (
    <>
      <div className="flex h-8 items-center">
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex h-4 items-center">
        <Skeleton className="h-3 w-28 max-w-full" />
      </div>
    </>
  )
}

export default function SkeletonStats() {
  const [run, setRun] = useState(0)
  // The refresh each tile last answered. A tile waits until it has answered the latest one.
  const [answered, setAnswered] = useState<Record<string, number>>({})
  const waiting = STATS.some((stat) => answered[stat.label] !== run)

  useEffect(() => {
    const timers = STATS.map((stat) =>
      setTimeout(() => setAnswered((prev) => ({ ...prev, [stat.label]: run })), stat.latency),
    )
    return () => timers.forEach(clearTimeout)
  }, [run])

  return (
    <div className="@container w-full max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-ui-lg font-medium text-fg">Last 24 hours</p>
        <Button size="sm" variant="outline" onClick={() => setRun((r) => r + 1)}>
          <RefreshIcon />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 @md:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-4">
            {/* Known before the data, so the label stays real. Only the numbers wait. */}
            <p className="text-ui-sm text-fg-muted">{stat.label}</p>
            <ContentSwap loading={answered[stat.label] !== run} fallback={<StatSkeleton />} className="mt-1">
              <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{stat.value}</p>
              <p className="truncate text-ui-sm text-fg-muted">{stat.change}</p>
            </ContentSwap>
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">
        {waiting ? 'Loading the last 24 hours' : ''}
      </p>
    </div>
  )
}
