'use client'

import { useState } from 'react'
import { RocketIcon } from '@youj/icons'
import { NotificationCenter, type NotificationItem } from '../../components/ui/notification-center'

/* The bell for a frame's top bar: an unread count that rolls, and your
 * notifications in a popover (a bottom sheet on phones), filtered by All,
 * Unread and Mentions, each one markable as read. It holds the read state
 * itself; pass `notifications` from your feed, and `onMarkRead` to save. */

const minutes = (n: number) => new Date(Date.now() - n * 60_000)
const days = (n: number) => new Date(Date.now() - n * 86_400_000)

/** Sample notifications: replace them with your own feed. */
const SAMPLE: NotificationItem[] = [
  {
    id: 'mention',
    actor: { name: 'Mira Chen' },
    title: 'mentioned you in Atlas launch plan',
    body: '“@Ada can we lock the pricing page before Friday?”',
    time: minutes(4),
    mention: true,
  },
  { id: 'deploy', icon: RocketIcon, title: 'Borealis 2.4 is live in production', body: 'Built in 41 seconds · 14 regions', time: minutes(26) },
  { id: 'invite', actor: { name: 'Jonas Weber' }, title: 'invited you to the Cirrus project', time: days(1), read: true },
  { id: 'review', actor: { name: 'Priya Natarajan' }, title: 'approved your changes to Reports', time: days(2), read: true },
]

interface FrameNotificationsProps {
  notifications?: NotificationItem[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  /** The moment Today and relative times count from. Default: the clock when the list opens. */
  now?: Date | number
  className?: string
}

function FrameNotifications({ notifications = SAMPLE, onMarkRead, onMarkAllRead, now, className }: FrameNotificationsProps) {
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set())
  const items = notifications.map((item) => (read.has(item.id) ? { ...item, read: true } : item))
  return (
    <NotificationCenter
      notifications={items}
      onMarkRead={(id) => {
        setRead((prev) => new Set(prev).add(id))
        onMarkRead?.(id)
      }}
      onMarkAllRead={() => {
        setRead(new Set(notifications.map((item) => item.id)))
        onMarkAllRead?.()
      }}
      now={now}
      className={className}
    />
  )
}

export { FrameNotifications }
export type { FrameNotificationsProps }
