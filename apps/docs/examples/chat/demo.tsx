'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChatMessage,
  ChatMessageList,
  ChatReasoning,
  ChatToolCall,
  ChatTypingIndicator,
  PromptInput,
  createTextStream,
  type ChatFeedback,
  type ChatTextStream,
  type ChatToolStatus,
  type PromptStatus,
} from '@youj/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string | ChatTextStream
  streaming?: boolean
  thinking?: boolean
  stopped?: boolean
  feedback?: ChatFeedback
  reasoning?: { content: ChatTextStream; streaming: boolean; duration?: number }
  tool?: { status: ChatToolStatus; result?: unknown; duration?: number }
}

const HISTORY: Message[] = [
  { id: 'h1', role: 'user', content: 'Our checkout got slower after Tuesday. Where should I look first?' },
  {
    id: 'h2',
    role: 'assistant',
    feedback: 'up',
    content:
      'Start with what changed on Tuesday. The second deployment moved `checkout` to the edge runtime, and p95 rose in **fra1** only, from 97 ms to 164 ms. Rolling back to `dpl_7c1e0b2` is safe.',
  },
]

const QUESTION = 'How do I ship orion to production with a safe rollback?'

const REASONING =
  'They want a production deploy with a way back. Check the latest deployments for orion first, so the steps match its real state, then list the checks, the command and where rollbacks live.'

const ANSWER = `Here's the path for **orion**, with a rollback ready at every step.

1. Run the checks: \`pnpm verify\`
2. Open a preview and review it with the team
3. Merge to \`main\`, which builds production

\`\`\`ts
const release = await deploy({ project: 'orion', target: 'production' })
\`\`\`

| Region | Cold start | p95 |
| :----- | ---------: | --: |
| iad1 | 112 ms | 84 ms |
| fra1 | 131 ms | 97 ms |

> Every deployment keeps its build, so promoting the previous one takes seconds.`

/** "Deploying to iad1" → ["Depl", "oyin", "g", " to", " iad1"]: a model's tokens, roughly. */
const tokenize = (text: string) => text.match(/\s*\S{1,4}|\s+/g) ?? []

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>(HISTORY)
  const [status, setStatus] = useState<PromptStatus>('idle')
  // Each reply runs under a generation number: stopping or unmounting bumps it, and the reply notices.
  const generation = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const replying = useRef<string | null>(null)

  const patch = (id: string, next: Partial<Message>) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...next } : m)))

  const cancel = useCallback(() => {
    generation.current++
    for (const timer of timers.current) clearTimeout(timer)
    timers.current.clear()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  const reply = useCallback(
    async (id: string) => {
      const mine = ++generation.current
      const alive = () => generation.current === mine
      const sleep = (ms: number) =>
        new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => {
            timers.current.delete(timer)
            resolve(alive())
          }, ms)
          timers.current.add(timer)
        })
      const type = async (stream: ChatTextStream, text: string) => {
        for (const token of tokenize(text)) {
          if (!(await sleep(22))) return false
          stream.append(token)
        }
        return true
      }

      replying.current = id
      setStatus('submitted')
      if (!(await sleep(700))) return

      const reasoning = createTextStream()
      setStatus('streaming')
      patch(id, { thinking: false, reasoning: { content: reasoning, streaming: true } })
      if (!(await type(reasoning, REASONING))) return
      patch(id, { reasoning: { content: reasoning, streaming: false, duration: 3 }, tool: { status: 'running' } })

      if (!(await sleep(900))) return
      patch(id, { tool: { status: 'success', duration: 840, result: { latest: 'dpl_9f3a2c1', state: 'ready', regions: ['iad1', 'fra1'] } } })

      const answer = createTextStream()
      patch(id, { content: answer })
      if (!(await type(answer, ANSWER))) return
      patch(id, { streaming: false })
      replying.current = null
      setStatus('idle')
    },
    [],
  )

  const ask = (text: string, fresh = false) => {
    const n = Date.now()
    const question: Message = { id: `q${n}`, role: 'user', content: text }
    const answer: Message = { id: `a${n}`, role: 'assistant', streaming: true, thinking: true }
    setMessages((list) => [...(fresh ? HISTORY : list), question, answer])
    void reply(answer.id)
  }

  // The preview opens mid-conversation: the question goes out on mount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useEffect(() => {
    ask(QUESTION, true)
    return cancel
  }, [])

  const stop = () => {
    cancel()
    const id = replying.current
    if (id) {
      setMessages((list) =>
        list.map((m) =>
          m.id === id
            ? { ...m, streaming: false, thinking: false, stopped: true, reasoning: m.reasoning && { ...m.reasoning, streaming: false } }
            : m,
        ),
      )
    }
    replying.current = null
    setStatus('idle')
  }

  return (
    <div className="flex h-[600px] w-full flex-col bg-canvas">
      <ChatMessageList>
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            role={m.role}
            name={m.role === 'assistant' ? 'Youj' : 'Ada Lovelace'}
            content={m.content}
            streaming={m.streaming}
            incomplete={m.stopped}
            feedback={m.role === 'assistant' ? (m.feedback ?? null) : undefined}
            onFeedbackChange={m.role === 'assistant' ? (feedback) => patch(m.id, { feedback }) : undefined}
          >
            {m.thinking && <ChatTypingIndicator />}
            {m.reasoning && <ChatReasoning content={m.reasoning.content} streaming={m.reasoning.streaming} duration={m.reasoning.duration} />}
            {m.tool && (
              <ChatToolCall
                name="get_deployments"
                args={{ project: 'orion', limit: 3 }}
                status={m.tool.status}
                result={m.tool.result}
                duration={m.tool.duration}
              />
            )}
          </ChatMessage>
        ))}
      </ChatMessageList>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput status={status} onStop={stop} onSubmit={({ text }) => ask(text)} />
      </div>
    </div>
  )
}
