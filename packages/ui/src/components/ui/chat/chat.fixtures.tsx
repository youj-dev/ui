import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BarChartIcon } from '@youj/icons/components/youj/icons/bar-chart'
import { BugIcon } from '@youj/icons/components/youj/icons/bug'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { GitBranchIcon } from '@youj/icons/components/youj/icons/git-branch'
import { GlobeIcon } from '@youj/icons/components/youj/icons/globe'
import { LightbulbIcon } from '@youj/icons/components/youj/icons/lightbulb'
import { MicIcon } from '@youj/icons/components/youj/icons/mic'
import { RocketIcon } from '@youj/icons/components/youj/icons/rocket'
import { cn } from '../../../lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { Toggle } from '../toggle'
import { ChatEmptyState } from './chat-empty-state'
import { ChatMessage, type ChatFeedback } from './chat-message'
import { ChatMessageList } from './chat-message-list'
import { PromptInput, usePromptAttachments } from './chat-prompt-input'
import type { ChatSuggestion } from './chat-suggestions'
import { createTextStream, type ChatTextStream } from './chat-text-stream'
import { ChatReasoning, ChatTypingIndicator } from './chat-thinking'
import { ChatToolCall } from './chat-tool-call'

/* A deterministic stand-in for a model, for stories and tests. Text is cut
 * into BPE-like tokens (a leading space plus up to four characters), so a run
 * always streams the same tokens in the same order, at a configurable rate.
 * Timers only, no randomness: Storybook's frozen clock catches every story on
 * the same frame. Tokens go into a ChatTextStream, so a streaming reply never
 * re-renders the conversation; state changes only between phases (reasoning,
 * each tool call, the answer, done). */

/** "Deploying to iad1" → ["Depl", "oyin", "g", " to", " iad1"]. */
export function tokenize(text: string): string[] {
  return text.match(/\s*\S{1,4}|\s+/g) ?? []
}

export interface StreamOptions {
  /** Tokens per second. Default 60. */
  tokensPerSecond?: number
  signal?: AbortSignal
}

/** A frame's worth of tokens at a time, so very fast rates don't mean a timer per token. */
const TICK = 16

const aborted = () => new DOMException('Stopped', 'AbortError')

/** Feeds `tokens` to `onToken` at the given rate. Resolves when done; rejects with an AbortError if aborted. */
export function feed(tokens: string[], onToken: (token: string, index: number) => void, { tokensPerSecond = 60, signal }: StreamOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = 1000 / tokensPerSecond
    const perTick = Math.max(1, Math.round(TICK / interval))
    let index = 0
    let timer: ReturnType<typeof setTimeout>
    const abort = () => {
      clearTimeout(timer)
      reject(aborted())
    }
    if (signal?.aborted) return abort()
    signal?.addEventListener('abort', abort, { once: true })
    const step = () => {
      for (let n = 0; n < perTick && index < tokens.length; n++, index++) onToken(tokens[index]!, index)
      if (index >= tokens.length) {
        signal?.removeEventListener('abort', abort)
        resolve()
      } else timer = setTimeout(step, Math.max(interval, TICK))
    }
    timer = setTimeout(step, Math.max(interval, TICK))
  })
}

/** Resolves after `ms`, or rejects when aborted. */
export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted())
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => (clearTimeout(timer), reject(aborted())), { once: true })
  })
}

/** Streams `text` into a ChatTextStream on mount (and on `restart`). */
export function useFakeStream(text: string, { tokensPerSecond = 60, delay = 400 }: { tokensPerSecond?: number; delay?: number } = {}) {
  const [stream] = useState(() => createTextStream())
  const [streaming, setStreaming] = useState(true)
  const [run, setRun] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    stream.set('')
    setStreaming(true)
    wait(delay, controller.signal)
      .then(() => feed(tokenize(text), (token) => stream.append(token), { tokensPerSecond, signal: controller.signal }))
      .then(
        () => setStreaming(false),
        () => {},
      )
    return () => controller.abort()
  }, [stream, text, tokensPerSecond, delay, run])
  const restart = useCallback(() => setRun((n) => n + 1), [])
  return { stream, streaming, restart }
}

/* ── A scripted conversation ─────────────────────────────────────────────── */

export type FakeRole = 'user' | 'assistant' | 'system'

export interface FakeToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: string
  error?: string
  /** How long it ran, in ms. */
  duration?: number
}

