import type { Meta, StoryObj } from '@storybook/react-vite'
import { ItineraryDay, DayRail, type ItineraryLeg, type DayRailProps, type ItineraryStay, type ItineraryStop } from './day-rail'

const local = (month: number, day: number, hh: number, mm: number, offset: number) => Date.UTC(2026, month - 1, day, hh, mm) - offset * 60_000

const STOPS: ItineraryStop[] = [
  { id: 'lis', code: 'LIS', name: 'Lisbon', utcOffset: 60 },
  { id: 'bcn', code: 'BCN', name: 'Barcelona', utcOffset: 120 },
  { id: 'fco', code: 'FCO', name: 'Rome', utcOffset: 120 },
]
const LEGS: ItineraryLeg[] = [
  { id: 'out', from: 'lis', to: 'bcn', depart: local(9, 30, 9, 40, 60), arrive: local(9, 30, 12, 55, 120), code: 'TP 1036' },
  { id: 'hop', from: 'bcn', to: 'fco', depart: local(10, 3, 14, 20, 120), arrive: local(10, 3, 16, 10, 120), code: 'VY 6104' },
  { id: 'home', from: 'fco', to: 'lis', depart: local(10, 5, 16, 20, 120), arrive: local(10, 5, 18, 25, 60), code: 'TP 839' },
]
const STAYS: ItineraryStay[] = [
  { id: 'bonay', at: 'bcn', start: local(9, 30, 15, 0, 120), end: local(10, 3, 11, 0, 120), name: 'Casa Bonay' },
  { id: 'vilon', at: 'fco', start: local(10, 3, 17, 0, 120), end: local(10, 5, 11, 0, 120), name: 'Hotel Vilòn' },
]
const PLANS = ['Fly to Barcelona, check in at 15:00', 'Sagrada Família at 10:30', 'Montjuïc and the beach', 'Fly to Rome at 14:20', 'Vatican Museums at 08:00', 'Fly home at 16:20']

const meta: Meta<DayRailProps> = {
  title: 'UI/Data/Day Rail',
  component: DayRail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A trip on one rail, a column per day. Flights arc from stop to stop with their code at the top of the arc and the change of clocks marked on landing (+1 h); stays run under the rail as spans in the stop’s color, with their nights; now is a line in the accent that moves with the clock, and during a flight the plane rides its arc. Flown legs are solid and quiet, the ones ahead dashed. The days are tabs (arrow keys, mirrored in RTL): pick one and its ItineraryDay panel shows. The rail is described for screen readers as a list of legs and stays. Reduced motion: arcs are drawn, the plane and the line jump.',
      },
    },
  },
  args: { stops: STOPS, legs: LEGS, stays: STAYS, start: local(9, 30, 0, 0, 60), days: 6, now: local(10, 1, 14, 30, 120) },
}
export default meta
type Story = StoryObj<DayRailProps>

const render = (args: DayRailProps) => (
  <div className="w-[52rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">
    <DayRail {...args}>
      {PLANS.map((plan, d) => (
        <ItineraryDay key={d} value={d} className="text-ui text-fg-muted">
          {plan}
        </ItineraryDay>
      ))}
    </DayRail>
  </div>
)

export const Default: Story = { name: 'Trip itinerary', render }

/** Halfway to Rome: the plane rides the arc, and now reads In transit. */
export const InFlight: Story = { name: 'In flight', args: { now: local(10, 3, 15, 15, 120) }, render }

/** Before the trip: no line, and the first day is open. */
export const Upcoming: Story = { args: { now: local(9, 20, 12, 0, 60) }, render }
