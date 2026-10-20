import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { TimeLanes, type RotaLane, type TimeLanesProps, type RotaShift } from './time-lanes'

const HOUR = 3_600_000
const WEEK = new Date(2026, 8, 28).getTime()
const at = (day: number, hour: number) => WEEK + (day * 24 + hour) * HOUR

const LANES: RotaLane[] = [
  { id: 'mara', name: 'Mara Quinn', detail: 'Primary' },
  { id: 'theo', name: 'Theo Park', detail: 'Primary' },
  { id: 'iris', name: 'Iris Okafor', detail: 'Primary' },
  { id: 'db', name: 'Database team', detail: 'Secondary', initials: 'DB', tone: 'neutral' },
]

const SHIFTS: RotaShift[] = [
  { id: 'a', lane: 'mara', start: at(-1, 9), end: at(1, 9) },
  { id: 'b', lane: 'theo', start: at(1, 9), end: at(3, 9) },
  { id: 'c', lane: 'iris', start: at(3, 9), end: at(5, 9) },
  { id: 'd', lane: 'mara', start: at(5, 9), end: at(7, 9) },
  { id: 'o', lane: 'iris', start: at(2, 18), end: at(2, 23), override: true, note: 'Covering Theo' },
  { id: 'x', lane: 'db', start: at(0, 0), end: at(3, 12) },
  { id: 'y', lane: 'db', start: at(3, 12), end: at(7, 0) },
]

const meta: Meta<TimeLanesProps> = {
  title: 'UI/Data/Time Lanes',
  component: TimeLanes,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Who is on call when, as a week of lanes: a lane per person or team in the chart colors, each shift a bar, overrides hatched, a dashed baton where one lane hands off to another, and now as an accent line that glides with the clock. Shifts that ended fade; the one on call now is lit. The shifts are one tab stop: arrows move along a lane and between lanes (mirrored in RTL), Home and End jump to a lane’s ends, and Enter opens the shift’s detail in a popover, with room for your own actions through `renderDetail`. Reduced motion: the line jumps.',
      },
    },
  },
  args: { lanes: LANES, shifts: SHIFTS, start: WEEK, now: at(2, 14.5) },
}
export default meta
type Story = StoryObj<TimeLanesProps>

export const Default: Story = {
  name: 'On-call rota',
  render: (args) => (
    <div className="w-[52rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-5">
      <TimeLanes {...args} />
    </div>
  ),
}

/** Your own actions at the foot of a shift's detail. */
export const WithActions: Story = {
  name: 'With actions',
  render: (args) => (
    <div className="w-[52rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-5">
      <TimeLanes
        {...args}
        renderDetail={() => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm">
              Swap
            </Button>
            <Button size="sm">Page</Button>
          </div>
        )}
      />
    </div>
  ),
}

/** Without `now`, the line follows the clock once the page is live; outside the week there's no line. */
export const NextWeek: Story = { name: 'Next week', args: { now: null } }

const DAY_START = new Date(2026, 9, 5, 8).getTime()
const t = (h: number, m = 0) => DAY_START + ((h - 8) * 60 + m) * 60_000
const DRIVERS: RotaLane[] = [
  { id: 'mq', name: 'Mara Quinn', detail: 'Load 4821' },
  { id: 'tp', name: 'Theo Park', detail: 'Load 4910' },
  { id: 'io', name: 'Iris Okafor', detail: 'Available' },
]
const RUNS: RotaShift[] = [
  { id: 'r1', lane: 'mq', start: t(8), end: t(9, 40), label: '4790', tone: 'neutral' },
  { id: 'r2', lane: 'mq', start: t(10), end: t(14, 50), label: '4821' },
  { id: 'r2x', lane: 'mq', start: t(14, 50), end: t(15, 37), label: '+47m', tone: 'danger', override: true, note: 'Running late on Ridge road' },
  { id: 'r3', lane: 'tp', start: t(8), end: t(10, 20), label: '4874', tone: 'neutral' },
  { id: 'r4', lane: 'tp', start: t(10, 50), end: t(13, 20), label: '4910', tone: 'danger', note: 'Dock conflict at 13:30' },
  { id: 'p1', lane: 'tp', start: t(13, 50), end: t(16), label: 'Reassign', proposed: true },
  { id: 'r5', lane: 'io', start: t(8), end: t(9, 50), label: '4863', tone: 'neutral' },
  { id: 'p2', lane: 'io', start: t(10, 30), end: t(13), label: '4935', proposed: true, note: '4.2 mi from the yard' },
  { id: 'p3', lane: 'io', start: t(13, 50), end: t(16), label: '4910', proposed: true },
]

/** A dispatcher's day: `hours` for an hour axis, bars labeled by load, a late overrun hatched in danger and proposed runs dashed. */
export const DayView: Story = {
  name: 'Day view, proposed',
  args: { lanes: DRIVERS, shifts: RUNS, start: DAY_START, hours: 9, now: t(11, 58), label: 'Driver timeline' },
  render: (args) => (
    <div className="w-[52rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-5">
      <TimeLanes {...args} />
    </div>
  ),
}