export interface FakeSource {
  title: string
  url: string
  snippet: string
}

export interface FakeAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
}

export interface FakeMessage {
  id: string
  role: FakeRole
  /** The text; while streaming, it grows in `stream`. */
  content: string
  stream?: ChatTextStream
  streaming?: boolean
  /** Sent, and nothing has come back yet. */
  thinking?: boolean
  /** Stopped part-way. */
  stopped?: boolean
  reasoning?: { text: string; stream?: ChatTextStream; streaming: boolean; duration?: number }
  toolCalls?: FakeToolCall[]
  sources?: FakeSource[]
  attachments?: FakeAttachment[]
  error?: string
  createdAt: Date
  feedback?: 'up' | 'down' | null
}

export const ANSWERS = {
  deploy: `Here's how to ship **orion** to production with a safe rollback path.

## Before you deploy

1. Run the checks locally: \`pnpm verify\`
2. Open a preview and review it with the team
   - performance budget under **180 KB**
   - no new accessibility findings
3. Merge to \`main\`: production builds from there

\`\`\`ts
import { deploy } from '@acme/cli'

const release = await deploy({ project: 'orion', target: 'production' })
console.log(release.url) // https://orion.acme.dev
\`\`\`

| Region | Cold start | p95 |
| :----- | ---------: | --: |
| iad1   | 112 ms     | 84 ms |
| fra1   | 131 ms     | 97 ms |

> Rollbacks are instant: every deployment keeps its build, so promoting an older one takes seconds.

Read more in [the deployment guide](https://youj.io/docs/deployments).`,
  short: 'Sure. The build finished in **38s** and all 214 checks passed. Want me to promote it to production?',
  regions: `**iad1** has the fastest cold starts, and **fra1** is the cheapest at 10M requests a month [1].

| Region | Cold start | p95 | Cost / 10M |
| :----- | ---------: | --: | ---------: |
| iad1   | 112 ms | 84 ms | $41 |
| fra1   | 131 ms | 97 ms | $36 |
| hnd1   | 148 ms | 102 ms | $44 |

Cold starts are measured on a 1 GB function after 15 minutes idle [2]. If most of your users are in Europe, fra1 wins on both latency and cost.`,
  search: `The **Youj 2.0** release adds streaming markdown, a chat kit and theme presets [1]. Upgrading is a one-line change for most apps: bump the package and run the codemod [2].

- \`pnpm add @youj/react@2\`
- \`npx @youj/codemod v2\`

The codemod renames the three changed props and leaves a comment wherever it needs a human [2].`,
  general: `Happy to help. A few things that usually matter most here:

- **Scope it first.** Write down the one outcome you need this week.
- **Ship the smallest version** that proves it, behind a flag.
- **Measure** before you optimize: p95 latency and error rate are enough to start.

Want me to turn that into a checklist for the team?`,
}

const REASONING = {
  deploy:
    'The user wants a production deploy with a rollback path. I should check the latest deployments for orion first, so the steps match its real state: the last build passed, and it runs in iad1 and fra1. Then list the checks, the command and where rollbacks live.',
  regions:
    'Comparing three regions on cold start, p95 and cost. The metrics tool has the last 7 days per region; cost at 10M requests follows from the pricing table. Europe-heavy traffic would favor fra1.',
  search: 'They are asking about the 2.0 release. I will search the docs and changelog and cite what I use.',
}

const SOURCES = {
  regions: [
    { title: 'Regions and pricing', url: 'https://youj.io/docs/regions', snippet: 'Per-region pricing for functions: requests, duration and bandwidth, updated monthly.' },
    { title: 'Measuring cold starts', url: 'https://youj.io/blog/cold-starts', snippet: 'How we measure cold starts: 1 GB functions, 15 minutes idle, p50 and p95 over 7 days.' },
  ],
  search: [
    { title: 'Youj 2.0 is here', url: 'https://youj.io/blog/2-0', snippet: 'Streaming markdown, a chat kit for assistants, and five theme presets with motion personalities.' },
    { title: 'Upgrading to 2.0', url: 'https://youj.io/docs/upgrade', snippet: 'Bump the package, run the codemod, review the three renamed props it marks for you.' },
  ],
} satisfies Record<string, FakeSource[]>

