import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityIcon, CreditCardIcon, FileCodeIcon, GlobeIcon, KeyIcon, PlugIcon, ShieldCheckIcon, TerminalIcon, UsersIcon } from '@youj/icons'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardDescription, CardHeader, CardTitle } from './card'
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsListProps } from './tabs'

interface PlaygroundArgs {
  variant: NonNullable<TabsListProps['variant']>
  orientation: 'horizontal' | 'vertical'
  activateOnFocus: boolean
}

const meta: Meta<PlaygroundArgs> = {
  title: 'UI/Navigation/Tabs',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI tabs with a kinetic indicator: one motion SlidingIndicator per list glides to the selected tab on the `smooth` spring (transform-only, retargets mid-glide, re-places without motion on resize, jumps under reduced motion). `underline` (the default) is plain labels on the list\'s hairline with a 2px accent bar under the selected one; `pill` raises a key out of a recessed track. Arrow keys move and select (activateOnFocus, per APG when panels show without latency), Home/End jump, focus loops; vertical lists use ↑ ↓. A long horizontal list scrolls without a scrollbar: its edges fade by how far there is to go, chevrons appear for pointer users, and a newly selected tab scrolls into view. The incoming panel fades in with a 4px drift from the side the selection moved to.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['underline', 'pill'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    activateOnFocus: { control: 'boolean' },
  },
  args: { variant: 'underline', orientation: 'horizontal', activateOnFocus: true },
}
export default meta
type Story = StoryObj<PlaygroundArgs>

function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-4 py-3">
      <span className="text-ui-sm text-fg-muted">{label}</span>
      <span dir="auto" className="text-[20px] leading-7 font-semibold tracking-tight text-fg tabular-nums">{value}</span>
      {delta && <span dir="auto" className="text-ui-sm text-success-text tabular-nums">{delta}</span>}
    </div>
  )
}

const DEPLOYS = [
  { id: 'dpl_8f2a', branch: 'main', message: 'Tighten pricing grid on mobile', age: '4m', status: 'Ready' },
  { id: 'dpl_77c1', branch: 'feat/onboarding', message: 'Copy pass on the welcome step', age: '38m', status: 'Ready' },
  { id: 'dpl_65d0', branch: 'fix/og-image', message: 'Regenerate the OG image at 2x', age: '2h', status: 'Error' },
]

