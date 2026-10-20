import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon, RocketIcon } from '@youj/icons'
import { Button } from './button'
import { NotificationCenter, useNotificationToasts, type NotificationItem } from './notification-center'
import { Toaster } from './toast'

const meta: Meta<typeof NotificationCenter> = {
  title: 'UI/Display/Notification center',
  component: NotificationCenter,
  excludeStories: ['inbox', 'nextNotification', 'useInbox'],
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A bell with an unread count that opens your notifications: a Popover on desktop, a bottom Sheet below the md breakpoint. Tabs filter All, Unread and Mentions; items are grouped into Today and Earlier with who, what, when, an unread dot and actions; Mark all as read clears the lot, and every tab has an empty state. When a notification arrives the bell swings once (youj\'s BellIcon), the count rolls and the badge pops in on the first unread; with the panel open, arrivals take their slot at the top through PresenceList and items marked read leave the Unread tab the same way. The bell\'s name carries the count and arrivals are announced politely. `useNotificationToasts` shows a toast for each arrival while the center is closed. Reduced motion: no swing or pop; changes land in place.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NotificationCenter>

const minutes = (n: number) => new Date(Date.now() - n * 60_000)
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

export const inbox: NotificationItem[] = [
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
  { id: 'n4', icon: AlertTriangleIcon, title: 'Error rate on /api/checkout recovered', time: daysAgo(1), read: true },
  { id: 'n5', actor: { name: 'Priya Natarajan' }, title: 'approved your pull request #479', time: daysAgo(2), read: true },
  { id: 'n6', actor: { name: 'Sam Okafor' }, title: 'replied to your comment', body: '“Friday works for me.”', time: daysAgo(3), read: true, mention: true },
]

const templates: Omit<NotificationItem, 'id' | 'time'>[] = [
  { actor: { name: 'Kenji Mori' }, title: 'assigned you KIN-231', body: 'Chart tooltips should follow keyboard focus' },
  { icon: RocketIcon, title: 'Preview ready for feat/notifications', body: 'youj-git-feat-notifications.vercel.app' },
  { actor: { name: 'Inès Laurent' }, title: 'mentioned you in Research notes', mention: true, body: '“@you the avatar stack tested well.”' },
]
let count = 0
export function nextNotification(): NotificationItem {
  const template = templates[count % templates.length]!
  count++
  return { ...template, id: `live-${count}`, time: new Date() }
}

/** Story state: a list the bell reads, plus read/mark-all handlers. */
export function useInbox(initial = inbox) {
  const [items, setItems] = useState(initial)
  return {
    items,
    push: () => setItems((list) => [nextNotification(), ...list]),
    markRead: (id: string) => setItems((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item))),
    markAllRead: () => setItems((list) => list.map((item) => ({ ...item, read: true }))),
  }
}

export const Hero: Story = {
  name: 'Hero: in an app bar',
  parameters: { layout: 'padded' },
  render: function Render() {
    const { items, push, markRead, markAllRead } = useInbox()
    const [open, setOpen] = useState(false)
    // Toast arrivals only while the panel is closed; open, the list shows them.
    useNotificationToasts(items, { enabled: !open })
    return (
      <div className="w-full max-w-[760px]">
        <header className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
          <span className="text-ui font-semibold">youj</span>
          <span className="text-ui text-fg-muted">/ web</span>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={push}>
              Simulate notification
            </Button>
            <NotificationCenter notifications={items} onMarkRead={markRead} onMarkAllRead={markAllRead} open={open} onOpenChange={setOpen} />
          </div>
        </header>
        <Toaster />
      </div>
    )
  },
}

export const LiveArrivals: Story = {
  name: 'Live arrivals while open',
  parameters: {
    layout: 'padded',
    docs: { description: { story: 'The panel starts open and a notification arrives every four seconds: it takes its slot at the top while the rest glide down.' } },
  },
  render: function Render() {
    const { items, push, markRead, markAllRead } = useInbox()
    const [open, setOpen] = useState(true)
    useEffect(() => {
      const id = setInterval(push, 4000)
      return () => clearInterval(id)
    }, [])
    return (
      <div className="flex w-full max-w-[760px] justify-end">
        <NotificationCenter notifications={items} onMarkRead={markRead} onMarkAllRead={markAllRead} open={open} onOpenChange={setOpen} />
      </div>
    )
  },
}

export const Empty: Story = {
  name: 'All caught up',
  render: function Render() {
    const { items, markRead, markAllRead } = useInbox([])
    return <NotificationCenter notifications={items} onMarkRead={markRead} onMarkAllRead={markAllRead} />
  },
}

export const Mobile: Story = {
  name: 'Small screens: bottom sheet',
  parameters: {
    docs: { description: { story: 'Below the md breakpoint the same panel opens in a bottom Sheet. Narrow the canvas to see it.' } },
  },
  render: function Render() {
    const { items, push, markRead, markAllRead } = useInbox()
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={push}>
          Simulate notification
        </Button>
        <NotificationCenter notifications={items} onMarkRead={markRead} onMarkAllRead={markAllRead} />
      </div>
    )
  },
}
