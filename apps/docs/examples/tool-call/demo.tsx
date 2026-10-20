'use client'

import { useEffect, useState } from 'react'
import { Button, ChatToolCall, type ChatToolStatus } from '@youj/react'
import { RefreshIcon } from '@youj/icons'

const RESULT = [
  { id: 'dpl_9f3a2c1', state: 'ready', region: 'iad1', builtIn: '38s' },
  { id: 'dpl_7c1e0b2', state: 'ready', region: 'fra1', builtIn: '41s' },
]

export default function ToolCallDemo() {
  const [status, setStatus] = useState<ChatToolStatus>('pending')
  const [run, setRun] = useState(0)

  // Queued, running, then done: the badge morphs, the check draws, and a preview of the result unfolds.
  useEffect(() => {
    setStatus('pending')
    const timers = [setTimeout(() => setStatus('running'), 700), setTimeout(() => setStatus('success'), 2200)]
    return () => timers.forEach(clearTimeout)
  }, [run])

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ChatToolCall
        name="get_deployments"
        args={{ project: 'orion', target: 'production', limit: 2 }}
        status={status}
        result={status === 'success' ? RESULT : undefined}
        duration={1480}
      />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setRun((n) => n + 1)}>
        <RefreshIcon size={14} strokeWidth={1.75} />
        Call again
      </Button>
    </div>
  )
}
