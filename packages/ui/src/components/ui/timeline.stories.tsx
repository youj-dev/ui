import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Timeline, type TimelineEvent, type TimelineProps } from './timeline'

const meta: Meta<TimelineProps> = {
  title: 'UI/Display/Timeline',
  component: Timeline,
  excludeStories: ['activity', 'olderActivity', 'nextActivity', 'LiveTimeline'],
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An activity feed: events grouped by day, newest first, each with a typed mark on a rail (commit, comment, deploy, alert, merge, pull request, or your own), who did it and a relative time that stays true. An event that arrives while the feed is on screen takes its slot at the top through motion\'s PresenceList (it fades down while the events below glide to make room) and its mark plays once; Load more appends older events the same way. Details open in place with motion\'s Collapse, and marks play on hover. Each day is a heading and a list, arrivals are announced politely, and each time is a <time> with the full date. Reduced motion: events appear in place and details open instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<TimelineProps>

const minutes = (n: number) => new Date(Date.now() - n * 60_000)
const days = (n: number, hour = 14) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 12, 0, 0)
  return d
}

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-md border border-line bg-band px-3 py-2 font-mono text-ui-xs leading-5 text-fg">{children}</pre>
)

export const activity: TimelineEvent[] = [
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
    time: minutes(4),
    meta: <Badge variant="success">Ready</Badge>,
    details: <Code>{'Build 38s · 212 routes · Edge: 14 regions\nPromoted from preview youj-git-main.vercel.app'}</Code>,
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
    time: minutes(26),
    meta: <Badge variant="warning">Resolved</Badge>,
    details: (
      <Code>{'TypeError: Cannot read properties of undefined (reading "currency")\n  at priceFor (lib/pricing.ts:48:19)\n  at handler (app/api/checkout/route.ts:22:11)'}</Code>
    ),
  },
  {
    id: 'e3',
    type: 'comment',
    actor: { name: 'Jonas Weber' },
    title: 'commented on #482, "Can we keep the old endpoint until Friday?"',
    time: minutes(58),
  },
  {
    id: 'e4',
    type: 'commit',
    actor: { name: 'Mira Chen' },
    title: (
      <>
        pushed 3 commits to <code>main</code>
      </>
    ),
    summary: 'pushed 3 commits to main',
    time: minutes(71),
    details: (
      <ul className="flex flex-col gap-1 font-mono text-ui-xs">
        <li>
          <span className="text-fg-muted">4f2c91a</span> <span className="text-fg">Guard currency lookup in priceFor</span>
        </li>
        <li>
          <span className="text-fg-muted">b81d0e4</span> <span className="text-fg">Add checkout error-rate alert</span>
        </li>
        <li>
          <span className="text-fg-muted">09ac7f2</span> <span className="text-fg">Bump recharts to 3.8</span>
        </li>
      </ul>
    ),
  },
  { id: 'e5', type: 'merge', actor: { name: 'Priya Natarajan' }, title: 'merged #479, Streaming responses for search', time: days(1, 17) },
  { id: 'e6', type: 'pull-request', actor: { name: 'Jonas Weber' }, title: 'opened #482, Deprecate v1 checkout endpoint', time: days(1, 11) },
  { id: 'e7', type: 'deploy', actor: { name: 'Priya Natarajan' }, title: 'deployed api@77e0b3d to production', time: days(1, 9) },
]

export const olderActivity: TimelineEvent[] = [
  { id: 'o1', type: 'commit', actor: { name: 'Sam Okafor' }, title: 'pushed 7 commits to feat/billing-portal', time: days(3, 16) },
  { id: 'o2', type: 'comment', actor: { name: 'Mira Chen' }, title: 'commented on #471, "Looks good once the copy is final."', time: days(3, 10) },
  { id: 'o3', type: 'alert', title: 'Certificate for status.youj.dev renews in 7 days', time: days(4, 8) },
]

const incoming: Omit<TimelineEvent, 'id' | 'time'>[] = [
  { type: 'commit', actor: { name: 'Sam Okafor' }, title: 'pushed 1 commit to main' },
  { type: 'comment', actor: { name: 'Priya Natarajan' }, title: 'commented on #482, "Friday works."' },
  { type: 'deploy', actor: { name: 'Sam Okafor' }, title: 'deployed web@9c01aa4 to preview' },
  { type: 'alert', title: 'p95 latency back under 200 ms' },
]

let counter = 0
export function nextActivity(): TimelineEvent {
  const template = incoming[counter % incoming.length]!
  counter++
  return { ...template, id: `live-${counter}`, time: new Date() }
}

export function LiveTimeline({ className, auto = false }: { className?: string; auto?: boolean }) {
  const [events, setEvents] = useState(activity)
  const [older, setOlder] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => {
    if (!auto) return
    timer.current = setInterval(() => setEvents((list) => [nextActivity(), ...list]), 6000)
    return () => clearInterval(timer.current)
  }, [auto])
  return (
    <Card className={className ?? 'w-full max-w-[560px]'}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>youj/web · all environments</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setEvents((list) => [nextActivity(), ...list])}>
            Simulate event
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Timeline
          events={events}
          hasMore={older}
          onLoadMore={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900))
            setEvents((list) => [...list, ...olderActivity])
            setOlder(false)
          }}
        />
      </CardContent>
    </Card>
  )
}

export const ActivityFeed: Story = {
  name: 'Hero: activity feed',
  render: () => <LiveTimeline />,
}

export const Empty: Story = {
  render: () => (
    <Card className="w-full max-w-[480px]">
      <CardContent>
        <Timeline events={[]} />
      </CardContent>
    </Card>
  ),
}