interface Script {
  reasoning?: string
  /** Each tool and how long its (pretend) network call takes, in ms. */
  tools: (Omit<FakeToolCall, 'status'> & { runsFor: number })[]
  text: string
  sources?: FakeSource[]
  /** Fail after this many tokens of the answer. */
  failAt?: number
}

/** What the fake model does with a prompt: always the same for the same words. */
function scriptFor(prompt: string, options: Required<Pick<FakeChatOptions, 'reasoning' | 'toolCalls'>>, fail: boolean, n: number): Script {
  const p = prompt.toLowerCase()
  const topic = /deploy|ship|release|production|rollback/.test(p)
    ? 'deploy'
    : /region|latency|cold start|compare|cost/.test(p)
      ? 'regions'
      : /search|docs|news|upgrade|2\.0|changelog/.test(p)
        ? 'search'
        : 'general'
  const tools: Script['tools'] = []
  if (options.toolCalls && topic === 'deploy') {
    tools.push({
      id: `tool-${n}-1`,
      name: 'get_deployments',
      args: { project: 'orion', target: 'production', limit: 3 },
      result: '[{ "id": "dpl_8f2a91c", "state": "READY", "regions": ["iad1", "fra1"], "age": "4m" }, …2 more]',
      runsFor: 900,
    })
  }
  if (options.toolCalls && topic === 'regions') {
    tools.push({
      id: `tool-${n}-1`,
      name: 'query_metrics',
      args: { metric: ['cold_start', 'p95'], regions: ['iad1', 'fra1', 'hnd1'], window: '7d' },
      result: '{ "iad1": { "cold_start": 112, "p95": 84 }, "fra1": { "cold_start": 131, "p95": 97 }, "hnd1": { … } }',
      runsFor: 1100,
    })
  }
  if (options.toolCalls && topic === 'search') {
    tools.push({ id: `tool-${n}-1`, name: 'search_docs', args: { query: 'youj 2.0 upgrade' }, result: '2 results: "Youj 2.0 is here", "Upgrading to 2.0"', runsFor: 800 })
  }
  const text = ANSWERS[topic]
  return {
    reasoning: options.reasoning && topic !== 'general' ? REASONING[topic] : undefined,
    tools,
    text,
    sources: topic === 'regions' || topic === 'search' ? SOURCES[topic] : undefined,
    failAt: fail ? Math.floor(tokenize(text).length * 0.35) : undefined,
  }
}

export interface FakeChatOptions {
  initial?: FakeMessage[]
  /** Tokens per second for the answer (reasoning runs 1.5× faster). Default 60. */
  tokensPerSecond?: number
  /** Think out loud in a reasoning block first. Default true. */
  reasoning?: boolean
  /** Call a tool when the prompt asks for live data. Default true. */
  toolCalls?: boolean
  /** The next reply fails part-way, to show the error path. */
  failNextReply?: boolean
  /** Time to the first token, in ms. Default 700. */
  latency?: number
}

export type FakeChatStatus = 'idle' | 'submitted' | 'streaming'

