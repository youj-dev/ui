import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowLanes, type FlowLane } from './flow-lanes'

/** A made-up delivery hub's parcels per minute, by route. */
const LANES: FlowLane[] = [
  { id: 'north', label: 'North loop', value: 64 },
  { id: 'harbor', label: 'Harbor run', value: 142 },
  { id: 'airport', label: 'Airport express', value: 88 },
  { id: 'hills', label: 'Hill towns', value: 31 },
]

const meta: Meta<typeof FlowLanes> = {
  title: 'UI/Data/Flow Lanes',
  component: FlowLanes,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Where a stream goes: one source fans out to a lane per destination, each ending beside its name and rate. Particles ride the lanes at one steady speed, so a busy lane is a dense stream and a quiet one a trickle, and the line’s weight says the same. Hover or focus a lane to light it (`active`, `onActiveChange`); the names are one tab stop walked with the arrow keys. The particles stop off screen and with `paused`. Reduced motion: drawn in place, the particles still on their lanes.',
      },
    },
  },
  args: { source: 'Hub', lanes: LANES, label: 'Parcels by route', formatValue: (v: number) => `${v}/min` },
  argTypes: { lanes: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof FlowLanes>

export const Default: Story = {}

function Pointing() {
  const [active, setActive] = useState<string | null>('harbor')
  return (
    <div className="grid gap-4">
      <FlowLanes source="Hub" lanes={LANES} active={active} onActiveChange={setActive} formatValue={(v) => `${v}/min`} label="Parcels by route" />
      <p className="text-ui-sm text-fg-muted">Lit: {LANES.find((lane) => lane.id === active)?.label ?? 'none'}</p>
    </div>
  )
}

/** One lane lit, its line and stream kept and the others quiet; pointing at a name moves it, so a table beside the chart can do the same. */
export const Active: Story = { render: () => <Pointing /> }

/** Six lanes in chosen tones, one of them nearly idle: it keeps a single particle. */
export const Tones: Story = {
  args: {
    source: 'Balancer',
    label: 'Requests by pool',
    formatValue: (v: number) => `${v}/s`,
    lanes: [
      { id: 'a', label: 'pool-a', value: 210, tone: 'chart-1' },
      { id: 'b', label: 'pool-b', value: 180, tone: 'chart-2' },
      { id: 'c', label: 'pool-c', value: 96, tone: 'chart-3' },
      { id: 'd', label: 'pool-d', value: 40, tone: 'chart-4' },
      { id: 'e', label: 'canary', value: 12, tone: 'chart-5' },
      { id: 'f', label: 'drain', value: 1, tone: 'neutral' },
    ],
  },
}

/** Paused: the particles stop where they are. */
export const Paused: Story = { args: { paused: true } }

/** No lanes yet. */
export const Empty: Story = { args: { lanes: [] } }
