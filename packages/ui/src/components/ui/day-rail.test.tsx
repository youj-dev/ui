import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ItineraryDay, DayRail, type ItineraryLeg, type ItineraryStay, type ItineraryStop } from './day-rail'

const local = (month: number, day: number, hh: number, mm: number, offset: number) => Date.UTC(2026, month - 1, day, hh, mm) - offset * 60_000
const STOPS: ItineraryStop[] = [
  { id: 'lis', code: 'LIS', name: 'Lisbon', utcOffset: 60 },
  { id: 'bcn', code: 'BCN', name: 'Barcelona', utcOffset: 120 },
]
const LEGS: ItineraryLeg[] = [
  { id: 'out', from: 'lis', to: 'bcn', depart: local(9, 30, 9, 40, 60), arrive: local(9, 30, 12, 55, 120), code: 'TP 1036' },
  { id: 'back', from: 'bcn', to: 'lis', depart: local(10, 2, 18, 0, 120), arrive: local(10, 2, 19, 5, 60), code: 'TP 1041' },
]
const STAYS: ItineraryStay[] = [{ id: 'bonay', at: 'bcn', start: local(9, 30, 15, 0, 120), end: local(10, 2, 11, 0, 120), name: 'Casa Bonay' }]
const START = local(9, 30, 0, 0, 60)

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rail = (now: number | null) =>
  reduced(
    <DayRail stops={STOPS} legs={LEGS} stays={STAYS} start={START} days={3} now={now} locale="en-GB">
      {[0, 1, 2].map((d) => (
        <ItineraryDay key={d} value={d}>
          {`Plans for day ${d + 1}`}
        </ItineraryDay>
      ))}
    </DayRail>,
  )

describe('DayRail', () => {
  test('makes each day a tab, opening on today, with its panel below', () => {
    rail(local(10, 1, 14, 30, 120))
    expect(screen.getByRole('tablist', { name: 'Itinerary' })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAccessibleName('Day 1 30 Wed, September')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Plans for day 2')
  })

  test('arrow keys and clicks move between days', async () => {
    const user = userEvent.setup()
    rail(local(10, 1, 14, 30, 120))
    await user.click(screen.getAllByRole('tab')[0]!)
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Plans for day 1')).toBeVisible()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getAllByRole('tab')[2]).toHaveFocus()
  })

  test('describes every leg with local times and the clock change, and every stay with its nights', () => {
    rail(local(10, 1, 14, 30, 120))
    const items = [...document.querySelectorAll('[data-slot=day-rail-summary] li')].map((li) => li.textContent)
    expect(items[0]).toBe('TP 1036, Lisbon to Barcelona, Wed 30 Sept, 09:40 to Wed 30 Sept, 12:55, Local time +1h')
    expect(items[1]).toMatch(/Local time -1h$/)
    expect(items[2]).toBe('Casa Bonay, Barcelona, 2 nights')
    expect(document.querySelectorAll('[data-slot=day-rail-shift]')).toHaveLength(2)
  })

  test('marks flown legs, the one in the air and the ones ahead; during a flight the plane is on its arc', () => {
    rail(local(9, 30, 11, 0, 120))
    expect(document.querySelector('[data-slot=day-rail-arc][data-state=flying]')).not.toBeNull()
    expect(document.querySelector('[data-slot=day-rail-plane]')).not.toBeNull()
    expect(document.querySelector('[data-slot=day-rail-now]')).toHaveTextContent('In transit')
  })

  test('has no now line with now set to null, or outside the trip', () => {
    rail(null)
    expect(document.querySelector('[data-slot=day-rail-now]')).toBeNull()
    expect(document.querySelectorAll('[data-slot=day-rail-arc][data-state=upcoming]')).toHaveLength(2)
  })
})