/** A useChat-shaped fake: messages, status, and the actions an assistant screen needs. */
export function useFakeChat({ initial = [], tokensPerSecond = 60, reasoning = true, toolCalls = true, failNextReply = false, latency = 700 }: FakeChatOptions = {}) {
  const [messages, setMessages] = useState<FakeMessage[]>(initial)
  const [status, setStatus] = useState<FakeChatStatus>('idle')
  const controller = useRef<AbortController | null>(null)
  const count = useRef(0)
  // One reply fails, not every one after it: Retry then succeeds.
  const failNext = useRef(failNextReply)
  const settings = useRef({ tokensPerSecond, reasoning, toolCalls, latency })
  settings.current = { tokensPerSecond, reasoning, toolCalls, latency }
  useEffect(() => () => controller.current?.abort(), [])

  const patch = useCallback((id: string, change: (m: FakeMessage) => Partial<FakeMessage>) => {
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, ...change(m) } : m)))
  }, [])

  const reply = useCallback(
    async (prompt: string) => {
      controller.current?.abort()
      const { signal } = (controller.current = new AbortController())
      const n = ++count.current
      const id = `a${n}`
      const { tokensPerSecond, reasoning, toolCalls, latency } = settings.current
      const script = scriptFor(prompt, { reasoning, toolCalls }, failNext.current, n)
      failNext.current = false
      const answer = createTextStream()
      setStatus('submitted')
      // The reply's message is there at once, thinking, so the conversation never jumps when it starts.
      setMessages((all) => [...all, { id, role: 'assistant', content: '', stream: answer, streaming: true, thinking: true, createdAt: new Date(), feedback: null }])
      try {
        await wait(latency, signal)
        setStatus('streaming')
        patch(id, () => ({ thinking: false }))
        if (script.reasoning) {
          const thoughts = createTextStream()
          const started = Date.now()
          patch(id, () => ({ reasoning: { text: '', stream: thoughts, streaming: true } }))
          await feed(tokenize(script.reasoning), (t) => thoughts.append(t), { tokensPerSecond: tokensPerSecond * 1.5, signal })
          patch(id, () => ({ reasoning: { text: script.reasoning!, streaming: false, duration: Math.max(1, Math.round((Date.now() - started) / 1000)) } }))
        }
        for (const tool of script.tools) {
          patch(id, (m) => ({ toolCalls: [...(m.toolCalls ?? []), { ...tool, result: undefined, status: 'running' }] }))
          await wait(tool.runsFor, signal)
          patch(id, (m) => ({
            toolCalls: m.toolCalls?.map((t) => (t.id === tool.id ? { ...t, status: tool.error ? 'error' : 'success', result: tool.result, duration: tool.runsFor } : t)),
          }))
        }
        const tokens = tokenize(script.text)
        await feed(script.failAt === undefined ? tokens : tokens.slice(0, script.failAt), (t) => answer.append(t), { tokensPerSecond, signal })
        if (script.failAt !== undefined) {
          patch(id, () => ({ content: answer.getSnapshot(), stream: undefined, streaming: false, error: 'The connection dropped before the reply finished.' }))
        } else {
          patch(id, () => ({ content: script.text, stream: undefined, streaming: false, sources: script.sources }))
        }
      } catch {
        // Stopped: keep what arrived, or drop the reply if nothing had.
        setMessages((all) =>
          all.flatMap((m): FakeMessage[] => {
            if (m.id !== id) return [m]
            const content = m.stream?.getSnapshot() ?? m.content
            if (!content && !m.reasoning && !m.toolCalls?.length) return []
            return [
              {
                ...m,
                content,
                stream: undefined,
                streaming: false,
                thinking: false,
                stopped: true,
                reasoning: m.reasoning && { ...m.reasoning, text: m.reasoning.stream?.getSnapshot() ?? m.reasoning.text, stream: undefined, streaming: false },
                toolCalls: m.toolCalls?.map((t) => (t.status === 'running' ? { ...t, status: 'error', error: 'Stopped' } : t)),
              },
            ]
          }),
        )
      } finally {
        if (controller.current?.signal === signal) {
          controller.current = null
          setStatus('idle')
        }
      }
    },
    [patch],
  )

  const send = useCallback(
    (text: string, attachments?: FakeAttachment[]) => {
      const n = ++count.current
      setMessages((all) => [...all, { id: `u${n}`, role: 'user', content: text, attachments, createdAt: new Date() }])
      void reply(text)
    },
    [reply],
  )

  const stop = useCallback(() => controller.current?.abort(), [])

  const current = useRef(messages)
  current.current = messages

  /** Drops an assistant message and answers the prompt before it again. */
  const regenerate = useCallback(
    (id: string) => {
      const index = current.current.findIndex((m) => m.id === id)
      const prompt = [...current.current.slice(0, index)].reverse().find((m) => m.role === 'user')?.content ?? ''
      setMessages((all) => all.filter((m) => m.id !== id))
      void reply(prompt)
    },
    [reply],
  )

  /** Rewrites a user message, drops everything after it and answers again. */
  const edit = useCallback(
    (id: string, text: string) => {
      setMessages((all) => {
        const index = all.findIndex((m) => m.id === id)
        return [...all.slice(0, index), { ...all[index]!, content: text }]
      })
      void reply(text)
    },
    [reply],
  )

  const setFeedback = useCallback((id: string, feedback: 'up' | 'down' | null) => patch(id, () => ({ feedback })), [patch])

  const reset = useCallback((next: FakeMessage[] = []) => {
    controller.current?.abort()
    setMessages(next)
  }, [])

  return { messages, status, send, stop, regenerate, retry: regenerate, edit, setFeedback, reset }
}

/* ── A conversation already under way ───────────────────────────────────── */

