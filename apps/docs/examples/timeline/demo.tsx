'use client'

import { useState } from 'react'
import { Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Timeline, type TimelineEvent } from '@youj/react'

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000)
const daysAgo = (n: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 12, 0, 0)
  return d
}

const ACTIVITY: TimelineEvent[] = [
  {
    id: 'e1',
    type: 'deploy',
    actor: { name: 'Mira Chen' },
    title: (
      <>
        deployed <strong>web@4f2c91a</strong> to production
      </>
    ),
    summary: 'deployed web@4f2c91a to production',
    time: minutesAgo(4),
    meta: <Badge variant="success">Ready</Badge>,
    details: (
      <pre className="overflow-x-auto rounded-md border border-line bg-band px-3 py-2 font-mono text-ui-xs leading-5 text-fg">
        {'Build 38s · 212 routes · 14 edge regions\nPromoted from preview web-git-main'}
      </pre>
    ),
  },
  {
    id: 'e2',
    type: 'alert',
    title: (
      <>
        Error rate on <code>/api/checkout</code> above 2% for 5 minutes
      </>
    ),
    summary: 'Error rate on /api/checkout above 2%',
    time: minutesAgo(26),
    meta: <Badge variant="warning">Resolved</Badge>,
  },
  {
    id: 'e3',
    type: 'comment',
    actor: { name: 'Jonas Weber' },
    title: 'commented on #482, “Can we keep the old endpoint until Friday?”',
    time: minutesAgo(58),
  },
  { id: 'e4', type: 'merge', actor: { name: 'Priya Natarajan' }, title: 'merged #479, Streaming responses for search', time: daysAgo(1, 17) },
  { id: 'e5', type: 'pull-request', actor: { name: 'Jonas Weber' }, title: 'opened #482, Deprecate v1 checkout endpoint', time: daysAgo(1, 11) },
]

const OLDER: TimelineEvent[] = [
  { id: 'o1', type: 'commit', actor: { name: 'Sam Okafor' }, title: 'pushed 7 commits to feat/billing-portal', time: daysAgo(3, 16) },
  { id: 'o2', type: 'alert', title: 'Certificate for status.acme.dev renews in 7 days', time: daysAgo(4, 8) },
]

const INCOMING: Omit<TimelineEvent, 'id' | 'time'>[] = [
  { type: 'commit', actor: { name: 'Sam Okafor' }, title: 'pushed 1 commit to main' },
  { type: 'comment', actor: { name: 'Priya Natarajan' }, title: 'commented on #482, “Friday works.”' },
  { type: 'deploy', actor: { name: 'Sam Okafor' }, title: 'deployed web@9c01aa4 to preview' },
]

export default function ActivityFeed() {
  const [events, setEvents] = useState(ACTIVITY)
  const [hasMore, setHasMore] = useState(true)
  const [count, setCount] = useState(0)

  const simulate = () => {
    const next = INCOMING[count % INCOMING.length]!
    setEvents((list) => [{ ...next, id: `live-${count}`, time: new Date() }, ...list])
    setCount((c) => c + 1)
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Activity
        </CardTitle>
        <CardDescription>acme/web · all environments</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={simulate}>
            Simulate event
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Timeline
          events={events}
          locale="en-US"
          hasMore={hasMore}
          onLoadMore={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900))
            setEvents((list) => [...list, ...OLDER])
            setHasMore(false)
          }}
        />
      </CardContent>
    </Card>
  )
}
