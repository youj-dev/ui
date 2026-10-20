'use client'

import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'

const STATS = [
  { label: 'Requests (24h)', value: '1.28M', delta: '+8.2%' },
  { label: 'p95 latency', value: '82 ms', delta: '−6 ms' },
  { label: 'Error rate', value: '0.02%' },
]

const DEPLOYS = [
  { id: 'dpl_8f2a', branch: 'main', message: 'Tighten the pricing grid on mobile', age: '4m', ready: true },
  { id: 'dpl_77c1', branch: 'feat/onboarding', message: 'Copy pass on the welcome step', age: '38m', ready: true },
  { id: 'dpl_65d0', branch: 'fix/og-image', message: 'Regenerate the OG image at 2x', age: '2h', ready: false },
]

// A day of traffic, one bar per hour.
const TRAFFIC = Array.from({ length: 24 }, (_, i) => 30 + Math.round(60 * Math.abs(Math.sin(i * 0.45))))

export default function TabsDemo() {
  return (
    <div className="@container w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas">
      <p className="flex items-center gap-2 px-5 pt-4 text-ui text-fg-muted">
        acme <span aria-hidden>/</span> <span className="font-medium text-fg">web</span>
      </p>
      <Tabs defaultValue="overview" className="mt-1.5 gap-0">
        <TabsList inset aria-label="Project" className="[--tabs-inset:--spacing(5)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">
            Deployments
            <Badge variant="secondary" className="px-1.5 tabular-nums">
              12
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="min-h-44 bg-surface p-5">
          <TabsContent value="overview">
            <div className="grid gap-3 @md:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-line bg-canvas px-4 py-3">
                  <p className="text-ui-sm text-fg-muted">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-fg tabular-nums">{stat.value}</p>
                  {stat.delta && <p className="text-ui-sm text-success-text tabular-nums">{stat.delta}</p>}
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="deployments">
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {DEPLOYS.map((deploy) => (
                <li key={deploy.id} className="flex items-center gap-3 px-4 py-2.5 text-ui">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${deploy.ready ? 'bg-success' : 'bg-danger'}`} />
                  <span className="sr-only">{deploy.ready ? 'Ready' : 'Failed'}:</span>
                  <span className="min-w-0 flex-1 truncate text-fg">{deploy.message}</span>
                  <span className="hidden font-mono text-ui-sm text-fg-muted @md:inline">{deploy.branch}</span>
                  <span className="w-8 text-end text-ui-sm text-fg-muted tabular-nums">{deploy.age}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="analytics">
            <div role="img" aria-label="Requests per hour over the last 24 hours" className="flex h-32 items-end gap-1">
              {TRAFFIC.map((height, hour) => (
                <span key={hour} className="flex-1 rounded-sm bg-accent-line" style={{ height: `${height}%` }} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <pre dir="ltr" className="overflow-x-auto rounded-lg bg-band px-3 py-2.5 font-mono text-ui-sm leading-6 text-fg-muted">
              {'12:04:11  GET   /api/pricing   200   38ms\n12:04:12  GET   /              200   12ms\n12:04:15  POST  /api/checkout  201  211ms'}
            </pre>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-fg-muted">Build command, output directory and environment variables for web.</p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