const T0 = new Date('2026-01-15T09:12:00Z').getTime()
const at = (minutes: number) => new Date(T0 + minutes * 60_000)

export const HISTORY: FakeMessage[] = [
  { id: 'h1', role: 'system', content: 'Youj Pro · this chat can read your deployments', createdAt: at(0) },
  { id: 'h2', role: 'user', content: 'Our checkout got slower after Tuesday. Where should I look first?', createdAt: at(1) },
  {
    id: 'h3',
    role: 'assistant',
    content: `Start with what changed on Tuesday, then narrow by region:

1. **Deployments**: two went out Tuesday; the second moved \`checkout\` to the edge runtime.
2. **Regions**: p95 rose in **fra1** only (from 97 ms to 164 ms).
3. **Dependencies**: the edge build pulls a larger crypto polyfill.

The edge move is the likeliest cause. Want the diff of that deployment?`,
    createdAt: at(1),
    feedback: null,
  },
  { id: 'h4', role: 'user', content: 'Yes please.', createdAt: at(3) },
  { id: 'h5', role: 'user', content: 'And whether rolling back is safe.', createdAt: at(3) },
  {
    id: 'h6',
    role: 'assistant',
    content: `Here's the change that matters:

\`\`\`diff
@@ checkout/route.ts @@
- export const runtime = 'nodejs'
+ export const runtime = 'edge'
+ import { webcrypto } from 'crypto-polyfill'
\`\`\`

Rolling back is safe: the previous deployment still has its build, and nothing else changed its database schema since. Promote \`dpl_7c1e0b2\` and fra1 should return to ~97 ms within a minute.`,
    createdAt: at(4),
    feedback: 'up',
  },
]

/* ── The assistant, assembled ────────────────────────────────────────────── */

const ICON = { size: 16, strokeWidth: 1.75 } as const

export const MODELS = [
  { value: 'youj-pro', label: 'Youj Pro' },
  { value: 'youj-fast', label: 'Youj Fast' },
  { value: 'youj-reason', label: 'Youj Reason' },
]

