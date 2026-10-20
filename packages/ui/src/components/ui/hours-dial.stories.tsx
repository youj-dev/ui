import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Dial } from './dial'
import { HoursDial, type HoursDialProps, type HoursDialValue } from './hours-dial'

const meta: Meta<HoursDialProps> = {
  title: 'UI/Inputs/Hours Dial',
  component: HoursDial,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A stretch of the day on a 24-hour face: midnight at the top, a ruler of quarter-hour ticks all the way round, and two handles on it, a hollow start and a solid end. The ticks between them light in the `tone`, and the center reads the length large in mono with the two times under it. Each handle is a slider of minutes after midnight: arrows step (`step`, 15 minutes), Page Up and Down move an hour, Home and End jump to midnight and the last step before it, and the window may run past midnight. A pointer drags the handle it is near; a press on the lit band drags the whole window; a press elsewhere on the ruler brings the nearer handle there. Every step plays the tick cue. Keyboard and click moves glide on the snappy spring, the short way round; a drag follows the pointer 1:1. A clock turns clockwise in every script. Reduced motion: every change jumps.',
      },
    },
  },
  args: { caption: 'Asleep', label: 'Sleep schedule' },
}
export default meta
type Story = StoryObj<HoursDialProps>

export const Sleep: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<HoursDialValue>({ start: 22 * 60 + 30, end: 6 * 60 + 45 })
    return (
      <div className="w-72">
        <HoursDial {...args} value={value} onValueChange={setValue} />
      </div>
    )
  },
}

/** Quiet hours in a chart color, snapping to half hours. */
export const QuietHours: Story = {
  args: { caption: 'Quiet hours', label: 'Quiet hours', tone: 'chart-4', step: 30, defaultValue: { start: 20 * 60, end: 8 * 60 } },
  render: (args) => (
    <div className="w-64">
      <HoursDial {...args} />
    </div>
  ),
}

/** A daytime window: opening hours, in a 24-hour locale. */
export const OpeningHours: Story = {
  args: { caption: 'Open', label: 'Opening hours', tone: 'neutral', locale: 'de-DE', defaultValue: { start: 9 * 60, end: 17 * 60 + 30 } },
  render: (args) => (
    <div className="w-72">
      <HoursDial {...args} />
    </div>
  ),
}

/** Dial sets one bounded value on a three-quarter arc; HoursDial sets a window on a whole day, which has no ends. */
export const BesideDial: Story = {
  render: function Render(args) {
    const [level, setLevel] = useState(40)
    return (
      <div className="flex flex-wrap items-center gap-10">
        <div className="w-60">
          <Dial label="Volume" caption="Volume" value={level} onValueChange={setLevel} />
        </div>
        <div className="w-60">
          <HoursDial {...args} />
        </div>
      </div>
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, caption: 'Paused' },
  render: (args) => (
    <div className="w-72">
      <HoursDial {...args} />
    </div>
  ),
}
