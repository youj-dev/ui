'use client'

import { useState } from 'react'
import { Button, DayRing, findOverlaps, type ScheduleJob } from '@youj/react'

const JOBS: ScheduleJob[] = [
  { id: 'backup', name: 'backup-db', runs: [120], duration: 40, tone: 'chart-1' },
  { id: 'reindex', name: 'reindex-search', runs: [150], duration: 25, tone: 'chart-2' },
  { id: 'sync', name: 'sync-crm', runs: [15, 255, 495, 735, 975, 1215], duration: 10, tone: 'chart-3' },
  { id: 'digest', name: 'send-digest', runs: [540], duration: 5, tone: 'chart-4' },
  { id: 'billing', name: 'billing-export', runs: [1210], duration: 15, tone: 'chart-5' },
]

export default function DayRingDemo() {
  const [highlight, setHighlight] = useState<string>()
  const overlaps = findOverlaps(JOBS)
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <DayRing jobs={JOBS} timeZone="UTC" highlight={highlight} className="w-72" />
      <div className="flex flex-wrap justify-center gap-1.5">
        {JOBS.map((job) => (
          <Button key={job.id} size="sm" variant={highlight === job.id ? 'secondary' : 'outline'} onClick={() => setHighlight((h) => (h === job.id ? undefined : job.id))}>
            {job.name}
          </Button>
        ))}
      </div>
      <p className="font-mono text-ui-sm text-fg-muted">{overlaps.length} overlaps today</p>
    </div>
  )
}