/** A model select and tool toggles, sized for the composer's bar. */
export function ComposerToolbar({ model, onModelChange }: { model: string; onModelChange: (model: string) => void }) {
  const [search, setSearch] = useState(true)
  const [reason, setReason] = useState(false)
  const [dictating, setDictating] = useState(false)
  return (
    <>
      <Select items={MODELS} value={model} onValueChange={(value) => value && onModelChange(value)}>
        <SelectTrigger size="sm" variant="ghost" aria-label="Model" className="shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} side="top">
          {MODELS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Toggle size="sm" pressed={search} onPressedChange={setSearch} aria-label="Search the web">
        <GlobeIcon {...ICON} />
        <span className="max-sm:hidden">Search</span>
      </Toggle>
      <Toggle size="sm" pressed={reason} onPressedChange={setReason} aria-label="Think before answering">
        <LightbulbIcon {...ICON} />
        <span className="max-sm:hidden">Reason</span>
      </Toggle>
      <Toggle size="sm" pressed={dictating} onPressedChange={setDictating} aria-label="Dictate">
        <MicIcon {...ICON} active={dictating} />
      </Toggle>
    </>
  )
}

export const STARTERS: ChatSuggestion[] = [
  { label: 'Ship to production', description: 'Checks, command and a rollback path', prompt: 'How do I ship orion to production with a safe rollback?', icon: <RocketIcon {...ICON} /> },
  { label: 'Compare regions', description: 'Cold starts, p95 and cost per region', prompt: 'Compare cold starts and cost across our regions', icon: <BarChartIcon {...ICON} /> },
  { label: 'Debug a slow page', description: 'Find what changed and where it hurts', prompt: 'Why did checkout get slower after Tuesday?', icon: <BugIcon {...ICON} /> },
  { label: 'Search the docs', description: 'What changed in 2.0, with citations', prompt: 'Search the docs: what changed in 2.0?', icon: <GitBranchIcon {...ICON} /> },
]

type ChatActions = Pick<ReturnType<typeof useFakeChat>, 'retry' | 'regenerate' | 'setFeedback' | 'edit'>

function MessageAttachments({ attachments }: { attachments: FakeAttachment[] }) {
  return (
    <ul aria-label="Attachments" className="flex flex-wrap justify-end gap-2">
      {attachments.map((a) => (
        <li key={a.id}>
          {a.url && a.type.startsWith('image/') ? (
            <img src={a.url} alt={a.name} className="size-16 rounded-lg border border-line object-cover" />
          ) : (
            <span className="flex h-10 items-center gap-2 rounded-lg border border-line bg-band px-3 text-ui-sm text-fg">
              <FileTextIcon {...ICON} className="text-fg-muted" />
              {a.name}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** One message of a fake conversation, memoised on the message: a streaming reply re-renders only its own text. */
export const ConversationMessage = memo(function ConversationMessage({ message, actions }: { message: FakeMessage; actions: ChatActions }) {
  const { id, role } = message
  const assistant = role === 'assistant'
  return (
    <ChatMessage
      role={role}
      name={assistant ? 'Youj' : role === 'user' ? 'Ada Lovelace' : undefined}
      timestamp={message.createdAt}
      content={message.stream ?? message.content}
      streaming={message.streaming}
      error={message.error}
      incomplete={message.stopped}
      sources={message.sources}
      onRetry={() => actions.retry(id)}
      onRegenerate={assistant ? () => actions.regenerate(id) : undefined}
      feedback={assistant ? (message.feedback ?? null) : undefined}
      onFeedbackChange={assistant ? (feedback: ChatFeedback) => actions.setFeedback(id, feedback) : undefined}
      onEdit={role === 'user' ? (text: string) => actions.edit(id, text) : undefined}
    >
      {message.thinking && <ChatTypingIndicator />}
      {message.reasoning && (
        <ChatReasoning content={message.reasoning.stream ?? message.reasoning.text} streaming={message.reasoning.streaming} duration={message.reasoning.duration} />
      )}
      {message.toolCalls?.map((t) => (
        <ChatToolCall key={t.id} name={t.name} args={t.args} status={t.status} result={t.result} error={t.error} duration={t.duration} />
      ))}
      {message.attachments?.length ? <MessageAttachments attachments={message.attachments} /> : null}
    </ChatMessage>
  )
})

export interface AssistantChatProps extends Omit<FakeChatOptions, 'initial'> {
  initial?: FakeMessage[]
  /** Sent once on mount, so a story opens mid-conversation. */
  autoSend?: string
  /** The composer's toolbar: a model select, tool toggles. */
  toolbar?: ReactNode
  greeting?: string
  className?: string
}

/** The whole assistant: the conversation (or a greeting when there's none yet) over the composer. */
export function AssistantChat({ initial, autoSend, toolbar, greeting = 'Good morning, Ada', className, ...options }: AssistantChatProps) {
  const chat = useFakeChat({ initial, ...options })
  const { send, stop, retry, regenerate, setFeedback, edit } = chat
  const actions = useMemo(() => ({ retry, regenerate, setFeedback, edit }), [retry, regenerate, setFeedback, edit])
  const files = usePromptAttachments()
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const sent = useRef(false)
  useEffect(() => {
    if (!autoSend || sent.current) return
    sent.current = true
    send(autoSend)
  }, [autoSend, send])
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {chat.messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
          <ChatEmptyState
            greeting={greeting}
            description="Ask about your deployments, logs and metrics."
            suggestions={STARTERS}
            onSelect={(prompt) => {
              setDraft(prompt)
              field.current?.focus()
            }}
          />
        </div>
      ) : (
        <ChatMessageList>
          {chat.messages.map((m) => (
            <ConversationMessage key={m.id} message={m} actions={actions} />
          ))}
        </ChatMessageList>
      )}
      <div className="mx-auto w-full max-w-3xl px-4 pb-3">
        <PromptInput
          value={draft}
          onValueChange={setDraft}
          textareaRef={field}
          status={chat.status}
          onStop={stop}
          attachments={files.attachments}
          onAttach={files.add}
          onRemoveAttachment={files.remove}
          accept="image/*,.pdf,.txt,.md,.csv"
          toolbar={toolbar}
          onSubmit={({ text, attachments }) => {
            send(
              text,
              attachments.map(({ id, name, type, size, url }) => ({ id, name, type: type ?? '', size: size ?? 0, url })),
            )
            files.clear()
            setDraft('')
          }}
        />
        <p className="mt-2 text-center text-ui-xs text-fg-muted">Youj can make mistakes. Check what matters.</p>
      </div>
    </div>
  )
}
