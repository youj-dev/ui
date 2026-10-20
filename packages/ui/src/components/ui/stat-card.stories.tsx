import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckIcon, MoreHorizontalIcon, ServerIcon, ShuffleIcon, WorkflowIcon, ZapIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import { Card } from './card'
import { Sparkline } from './sparkline'
import { Stat, StatBars, StatBreakdown, StatCard, StatDelta, StatGroup, StatMeter, StatNote, StatValue, type StatCardProps } from './stat-card'

const meta: Meta<StatCardProps> = {
  title: 'UI/Data/Stat card',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Analytics tiles built like an instrument readout. `Stat` is one tile, a group named by its label; `StatGroup` joins tiles on hairlines; `StatCard` is a tile on its own Card with its parts as props. Inside a tile: `StatValue` (the figure, rolling like an odometer, its unit small and muted), `StatDelta` (a triangle and the change in the good or bad ink, then its comparison), `StatNote`, and one picture of the data: `StatBars` (recent readings, last period as ticks), `StatMeter` (a share or progress to a target, with a pace notch) or `StatBreakdown` (how a total splits). Reduced motion: every figure and picture is drawn at its value.',
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    invert: { control: 'boolean' },
    value: { control: 'number' },
    delta: { control: 'number' },
  },
  args: {
    label: 'Monthly recurring revenue',
    value: 48210,
    delta: 0.124,
    comparison: 'vs. last month',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    loading: false,
    invert: false,
  },
}
export default meta
type Story = StoryObj<StatCardProps>

const usd = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 } as const

interface Reading {
  mrr: number
  mrrChange: number
  orders: number[]
  lastWeek: number[]
  latency: number
  health: [number, number, number]
}

const FIRST: Reading = {
  mrr: 121_140,
  mrrChange: 0.064,
  orders: [182, 204, 197, 221, 236, 214, 248],
  lastWeek: [171, 188, 201, 194, 210, 205, 219],
  latency: 184,
  health: [41, 15, 8],
}

/** The next "live" reading: figures drift, the week gains a day. */
function next(r: Reading): Reading {
  const drift = (n: number, spread: number) => Math.max(0, Math.round(n * (1 + (Math.random() - 0.45) * spread)))
  const day = drift(r.orders.at(-1)!, 0.2)
  return {
    mrr: drift(r.mrr, 0.04),
    mrrChange: Math.round((Math.random() - 0.3) * 200) / 1000,
    orders: [...r.orders.slice(1), day],
    lastWeek: [...r.lastWeek.slice(1), drift(r.lastWeek.at(-1)!, 0.1)],
    latency: drift(r.latency, 0.18),
    health: [drift(r.health[0], 0.1), drift(r.health[1], 0.3), drift(r.health[2], 0.4)],
  }
}

function Desk({ reading: r, loading }: { reading: Reading; loading?: boolean }) {
  const orders = r.orders.reduce((a, b) => a + b, 0)
  const before = r.lastWeek.reduce((a, b) => a + b, 0)
  return (
    <StatGroup aria-label="This week" className="w-full max-w-[1040px] grid-cols-2 lg:grid-cols-4">
      <Stat label="Monthly recurring revenue" loading={loading}>
        <StatValue value={r.mrr} format={usd} />
        <StatDelta value={r.mrrChange}>vs. last month</StatDelta>
        <StatMeter value={r.mrr} max={130_000} marker={120_000} detail={r.mrr < 130_000 ? `$${((130_000 - r.mrr) / 1000).toFixed(1)}K to go` : 'Met'}>
          of the $130K target
        </StatMeter>
      </Stat>
      <Stat label="Orders" action={<span>7 days</span>} loading={loading}>
        <StatValue value={orders} />
        <StatDelta value={(orders - before) / before}>vs. last week</StatDelta>
        <StatBars data={r.orders} previous={r.lastWeek} tone="accent" label="Orders by day this week, with last week's as ticks" />
      </Stat>
      <Stat label="p95 latency" loading={loading}>
        <StatValue value={r.latency} format={{ style: 'unit', unit: 'millisecond', unitDisplay: 'short' }} />
        <StatDelta value={(r.latency - 176) / 176} invert>
          vs. yesterday
        </StatDelta>
        <StatMeter value={r.latency} max={250} tone={r.latency > 225 ? 'danger' : r.latency > 200 ? 'warning' : 'neutral'}>
          of the 250 ms budget
        </StatMeter>
      </Stat>
      <Stat
        label="Accounts"
        loading={loading}
        action={
          <Button variant="ghost" size="icon-xs" aria-label="Accounts options">
            <MoreHorizontalIcon />
          </Button>
        }
      >
        <StatValue value={r.health[0] + r.health[1] + r.health[2]} />
        <StatNote>by health</StatNote>
        <StatBreakdown
          parts={[
            { label: 'Healthy', value: r.health[0], tone: 'neutral' },
            { label: 'At risk', value: r.health[1], tone: 'warning' },
            { label: 'Churning', value: r.health[2], tone: 'danger' },
          ]}
        />
      </Stat>
    </StatGroup>
  )
}

