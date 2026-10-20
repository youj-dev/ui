import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LollipopChart, type LollipopDatum } from './lollipop-chart'

/** A made-up league's teams, goal difference against par. */
const TEAMS: LollipopDatum[] = [
  { id: 'harbor', label: 'Harbor FC', value: 14 },
  { id: 'mill', label: 'Mill Lane', value: -9 },
  { id: 'north', label: 'North End', value: 6 },
  { id: 'quarry', label: 'Quarry Town', value: -17 },
  { id: 'river', label: 'Riverside', value: 2 },
  { id: 'station', label: 'Station Road', value: -3 },
  { id: 'vale', label: 'Vale Rovers', value: 21 },
  { id: 'wharf', label: 'Wharf United', value: 9 },
].map((t) => ({ ...t, tone: t.value < -5 ? 'danger' : t.value < 5 ? 'warning' : 'success' }))

const signed = (v: number) => `${v > 0 ? '+' : ''}${v}`

const meta: Meta<typeof LollipopChart> = {
  title: 'UI/Data/Lollipop Chart',
  component: LollipopChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Many items on one value scale, each a dot on a stem from a baseline, in its tone. Sorted, it reads from the worst to the best. One item can be picked: its column gets a band, its dot a ring and a pill names it. A listbox, one tab stop: the arrows walk the items, Enter picks, and focus or hover shows each one. The stems grow from the baseline as it scrolls into view. Reduced motion: drawn in place.',
      },
    },
  },
  args: { data: TEAMS, sort: 'ascending', formatValue: signed, label: 'Goal difference by team' },
  argTypes: { data: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof LollipopChart>

export const Default: Story = {}

function Picking() {
  const [value, setValue] = useState<string | null>('river')
  return (
    <div className="grid gap-3">
      <LollipopChart data={TEAMS} sort="ascending" value={value} onValueChange={setValue} formatValue={signed} label="Goal difference by team" />
      <p className="text-ui-sm text-fg-muted">Picked: {TEAMS.find((t) => t.id === value)?.label ?? 'none'}</p>
    </div>
  )
}

/** One item picked: its band, ringed dot and pill. Click a dot, or tab in and use the arrows and Enter. */
export const Picked: Story = { render: () => <Picking /> }

/** A fixed domain and ticks, percent values from a budget, highest first. */
export const Domain: Story = {
  args: {
    sort: 'descending',
    domain: [-1, 1],
    ticks: [-1, -0.5, 0, 0.5, 1],
    formatValue: (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}%`,
    formatTick: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`,
    data: TEAMS.map((t) => ({ ...t, value: t.value / 25 })),
    label: 'Budget left',
  },
}

/** No items yet. */
export const Empty: Story = { args: { data: [] } }
