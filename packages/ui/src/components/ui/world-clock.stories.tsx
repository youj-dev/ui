import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { WorldClock, type WorldClockProps, type WorldClockZone } from './world-clock'

const TEAM: WorldClockZone[] = [
  { timeZone: 'Europe/London', label: 'Ada · London' },
  { timeZone: 'America/New_York', label: 'Grace · New York' },
  { timeZone: 'Asia/Singapore', label: 'Lin · Singapore', workingHours: [8.5, 17.5] },
  { timeZone: 'America/Los_Angeles', label: 'Joan · San Francisco', workingHours: [8, 16] },
]

const CITIES: WorldClockZone[] = [
  { timeZone: 'Europe/Berlin', label: 'Berlin' },
  { timeZone: 'America/New_York', label: 'New York' },
  { timeZone: 'Asia/Kolkata', label: 'Bengaluru', workingHours: [10, 18] },
]

/** A Tuesday in October, 10:00 in London. */
const TUESDAY = Date.UTC(2026, 9, 13, 9, 0)

const meta: Meta<WorldClockProps> = {
  title: 'UI/Data/World Clock',
  component: WorldClock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Several time zones side by side, to find a time that works for everyone. Each row is a zone or a person: its name, its offset from UTC and from the first row, the time there with a sun or a moon, and a strip of the first row’s day, an hour per cell, colored by working hours, the waking hours around them, and night; where a zone’s date turns over, a line marks it and the cell names the new day. One cursor runs down every row at the chosen moment: drag it, click a strip, or use the arrow keys, and it snaps to the step. With no moment chosen it follows the clock, and Now goes back to it. Where everyone is working at once, a ring holds those hours and the header says when. Every change is announced politely in each zone. Offsets come from each zone’s own clock, so changes of clocks land where they do. Reduced motion: the cursor jumps and the times change in place.',
      },
    },
  },
  argTypes: {
    step: { control: { type: 'select' }, options: [15, 30, 60] },
    hourCycle: { control: { type: 'inline-radio' }, options: [undefined, 12, 24] },
    compact: { control: 'boolean' },
  },
  args: { zones: TEAM, step: 15 },
  render: (args) => (
    <div className="w-[52rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-5">
      <WorldClock {...args} />
    </div>
  ),
}
export default meta
type Story = StoryObj<WorldClockProps>

export const Playground: Story = { args: { defaultValue: TUESDAY } }

/** Live: the cursor follows the clock and each time ticks over; move it to propose a time, Now brings it back. */
export const Team: Story = {
  name: 'Team across four zones',
  args: { zones: TEAM },
}

function MeetingPlanner(args: WorldClockProps) {
  const [value, setValue] = useState<Date | null>(new Date(Date.UTC(2026, 9, 13, 15, 0)))
  const when = value ?? new Date()
  return (
    <div className="flex w-[52rem] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-ui-lg font-medium text-fg">Design review</h3>
        <p className="text-ui-sm text-fg-muted">
          {new Intl.DateTimeFormat('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London', timeZoneName: 'short' }).format(when)}
        </p>
      </div>
      <WorldClock {...args} value={value} onValueChange={setValue} step={30} />
    </div>
  )
}

/** Controlled: the app holds the proposed time and shows it beside the title; the ring shows the hours everyone can make. */
export const FindAMeetingTime: Story = {
  name: 'Find a meeting time',
  args: { zones: [TEAM[0]!, TEAM[1]!, TEAM[3]!] },
  render: (args) => <MeetingPlanner {...args} />,
}

/** One line per zone and a slim strip, for a sidebar or a card. */
export const Compact: Story = {
  args: { zones: CITIES, compact: true, defaultValue: TUESDAY },
  render: (args) => (
    <div className="w-[34rem] max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-4">
      <WorldClock {...args} />
    </div>
  ),
}

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  args: { defaultValue: TUESDAY },
  parameters: { docs: { description: { story: 'Motion is set to reduced for this story: the cursor jumps to each new time and the times change in place.' } } },
}
