'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { plainText, type PeopleByHandle } from '../comment-thread/markdown'
import {
  DEMO_ARRIVALS,
  DEMO_NOW,
  demo,
  demoNotifications,
  type ActivityInboxAction,
  type ActivityInboxCopy,
  type ActivityInboxNotification,
} from './data'

/* The inbox's state. The notifications are the app's (or the demo's); what
 * the person does here (read, done, snooze, an action's result, a reply) is
 * laid over them at once and reported through the `on…` callbacks, and a
 * rejection takes it back and says why. What's laid over a notification is
 * forgotten when it has news (its time moves on): a new reply in a thread
 * you marked read is unread again. Arrivals and news are announced. */

export interface InboxHandlers {
  onMarkRead?: (id: string, read: boolean) => Promise<unknown> | unknown
  onMarkAllRead?: () => Promise<unknown> | unknown
  /** Done (`done` true), or undone. */
  onDone?: (id: string, done: boolean) => Promise<unknown> | unknown
  /** Snoozed until then, or back (`until` null). */
  onSnooze?: (id: string, until: Date | null) => Promise<unknown> | unknown
  onAction?: (id: string, actionId: string) => Promise<unknown> | unknown
  onReply?: (id: string, body: string, mentions: string[]) => Promise<unknown> | unknown
}

export interface Overlay {
  /** The notification's time when this was laid: news makes the read and done parts lapse. */
  stamp: number
  read?: boolean
  done?: boolean
  snoozedUntil?: number | null
  result?: string
  replied?: boolean
  error?: string
}

export type InboxItem = ActivityInboxNotification & Omit<Overlay, 'stamp' | 'snoozedUntil'> & { snoozedUntil?: number | null }

const timeOf = (value: Date | number | string) => +new Date(value)
const reason = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

export function useInbox({
  notifications,
  copy,
  read,
  live,
  people,
  handlers,
}: {
  notifications: ActivityInboxNotification[] | undefined
  copy: ActivityInboxCopy
  read: () => number
  live: boolean
  people: PeopleByHandle
  handlers: InboxHandlers
}) {
  const simulated = notifications === undefined
  const [own, setOwn] = useState(() => demoNotifications(DEMO_NOW))
  const [overlays, setOverlays] = useState<Record<string, Overlay>>({})
  const base = notifications ?? own

  const items: InboxItem[] = base
    .map((n) => {
      const o = overlays[n.id]
      const news = o && o.stamp !== timeOf(n.time)
      const snoozedUntil = o && 'snoozedUntil' in o ? o.snoozedUntil : n.snoozedUntil == null ? null : timeOf(n.snoozedUntil)
      return { ...n, ...(o && !news && { read: o.read ?? n.read, done: o.done, result: o.result, replied: o.replied, error: o.error }), snoozedUntil }
    })
    .sort((a, b) => timeOf(b.time) - timeOf(a.time))

  // News: a notification not seen before, or one whose time moved on. Said once each (set while rendering).
  const [seen, setSeen] = useState(() => new Map(base.map((n) => [n.id, timeOf(n.time)])))
  const [message, setMessage] = useState('')
  const news = base.filter((n) => (seen.get(n.id) ?? -Infinity) < timeOf(n.time))
  if (news.length) {
    setSeen(new Map([...seen, ...news.map((n) => [n.id, timeOf(n.time)] as const)]))
    const newest = news.reduce((a, b) => (timeOf(b.time) > timeOf(a.time) ? b : a))
    const summary =
      `${newest.actors[0]?.name ?? ''} ${newest.action} ${newest.subject.label}${newest.preview ? `: ${plainText(newest.preview, people)}` : ''}`.trim()
    setMessage(copy.announceArrived(summary))
  }

  const latest = useRef({ read, handlers })
  useLayoutEffect(() => {
    latest.current = { read, handlers }
  })
  useEffect(() => {
    if (!simulated || !live) return
    const timers = DEMO_ARRIVALS.map((arrival) => setTimeout(() => setOwn((list) => arrival.update(list, latest.current.read())), arrival.after))
    return () => timers.forEach(clearTimeout)
  }, [simulated, live])

  const lay = (id: string, patch: Omit<Overlay, 'stamp'>) =>
    setOverlays((all) => {
      const n = base.find((x) => x.id === id)
      return { ...all, [id]: { ...all[id], ...patch, stamp: n ? timeOf(n.time) : 0 } }
    })
  const run = async (id: string, patch: Omit<Overlay, 'stamp'>, undo: Omit<Overlay, 'stamp'>, call: () => unknown) => {
    lay(id, { ...patch, error: undefined })
    try {
      await call()
      return true
    } catch (error) {
      lay(id, { ...undo, error: reason(error, copy.failed) })
      return false
    }
  }

  const h = () => latest.current.handlers
  return {
    simulated,
    items,
    message,
    setRead: (item: InboxItem, value: boolean) =>
      run(item.id, { read: value }, { read: !value }, () =>
        h().onMarkRead ? h().onMarkRead!(item.id, value) : demo('ActivityInbox: onMarkRead', 250),
      ),
    markAllRead: async () => {
      const unread = items.filter((i) => !i.read)
      for (const item of unread) lay(item.id, { read: true })
      try {
        await (h().onMarkAllRead ? h().onMarkAllRead!() : demo('ActivityInbox: onMarkAllRead', 300))
      } catch (error) {
        for (const item of unread) lay(item.id, { read: false, error: reason(error, copy.failed) })
      }
    },
    done: (item: InboxItem, value: boolean) =>
      run(item.id, { done: value, ...(value && { read: true }) }, { done: !value }, () =>
        h().onDone ? h().onDone!(item.id, value) : demo('ActivityInbox: onDone', 300),
      ),
    snooze: (item: InboxItem, until: number | null) =>
      run(item.id, { snoozedUntil: until }, { snoozedUntil: item.snoozedUntil ?? null }, () =>
        h().onSnooze ? h().onSnooze!(item.id, until === null ? null : new Date(until)) : demo('ActivityInbox: onSnooze', 300),
      ),
    act: async (item: InboxItem, action: ActivityInboxAction) => {
      lay(item.id, { error: undefined })
      try {
        await (h().onAction ? h().onAction!(item.id, action.id) : demo('ActivityInbox: onAction', 650))
        lay(item.id, { result: action.done, read: true })
      } catch (error) {
        lay(item.id, { error: reason(error, copy.failed) })
        throw error
      }
    },
    reply: async (item: InboxItem, body: string, mentions: string[]) => {
      const ok = await run(item.id, { replied: true, read: true }, { replied: false }, () =>
        h().onReply ? h().onReply!(item.id, body, mentions) : demo('ActivityInbox: onReply', 600),
      )
      if (ok) setMessage(copy.announceReplied)
      return ok
    },
  }
}

export type Inbox = ReturnType<typeof useInbox>
