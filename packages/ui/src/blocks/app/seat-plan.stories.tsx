import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SeatPlan, type SeatPlanRow, type SeatPlanTier } from './seat-plan'

const meta: Meta<typeof SeatPlan> = {
  title: 'Blocks/App/Seat Plan',
  component: SeatPlan,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Let your users choose seats on a plan, with prices, fees and a reservation timer in view. Tiers without a price show none, so a flight with free standard seats or a classroom with assigned desks reads the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SeatPlan>

/** A concert hall: three priced tiers, booking fees and a hold that counts down. */
export const Default: Story = { name: 'Concert seats' }

/** Nothing picked yet: the basket explains the hold. */
export const Empty: Story = { args: { defaultPicked: [] } }

/** The last two minutes of the hold, in amber. */
export const HoldEnding: Story = { name: 'Hold ending', args: { holdLeft: 95, defaultPicked: ['D6', 'D7', 'D8'] } }

const taken = (r: number, c: number, salt: number) => (r * 7 + c * 3 + salt) % 5 === 0 || (r + c * 2 + salt) % 11 === 0

/** A plan from a list of row labels: seats numbered along the row, each in the tier its row belongs to, some taken. */
function plan(labels: string[], perRow: number, tierOf: (row: number) => string, salt: number, name?: (label: string, n: number) => string): SeatPlanRow[] {
  return labels.map((label, r) => ({
    id: label,
    label,
    seats: Array.from({ length: perRow }, (_, c) => ({
      id: name?.(label, c + 1) ?? `${label}${c + 1}`,
      number: c + 1,
      label: name?.(label, c + 1),
      tier: tierOf(r),
      unavailable: taken(r, c, salt),
    })),
  }))
}

const cabin: SeatPlanTier[] = [
  { id: 'legroom', name: 'Extra legroom', price: 45, tone: 'chart-2' },
  { id: 'front', name: 'Front cabin', price: 25, tone: 'chart-1' },
  { id: 'standard', name: 'Standard', tone: 'neutral' },
]

/** An airline cabin: rows 1 to 14 in three and three, extra legroom up front, standard seats included in the fare, so they show no price. */
export const FlightSeats: Story = {
  name: 'Flight seats',
  args: {
    rows: plan(Array.from({ length: 14 }, (_, i) => String(i + 1)), 6, (r) => (r < 3 ? 'legroom' : r < 7 ? 'front' : 'standard'), 2, (row, n) => `${row}${'ABCDEF'[n - 1]}`),
    tiers: cabin,
    aisles: [3],
    stage: 'Front of cabin',
    max: 2,
    fee: 0,
    defaultPicked: ['5B', '5C'],
    holdLeft: 780,
    hold: 900,
    onConfirm: fn(),
    copy: {
      currency: 'USD',
      title: 'Choose your seats',
      subtitle: 'Skyline 218 · Denver to Portland · Fri, Nov 14',
      selection: 'Your seats',
      seat: (row: string, n: number) => `Row ${row} · Seat ${'ABCDEF'[n - 1]}`,
      pickPrompt: 'Pick seats on the plan. They’re held for you while you confirm.',
      subtotal: 'Seat upgrades',
      total: 'Added to your fare',
      confirm: 'Confirm seats',
      footnote: 'Standard seats are included in your fare',
      map: 'Cabin',
    },
  },
}

const zones: SeatPlanTier[] = [
  { id: 'front', name: 'Front', tone: 'chart-1' },
  { id: 'middle', name: 'Middle', tone: 'chart-2' },
  { id: 'back', name: 'Back', tone: 'chart-3' },
]

/** A classroom: assigned desks and no prices, so no sums, no fees and no timer, only your seat. */
export const ClassroomSeating: Story = {
  name: 'Classroom seating',
  args: {
    rows: plan(['A', 'B', 'C', 'D', 'E', 'F'], 8, (r) => (r < 2 ? 'front' : r < 4 ? 'middle' : 'back'), 4),
    tiers: zones,
    aisles: [4],
    stage: 'Whiteboard',
    max: 1,
    hold: null,
    defaultPicked: [],
    onConfirm: fn(),
    copy: {
      title: 'Seating plan',
      subtitle: 'Room 204 · Chemistry · Wed, 9:00 a.m.',
      selection: 'Your seat',
      seat: (row: string, n: number) => `Row ${row} · Desk ${n}`,
      pickPrompt: 'Pick a desk on the plan.',
      confirm: 'Confirm seat',
      footnote: 'You can change seats until Friday',
      map: 'Desks',
    },
  },
}

/** Skeletons hold the plan’s place and the figures turn to skeletons while the seats load. */
export const Loading: Story = { args: { loading: true } }

/** No plan: the empty message in the plan’s place. */
export const NoSeatPlan: Story = { name: 'No seat plan', args: { rows: [], defaultPicked: [] } }

/** The load failed: the message with Retry in the plan’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the seats.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }
