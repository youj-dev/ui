'use client'

import { useEffect, useState } from 'react'
import { Button, ChatReasoning, createTextStream } from '@youj/react'
import { RefreshIcon } from '@youj/icons'

const REASONING = `Comparing three regions on cold start, p95 and cost. The metrics tool has the last 7 days per region, and cost at 10M requests follows from the pricing table.

Most traffic comes from Europe, so **fra1** should win on both latency and cost. Check hnd1 anyway: Asia-Pacific is growing.`

const tokenize = (text: string) => text.match(/\s*\S{1,4}|\s+/g) ?? []

export default function ThinkingDemo() {
  const [stream] = useState(() => createTextStream())
  const [streaming, setStreaming] = useState(true)
  const [seconds, setSeconds] = useState<number>()
  const [run, setRun] = useState(0)

  // Streams open, then folds away to "Thought for Ns", N the time it really took (about 3s here). Open it again to read it.
  useEffect(() => {
    const tokens = tokenize(REASONING)
    const started = Date.now()
    let i = 0
    stream.set('')
    setStreaming(true)
    const timer = setInterval(() => {
      stream.append(tokens[i++]!)
      if (i < tokens.length) return
      clearInterval(timer)
      setSeconds((Date.now() - started) / 1000)
      setStreaming(false)
    }, 45)
    return () => clearInterval(timer)
  }, [run, stream])

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ChatReasoning content={stream} streaming={streaming} duration={seconds} />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setRun((n) => n + 1)} disabled={streaming} focusableWhenDisabled>
        <RefreshIcon size={14} strokeWidth={1.75} />
        Think again
      </Button>
    </div>
  )
}
