import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SlotGrid, type SlotGridProps, type SlotGridSlot } from './slot-grid'

const WEEK = new Date(2026, 8, 28).getTime()
const TIMES = [7 * 60, 9 * 60, 12 * 60 + 30, 18 * 60]
/** A small studio's week: mornings busy, a closed Sunday evening, one class already yours. */
const LEFT = [
  [6, 0, 3, 1, 8, 5, 2],
  [2, 4, 8, 7, 1, 0, 6],
  [8, 6, 5, 8, 7, 3, 4],
  [0, 1, 2, 0, 3, 5, -1],
]
const SLOTS: SlotGridSlot[] = LEFT.flatMap((row, r) =>
  row.flatMap((left, d) => {
    if (left < 0) return []
    const start = new Date(WEEK)
    start.setDate(start.getDate() + d)
    start.setHours(Math.floor(TIMES[r]! / 60), TIMES[r]! % 60)
    return [{ id: `s${r}${d}`, start: start.getTime(), left, capacity: 8, mine: r === 2 && d === 3 }]
  }),
)

const meta: Meta<SlotGridProps> = {
  title: 'UI/Inputs/Slot Grid',
  component: SlotGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A week of bookable times you can read at a glance: a column per day, a row per start time, and in each cell a run of pips (one per place, up to eight) lit for the places still free. A slot with only a few left warms to the warning tone, a full one is hatched and dark, a time the day doesn’t offer is a dash, and your own booking carries a check. The grid is one tab stop: arrows move between days and times (mirrored in RTL), Home and End to a row’s ends, Ctrl+Home and Ctrl+End to the grid’s, and Enter picks. Under 36rem it shows one day at a time under a day picker. Reduced motion: drawn in place.',
      },
    },
  },
  args: { slots: SLOTS, start: WEEK },
}
export default meta
type Story = StoryObj<SlotGridProps>

const frame = (args: SlotGridProps, width = 'w-[46rem]') => (
  <div className={`${width} max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-5`}>
    <SlotGrid {...args} />
  </div>
)

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('s12')
    return frame({ ...args, value, onValueChange: setValue })
  },
}

/** One day at a time under the week’s days, as on a phone; left and right step the day. */
export const DayView: Story = { name: 'Day view', args: { layout: 'day' }, render: (args) => frame(args, 'w-[24rem]') }

/** One place a slot (a private session): open or full, nothing in between. */
export const OnePlace: Story = {
  name: 'One place a slot',
  args: { slots: SLOTS.map((s) => ({ ...s, capacity: 1, left: s.left > 3 ? 1 : 0, mine: false })), legend: false },
  render: (args) => frame(args),
}
