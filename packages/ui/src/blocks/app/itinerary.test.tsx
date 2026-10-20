import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { BuildingIcon, PlaneIcon } from '@youj/icons'
import { Itinerary } from './itinerary'
import { LEGS } from './itinerary/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Itinerary', () => {
  test('shows the next flight as a pass with a countdown, and today’s plans with their codes', () => {
    reduced(<Itinerary />)
    expect(screen.getByRole('heading', { level: 2, name: 'Barcelona & Rome' })).toBeInTheDocument()
    const pass = screen.getByRole('group', { name: 'Up next' })
    expect(pass).toHaveTextContent('BCN')
    expect(pass).toHaveTextContent('FCO')
    expect(pass).toHaveTextContent('VY 6104')
    expect(pass).toHaveTextContent('7C')
    expect(within(pass).getByRole('img', { name: 'Barcelona to Rome' })).toBeInTheDocument()
    expect(within(pass).getByText('Departs in')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent(/1\s?d\s?23\s?h\s?50\s?m\s?00\s?s/)
    const today = screen.getByRole('tab', { selected: true })
    expect(today).toHaveAccessibleName(/^Day 2, .*Today, Barcelona$/)
    expect(screen.getByRole('heading', { level: 3, name: /Barcelona/ })).toBeInTheDocument()
    expect(screen.getByText('Casa Bonay · night 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Sagrada Família')).toBeVisible()
    expect(screen.getByText('SF-229104')).toBeInTheDocument()
  })

  test('the countdown ticks every second', async () => {
    vi.useFakeTimers()
    try {
      reduced(<Itinerary />)
      await act(async () => vi.advanceTimersByTime(3000))
      expect(screen.getByRole('timer')).toHaveTextContent(/49\s?m\s?57\s?s/)
    } finally {
      vi.useRealTimers()
    }
  })

  test('in the air, the pass counts down to landing and the plane is partway along', () => {
    reduced(<Itinerary now={+LEGS[1]!.depart + 55 * 60_000} />)
    const pass = screen.getByRole('group', { name: 'In the air' })
    expect(pass.querySelector('[data-slot=itinerary-pass]')).toHaveAttribute('data-state', 'in-flight')
    expect(within(pass).getByText('Lands in')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent(/00\s?h\s?55\s?m\s?00\s?s/)
    expect(pass.querySelector<HTMLElement>('[data-slot=itinerary-plane]')!.style.insetInlineStart).toContain('0.5')
  })

  test('after the last flight lands, the pass says so', () => {
    reduced(<Itinerary now={+LEGS[2]!.arrive + 60_000} />)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByText('You’re home. Welcome back.')).toBeInTheDocument()
  })

  test('picking a day lists its plans; travel days say so; a code copies and says so; the day is controllable', async () => {
    const user = userEvent.setup()
    const onDayChange = vi.fn()
    reduced(<Itinerary onDayChange={onDayChange} />)
    const saturday = screen.getByRole('tab', { name: /^Day 4/ })
    expect(saturday).toHaveAccessibleName(/Travel to Rome$/)
    await user.click(saturday)
    expect(onDayChange).toHaveBeenCalledWith(3)
    expect(screen.getByText('VY 6104 to Rome')).toBeVisible()
    expect(screen.getByText('Check-in opens soon')).toBeInTheDocument()
    const plan = screen.getByText('VY 6104 to Rome').closest('li')!
    await user.click(within(plan).getByRole('button', { name: 'Copy M4XRT2' }))
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('M4XRT2 copied')
  })

  test('arrow keys move between days', async () => {
    const user = userEvent.setup()
    reduced(<Itinerary />)
    screen.getByRole('tab', { selected: true }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { selected: true })).toHaveAccessibleName(/^Day 3/)
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { selected: true })).toHaveAccessibleName(/^Day 6/)
  })

  test('props drive the content and copy rewrites it; a free day says so; standalone is an h1', () => {
    reduced(
      <Itinerary
        embedded={false}
        copy={{ title: 'Weekend away', nothing: 'Rest day' }}
        stops={[
          { id: 'a', code: 'AAA', name: 'Alpha', utcOffset: 0 },
          { id: 'b', code: 'BBB', name: 'Beta', utcOffset: 0 },
        ]}
        legs={[{ id: 'l', from: 'a', to: 'b', depart: Date.UTC(2026, 0, 2, 9), arrive: Date.UTC(2026, 0, 2, 11), code: 'XX 1' }]}
        stays={[]}
        bookings={[]}
        start={Date.UTC(2026, 0, 1)}
        days={2}
        now={Date.UTC(2026, 0, 1, 12)}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Weekend away' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Up next' })).toHaveTextContent('AAA')
    expect(screen.getByText('Rest day')).toBeInTheDocument()
  })

  test('your kinds and statuses drive the icons, the badges and the done state', () => {
    reduced(
      <Itinerary
        stops={[
          { id: 'a', code: 'AAA', name: 'Alpha', utcOffset: 0 },
          { id: 'b', code: 'BBB', name: 'Beta', utcOffset: 0 },
        ]}
        legs={[{ id: 'l', from: 'a', to: 'b', depart: Date.UTC(2026, 0, 2, 9), arrive: Date.UTC(2026, 0, 2, 11), code: 'XX 1' }]}
        stays={[]}
        kinds={[
          { id: 'call', label: 'Crew call', icon: PlaneIcon },
          { id: 'gear', label: 'Equipment', icon: BuildingIcon },
        ]}
        statuses={[
          { id: 'called', label: 'Crew called', tone: 'success' },
          { id: 'hold', label: 'On hold', tone: 'warning' },
          { id: 'wrapped', label: 'Wrapped', done: true },
          { id: 'plain', label: 'Planned' },
        ]}
        bookings={[
          { id: '1', day: 0, kind: 'call', title: 'Call at the rim', detail: 'Sheet 1', time: '05:15', code: 'CS-01', status: 'called' },
          { id: '2', day: 0, kind: 'gear', title: 'Steadicam pickup', detail: 'Page Film Services', time: '12:00', code: 'EQ-1', status: 'hold' },
          { id: '3', day: 0, kind: 'gear', title: 'Truck back', detail: 'Moab Rentals', time: '15:30', code: 'GT-1', status: 'wrapped' },
          { id: '4', day: 0, kind: 'call', title: 'Scout', detail: 'Sheet 2', time: '17:00', code: 'CS-02', status: 'plain' },
        ]}
        start={Date.UTC(2026, 0, 1)}
        days={2}
        now={Date.UTC(2026, 0, 1, 4)}
      />,
    )
    const plan = (title: string) => screen.getByText(title).closest('li')!
    expect(within(plan('Call at the rim')).getByText('Crew called')).toBeInTheDocument()
    expect(within(plan('Steadicam pickup')).getByText('On hold')).toBeInTheDocument()
    expect(plan('Truck back')).toHaveAttribute('data-status', 'wrapped')
    // A plain status is named for screen readers only.
    expect(within(plan('Scout')).getByText('Planned')).toHaveClass('sr-only')
    expect(within(plan('Scout')).getByText('Crew call')).toHaveClass('sr-only')
  })

  test('your copy rewrites the pass labels and the finished message', () => {
    reduced(<Itinerary now={+LEGS[2]!.arrive + 60_000} copy={{ finished: 'Wrapped. See you Monday.' }} />)
    expect(screen.getByText('Wrapped. See you Monday.')).toBeInTheDocument()
    cleanup()
    reduced(<Itinerary copy={{ legCode: 'Charter', legPlace: 'Group', legReference: 'Manifest', departsIn: 'Leaves in' }} />)
    const pass = screen.getByRole('group', { name: 'Up next' })
    expect(within(pass).getByText('Charter')).toBeInTheDocument()
    expect(within(pass).getByText('Group')).toBeInTheDocument()
    expect(within(pass).getByText('Manifest')).toBeInTheDocument()
    expect(within(pass).getByText('Leaves in')).toBeInTheDocument()
  })

  test('with nothing in the trip it shows the empty state instead of the pass and the days', () => {
    reduced(<Itinerary legs={[]} stays={[]} bookings={[]} />)
    expect(screen.getByText('Nothing planned yet')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  test('your empty node replaces the default message', () => {
    reduced(<Itinerary legs={[]} stays={[]} bookings={[]} empty={<p>Add your first leg</p>} />)
    expect(screen.getByText('Add your first leg')).toBeInTheDocument()
    expect(screen.queryByText('Nothing planned yet')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<Itinerary error="Couldn’t load the trip." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the trip.')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByText('Sep 30 – Oct 5 · 6 days')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the place without the pass, the days or the dates', () => {
    reduced(<Itinerary loading />)
    expect(screen.getByText('Loading the trip')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    expect(screen.queryByText(/6 days/)).toBeNull()
  })
})
