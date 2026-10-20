import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createTextStream, type ChatFeedback, type ChatTextStream } from '../../../components/ui/chat'
import {
  TIMING,
  replyTo,
  tokens,
  type SupportAgent,
  type SupportAttachment,
  type SupportChatCopy,
  type SupportMessage,
  type SupportReply,
  type SupportStage,
  type SupportThread,
  type SupportUser,
} from './data'

/* One conversation with the desk: your `onSend`'s replies, or the script in
 * data.ts without one.
 * - The assistant "types" for a beat, then streams its answer word by word
 *   through a ChatTextStream (only the message's text re-renders). Stopping
 *   keeps what arrived. People don't stream: they type, then the message
 *   lands whole.
 * - Asking for a person hands off: the assistant says so, the conversation
 *   waits in the queue, a person joins (a system line) and replies. With the
 *   team away the assistant takes an email instead.
 * - Every timer is tracked and cleared on unmount, or when `start` opens
 *   another conversation; a reply that arrives after that is dropped.
 * Reduced motion: replies arrive whole after the typing beat. */

export interface LiveMessage extends SupportMessage {
  /** Typing: nothing has arrived yet. Streaming: text is arriving through `stream`. */
  status?: 'typing' | 'streaming'
  stream?: ChatTextStream
  /** Stopped mid-answer. */
  incomplete?: boolean
  feedback?: ChatFeedback
  /** An answer from the assistant (not its greeting): it can be rated. */
  answer?: boolean
}

/** What the person sent, and where the conversation stood. */
export interface SupportOutgoing {
  text: string
  attachments: SupportAttachment[]
  /** The conversation's id, or 'new' for one started in the widget. */
  threadId: string
  stage: SupportStage
}

/** Delivers a message; resolve with the reply to play (or nothing, to wait), reject to show the error in the thread. */
export type SupportSendHandler = (message: SupportOutgoing) => Promise<SupportReply | void> | SupportReply | void

interface Options {
  thread: SupportThread | null
  online: boolean
  reduced: boolean
  copy: SupportChatCopy
  user: SupportUser
  bot: string
  team: SupportAgent[]
  onSend?: SupportSendHandler
}

let seq = 0
const nextId = () => `m-${++seq}`

/** The greeting's time on first render: a fixed demo instant, so server and client agree. A reset stamps the real time. */
const DEMO_START = new Date('2027-01-10T08:00:00Z')

function opening(thread: SupportThread | null, greeting: string, at: Date): LiveMessage[] {
  if (thread) return thread.messages
  return [{ id: nextId(), from: 'bot', text: greeting, at }]
}