export const Hero: Story = {
  name: 'Hero: revenue desk (live)',
  render: function Render() {
    const [reading, setReading] = useState(FIRST)
    const [loading, setLoading] = useState(false)
    const refetch = () => {
      setLoading(true)
      setTimeout(() => {
        setReading(next)
        setLoading(false)
      }, 1200)
    }
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setReading(next)}>
            Next reading
          </Button>
          <Button variant="ghost" size="sm" onClick={refetch}>
            Refetch
          </Button>
        </div>
        <Desk reading={reading} loading={loading} />
      </div>
    )
  },
}

export const Playground: Story = {
  render: (args) => (
    <StatCard
      {...args}
      className="w-72"
      chart={<StatBars data={[31, 33, 32, 36, 38, 37, 41, 44, 43, 48]} label="MRR over the last 10 weeks, rising" />}
    />
  ),
}

export const Cards: Story = {
  name: 'Stat cards',
  render: () => (
    <div className="grid w-full max-w-[1040px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      <StatCard label="Visitors" value={48210} previous={42891} comparison="vs. last week" chart={<StatBars data={[31, 33, 32, 36, 38, 37, 41, 44, 48]} tone="chart-1" />} />
      <StatCard
        label="Error rate"
        value={0.0021}
        previous={0.0029}
        invert
        format={{ style: 'percent', maximumFractionDigits: 2 }}
        comparison="vs. last 30 days"
        chart={<Sparkline data={[29, 31, 27, 26, 28, 24, 25, 23, 22, 21]} color="var(--color-success)" className="h-9" />}
      />
      <StatCard label="Seats" value={42} unit="of 50" comparison="8 left on this plan" chart={<StatMeter value={42} max={50}>in use</StatMeter>} />
    </div>
  ),
}

export const Loading: Story = {
  render: () => <Desk reading={FIRST} loading />,
}

export const Deltas: Story = {
  name: 'Deltas',
  render: () => (
    <div className="flex flex-col gap-3">
      <StatDelta value={0.124}>vs. last month</StatDelta>
      <StatDelta value={-0.031}>vs. last month</StatDelta>
      <StatDelta value={-0.092} invert>
        latency, vs. yesterday
      </StatDelta>
      <StatDelta value={0.14} invert>
        churn, vs. last quarter
      </StatDelta>
      <StatDelta value={0}>vs. last week</StatDelta>
      <StatDelta value={4} format={{ maximumFractionDigits: 0 }}>
        accounts since Monday
      </StatDelta>
    </div>
  ),
}

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  parameters: { docs: { description: { story: 'Figures, bars, meters and breakdowns are drawn at their values; nothing rolls, rises or opens.' } } },
  render: () => <Desk reading={FIRST} />,
}

const SIGNED: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' }

