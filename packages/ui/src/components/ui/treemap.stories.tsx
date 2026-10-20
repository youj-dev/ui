import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Treemap, type TreemapItem, type TreemapProps } from './treemap'

const kb = (value: number) => `${value} kB`

/** A web app's JavaScript, gzipped, by package. */
const BUNDLE: TreemapItem[] = [
  { id: 'app', name: 'app code', value: 164 },
  { id: 'react-dom', name: 'react-dom', value: 131 },
  { id: 'recharts', name: 'recharts', value: 96 },
  { id: 'prosemirror', name: 'prosemirror', value: 74 },
  { id: 'motion', name: 'motion', value: 52 },
  { id: 'date-fns', name: 'date-fns', value: 31 },
  { id: 'zod', name: 'zod', value: 18 },
  { id: 'rest', name: 'the rest', value: 12 },
]

const meta: Meta<TreemapProps> = {
  title: 'UI/Data/Treemap',
  component: Treemap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How a whole divides: each part is a cell whose area is its value, laid out squarified so cells stay near square, largest first from the top-start corner (mirrored in RTL). Cells show the name and value where they have room, the name alone when smaller and nothing in a sliver; every cell has a tooltip with its name, value and share. `highlight` tints and outlines cells in their tone. One tab stop: the arrow keys move to the nearest cell in that direction, Home and End to the largest and smallest. Cells fade in largest first as the map scrolls into view, and new data re-lays the map on the smooth spring (FLIP, transforms only). Reduced motion: drawn in place; changes land at once.',
      },
    },
  },
  args: {
    items: BUNDLE,
    highlight: 'recharts',
    formatValue: kb,
    label: 'Bundle by package',
  },
}
export default meta
type Story = StoryObj<TreemapProps>

export const Playground: Story = {
  render: (args) => (
    <div className="w-[min(46rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5">
      <Treemap {...args} />
    </div>
  ),
}

const reshuffle = (items: TreemapItem[]) =>
  items.map((item) => ({ ...item, value: Math.max(4, Math.round(item.value * (0.35 + Math.random() * 1.3))) }))

export const DataChange: Story = {
  name: 'Data change',
  render: function Render(args) {
    const [items, setItems] = useState(BUNDLE)
    return (
      <div className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-3">
        <Treemap {...args} items={items} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setItems(reshuffle)}>
            New data
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setItems((list) => (list.length > 5 ? list.slice(0, -1) : BUNDLE))}>
            {items.length > 5 ? 'Drop the smallest' : 'Restore'}
          </Button>
        </div>
      </div>
    )
  },
}

export const Tones: Story = {
  args: {
    items: [
      { id: 'compute', name: 'Compute', value: 4200, tone: 'chart-1' },
      { id: 'database', name: 'Database', value: 2100, tone: 'chart-2' },
      { id: 'bandwidth', name: 'Bandwidth', value: 1500, tone: 'warning' },
      { id: 'support', name: 'Support', value: 900, tone: 'chart-3' },
      { id: 'failed', name: 'Failed jobs', value: 640, tone: 'danger' },
      { id: 'credits', name: 'Credits', value: 400, tone: 'success' },
    ],
    highlight: 'bandwidth',
    formatValue: (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v),
    label: 'Spend by line item',
  },
  render: (args) => (
    <div className="w-[min(36rem,calc(100vw-2rem))]">
      <Treemap {...args} aspect={2.6} />
    </div>
  ),
}

export const ManyParts: Story = {
  name: 'Many small parts',
  args: {
    items: Array.from({ length: 28 }, (_, i) => ({ id: `svc-${i}`, name: `service-${String(i + 1).padStart(2, '0')}`, value: Math.round(900 / (i + 1.4)) })),
    highlight: ['svc-0', 'svc-6'],
    formatValue: (v: number) => `${v} ms`,
    label: 'Latency budget by service',
  },
  render: (args) => (
    <div className="w-[min(40rem,calc(100vw-2rem))]">
      <Treemap {...args} aspect={2} />
    </div>
  ),
}

export const Empty: Story = {
  args: { items: [] },
  render: (args) => (
    <div className="w-80">
      <Treemap {...args} />
    </div>
  ),
}
