'use client'

import { useEffect, useState } from 'react'
import { RocketIcon } from '@youj/icons'
import { Button, Progress, ProgressLabel, ProgressValue } from '@youj/react'

// The upload reports uneven chunks that add up to 100. Finalizing reports nothing until it's live.
const CHUNKS = [9, 14, 6, 17, 11, 8, 19, 16]
const STEP_MS = 420
const FINALIZE_MS = 2400

const LABELS = { uploading: 'Uploading 1,284 files', finalizing: 'Finalizing', live: 'Live on youj.io' }

export default function ProgressPhases() {
  const [run, setRun] = useState(0)
  const [phase, setPhase] = useState<keyof typeof LABELS>('uploading')
  const [uploaded, setUploaded] = useState(0)

  useEffect(() => {
    const timers = CHUNKS.map((_, i) =>
      setTimeout(() => setUploaded(CHUNKS.slice(0, i + 1).reduce((sum, n) => sum + n, 0)), (i + 1) * STEP_MS),
    )
    const uploadedAt = (CHUNKS.length + 1) * STEP_MS
    timers.push(setTimeout(() => setPhase('finalizing'), uploadedAt))
    timers.push(setTimeout(() => setPhase('live'), uploadedAt + FINALIZE_MS))
    return () => timers.forEach(clearTimeout)
  }, [run])

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
          <RocketIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui font-medium text-fg">youj-web</p>
          <p className="truncate text-ui-sm text-fg-muted">Production · 4f2a91c</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={phase !== 'live'}
          focusableWhenDisabled
          onClick={() => {
            setPhase('uploading')
            setUploaded(0)
            setRun((r) => r + 1)
          }}
        >
          Redeploy
        </Button>
      </div>
      {/* The upload can be measured and finalizing can't, so it's null until the deploy is live. */}
      <Progress value={phase === 'finalizing' ? null : uploaded} className="mt-4">
        <ProgressLabel>{LABELS[phase]}</ProgressLabel>
        <ProgressValue />
      </Progress>
      <p role="status" className="sr-only">
        {phase === 'live' ? 'Deployed to production.' : ''}
      </p>
    </div>
  )
}
