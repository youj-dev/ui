'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  demo,
  type CommentThreadComment,
  type CommentThreadCopy,
  type CommentThreadDraft,
  type CommentThreadItem,
  type CommentThreadPerson,
  type DemoBeat,
  type LiveComment,
  type LiveThread,
} from './data'

/* The discussion's state. The threads are the app's (or the demo's); every
 * change the person makes is an optimistic op laid over them, so it shows at
 * once. An op settles when its callback resolves: the demo folds it into its
 * own threads, while an app's next `threads` replaces it (until then it keeps
 * showing, so nothing flickers back). A rejection takes the op away again and
 * says why; a post that fails stays, marked, with Retry and Discard. */

export interface DiscussionHandlers {
  onPost?: (draft: CommentThreadDraft) => Promise<Partial<CommentThreadComment> | void> | Partial<CommentThreadComment> | void
  onEdit?: (commentId: string, body: string) => Promise<unknown> | unknown
  onDelete?: (commentId: string) => Promise<unknown> | unknown
  onReact?: (commentId: string, emoji: string, reacted: boolean) => Promise<unknown> | unknown
  onResolve?: (threadId: string, resolved: boolean) => Promise<unknown> | unknown
}

type Op = { key: number; settled?: boolean } & (
  | { kind: 'post'; draft: CommentThreadDraft; threadId: string; comment: LiveComment; savedId?: string; extra?: Record<string, unknown> }
  | { kind: 'edit'; commentId: string; body: string; at: number }
  | { kind: 'delete'; commentId: string }
  | { kind: 'react'; commentId: string; emoji: string; on: boolean }
  | { kind: 'resolve'; threadId: string; resolved: LiveThread['resolved'] }
)

const withComment = (
  threads: LiveThread[],
  id: string,
  fn: (c: LiveComment, thread: LiveThread, index: number) => LiveComment | null,
): LiveThread[] =>
  threads.flatMap((t) => {
    const at = t.comments.findIndex((c) => c.id === id)
    if (at === -1) return [t]
    const comments = t.comments.flatMap((c, i) => (i === at ? (fn(c, t, i) ?? []) : [c]))
    return comments.length ? [{ ...t, comments }] : []
  })

/** The threads with the ops laid over them, in order. */
export function apply(threads: LiveThread[], ops: Op[], user: CommentThreadPerson): LiveThread[] {
  let out = threads
  for (const op of ops) {
    if (op.kind === 'post') {
      if (op.savedId && out.some((t) => t.comments.some((c) => c.id === op.savedId))) continue
      const exists = out.some((t) => t.id === op.threadId)
      out = exists
        ? out.map((t) => (t.id === op.threadId ? { ...t, comments: [...t.comments, op.comment] } : t))
        : op.draft.threadId === null
          ? [...out, { ...op.extra, id: op.threadId, comments: [op.comment] }]
          : out
    } else if (op.kind === 'edit') {
      out = withComment(out, op.commentId, (c) => ({ ...c, body: op.body, editedAt: op.at }))
    } else if (op.kind === 'delete') {
      // A thread's first comment with replies stays as a placeholder, so the replies keep their context.
      out = withComment(out, op.commentId, (c, t, i) => (i === 0 && t.comments.length > 1 ? { ...c, deleted: true, body: '', reactions: [] } : null))
    } else if (op.kind === 'react') {
      out = withComment(out, op.commentId, (c) => {
        const list = c.reactions ?? []
        const found = list.find((r) => r.emoji === op.emoji)
        const by = (found?.by ?? []).filter((id) => id !== user.id)
        const next = op.on ? [...by, user.id] : by
        const reactions = found ? list.map((r) => (r.emoji === op.emoji ? { ...r, by: next } : r)) : [...list, { emoji: op.emoji, by: next }]
        return { ...c, reactions: reactions.filter((r) => r.by.length > 0) }
      })
    } else {
      out = out.map((t) => (t.id === op.threadId ? { ...t, resolved: op.resolved } : t))
    }
  }
  return out
}