function ProjectTabs() {
  return (
    <div className="w-full max-w-[720px] overflow-hidden rounded-xl border border-line bg-canvas">
      <div className="flex items-center gap-2 px-5 pt-4 text-ui">
        <span aria-hidden className="grid size-5 place-items-center rounded-[5px] bg-fg text-[10px] font-bold text-canvas">
          A
        </span>
        <span className="text-fg-muted">acme</span>
        <span aria-hidden className="text-fg-subtle">/</span>
        <span className="font-medium text-fg">web</span>
      </div>
      <Tabs defaultValue="overview" className="mt-2 gap-0">
        <TabsList inset aria-label="Project" className="[--tabs-inset:--spacing(5)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">
            Deployments
            <Badge variant="secondary" className="h-4.5 px-1.5 tabular-nums">
              12
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="bg-surface px-5 py-5">
          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Requests (24h)" value="1.28M" delta="+8.2%" />
              <Stat label="p95 latency" value="82 ms" delta="−6 ms" />
              <Stat label="Error rate" value="0.02%" />
            </div>
          </TabsContent>
          <TabsContent value="deployments">
            <ul className="divide-y divide-line rounded-lg border border-line">
              {DEPLOYS.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={d.status === 'Error' ? 'size-2 rounded-full bg-danger' : 'size-2 rounded-full bg-success'} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-fg">{d.message}</span>
                  <span className="font-mono text-ui-sm text-fg-muted">{d.branch}</span>
                  <span className="w-10 text-end text-ui-sm text-fg-muted tabular-nums">{d.age}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="flex h-28 items-end gap-1" aria-label="Requests per hour, last 24 hours" role="img">
              {Array.from({ length: 36 }, (_, i) => (
                <span key={i} className="flex-1 rounded-sm bg-accent-line" style={{ height: `${30 + Math.round(60 * Math.abs(Math.sin(i * 0.45)))}%` }} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <pre dir="ltr" className="overflow-x-auto rounded-lg bg-band px-3 py-2.5 font-mono text-ui-sm leading-6 text-fg-muted">
              {`12:04:11  GET  /api/pricing        200  38ms\n12:04:12  GET  /                   200  12ms\n12:04:15  POST /api/checkout       201  211ms`}
            </pre>
          </TabsContent>
          <TabsContent value="storage">
            <p className="text-fg-muted">2 blob stores and 1 KV namespace, 7.4 GB of 10 GB used.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-fg-muted">Build command, output directory and environment variables.</p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

/** A project header: underline tabs whose accent bar glides between tabs (click them, or Tab in and use ← →). */
export const Hero: Story = {
  render: () => <ProjectTabs />,
}

const MANAGERS = {
  pnpm: 'pnpm add @youj/react',
  npm: 'npm install @youj/react',
  yarn: 'yarn add @youj/react',
  bun: 'bun add @youj/react',
}

/** Pill: a raised key glides along a recessed track. Here, switching the install command of a package. */
export const Pill: Story = {
  render: () => (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-line bg-surface">
      <Tabs defaultValue="pnpm" className="gap-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
          <span className="flex items-center gap-2 text-ui text-fg-muted">
            <TerminalIcon className="size-4" />
            Install
          </span>
          <TabsList variant="pill" aria-label="Package manager">
            {Object.keys(MANAGERS).map((m) => (
              <TabsTrigger key={m} value={m} className="font-mono text-ui-sm">
                {m}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {Object.entries(MANAGERS).map(([m, command]) => (
          <TabsContent key={m} value={m} className="px-4 py-4">
            <code className="font-mono text-ui text-fg">
              <span className="text-fg-muted select-none">$ </span>
              {command}
            </code>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
}

const SETTINGS: { value: string; label: string; icon: typeof UsersIcon; body: ReactNode }[] = [
  { value: 'general', label: 'General', icon: GlobeIcon, body: 'Workspace name, URL and default region.' },
  { value: 'members', label: 'Members', icon: UsersIcon, body: '8 members, 1 pending invite. Roles decide who can deploy.' },
  { value: 'billing', label: 'Billing', icon: CreditCardIcon, body: 'Pro plan, renews on the 1st. Usage alerts at 80%.' },
  { value: 'security', label: 'Security', icon: ShieldCheckIcon, body: 'SAML SSO, enforced 2FA and the audit log.' },
  { value: 'integrations', label: 'Integrations', icon: PlugIcon, body: 'GitHub, Slack and Linear are connected.' },
  { value: 'tokens', label: 'API tokens', icon: KeyIcon, body: '3 active tokens. The oldest expires in 12 days.' },
]

function SettingsTabs({ variant }: { variant: 'underline' | 'pill' }) {
  return (
    <Tabs defaultValue="members" orientation="vertical" className="w-full max-w-[640px] gap-6">
      <TabsList variant={variant} aria-label="Settings" className="w-44">
        {SETTINGS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon aria-hidden />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SETTINGS.map(({ value, label, body }) => (
        <TabsContent key={value} value={value} className="rounded-xl border border-line bg-surface p-5">
          <h3 className="text-ui-lg font-semibold text-fg">{label}</h3>
          <p dir="auto" className="mt-1.5 text-fg-muted">{body}</p>
          <Button variant="outline" size="sm" className="mt-4">
            Manage {label.toLowerCase()}
          </Button>
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Vertical settings navigation. ↑ ↓ move and select; the bar glides along the hairline on the start edge. */
export const Vertical: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <SettingsTabs variant="underline" />
      <SettingsTabs variant="pill" />
    </div>
  ),
}

const FILES = [
  'page.tsx',
  'layout.tsx',
  'pricing-grid.tsx',
  'checkout-button.tsx',
  'use-subscription.ts',
  'stripe.server.ts',
  'plans.json',
  'globals.css',
  'middleware.ts',
  'next.config.ts',
  'README.md',
  'package.json',
]

/** `inset`: a list that runs edge to edge keeps its tabs on the content's inset, in every component style. In a Card it takes the card's own inset; `--tabs-inset` sets another. Underline labels line up with the heading and the hairline still spans; a track (pill tabs) lines its edge up with it. */
export const Inset: Story = {
  render: () => (
    <div className="flex w-full max-w-[480px] flex-col gap-6">
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-2">
          <CardTitle>Inbox</CardTitle>
          <CardDescription>3 unread</CardDescription>
        </CardHeader>
        <Tabs defaultValue="all" className="gap-0">
          <TabsList inset aria-label="Filter">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          {['all', 'mentions', 'archived'].map((v) => (
            <TabsContent key={v} value={v} className="px-(--card-spacing) py-4 text-fg-muted">
              {v === 'all' ? 'Three new comments on the pricing page.' : v === 'mentions' ? 'Priya mentioned you in #launch.' : 'Nothing archived yet.'}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
      <div className="overflow-hidden rounded-xl border border-line bg-surface py-3">
        <Tabs defaultValue="pnpm" className="gap-0">
          <TabsList inset variant="pill" aria-label="Package manager" className="[--tabs-inset:--spacing(4)]">
            {Object.keys(MANAGERS).map((m) => (
              <TabsTrigger key={m} value={m} className="font-mono">
                {m}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(MANAGERS).map(([m, command]) => (
            <TabsContent key={m} value={m} className="px-4 pt-3 font-mono text-ui-sm text-fg-muted">
              $ {command}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  ),
}

/** Many tabs in a narrow frame: the list scrolls without a scrollbar, its edges fade by how far there is to go, and chevrons appear for pointer users. Arrow to the end: the focused tab scrolls itself into view. */
export const Overflow: Story = {
  render: () => {
    function Editor() {
      const [file, setFile] = useState('pricing-grid.tsx')
      return (
        <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-line bg-surface">
          <Tabs value={file} onValueChange={(v) => setFile(v as string)} className="gap-0">
            <TabsList inset aria-label="Open files" className="[--tabs-inset:--spacing(4)]">
              {FILES.map((f) => (
                <TabsTrigger key={f} value={f} className="font-mono text-ui-sm">
                  <FileCodeIcon className="text-fg-muted" />
                  {f}
                </TabsTrigger>
              ))}
            </TabsList>
            {FILES.map((f) => (
              <TabsContent key={f} value={f} className="px-4 py-4 font-mono text-ui-sm text-fg-muted">
                {`// ${f}`}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )
    }
    return <Editor />
  },
}

/** dir="rtl": the glide, the fades and the chevrons all mirror. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="flex flex-col gap-8">
        <ProjectTabs />
        <SettingsTabs variant="underline" />
      </div>
    </ThemeScope>
  ),
}

/** Reduced motion: the indicator jumps to the selected tab and the panel appears without its drift. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <ProjectTabs />
    </YoujProvider>
  ),
}

export const Playground: Story = {
  render: ({ variant, orientation, activateOnFocus }) => (
    <Tabs defaultValue="activity" orientation={orientation} className="w-full max-w-[560px]">
      <TabsList variant={variant} activateOnFocus={activateOnFocus} aria-label="Inbox">
        <TabsTrigger value="activity">
          <ActivityIcon />
          Activity
        </TabsTrigger>
        <TabsTrigger value="mentions">Mentions</TabsTrigger>
        <TabsTrigger value="assigned">Assigned to me</TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
      </TabsList>
      {['activity', 'mentions', 'assigned', 'archived'].map((v) => (
        <TabsContent key={v} value={v} className="rounded-lg border border-line bg-surface p-4 text-fg-muted">
          {`Nothing new in ${v}.`}
        </TabsContent>
      ))}
    </Tabs>
  ),
}
