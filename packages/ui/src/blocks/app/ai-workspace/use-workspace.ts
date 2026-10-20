import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Youj } from '@youj/core'
import { createTextStream } from '../../../components/ui/chat'
import { makeChats, OPENING, scriptFor, tokenize, type Attachment, type Chat, type ModelId, type Script, type Turn } from './data'

/* The workspace's state: its chats, the open one, and a reply playing from a
 * script the way a model's stream arrives. A beat of waiting, the reasoning
 * streamed (Deep only), each tool call running then settling, then the
 * answer token by token into a ChatTextStream, so only that message's text
 * re-renders. Every wait is a motion token from useYouj, so Speed slows
 * the whole reply; no randomness, so a prompt always plays the same way.
 * Under reduced motion the text arrives a phrase at a time (ChatMarkdown
 * shows whole sentences) and the kit's parts stop animating. Stop, opening
 * another chat, or unmounting aborts what's in flight and keeps what came. */

export type Status = 'idle' | 'submitted' | 'streaming'

const aborted = () => new DOMException('Stopped', 'AbortError')

// lint-blocks-allow: paces a scripted reply's stream (Demo content), not an action's success
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(aborted())
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(timer), reject(aborted())), { once: true })
  })
}

/** Feeds `perTick` tokens to `onToken` every `tick` ms. */
async function feed(tokens: string[], onToken: (token: string) => void, perTick: number, tick: number, signal: AbortSignal) {
  for (let i = 0; i < tokens.length; i += perTick) {
    await wait(tick, signal) // lint-blocks-allow: stream pacing
    onToken(tokens.slice(i, i + perTick).join(''))
  }
}

/** A reply cut off: keep what arrived, as stopped; drop it if nothing had. */
function settle(t: Turn): Turn[] {
  const text = t.stream?.getSnapshot() ?? t.text
  if (!text && !t.tools?.length && !t.reasoning) return []
  const reasoning = t.reasoning && { ...t.reasoning, text: t.reasoning.stream?.getSnapshot() ?? t.reasoning.text, stream: undefined, streaming: false }
  const tools = t.tools?.map((r) => (r.status === 'running' ? { ...r, status: 'error' as const, error: 'Stopped' } : r))
  return [{ ...t, text, stream: undefined, streaming: false, waiting: false, stopped: true, reasoning, tools }]
}

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`

interface Options {
  k: Youj
  model: ModelId
  /** Answer the opening chat's question live on mount. */
  autoplay: boolean
}

export function useWorkspace({ k, model, autoplay }: Options) {
  const [chats, setChats] = useState(() => makeChats(!autoplay))
  const [activeId, setActiveId] = useState<string | null>(OPENING.chat)
  const [status, setStatus] = useState<Status>('idle')
  const controller = useRef<AbortController | null>(null)
  const live = useRef({ k, model })
  useLayoutEffect(() => {
    live.current = { k, model }
  })

  const patchTurn = useCallback((chat: string, id: string, change: (t: Turn) => Partial<Turn>) => {
    setChats((all) => all.map((c) => (c.id === chat ? { ...c, turns: c.turns.map((t) => (t.id === id ? { ...t, ...change(t) } : t)) } : c)))
  }, [])

  const play = useCallback(
    async (chat: string, script: Script, at = new Date()) => {
      controller.current?.abort()
      const { signal } = (controller.current = new AbortController())
      const { k, model } = live.current
      const tick = k.ms('instant') / 2
      const per = k.reduced ? 12 : 2
      const id = nextId('a')
      const answer = createTextStream()
      setStatus('submitted')
      const turn: Turn = { id, role: 'assistant', text: '', stream: answer, streaming: true, waiting: true, at, feedback: null }
      setChats((all) => all.map((c) => (c.id === chat ? { ...c, followUps: [], turns: [...c.turns, turn] } : c)))
      try {
        await wait(k.ms('deliberate'), signal) // lint-blocks-allow: stream pacing
        setStatus('streaming')
        patchTurn(chat, id, () => ({ waiting: false }))
        if (model === 'deep') {
          const thoughts = createTextStream()
          const words = tokenize(script.reasoning)
          patchTurn(chat, id, () => ({ reasoning: { text: '', stream: thoughts, streaming: true } }))
          await feed(words, (w) => thoughts.append(w), per + 1, tick, signal)
          const duration = Math.max(1, Math.round((words.length * tick) / (per + 1) / 1000))
          patchTurn(chat, id, () => ({ reasoning: { text: script.reasoning, streaming: false, duration } }))
        }
        for (const [index, tool] of script.tools.entries()) {
          const toolId = `${id}-t${index}`
          patchTurn(chat, id, (t) => ({ tools: [...(t.tools ?? []), { id: toolId, name: tool.name, args: tool.args, status: 'running' }] }))
          await wait(k.ms('deliberate') * 2, signal) // lint-blocks-allow: stream pacing
          const done = { status: tool.error ? ('error' as const) : ('success' as const), result: tool.result, error: tool.error, duration: tool.ms }
          patchTurn(chat, id, (t) => ({ tools: t.tools?.map((r) => (r.id === toolId ? { ...r, ...done } : r)) }))
        }
        await feed(tokenize(script.text), (w) => answer.append(w), per, tick, signal)
        patchTurn(chat, id, () => ({ text: script.text, stream: undefined, streaming: false, sources: script.sources }))
        setChats((all) => all.map((c) => (c.id === chat ? { ...c, followUps: script.followUps } : c)))
      } catch {
        setChats((all) => all.map((c) => (c.id === chat ? { ...c, turns: c.turns.flatMap((t) => (t.id === id ? settle(t) : [t])) } : c)))
      } finally {
        if (controller.current?.signal === signal) {
          controller.current = null
          setStatus('idle')
        }
      }
    },
    [patchTurn],
  )

  // The opening question is answered as the workspace opens; unmounting stops whatever is playing.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting the stream is the point: the opening answer must be on screen from the first render
    if (autoplay) void play(OPENING.chat, OPENING.script, OPENING.at)
    return () => controller.current?.abort()
  }, [autoplay, play])

  const send = useCallback(
    (text: string, attachments?: Attachment[]) => {
      const question: Turn = { id: nextId('u'), role: 'user', text, attachments, at: new Date() }
      let chat = activeId
      if (!chat) {
        chat = nextId('chat')
        const title = text.length > 36 ? `${text.slice(0, 34).trimEnd()}…` : text
        const fresh: Chat = { id: chat, title, group: 'today', when: 'Now', turns: [], followUps: [] }
        setChats((all) => [...all.filter((c) => c.group === 'pinned'), fresh, ...all.filter((c) => c.group !== 'pinned')])
        setActiveId(chat)
      }
      const target = chat
      setChats((all) => all.map((c) => (c.id === target ? { ...c, turns: [...c.turns, question] } : c)))
      void play(target, scriptFor(text))
    },
    [activeId, play],
  )

  const stop = useCallback(() => controller.current?.abort(), [])

  const open = useCallback((id: string | null) => {
    controller.current?.abort()
    setActiveId(id)
  }, [])

  const rate = useCallback((chat: string, id: string, feedback: Turn['feedback']) => patchTurn(chat, id, () => ({ feedback })), [patchTurn])

  const active = chats.find((c) => c.id === activeId) ?? null
  return { chats, active, status, send, stop, open, rate }
}
