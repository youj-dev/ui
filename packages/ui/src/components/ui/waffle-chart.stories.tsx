import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { WaffleChart, type WaffleChartItem, type WaffleChartProps } from './waffle-chart'

/** A kitchen's food waste over a week, in kilograms, by where it came from. */
const WASTE: WaffleChartItem[] = [
  { id: 'trim', name: 'Produce trim', value: 22 },
  { id: 'plates', name: 'Plate returns', value: 17 },
  { id: 'overprep', name: 'Overprep', value: 15 },
  { id: 'bread', name: 'Bread', value: 11 },
  { id: 'dairy', name: 'Dairy', value: 7 },
]
const kg = (v: number) => `${v} kg`

/** A team's storage, in GB, by file type. */
const STORAGE: WaffleChartItem[] = [
  { id: 'video', name: 'Video', value: 412 },
  { id: 'images', name: 'Images', value: 236 },
  { id: 'docs', name: 'Documents', value: 128 },
  { id: 'archives', name: 'Archives', value: 94 },
  { id: 'other', name: 'Other', value: 50, tone: 'neutral' },
]

const meta: Meta<WaffleChartProps> = {
  title: 'UI/Data/Waffle Chart',
  component: WaffleChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A whole in countable cells: each cell is one unit (`unit` sets how much), colored by its part. Square cells by default, hexagons with `shape="hex"`. `layout="rows"` fills from the top-start corner row by row; `layout="cluster"` gathers the cells into a round patch at the center, each part a wedge, with empty cells around. Hovering or focusing a part, in the legend or on a cell, lights its cells and quiets the rest; the legend is one tab stop whose arrow keys walk the parts. The cells fill in order as it scrolls into view (outward from the center for a cluster), and new data recolors the cells that change. Reduced motion: drawn in place.',
      },
    },
  },
  args: {
    items: WASTE,
    formatValue: kg,
    label: 'Waste by source',
  },
}
export default meta
type Story = StoryObj<WaffleChartProps>

export const Playground: Story = {
  args: { columns: 12 },
  render: (args) => (
    <div className="w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5">
      <WaffleChart {...args} />
    </div>
  ),
}

export const WasteBySource: Story = {
  name: 'Waste by source',
  args: { shape: 'hex', layout: 'cluster', columns: 16, rows: 10 },
  render: (args) => (
    <div className="flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-medium tabular-nums">72 kg</span>
        <span className="text-ui text-fg-muted">this week. Each cell is 1 kg.</span>
      </div>
      <WaffleChart {...args} />
    </div>
  ),
}

export const StorageByType: Story = {
  name: 'Storage by type',
  args: { items: STORAGE, unit: 10, columns: 15, formatValue: (v: number) => `${v} GB`, label: 'Storage by file type' },
  render: (args) => (
    <div className="flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2">
      <WaffleChart {...args} />
      <p className="text-ui-sm text-fg-muted">Each cell is 10 GB.</p>
    </div>
  ),
}

const reshuffle = (items: WaffleChartItem[]) => items.map((item) => ({ ...item, value: Math.max(2, Math.round(item.value * (0.5 + Math.random()))) }))

export const DataChange: Story = {
  name: 'Data change',
  args: { shape: 'hex', layout: 'cluster', columns: 16, rows: 10 },
  render: function Render(args) {
    const [items, setItems] = useState(WASTE)
    return (
      <div className="flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-3">
        <WaffleChart {...args} items={items} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setItems(reshuffle)}>
            Next week
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setItems(WASTE)}>
            Reset
          </Button>
        </div>
      </div>
    )
  },
}

export const Empty: Story = {
  args: { items: [] },
  render: (args) => (
    <div className="w-80">
      <WaffleChart {...args} />
    </div>
  ),
}
