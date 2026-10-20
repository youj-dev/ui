import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'
import { Button } from './button'
import { ShareBar, type ShareBarProps, type ShareBarTone } from './share-bar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

const meta: Meta<ShareBarProps> = {
  title: 'UI/Data/Share Bar',
  component: ShareBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A word-sized share of a whole for a table cell or a list row: a solid bar, or a run of cells (`segments`) for the dense, counted look. `value` is 0–1, or out of `max`; `tone` is the accent, a chart color, a status or neutral. The fill’s edge travels on the smooth spring (a clip, so shapes never stretch): it fills from empty as it scrolls into view and retargets from where it is on a new value. With `label` it is a `meter`; without, it is decorative, for when the number sits beside it. Reduced motion: drawn at its value; changes jump.',
      },
    },
  },
  argTypes: {
    tone: { control: 'select', options: ['accent', 'neutral', 'success', 'warning', 'danger', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] },
    segments: { control: { type: 'number', min: 0, max: 40 } },
  },
  args: { value: 0.62, segments: 20, tone: 'accent', label: 'Share of spend' },
}
export default meta
type Story = StoryObj<ShareBarProps>

export const Playground: Story = {
  render: (args) => <ShareBar {...args} className="w-60" />,
}

const PLANS: { name: string; accounts: number; mrr: string; share: number; trend: 'up' | 'flat' | 'down'; tone: ShareBarTone }[] = [
  { name: 'Business', accounts: 318, mrr: '€41,630', share: 0.412, trend: 'up', tone: 'accent' },
  { name: 'Team', accounts: 1_072, mrr: '€29,810', share: 0.295, trend: 'up', tone: 'chart-2' },
  { name: 'Enterprise', accounts: 14, mrr: '€19,390', share: 0.192, trend: 'flat', tone: 'chart-3' },
  { name: 'Starter', accounts: 2_655, mrr: '€7,960', share: 0.079, trend: 'down', tone: 'warning' },
  { name: 'Legacy', accounts: 97, mrr: '€2,230', share: 0.022, trend: 'down', tone: 'neutral' },
]
const TREND = { up: { label: 'Growing', variant: 'success' }, flat: { label: 'Steady', variant: 'secondary' }, down: { label: 'Shrinking', variant: 'warning' } } as const
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const InATable: Story = {
  name: 'In a table',
  render: () => (
    <div className="w-[min(46rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead className="text-end">Accounts</TableHead>
            <TableHead className="text-end">MRR</TableHead>
            <TableHead className="w-60">Share of MRR</TableHead>
            <TableHead className="text-end">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PLANS.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell className="text-end font-mono tabular-nums">{row.accounts.toLocaleString('en-US')}</TableCell>
              <TableCell className="text-end font-mono tabular-nums">{row.mrr}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* The percentage beside it says the value, so the bar is decorative. */}
                  <ShareBar value={row.share} segments={24} tone={row.tone} className="w-40" />
                  <span className="ms-auto font-mono text-fg-muted tabular-nums">{pct.format(row.share)}</span>
                </div>
              </TableCell>
              <TableCell className="text-end">
                <Badge variant={TREND[row.trend].variant}>{TREND[row.trend].label}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}

export const Solid: Story = {
  name: 'Solid, in a list',
  render: () => (
    <ul className="flex w-80 flex-col gap-2.5 rounded-xl border border-line bg-surface p-4 text-ui">
      {[
        { name: 'web-app', value: 412 },
        { name: 'api', value: 268 },
        { name: 'mobile', value: 190 },
        { name: 'docs', value: 42 },
      ].map((row) => (
        <li key={row.name} className="flex items-center gap-3">
          <span className="w-20 truncate font-mono text-fg-muted">{row.name}</span>
          <ShareBar value={row.value} max={480} tone="neutral" className="flex-1" />
          <span className="w-20 text-end font-mono tabular-nums">{row.value} min</span>
        </li>
      ))}
    </ul>
  ),
}

export const Tones: Story = {
  render: () => (
    <div className="grid w-80 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-ui">
      {(['accent', 'success', 'warning', 'danger', 'neutral', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const).map((tone, i) => (
        <div key={tone} className="contents">
          <span className="font-mono text-fg-muted">{tone}</span>
          <ShareBar value={0.3 + i * 0.07} segments={i % 2 ? undefined : 18} tone={tone} label={tone} />
        </div>
      ))}
    </div>
  ),
}

export const Live: Story = {
  name: 'Live value',
  render: function Render() {
    const [value, setValue] = useState(0.42)
    return (
      <div className="flex w-72 flex-col gap-3">
        <ShareBar value={value} segments={24} tone="success" label="Pass rate" />
        <ShareBar value={value} tone="success" label="Pass rate, solid" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setValue(Math.random())}>
            New value
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setValue((v) => (v > 0 ? 0 : 1))}>
            {value > 0 ? 'Empty' : 'Full'}
          </Button>
        </div>
      </div>
    )
  },
}

const QUEUE = [
  { label: 'Passing', value: 34, tone: 'success' as const },
  { label: 'Flaky', value: 7, tone: 'warning' as const },
  { label: 'Failing', value: 3, tone: 'danger' as const },
  { label: 'Skipped', value: 12, tone: 'neutral' as const },
]

/** Ticks: each segment a hairline, colored by the part it falls in, over a legend of counts. */
export const Ticks: Story = {
  name: 'Ticks with a legend',
  render: function Render() {
    const [active, setActive] = useState<number | null>(null)
    const total = QUEUE.reduce((sum, q) => sum + q.value, 0)
    return (
      <div className="flex w-80 flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-ui">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">Test suites</span>
          <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{total} suites</span>
        </div>
        <ShareBar parts={QUEUE} segments={48} mark="tick" active={active} label="Test suites by result" />
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-ui-sm">
          {QUEUE.map((q, i) => (
            <li key={q.label} className="flex items-center gap-1.5" onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)}>
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: `var(--color-${q.tone === 'neutral' ? 'fg-subtle' : q.tone})` }} />
              <span className="font-mono font-medium tabular-nums">{q.value}</span>
              <span className="text-fg-muted">{q.label}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}

const SPLIT = [
  { value: 0.46, label: 'Compute' },
  { value: 0.27, label: 'Storage' },
  { value: 0.16, label: 'Network' },
  { value: 0.11, label: 'Support', tone: 'neutral' as const },
]

/** A whole split into parts, solid and in cells; pick a part and the rest quiet. Pair it with BreakdownList for a key that points. */
export const Parts: Story = {
  name: 'Split into parts',
  render: function Render() {
    const [active, setActive] = useState<number | null>(null)
    return (
      <div className="flex w-80 flex-col gap-4">
        <ShareBar parts={SPLIT} active={active} label="Spend by service" className="h-2" />
        <ShareBar parts={SPLIT} segments={32} active={active} label="Spend by service, in cells" />
        <div className="flex flex-wrap gap-1.5">
          {SPLIT.map((part, i) => (
            <Button key={part.label} variant={active === i ? 'secondary' : 'ghost'} size="xs" onClick={() => setActive(active === i ? null : i)}>
              {part.label}
            </Button>
          ))}
        </div>
      </div>
    )
  },
}