export function useConversation(options: Options) {
  const { thread, reduced } = options
  const opts = useRef(options)
  useLayoutEffect(() => {
    opts.current = options
  })
  const [messages, setMessages] = useState<LiveMessage[]>(() => opening(thread, options.copy.greeting(options.user.first, options.bot), DEMO_START))
  const [stage, setStage] = useState<SupportStage>(thread?.stage ?? 'bot')
  const [agent, setAgent] = useState<SupportAgent | undefined>(thread?.agent)
  const [suggestions, setSuggestions] = useState<string[]>(thread ? thread.suggestions : options.copy.openers)
  const [rated, setRated] = useState<number | undefined>(thread?.rated)
  const [email, setEmail] = useState<string | null>(null)
  const [threadId, setThreadId] = useState(thread?.id ?? 'new')
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const streaming = useRef<string | null>(null)
  const stageRef = useRef(stage)
  const threadRef = useRef(threadId)
  const agentRef = useRef(agent)
  useLayoutEffect(() => {
    stageRef.current = stage
    threadRef.current = threadId
    agentRef.current = agent
  })
  // Bumped when another conversation opens, so a late reply to the old one is dropped.
  const generation = useRef(0)

  useEffect(() => {
    const live = timers.current
    return () => {
      for (const t of live) clearTimeout(t)
      live.clear()
    }
  }, [])

  const later = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
  }, [])

  const patch = useCallback((id: string, next: Partial<LiveMessage>) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...next } : m))), [])
  const push = useCallback((message: LiveMessage) => setMessages((list) => [...list, message]), [])

  const close = useCallback(
    (who?: SupportAgent) => {
      later(TIMING.close, () => {
        const { copy } = opts.current
        push({ id: nextId(), from: 'system', text: who ? copy.closedBy(who.first) : copy.closed, at: new Date() })
        setStage('ended')
      })
    },
    [later, push],
  )

  /** The assistant types, then streams `text` (whole under reduced motion). Only answers can be rated, not hand-offs. */
  const botSays = useCallback(
    (text: string, then: () => void, answer = true) => {
      const id = nextId()
      push({ id, from: 'bot', text: '', status: 'typing', answer, at: new Date() })
      later(TIMING.think, () => {
        if (reduced) {
          patch(id, { text, status: undefined })
          return then()
        }
        const stream = createTextStream()
        const parts = tokens(text)
        streaming.current = id
        patch(id, { status: 'streaming', stream })
        parts.forEach((part, i) =>
          later(TIMING.token * (i + 1), () => {
            stream.append(part)
            if (i < parts.length - 1) return
            streaming.current = null
            patch(id, { text, status: undefined, stream: undefined })
            then()
          }),
        )
      })
    },
    [later, patch, push, reduced],
  )

  /** A person types for a beat, then the message lands whole. */
  const agentSays = useCallback(
    (who: SupportAgent, text: string, attachments: SupportAttachment[] | undefined, then: () => void) => {
      const id = nextId()
      push({ id, from: 'agent', agent: who, text: '', status: 'typing', at: new Date() })
      later(TIMING.agentTyping, () => {
        patch(id, { text, attachments, status: undefined, at: new Date() })
        then()
      })
    },
    [later, patch, push],
  )

  const handOff = useCallback(
    (reply: Extract<SupportReply, { kind: 'handoff' }>) => {
      setStage('queue')
      later(TIMING.queue, () => {
        const { copy, team, user } = opts.current
        const who = reply.agent ?? team[0]
        if (!who) return
        setAgent(who)
        setStage('agent')
        push({ id: nextId(), from: 'system', text: copy.joined(who.name), at: new Date() })
        agentSays(who, reply.greeting ?? copy.handoffGreeting(user.first, who.first), undefined, () => setSuggestions(reply.suggestions ?? copy.handoffSuggestions))
      })
    },
    [agentSays, later, push],
  )

  const play = useCallback(
    (reply: SupportReply) => {
      if (reply.kind === 'agent') {
        const who = reply.agent ?? agentRef.current ?? opts.current.team[0]
        if (!who) return
        agentSays(who, reply.text, reply.attachments, () => {
          setSuggestions(reply.suggestions ?? [])
          if (reply.close) close(who)
        })
      } else if (reply.kind === 'handoff') {
        if (opts.current.online) botSays(reply.text, () => handOff(reply), false)
        else botSays(opts.current.copy.offlineReply, () => setStage('offline'), false)
      } else {
        botSays(reply.text, () => {
          setSuggestions(reply.suggestions ?? [])
          if (reply.close) close()
        })
      }
    },
    [agentSays, botSays, close, handOff],
  )

  const send = useCallback(
    (text: string, attachments: SupportAttachment[] = []) => {
      push({ id: nextId(), from: 'user', text, attachments: attachments.length ? attachments : undefined, at: new Date() })
      setSuggestions([])
      const current = stageRef.current
      const { onSend, copy } = opts.current
      if (!onSend) {
        if (current !== 'queue') play(replyTo(text, current, attachments.length > 0))
        return
      }
      const round = generation.current
      new Promise<SupportReply | void>((resolve) => resolve(onSend({ text, attachments, threadId: threadRef.current, stage: current }))).then(
        (reply) => {
          if (reply && round === generation.current) play(reply)
        },
        (reason) => {
          if (round !== generation.current) return
          const message = reason instanceof Error ? reason.message : String(reason)
          push({ id: nextId(), from: 'system', text: copy.sendFailed(message), at: new Date() })
        },
      )
    },
    [play, push],
  )

  /** Cuts the streaming answer off where it is. */
  const stop = useCallback(() => {
    const id = streaming.current
    if (!id) return
    for (const t of timers.current) clearTimeout(t)
    timers.current.clear()
    streaming.current = null
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, text: m.stream?.getSnapshot() ?? '', stream: undefined, status: undefined, incomplete: true } : m)))
    setSuggestions(opts.current.copy.openers)
  }, [])

  const leaveEmail = useCallback(
    (address: string) => {
      setEmail(address)
      push({ id: nextId(), from: 'system', text: opts.current.copy.replyTo(address), at: new Date() })
    },
    [push],
  )

  /** Opens a past conversation, or a fresh one with the assistant; whatever was pending stops. */
  const start = useCallback((next: SupportThread | null) => {
    for (const t of timers.current) clearTimeout(t)
    timers.current.clear()
    generation.current += 1
    streaming.current = null
    stageRef.current = next?.stage ?? 'bot'
    setThreadId(next?.id ?? 'new')
    setMessages(opening(next, opts.current.copy.greeting(opts.current.user.first, opts.current.bot), new Date()))
    setStage(next?.stage ?? 'bot')
    setAgent(next?.agent)
    setSuggestions(next ? next.suggestions : opts.current.copy.openers)
    setRated(next?.rated)
    setEmail(null)
  }, [])

  const setFeedback = useCallback((id: string, feedback: ChatFeedback) => patch(id, { feedback }), [patch])

  const busy = messages.some((m) => m.status !== undefined)
  const answering = messages.some((m) => m.from === 'bot' && m.status !== undefined)
  const who = agent ? agent.first : options.bot

  return { threadId, start, messages, stage, agent, who, suggestions, rated, setRated, email, busy, answering, send, stop, leaveEmail, setFeedback }
}

export type Conversation = ReturnType<typeof useConversation>
