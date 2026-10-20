'use client'

import { ScrollArea } from '@youj/react'

const STEPS = ['resolve', 'install', 'compile', 'bundle', 'optimize', 'upload']

// A deterministic build log, wider and taller than its box.
const LOG = Array.from({ length: 28 }, (_, i) => {
  const seconds = 130 + i * 2 // from 14:02:10
  const time = `14:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const level = i % 9 === 5 ? 'WARN' : 'INFO'
  const step = STEPS[i % STEPS.length]
  return `${time}  ${level}  step=${step} worker=${(i % 4) + 1} cache=${i % 3 ? 'hit' : 'miss'} route=/api/v2/projects/web/deployments/${(4096 + i * 37).toString(16)} took=${12 + ((i * 13) % 90)}ms`
})

export default function ScrollAreaBoth() {
  return (
    <ScrollArea orientation="both" aria-label="Build log" className="h-64 w-full max-w-xl rounded-xl border border-line bg-surface">
      <pre className="w-max p-4 font-mono text-ui-sm leading-6 text-fg-muted">{LOG.join('\n')}</pre>
    </ScrollArea>
  )
}
