'use client'

import { useRef, useState } from 'react'
import { AlertTriangleIcon, RocketIcon } from '@youj/icons'
import { Button, NotificationCenter, useNotificationToasts, type NotificationItem } from '@youj/react'

const minutes = (n: number) => new Date(Date.now() - n * 60_000)
const days = (n: number) => new Date(Date.now() - n * 86_400_000)

const INBOX: NotificationItem[] = [
  {
    id: 'n1',
    actor: { name: 'Mira Chen' },
    title: 'mentioned you in Q3 roadmap',
    body: '“@you can we get the chart kit into the dashboard before the review?”',
    time: minutes(3),
    mention: true,
    actions: [
      { label: 'Reply', onClick: () => {}, variant: 'default' },
      { label: 'Open doc', onClick: () => {} },
    ],
  },
  { id: 'n2', icon: RocketIcon, title: 'web@4f2c91a is live in production', body: 'Build 38s · 14 regions', time: minutes(18) },
  {
    id: 'n3',
    actor: { name: 'Jonas Weber' },
    title: 'invited you to youj/infra',
    time: minutes(64),
    actions: [
      { label: 'Accept', onClick: () => {}, variant: 'default' },
      { label: 'Decline', onClick: () => {} },
    ],
  },
  { id: 'n4', icon: AlertTriangleIcon, title: 'Error rate on /api/checkout recovered', time: days(1), read: true },
  { id: 'n5', actor: { name: 'Priya Natarajan' }, title: 'approved your pull request #479', time: days(2), read: true },
]

const ARRIVALS: Omit<NotificationItem, 'id' | 'time'>[] = [
  { actor: { name: 'Kenji Mori' }, title: 'assigned you KIN-231', body: 'Chart tooltips should follow keyboard focus' },
  { icon: RocketIcon, title: 'Preview ready for feat/notifications' },
  { actor: { name: 'Inès Laurent' }, title: 'mentioned you in Research notes', mention: true, body: '“@you the avatar stack tested well.”' },
]

export default function NotificationCenterDemo() {
  const [items, setItems] = useState(INBOX)
  const [open, setOpen] = useState(false)
  const sent = useRef(0)

  // While the panel is closed, each arrival also shows as a toast (the app renders one <Toaster />).
  useNotificationToasts(items, { enabled: !open })

  const simulate = () => {
    const next = ARRIVALS[sent.current % ARRIVALS.length]!
    sent.current++
    setItems((list) => [{ ...next, id: `live-${sent.current}`, time: new Date() }, ...list])
  }

  return (
    <header className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
      <span className="text-ui font-semibold whitespace-nowrap">youj</span>
      <span className="text-ui whitespace-nowrap text-fg-muted">/ web</span>
      <div className="ms-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={simulate}>
          Simulate notification
        </Button>
        <NotificationCenter
          notifications={items}
          open={open}
          onOpenChange={setOpen}
          onMarkRead={(id) => setItems((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))}
          onMarkAllRead={() => setItems((list) => list.map((item) => ({ ...item, read: true })))}
        />
      </div>
    </header>
  )
}
