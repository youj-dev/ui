import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SeatMap, type SeatMapProps, type SeatMapRow, type SeatMapTier } from './seat-map'

const TIERS: SeatMapTier[] = [
  { id: 'premium', name: 'Premium', price: 42 },
  { id: 'standard', name: 'Standard', price: 24 },
]

// A small cinema: eight rows of twelve, one aisle down the middle, a few seats taken.
const TAKEN = new Set(['A5', 'A6', 'B6', 'B7', 'C1', 'C2', 'D8', 'D9', 'E5', 'E6', 'E7', 'F11', 'F12', 'G3', 'H6', 'H7'])
const ROWS: SeatMapRow[] = 'ABCDEFGH'.split('').map((letter, r) => ({
  id: letter,
  label: letter,
  seats: Array.from({ length: 12 }, (_, i) => ({ id: `${letter}${i + 1}`, number: i + 1, tier: r >= 3 && r <= 5 ? 'premium' : 'standard', unavailable: TAKEN.has(`${letter}${i + 1}`) })),
}))

const meta: Meta<SeatMapProps> = {
  title: 'UI/Inputs/Seat Map',
  component: SeatMap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A venue from above: the stage, then rows of seats bending round it with aisles, the row’s letter at both ends. Seats take their price tier’s chart color, taken seats are dimmed and hatched, and picked seats fill with their tier and spring in with a check. Hovering or focusing a seat raises a chip with its row, number, tier and price that glides from seat to seat. The map is one grid and one tab stop: arrows move seat to seat and row to row, Home and End jump to a row’s ends, Space or Enter picks, and each seat is named “Row F, seat 12, €48, available”. `max` caps the picks (announced). A venue plan is physical, so it isn’t mirrored in RTL. Reduced motion: the check and chip appear in place.',
      },
    },
  },
  args: { rows: ROWS, tiers: TIERS, aisles: [6], defaultValue: ['E3', 'E4'], max: 6 },
}
export default meta
type Story = StoryObj<SeatMapProps>

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.defaultValue ?? [])
    return (
      <div className="flex w-[34rem] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
        <SeatMap {...args} defaultValue={undefined} value={value} onValueChange={setValue} />
        <p className="text-center font-mono text-ui-sm text-fg-muted">{value.join(' · ') || '—'}</p>
      </div>
    )
  },
}

/** No stage, in dollars: a table plan or a classroom works the same way. */
export const NoStage: Story = {
  name: 'No stage',
  args: { stage: false, currency: 'USD', locale: 'en-US' },
  render: (args) => (
    <div className="w-[34rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">
      <SeatMap {...args} />
    </div>
  ),
}
