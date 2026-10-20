'use client'

import { useState } from 'react'
import { Button, LaneMeter, type Lane, type LaneItem } from '@youj/react'

const FAILED: LaneItem[] = [
  { id: 'job-8f2a1c', label: 'job-8f2a1c', detail: 'Timeout after 30 s' },
  { id: 'job-41be07', label: 'job-41be07', detail: 'SMTP 421: try again later' },
  { id: 'job-c93d58', label: 'job-c93d58', detail: 'Timeout after 30 s' },
  { id: 'job-0a7f12', label: 'job-0a7f12', detail: 'Rate limited by provider' },
  { id: 'job-5e61b9', label: 'job-5e61b9', detail: 'Template not found' },
]

export default function LaneMeterDemo() {
  const [failed, setFailed] = useState(FAILED)
  const [queued, setQueued] = useState(214)
  const retry = (items: LaneItem[]) => {
    const ids = new Set(items.map((i) => i.id))
    setFailed((list) => list.filter((i) => !ids.has(i.id)))
    setQueued((q) => q + items.length)
  }
  const lanes: Lane[] = [
    { id: 'queued', label: 'Queued', value: queued, max: 500 },
    { id: 'running', label: 'Running', value: 24, max: 32, tone: 'accent', active: true },
    {
      id: 'failed',
      label: 'Failed',
      value: failed.length,
      tone: 'danger',
      items: failed,
      action: (
        <Button size="xs" variant="secondary" disabled={failed.length === 0} onClick={() => retry(failed)}>
          Retry all
        </Button>
      ),
    },
    { id: 'done', label: 'Done', value: 12480, max: 16000, tone: 'success' },
  ]
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <LaneMeter lanes={lanes} format={{ notation: 'compact', maximumFractionDigits: 1 }} onItemAction={(item) => retry([item])} />
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => {
          setFailed(FAILED)
          setQueued(214)
        }}
      >
        Reset
      </Button>
    </div>
  )
}
