'use client'

import { useState } from 'react'
import { ScoreRing, Switch } from '@youj/react'

/** Three scores without grades, so each shows its number, and a scan you can start. */
export default function ScoreRingGrades() {
  const [busy, setBusy] = useState(true)
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6">
        <ScoreRing value={88} size="sm" tone="chart-1" label="Uptime score" />
        <ScoreRing value={64} tone="chart-2" busy={busy} label="Coverage" />
        <ScoreRing value={512} max={850} size="sm" tone="chart-5" label="Credit score" />
      </div>
      <label className="flex items-center gap-2 text-ui text-fg-muted">
        <Switch size="sm" checked={busy} onCheckedChange={setBusy} />
        Scanning
      </label>
    </div>
  )
}
