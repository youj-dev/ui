import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { fn } from 'storybook/test'
import { WeekCalendar } from './week-calendar'

const meta: Meta<typeof WeekCalendar> = {
  title: 'Blocks/App/Week calendar',
  component: WeekCalendar,
  // Default renders on the canvas too.
  render: (args) => (
    <Screen>
      <WeekCalendar {...args} />
    </Screen>
  ),
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Plan your week with a calendar page: the week’s events on a time grid, what’s up next today, and a Slot Grid to find a free hour.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WeekCalendar>

/** The page on its own canvas: the screen carries no frame, only its content. */
const Screen = ({ children }: { children: ReactNode }) => <div className="min-h-dvh bg-canvas text-fg">{children}</div>

export const Default: Story = {
  name: 'Default',
}

/** Its own page, for an app without the frame: the same header and week on a canvas with a `main`. */
export const Standalone: Story = { args: { embedded: false } }

const at = (h: number, m = 0) => h * 60 + m

export const WithYourData: Story = {
  name: 'With your data',
  render: () => (
    <Screen>
      <WeekCalendar
        title="Clinic rota"
        now={new Date(2027, 2, 16, 13, 5)}
        calendars={[
          { id: 'clinic', name: 'Appointments', tone: 'primary' },
          { id: 'surgery', name: 'Surgery', tone: 'danger' },
          { id: 'admin', name: 'Admin', tone: 'success' },
        ]}
        events={[
          { id: 'huddle', title: 'Morning huddle', date: '2027-03-15', start: at(8), end: at(8, 30), calendar: 'admin', recurring: true },
          { id: 'okoro', title: 'Mr Okoro, follow-up', date: '2027-03-15', start: at(9), end: at(9, 30), calendar: 'clinic', location: 'Room 2' },
          {
            id: 'knee',
            title: 'Knee arthroscopy',
            date: '2027-03-16',
            start: at(10),
            end: at(12, 30),
            calendar: 'surgery',
            location: 'Theatre 1',
            people: ['Dr Lima', 'Dr Weiss'],
          },
          { id: 'lima', title: 'Ms Lima, new patient', date: '2027-03-17', start: at(14), end: at(14, 45), calendar: 'clinic', location: 'Room 1' },
          { id: 'audit', title: 'Notes audit', date: '2027-03-19', start: at(15), end: at(16), calendar: 'admin' },
        ]}
        hours={{ start: 7, end: 18 }}
        locale="en-GB"
        copy={{ range: (dates, week) => `${dates} (week ${week})`, where: 'Room', with: 'Team' }}
        onSelect={fn()}
        onDateChange={fn()}
        onViewChange={fn()}
      />
    </Screen>
  ),
}