const SHIFTS: { label: string; change: number; data: number[]; color: string; note: string; chip?: { text: string; variant: 'warning' | 'secondary' } }[] = [
  { label: 'Annual plans', change: 0.21, data: [12, 13, 12, 14, 13, 15, 17, 16, 19, 22], color: 'var(--color-chart-1)', note: 'Upgrades ahead of the price change on Nov 1.', chip: { text: 'Surge', variant: 'warning' } },
  { label: 'Team seats', change: 0.09, data: [40, 41, 39, 42, 43, 42, 44, 45, 44, 46], color: 'var(--color-chart-1)', note: 'Two large workspaces added an editor team.' },
  { label: 'Starter plans', change: -0.17, data: [30, 31, 29, 28, 29, 27, 26, 25, 26, 24], color: 'var(--color-fg-subtle)', note: 'Trials converting to Team instead.' },
  { label: 'Add-on storage', change: 0.06, data: [8, 9, 8, 9, 9, 10, 9, 10, 10, 11], color: 'var(--color-chart-3)', note: 'Only six weeks of sales so far.', chip: { text: 'Early', variant: 'secondary' } },
]

/** The change is the figure: a signed percentage, its recent shape beside it, and one line of why. */
export const ChangeWithSparkline: Story = {
  name: 'Change with a sparkline',
  render: () => (
    <StatGroup className="w-full max-w-[1040px]">
      {SHIFTS.map((shift) => (
        <Stat
          key={shift.label}
          label={shift.label}
          action={shift.chip && <Badge variant={shift.chip.variant}>{shift.chip.text}</Badge>}
        >
          <div className="flex items-center justify-between gap-3">
            <StatValue value={shift.change} format={SIGNED} size="lg" />
            <Sparkline data={shift.data} color={shift.color} className="h-10 w-24 shrink-0" />
          </div>
          <StatNote>{shift.note}</StatNote>
        </Stat>
      ))}
    </StatGroup>
  ),
}

/** A row of headline figures on one panel, split by hairlines; the gap in the bad ink, the scenario in the good one with its change. */
export const SplitFigures: Story = {
  name: 'Figures split by dividers',
  render: () => (
    <StatGroup className="w-full max-w-[1040px]">
      <Stat label="Net retention">
        <StatValue value={1.042} format={{ style: 'percent', maximumFractionDigits: 1 }} size="lg" />
        <StatNote>Likely 102.8% to 105.1%</StatNote>
      </Stat>
      <Stat label="Annual run rate">
        <StatValue value={6_300_000} format={{ style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }} size="lg" />
        <StatNote>€1.1M added this year</StatNote>
      </Stat>
      <Stat label="Short of plan">
        <StatValue value={212_000} format={{ style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }} size="lg" className="text-danger-text" />
        <StatNote>4% under the €5.5M plan</StatNote>
      </Stat>
      <Stat label="With the fixes">
        <StatValue value={1.06} format={{ style: 'percent', maximumFractionDigits: 1 }} size="lg" className="text-success-text" />
        <StatDelta value={1.8} format={{ maximumFractionDigits: 1 }}>
          pts, the gap down to €96K
        </StatDelta>
      </Stat>
    </StatGroup>
  ),
}

const FOUND = [
  { icon: <ServerIcon />, count: 14, noun: 'services', chip: '96% matched', tile: 'bg-success-subtle text-success-text' },
  { icon: <WorkflowIcon />, count: 3, noun: 'pipelines', chip: '81% matched', tile: 'bg-accent-subtle text-accent-text' },
  { icon: <ShuffleIcon />, count: 27, noun: 'handoffs', chip: '5 unconfirmed', tile: 'bg-info-subtle text-info-text' },
  { icon: <ZapIcon />, count: 1_208, noun: 'events', chip: 'live', tile: 'bg-warning-subtle text-warning-text' },
]

/** Small tiles that each count one kind of thing: an icon tile, the count with its noun, and a chip that qualifies it. */
export const IconTiles: Story = {
  name: 'Icon tile, count and chip',
  render: () => (
    <div className="grid w-[30rem] max-w-[94vw] grid-cols-2 gap-3">
      {FOUND.map((item) => (
        <Card key={item.noun} size="sm" role="group" aria-label={`${item.count} ${item.noun}`} className="items-center gap-3 py-5 text-center">
          <span aria-hidden className={`flex size-10 items-center justify-center rounded-lg [&_svg]:size-5 ${item.tile}`}>
            {item.icon}
          </span>
          <StatValue value={item.count} unit={item.noun} size="sm" from={item.count} className="justify-center" />
          <Badge variant="outline">
            <CheckIcon /> {item.chip}
          </Badge>
        </Card>
      ))}
    </div>
  ),
}
