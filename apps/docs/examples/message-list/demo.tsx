'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, ChatMessage, ChatMessageList, createTextStream, type ChatTextStream } from '@youj/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string | ChatTextStream
  streaming?: boolean
}

const HISTORY: Message[] = [
  { id: 'm1', role: 'user', content: 'Which regions is orion deployed to?' },
  { id: 'm2', role: 'assistant', content: 'Two: **iad1** (Washington, D.C.) and **fra1** (Frankfurt). Both serve production traffic.' },
  { id: 'm3', role: 'user', content: 'What would adding hnd1 cost?' },
  { id: 'm4', role: 'assistant', content: 'About **$44 per 10M requests**, a little more than iad1. Cold starts there average 148 ms.' },
]

const ANSWER = `Here's a rollout plan for **hnd1**, one step at a time.

1. Add the region to \`youj.json\` and open a preview.
2. Send 5% of Asia-Pacific traffic to it for a day.
3. Compare p95 with iad1. If it's within 20 ms, raise it to 50%.
4. Watch errors for an hour, then take the rest.

Each step keeps the previous deployment ready, so a rollback is one promote away. Scroll up while this streams: the list lets go, and **Jump to latest** brings you back.

- Latency budget: p95 under 120 ms
- Error budget: under 0.1% for an hour
- Cost check: under $50 per 10M requests

When all three hold, hnd1 is ready for the whole region.`

const tokenize = (text: string) => text.match(/\s*\S{1,4}|\s+/g) ?? []

export default function MessageListDemo() {
  const [messages, setMessages] = useState(HISTORY)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => () => clearInterval(timer.current), [])

  const ask = () => {
    const n = messages.length
    const stream = createTextStream()
    const id = `a${n}`
    setBusy(true)
    setMessages((list) => [...list, { id: `q${n}`, role: 'user', content: 'Plan the hnd1 rollout.' }, { id, role: 'assistant', content: stream, streaming: true }])
    const tokens = tokenize(ANSWER)
    let i = 0
    timer.current = setInterval(() => {
      stream.append(tokens[i++]!)
      if (i < tokens.length) return
      clearInterval(timer.current)
      setMessages((list) => list.map((m) => (m.id === id ? { ...m, streaming: false } : m)))
      setBusy(false)
    }, 45)
  }

  return (
    <div className="flex h-[440px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-canvas">
      <ChatMessageList contentClassName="px-5">
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role} name={m.role === 'assistant' ? 'Youj' : 'Ada Lovelace'} content={m.content} streaming={m.streaming} />
        ))}
      </ChatMessageList>
      <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2">
        <Button size="sm" onClick={ask} disabled={busy} focusableWhenDisabled>
          Ask for a rollout plan
        </Button>
      </div>
    </div>
  )
}
