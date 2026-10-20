import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { MeetingBooking } from './meeting-booking'

const tempo = defineTheme({ accent: 'oklch(0.6 0.19 355)', radius: 'lg' }) // youj-allow: theme accent

const meta: Meta<typeof MeetingBooking> = {
  title: 'Blocks/App/Meeting booking',
  component: MeetingBooking,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: tempo },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Let visitors choose a meeting time with a booking page that accounts for duration and time zone.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MeetingBooking>

export const Default: Story = {}

/** The booking card alone (`embedded`), as it sits inside another page: centered here on a plain stage. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center p-6">
      <MeetingBooking {...args} />
    </div>
  ),
}

/** Your host, meeting, lengths, zones and availability, with booking wired to `onBook`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Northwind' },
    host: { name: 'Jonas Weber', role: 'Solutions engineer, Northwind' },
    meeting: { title: 'Platform demo', description: 'A guided tour of the dashboard, the API and SSO, with time for your questions.', location: 'Google Meet' },
    durations: [20, 40, 60],
    defaultDuration: 40,
    zones: [
      { value: 'berlin', label: 'Berlin · CET', offset: 0 },
      { value: 'london', label: 'London · GMT', offset: -1 },
      { value: 'new-york', label: 'New York · EST', offset: -6 },
    ],
    defaultZone: 'berlin',
    today: new Date(2027, 0, 4),
    availability: (date: Date) => (date.getDay() === 2 || date.getDay() === 4 ? [9 * 60, 10 * 60, 14 * 60, 15 * 60 + 30] : []),
    copy: { pickDay: 'Choose a date', notes: (host: string) => `Anything ${host} should prepare?`, confirm: 'Book the demo' },
    onBook: fn(),
    onAddToCalendar: fn(),
    onReschedule: fn(),
    onDateChange: fn(),
    onDurationChange: fn(),
    onZoneChange: fn(),
  },
}
