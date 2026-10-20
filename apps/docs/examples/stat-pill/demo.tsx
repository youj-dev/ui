'use client'

import { useEffect, useState } from 'react'
import { ActivityIcon, CpuIcon, HardDriveIcon } from '@youj/icons'
import { StatPill } from '@youj/react'

export default function StatPillDemo() {
  const [load, setLoad] = useState([31, 36, 33, 40, 37, 42])
  useEffect(() => {
    // A new reading every two seconds, like a live feed.
    const id = setInterval(() => setLoad((l) => [...l.slice(-7), 30 + Math.round(Math.random() * 16)]), 2000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <StatPill label="CPU" icon={<CpuIcon />} value={load[load.length - 1]!} unit="%" trend={load} />
      <StatPill label="Latency" icon={<ActivityIcon />} value={42} unit="ms" delta={-6} better="down" />
      <StatPill label="Cache" icon={<HardDriveIcon />} value={2.4} unit="GB" delta={0.3} />
    </div>
  )
}
