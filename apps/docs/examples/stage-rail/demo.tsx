'use client'

import { useEffect, useState } from 'react'
import { Button, StageRail, type Stage } from '@youj/react'

const fresh = (): Stage[] => [
  { id: 'build', name: 'Build', status: 'running', startedAt: Date.now(), estimate: 6000 },
  { id: 'test', name: 'Test', status: 'queued', estimate: 8000 },
  { id: 'deploy', name: 'Deploy', status: 'queued', estimate: 5000 },
]

export default function StageRailDemo() {
  const [stages, setStages] = useState(fresh)
  // Each stage passes when its usual time runs out, and hands over to the next.
  useEffect(() => {
    const timer = setInterval(() => {
      setStages((list) => {
        const index = list.findIndex((s) => s.status === 'running')
        const stage = list[index]
        if (!stage || Date.now() - (stage.startedAt ?? 0) < (stage.estimate ?? 0)) return list
        return list.map((s, i) =>
          i === index ? { ...s, status: 'passed', duration: Date.now() - (s.startedAt ?? 0) } : i === index + 1 ? { ...s, status: 'running', startedAt: Date.now() } : s,
        )
      })
    }, 250)
    return () => clearInterval(timer)
  }, [])
  const done = stages.every((s) => s.status === 'passed')
  return (
    <div className="flex w-full max-w-xl flex-col items-start gap-4">
      <StageRail stages={stages} />
      <Button size="sm" variant="secondary" disabled={!done} onClick={() => setStages(fresh())}>
        Run again
      </Button>
    </div>
  )
}