export interface DiscussionOptions {
  threads: CommentThreadItem[] | undefined
  demoThreads: CommentThreadItem[]
  user: CommentThreadPerson
  copy: CommentThreadCopy
  /** The time a new comment gets. */
  read: () => number
  announce: (text: string) => void
  /** The demo's beats run while this is true. */
  live: boolean
  beats: DemoBeat[]
  /** "CommentThread", for the unwired actions' warnings. */
  block: string
  handlers: DiscussionHandlers
}

export function useDiscussion(options: DiscussionOptions) {
  const { threads, user, copy, read, announce, live, beats, block } = options
  const controlled = threads !== undefined
  const [source, setSource] = useState(threads)
  const [base, setBase] = useState<LiveThread[]>(() => threads ?? options.demoThreads)
  const [ops, setOps] = useState<Op[]>([])
  const [typing, setTyping] = useState<CommentThreadPerson[]>([])
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())
  const [failure, setFailure] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  // The app's new threads replace everything that has settled.
  if (threads !== source) {
    setSource(threads)
    if (threads) {
      setBase(threads)
      setOps((list) => list.filter((op) => !op.settled))
    }
  }
  const latest = useRef(options)
  latest.current = options
  // The ops as last rendered, for the callbacks that settle them a request later.
  const current = useRef(ops)
  current.current = ops
  const keys = useRef(0)

  const view = useMemo(() => apply(base, ops, user), [base, ops, user])

  const settle = (key: number, patch?: Partial<Op>) => {
    if (controlled) {
      setOps((list) => list.map((op) => (op.key === key ? ({ ...op, ...patch, settled: true } as Op) : op)))
      return
    }
    // The demo keeps its own threads: the op becomes part of them.
    const op = current.current.find((o) => o.key === key)
    if (op) setBase((b) => apply(b, [{ ...op, ...patch } as Op], user))
    setOps((list) => list.filter((o) => o.key !== key))
  }
  const drop = (key: number) => setOps((list) => list.filter((op) => op.key !== key))
  const reason = (error: unknown) => (error instanceof Error && error.message ? error.message : copy.failed)

  /** Lays an op over the threads and runs its callback; a rejection takes it away and says why. */
  const run = async (op: Op, call: () => unknown, done?: string) => {
    setFailure(null)
    setOps((list) => [
      ...list.filter((o) => !(op.kind === 'react' && o.kind === 'react' && o.commentId === op.commentId && o.emoji === op.emoji)),
      op,
    ])
    try {
      await call()
      settle(op.key)
      if (done) announce(done)
    } catch (error) {
      drop(op.key)
      setFailure(reason(error))
    }
  }

  const send = async (op: Extract<Op, { kind: 'post' }>) => {
    const { onPost } = latest.current.handlers
    try {
      const saved = await (onPost ? onPost(op.draft) : demo(`${block}: onPost`, 650))
      const fields: Partial<CommentThreadComment> = saved && typeof saved === 'object' ? saved : {}
      settle(op.key, { comment: { ...op.comment, ...fields, status: undefined }, savedId: fields.id })
      announce(copy.announceSent)
    } catch (error) {
      setOps((list) =>
        list.map((o) => (o.key === op.key && o.kind === 'post' ? { ...o, comment: { ...o.comment, status: 'failed', error: reason(error) } } : o)),
      )
    }
  }

  /** A reply, or a new thread (`threadId` null); `extra` rides along on a new thread and its draft (an anchor). */
  const post = (threadId: string | null, body: string, mentions: string[], extra?: Record<string, unknown>) => {
    const key = ++keys.current
    const comment: LiveComment = { id: `local-${key}`, author: user, body, createdAt: read(), status: 'sending' }
    const op: Op = { key, kind: 'post', draft: { ...extra, threadId, body, mentions }, threadId: threadId ?? `local-thread-${key}`, comment, extra }
    setFailure(null)
    setOps((list) => [...list, op])
    void send(op)
    return op.threadId
  }

  const retry = (commentId: string) => {
    const op = ops.find((o) => o.kind === 'post' && o.comment.id === commentId)
    if (op?.kind !== 'post') return
    const next = { ...op, comment: { ...op.comment, status: 'sending' as const, error: undefined } }
    setOps((list) => list.map((o) => (o.key === op.key ? next : o)))
    void send(next)
  }
  const discard = (commentId: string) => setOps((list) => list.filter((o) => !(o.kind === 'post' && o.comment.id === commentId)))

  const { onEdit, onDelete, onReact, onResolve } = options.handlers
  const actions = {
    post,
    retry,
    discard,
    edit: (commentId: string, body: string) => {
      setEditing(null)
      void run(
        { key: ++keys.current, kind: 'edit', commentId, body, at: read() },
        () => (onEdit ? onEdit(commentId, body) : demo(`${block}: onEdit`, 450)),
        copy.announceEdited,
      )
    },
    remove: (commentId: string) =>
      run(
        { key: ++keys.current, kind: 'delete', commentId },
        () => (onDelete ? onDelete(commentId) : demo(`${block}: onDelete`, 450)),
        copy.announceDeleted,
      ),
    react: (commentId: string, emoji: string, on: boolean) =>
      run({ key: ++keys.current, kind: 'react', commentId, emoji, on }, () =>
        onReact ? onReact(commentId, emoji, on) : demo(`${block}: onReact`, 300),
      ),
    resolve: (threadId: string, resolved: boolean) =>
      run(
        { key: ++keys.current, kind: 'resolve', threadId, resolved: resolved ? { by: user, at: read() } : null },
        () => (onResolve ? onResolve(threadId, resolved) : demo(`${block}: onResolve`, 450)),
        resolved ? copy.announceResolved : copy.announceReopened,
      ),
  }

  // The demo's life: someone types, then replies; a reaction lands. Only while it's on screen.
  const played = useRef(new Set<number>())
  useEffect(() => {
    if (!live) return
    const timers = beats.flatMap((beat, i) => {
      if (played.current.has(i)) return []
      return [
        setTimeout(() => {
          played.current.add(i)
          const { read: now, copy: words, announce: say } = latest.current
          if (beat.kind === 'typing') {
            setTyping((list) => [...list.filter((p) => p.id !== beat.person.id), beat.person])
            timers.push(setTimeout(() => setTyping((list) => list.filter((p) => p.id !== beat.person.id)), beat.until - beat.after))
          } else if (beat.kind === 'thread') {
            const thread = { ...beat.thread, comments: beat.thread.comments.map((c) => ({ ...c, createdAt: now() })) }
            setBase((b) => [...b, thread])
            setFresh((set) => new Set(set).add(thread.comments[0]!.id))
            say(words.announceComment(thread.comments[0]!.author.name))
          } else if (beat.kind === 'reply') {
            setTyping((list) => list.filter((p) => p.id !== beat.comment.author.id))
            setBase((b) => b.map((t) => (t.id === beat.threadId ? { ...t, comments: [...t.comments, { ...beat.comment, createdAt: now() }] } : t)))
            setFresh((set) => new Set(set).add(beat.comment.id))
            say(words.announceReply(beat.comment.author.name))
          } else {
            setBase((b) =>
              b.map((t) => ({
                ...t,
                comments: t.comments.map((c) =>
                  c.id === beat.commentId
                    ? {
                        ...c,
                        reactions: [
                          ...(c.reactions ?? []).filter((r) => r.emoji !== beat.emoji),
                          { emoji: beat.emoji, by: [...((c.reactions ?? []).find((r) => r.emoji === beat.emoji)?.by ?? []), beat.personId] },
                        ],
                      }
                    : c,
                ),
              })),
            )
          }
        }, beat.after),
      ]
    })
    return () => timers.forEach(clearTimeout)
  }, [live, beats])

  return { threads: view, typing, fresh, failure, setFailure, editing, setEditing, actions }
}

export type Discussion = ReturnType<typeof useDiscussion>
