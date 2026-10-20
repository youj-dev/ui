'use client'

import { useState } from 'react'
import { GitCommitIcon } from '@youj/icons'
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from 'recharts'
import { Badge } from '../../../components/ui/badge'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { Timeline, type TimelineEvent } from '../../../components/ui/timeline'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'

/* The spotlight's three live demos: a Timeline that takes a pushed commit and
 * its deploy, a deploy list whose Production badge moves on promote, and a
 * bar chart that regrows when the metric changes. */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const MINUTE = 60_000

export function PreviewDemo() {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const now = Date.now()
    return [
      { id: 'd1', type: 'deploy', title: 'Preview ready for fix/checkout-copy', actor: { name: 'Grace Hopper' }, time: now - 4 * MINUTE, meta: <Badge variant="success">Ready</Badge> },
      { id: 'c1', type: 'commit', title: 'Tighten the checkout copy', actor: { name: 'Grace Hopper' }, time: now - 6 * MINUTE },
      { id: 'p1', type: 'pull-request', title: 'Opened PR 482, Checkout copy', actor: { name: 'Grace Hopper' }, time: now - 9 * MINUTE },
    ]
  })
  const push = async () => {
    const n = events.length
    setEvents((list) => [{ id: `c${n}`, type: 'commit', title: 'Address review comments', actor: { name: 'Ada Lovelace' }, time: Date.now() }, ...list])
    // lint-blocks-allow: paces the illustrative preview build, not an app action
    await wait(1100)
    setEvents((list) => [
      { id: `d${n}`, type: 'deploy', title: 'Preview ready for fix/checkout-copy', actor: { name: 'Northwind' }, time: Date.now(), meta: <Badge variant="success">Ready</Badge> },
      ...list,
    ])
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>fix/checkout-copy</CardTitle>
        <CardDescription>Pull request 482</CardDescription>
        <CardAction>
          <AsyncButton size="sm" variant="outline" onAction={push} pendingLabel="Building…" successLabel="Deployed">
            <GitCommitIcon size={16} /> Push a commit
          </AsyncButton>
        </CardAction>
      </CardHeader>
      {/* The first events' height at 100%: a push lands on top and the oldest scroll away, so the card never grows. */}
      <CardContent className="h-53.25 overflow-y-auto yj-scrollbar">
        <Timeline events={events} />
      </CardContent>
    </Card>
  )
}

const DEPLOYS = [
  { id: 'dpl_8f2a', message: 'Tighten the checkout copy', ago: '4m ago' },
  { id: 'dpl_77c1', message: 'Lazy-load the review widget', ago: '2h ago' },
  { id: 'dpl_5b90', message: 'Upgrade the image pipeline', ago: 'Yesterday' },
]

export function RollbackDemo() {
  const [production, setProduction] = useState(DEPLOYS[0]!.id)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployments</CardTitle>
        <CardDescription>storefront · production</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-line">
          {DEPLOYS.map((d) => {
            const live = d.id === production
            return (
              <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-ui font-medium text-fg">{d.message}</span>
                  <span className="truncate font-mono text-ui-sm text-fg-muted">
                    {d.id} · {d.ago}
                  </span>
                </span>
                {live ? (
                  <Badge variant="success">Production</Badge>
                ) : (
                  <AsyncButton
                    size="sm"
                    variant="outline"
                    aria-label={`Promote ${d.id} to production`}
                    pendingLabel="Promoting…"
                    successLabel="Live"
                    onAction={async () => {
                      // lint-blocks-allow: paces the illustrative promote, not an app action
                      await wait(900)
                      setProduction(d.id)
                    }}
                  >
                    Promote
                  </AsyncButton>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

const METRICS = {
  visitors: { label: 'Visitors', data: [3200, 4100, 3800, 5200, 6100, 5400, 7300] },
  errors: { label: 'Errors', data: [42, 38, 51, 12, 9, 7, 5] },
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const chartConfig = { value: { label: 'Value', color: 'var(--color-chart-1)' } } satisfies ChartConfig

export function AnalyticsDemo() {
  const [metric, setMetric] = useState<keyof typeof METRICS>('visitors')
  const motion = useChartMotion()
  const data = DAYS.map((day, i) => ({ day, value: METRICS[metric].data[i] }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{METRICS[metric].label}</CardTitle>
        <CardDescription>By day, split at Thursday’s deploy</CardDescription>
        <CardAction>
          <ToggleGroup
            variant="segmented"
            size="sm"
            value={[metric]}
            onValueChange={(value) => value[0] && setMetric(value[0] as keyof typeof METRICS)}
            aria-label="Metric"
          >
            <ToggleGroupItem value="visitors">Visitors</ToggleGroupItem>
            <ToggleGroupItem value="errors">Errors</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ value: { ...chartConfig.value, label: METRICS[metric].label } }} title={`${METRICS[metric].label} by day`} className="aspect-auto h-52 w-full">
          <BarChart key={metric} data={data} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={32} {...motion.grow(0)}>
              {data.map((d, i) => (
                <Cell key={d.day} fill={i < 3 ? 'var(--color-chart-3)' : 'var(--color-value)'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
