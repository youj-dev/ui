'use client'

import { useState } from 'react'
import { Button, SegmentedMeter, type SegmentedMeterThreshold } from '@youj/react'

const HOT: SegmentedMeterThreshold[] = [{ value: 80, tone: 'warning', label: 'High' }]

export default function SegmentedMeterDemo() {
  const [disk, setDisk] = useState(84)
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <SegmentedMeter label="Threads" value={47} thresholds={HOT} />
      <SegmentedMeter label="Disk" value={disk} thresholds={HOT} />
      <SegmentedMeter label="Backlog" value={870} max={2400} format={{}} />
      <div className="flex gap-2">
        {[52, 84, 96].map((v) => (
          <Button key={v} size="sm" variant={v === disk ? 'secondary' : 'outline'} onClick={() => setDisk(v)}>
            Disk {v}%
          </Button>
        ))}
      </div>
    </div>
  )
}
