import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Dial, type DialProps } from './dial'

const meta: Meta<DialProps> = {
  title: 'UI/Inputs/Dial',
  component: Dial,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A bounded value on a ruled arc: a three-quarter ring ticked at every step, the value as an ink knob on the band and large in mono in the middle. `current` adds a measured value (a marker inside the band and “Now” under the figure) and lights the stretch between it and the value in the `tone`; `marks` put setpoints on the ruler. It’s a Base UI slider under the arc: arrows step, Page Up and Down take large steps, Home and End jump to the ends, and a pointer anywhere on the band drags the knob round, snapping to the step. Every step plays the tick cue. Keyboard and click steps glide on the snappy spring; a drag follows the pointer 1:1. A dial turns clockwise in every script. Reduced motion: every change jumps.',
      },
    },
  },
  args: { min: 10, max: 30, step: 0.5, current: 19.8, tone: 'warm', caption: 'Heating to', label: 'Target temperature', format: { style: 'unit', unit: 'celsius', minimumFractionDigits: 1, maximumFractionDigits: 1 } },
}
export default meta
type Story = StoryObj<DialProps>

export const Thermostat: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(21.5)
    return (
      <div className="w-72">
        <Dial {...args} value={value} onValueChange={setValue} marks={[{ value: 17, label: 'Away' }, { value: 18, label: 'Night' }, { value: 21, label: 'Morning' }]} />
      </div>
    )
  },
}

/** `variant="ticks"`: a ring of radial ticks lit up to the value, with no band or knob. Here a room's target, warm. */
export const Temperature: Story = {
  args: { variant: 'ticks', min: 10, max: 30, step: 0.5, current: undefined, tone: 'warm', caption: 'Set to', label: 'Target temperature' },
  render: function Render(args) {
    const [value, setValue] = useState(21.5)
    return (
      <div className="w-64">
        <Dial {...args} value={value} onValueChange={setValue} />
      </div>
    )
  },
}

/** `bands` change the tone by value: dry in warm, comfortable in success, damp in the cool chart color. */
export const Humidity: Story = {
  args: {
    variant: 'ticks',
    min: 0,
    max: 100,
    step: 1,
    current: undefined,
    caption: undefined,
    label: 'Humidity',
    format: { style: 'unit', unit: 'percent' },
    bands: [
      { from: 0, tone: 'warm' },
      { from: 30, tone: 'success' },
      { from: 60, tone: 'chart-5' },
    ],
  },
  render: function Render(args) {
    const [value, setValue] = useState(15)
    return (
      <div className="w-64">
        <Dial {...args} value={value} onValueChange={setValue} />
      </div>
    )
  },
}

/** Any bounded control: a speaker's volume on the ticks ring, with no measured value. */
export const Volume: Story = {
  args: { variant: 'ticks', ticks: 41, min: 0, max: 100, step: 1, current: undefined, tone: 'accent', caption: 'Volume', label: 'Volume', format: { style: 'percent' } },
  render: function Render(args) {
    const [value, setValue] = useState(40)
    return (
      <div className="w-60">
        <Dial {...args} value={value / 100} min={0} max={1} step={0.01} onValueChange={(v) => setValue(Math.round(v * 100))} />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, tone: 'neutral', caption: 'Off', defaultValue: 19 },
  render: (args) => (
    <div className="w-72">
      <Dial {...args} />
    </div>
  ),
}
