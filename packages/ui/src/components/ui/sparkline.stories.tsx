import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Sparkline, type SparklineProps } from './sparkline'

const meta: Meta<SparklineProps> = {
  title: 'UI/Data/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A word-sized trend line: a monotone curve (it never overshoots a point), a wash under it and a dot on the latest value, in plain SVG. When it scrolls into view the curve is revealed left to right on the deliberate token and the dot lands on the settle spring; a data change morphs the curve point by point on the slow token and the dot glides to the new value. It stretches to its box and keeps its stroke width. With `label` it is a named image; without, decorative. Reduced motion: drawn in place, changes jump.',
      },
    },
  },
  argTypes: {
    area: { control: 'boolean' },
    dot: { control: 'boolean' },
    color: { control: 'text' },
  },
  args: {
    data: [12, 14, 13, 17, 16, 19, 22, 21, 24, 27],
    area: true,
    dot: true,
    label: 'Signups over 10 days, rising',
  },
}
export default meta
type Story = StoryObj<SparklineProps>

export const Playground: Story = {
  render: (args) => <Sparkline {...args} className="h-10 w-56" />,
}

const walk = (n: number, start = 40) => {
  const out = [start]
  for (let i = 1; i < n; i++) out.push(Math.max(4, out[i - 1]! + (Math.random() - 0.45) * 12))
  return out.map((v) => Math.round(v))
}

export const Morph: Story = {
  name: 'Data morph',
  render: function Render() {
    const [data, setData] = useState(() => walk(16))
    return (
      <div className="flex w-72 flex-col gap-3">
        <Sparkline data={data} className="h-14" label="Requests per minute" />
        <Button variant="outline" size="sm" className="self-start" onClick={() => setData(walk(16))}>
          New data
        </Button>
      </div>
    )
  },
}

export const InATable: Story = {
  name: 'In a table row',
  render: () => (
    <ul className="w-96 divide-y divide-line rounded-xl border border-line bg-surface text-ui">
      {[
        { name: 'api.youj.dev', trend: [120, 132, 128, 141, 150, 147, 162], color: 'var(--color-chart-1)' },
        { name: 'edge-eu-west', trend: [88, 84, 90, 79, 76, 81, 72], color: 'var(--color-chart-4)' },
        { name: 'cdn-assets', trend: [40, 41, 39, 44, 43, 46, 48], color: 'var(--color-chart-3)' },
      ].map((row) => (
        <li key={row.name} className="flex items-center gap-4 px-4 py-2.5">
          <span className="flex-1 truncate">{row.name}</span>
          <Sparkline data={row.trend} color={row.color} area={false} className="h-6 w-24" />
          <span className="w-10 text-end text-fg-muted tabular-nums">{row.trend[row.trend.length - 1]}</span>
        </li>
      ))}
    </ul>
  ),
}
