import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Gauge, type GaugeProps, type GaugeThreshold } from './gauge'

const INDEX: GaugeThreshold[] = [
  { value: 0, tone: 'danger', label: 'Critical' },
  { value: 45, tone: 'warning', label: 'Strained' },
  { value: 75, tone: 'success', label: 'Nominal' },
]

const LOAD: GaugeThreshold[] = [
  { value: 70, tone: 'warning', label: 'Busy' },
  { value: 90, tone: 'danger', label: 'Saturated' },
]

const meta: Meta<GaugeProps> = {
  title: 'UI/Data/Gauge',
  component: Gauge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One bounded score at a glance: a thin half-ring on a scale of ticks, read left to right, the value in its bowl and a word for its band underneath, between the range’s ends (`role="meter"`). Thresholds split the range into bands: the fill takes the band’s tone and the band’s label becomes the sub-label, spoken with the value. `gradient` lays the bands under the fill as faint zones split by hairline gaps. A fine needle across the band marks the value. When it scrolls into view the fill sweeps up on the smooth spring and the number and the index ride the same spring; a new value retargets mid-flight. Sizes sm, default and lg. Reduced motion: drawn at its value, changes jump.',
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    tone: { control: 'select', options: ['accent', 'success', 'warning', 'danger', 'neutral'] },
    gradient: { control: 'boolean' },
  },
  args: { value: 71, size: 'lg', gradient: true, thresholds: INDEX, label: 'Health index' },
}
export default meta
type Story = StoryObj<GaugeProps>

/** A service's health index over its zones: the scale reads at once, the band's word sits under the number and the needle marks where it stands. */
export const Hero: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col items-start gap-5 rounded-xl border border-line bg-surface px-6 pt-5 pb-7">
      <p className="text-ui text-fg-muted">
        <span className="font-mono text-fg">payments-api</span> · 6 h window
      </p>
      <Gauge {...args} className="self-center" />
    </div>
  ),
}

export const Playground: Story = {}

/** Bands without zones: the fill takes the tone of the band the value is in, and crossfades as it crosses into the next. */
export const Thresholds: Story = {
  args: { gradient: false, thresholds: LOAD, value: 76, label: 'CPU load', size: 'default', format: { style: 'unit', unit: 'percent' } },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <div className="flex flex-col items-center gap-4">
        <Gauge {...args} value={value} />
        <div className="flex gap-2">
          {[34, 76, 95].map((v) => (
            <Button key={v} size="sm" variant={v === value ? 'secondary' : 'outline'} onClick={() => setValue(v)}>
              {v}%
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** A new value springs from wherever the fill is, so pressing quickly never jumps. */
export const Retarget: Story = {
  name: 'Live value',
  render: function Render(args) {
    const [value, setValue] = useState(64)
    return (
      <div className="flex flex-col items-center gap-4">
        <Gauge {...args} value={value} />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.max(0, v - 17))}>
            −17
          </Button>
          <Button size="sm" variant="outline" onClick={() => setValue(Math.round(Math.random() * 100))}>
            Random
          </Button>
          <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.min(100, v + 17))}>
            +17
          </Button>
        </div>
      </div>
    )
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <Gauge {...args} size="sm" value={38} />
      <Gauge {...args} size="default" value={64} />
      <Gauge {...args} size="lg" value={86} />
    </div>
  ),
}

/** Tones for a gauge without bands: the accent by default, or a status or the neutral ink. */
export const Tones: Story = {
  args: { gradient: false, thresholds: undefined, size: 'sm' },
  render: (args) => (
    <div className="flex flex-wrap items-end gap-6">
      {(['accent', 'success', 'warning', 'danger', 'neutral'] as const).map((tone, i) => (
        <Gauge key={tone} {...args} tone={tone} value={30 + i * 15} label={tone}>
          {tone}
        </Gauge>
      ))}
    </div>
  ),
}

/** Reduced motion draws the gauge at its value and changes jump; the value and the band are still spoken. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: the arc, the index and the number appear at their value.' } } },
  args: { value: 58 },
}
