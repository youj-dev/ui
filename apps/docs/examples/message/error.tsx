'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessage, createTextStream } from '@youj/react'

const ANSWER = `**fra1** has the fastest cold starts in Europe, at 131 ms. **hnd1** is slower (148 ms) but serves Asia-Pacific. For a mixed audience, run both and let routing pick the nearest.`

const tokenize = (text: string) => text.match(/\s*\S{1,4}|\s+/g) ?? []

export default function MessageError() {
  const [stream] = useState(() => createTextStream())
  const [streaming, setStreaming] = useState(true)
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  // The first try drops part-way; Retry streams the whole answer.
  useEffect(() => {
    const tokens = tokenize(ANSWER)
    const failAt = attempt === 0 ? 14 : tokens.length
    let i = 0
    stream.set('')
    setStreaming(true)
    setError(undefined)
    timer.current = setInterval(() => {
      if (i === failAt && i < tokens.length) {
        clearInterval(timer.current)
        setStreaming(false)
        setError('The connection dropped before the answer finished.')
        return
      }
      stream.append(tokens[i++]!)
      if (i < tokens.length) return
      clearInterval(timer.current)
      setStreaming(false)
    }, 50)
    return () => clearInterval(timer.current)
  }, [attempt, stream])

  return (
    <div className="w-full max-w-2xl">
      <ChatMessage
        role="assistant"
        name="Youj"
        content={stream}
        streaming={streaming}
        error={error}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    </div>
  )
}
