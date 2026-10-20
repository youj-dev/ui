import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { UnitChart, type UnitChartBucket, type UnitChartProps } from './unit-chart'

/** Quarter-hour slots from 11:30 to 22:15, as "HH:MM". */
const slot = (i: number) => {
  const minutes = 11 * 60 + 30 + i * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** A bistro's expected covers per quarter hour: a lunch rush, a quiet afternoon, a longer dinner. */
const COVERS: UnitChartBucket[] = [
  3, 6, 9, 12, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0, 0, 1, 1, 2, 3, 5, 8, 11, 14, 17, 19, 18, 16, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 1, 0, 0,
].map((value, i) => ({ label: slot(i), value }))

const covers = (value: number) => `${value} ${value === 1 ? 'cover' : 'covers'}`

const meta: Meta<UnitChartProps> = {
  title: 'UI/Data/Unit Chart',
  component: UnitChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A count you can see one by one: each column is a bucket and each dot in it one unit (`unit` sets how much a dot counts for), stacked from the baseline over a faint grid of every dot the chart could hold. Labels sit under every few columns. `highlight` keeps a range of buckets in the tone and quiets the rest. One tab stop: the arrow keys walk the columns, Home and End go to the ends, and focus or hover shows the bucket and its value. The dots light column by column as it scrolls into view, and new data lights and darkens the dots that change in the same wave. Reduced motion: drawn in place.',
      },
    },
  },
  args: {
    data: COVERS,
    formatValue: covers,
    label: 'Covers through the day',
    tickEvery: 8,
  },
}
export default meta
type Story = StoryObj<UnitChartProps>

export const Playground: Story = {
  render: (args) => (
    <div className="w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5">
      <UnitChart {...args} />
    </div>
  ),
}

export const CoversThroughTheDay: Story = {
  name: 'Covers through the day',
  render: (args) => {
    const total = COVERS.reduce((sum, b) => sum + b.value, 0)
    return (
      <div className="flex w-[min(44rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium tabular-nums">{total}</span>
            <span className="text-ui text-fg-muted">covers expected</span>
          </div>
          <span className="text-ui-sm text-fg-muted">One dot, one cover</span>
        </div>
        <UnitChart {...args} highlight={[18, 33]} />
        <p className="text-ui-sm text-fg-muted">Dinner service, 16:00 to 19:45, in the accent.</p>
      </div>
    )
  },
}

/** Support tickets per hour over a day, each dot five tickets. */
const TICKETS: UnitChartBucket[] = [12, 8, 5, 4, 6, 10, 22, 48, 85, 110, 124, 118, 96, 102, 115, 108, 92, 70, 52, 40, 33, 28, 20, 15].map(
  (value, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, value }),
)

export const TicketsByHour: Story = {
  name: 'Tickets by hour',
  args: {
    data: TICKETS,
    unit: 5,
    tone: 'chart-2',
    tickEvery: 6,
    label: 'Support tickets by hour',
    formatValue: (v: number) => `${v} tickets`,
  },
  render: (args) => (
    <div className="flex w-[min(36rem,calc(100vw-2rem))] flex-col gap-3">
      <UnitChart {...args} />
      <p className="text-ui-sm text-fg-muted">Each dot is five tickets.</p>
    </div>
  ),
}

const reshuffle = (data: UnitChartBucket[]) => data.map((b) => ({ ...b, value: Math.max(0, Math.round(b.value * (0.6 + Math.random() * 0.8))) }))

export const DataChange: Story = {
  name: 'Data change',
  render: function Render(args) {
    const [data, setData] = useState(COVERS)
    return (
      <div className="flex w-[min(44rem,calc(100vw-2rem))] flex-col gap-3">
        <UnitChart {...args} data={data} rows={24} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setData(reshuffle)}>
            New forecast
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setData(COVERS)}>
            Reset
          </Button>
        </div>
      </div>
    )
  },
}

export const Empty: Story = {
  args: { data: [] },
  render: (args) => (
    <div className="w-80">
      <UnitChart {...args} />
    </div>
  ),
}
