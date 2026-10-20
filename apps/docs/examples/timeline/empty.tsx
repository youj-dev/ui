'use client'

import { Timeline } from '@youj/react'

export default function TimelineEmpty() {
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <Timeline events={[]} />
    </div>
  )
}
