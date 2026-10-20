import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import type { SlotGridSlot } from '../../components/ui/slot-grid'
import { SlotBooking } from './slot-booking'
import type { SlotBookingService, SlotBookingSlot } from './slot-booking/data'

const at = (day: number, hour: number) => new Date(2026, 8, 28 + day, hour).getTime()
const week = new Date(2026, 8, 28).getTime()
/** Two slots on Monday and one full one on Tuesday, for every service and week. */
const slots = (service: SlotBookingService, w: number): SlotGridSlot[] => [
  { id: `${service.id}-${w}-a`, start: at((w - week) / 86_400_000, 7), left: 2, capacity: service.capacity },
  { id: `${service.id}-${w}-b`, start: at((w - week) / 86_400_000, 10), left: 6, capacity: service.capacity },
  { id: `${service.id}-${w}-c`, start: at((w - week) / 86_400_000 + 1, 7), left: 0, capacity: service.capacity },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('SlotBooking, studio grid', () => {
  test('shows the studio, the class track, the week and its slots, and asks for a pick', () => {
    reduced(<SlotBooking variant="grid" slots={slots} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Book a class' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reformer' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('grid', { name: 'Times this week' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Monday, September 28, 07:00, 2 left' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your pick' })).toHaveTextContent('Pick a time')
  })

  test('picking a slot springs its details into the well; Change sends focus back to the grid', async () => {
    const user = userEvent.setup()
    reduced(<SlotBooking variant="grid" slots={slots} />)
    await user.click(screen.getByRole('gridcell', { name: 'Monday, September 28, 07:00, 2 left' }))
    const well = screen.getByRole('region', { name: 'Your pick' })
    expect(well).toHaveTextContent('with Lena Moser')
    expect(well).toHaveTextContent('50 min')
    expect(well).toHaveTextContent('€28.00')
    expect(within(well).getByText('2 left')).toBeInTheDocument()
    expect(within(well).getByRole('meter', { name: 'Class pass' })).toHaveAttribute('aria-valuetext', '6 of 10 left')
    await user.click(within(well).getByRole('button', { name: 'Change' }))
    expect(well).toHaveTextContent('Pick a time')
    await waitFor(() => expect(screen.getByRole('gridcell', { name: 'Monday, September 28, 07:00, 2 left' })).toHaveFocus())
  })

  test('Book confirms the slot, takes a class off the pass and marks the slot as yours', async () => {
    const user = userEvent.setup()
    const booked: string[] = []
    reduced(<SlotBooking variant="grid" slots={slots} onBook={(slot, service) => void booked.push(`${service.id}:${slot.id}`)} />)
    await user.click(screen.getByRole('gridcell', { name: 'Monday, September 28, 10:00, 6 left' }))
    await user.click(screen.getByRole('button', { name: 'Book · €28.00' }))
    await waitFor(() => expect(screen.getByRole('region', { name: 'Your pick' })).toHaveTextContent('You’re booked'))
    expect(booked).toEqual([`reformer:reformer-${week}-b`])
    expect(screen.getByRole('meter', { name: 'Class pass' })).toHaveAttribute('aria-valuetext', '5 of 10 left')
    expect(screen.getByRole('gridcell', { name: 'Monday, September 28, 10:00, Yours' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Booked for Monday, September 28 at 10:00')
  })

  test('a full slot cannot be picked', async () => {
    const user = userEvent.setup()
    reduced(<SlotBooking variant="grid" slots={slots} />)
    await user.click(screen.getByRole('gridcell', { name: 'Tuesday, September 29, 07:00, Full' }))
    expect(screen.getByRole('region', { name: 'Your pick' })).toHaveTextContent('Pick a time')
  })

  test('switching the class or the week clears the pick', async () => {
    const user = userEvent.setup()
    reduced(<SlotBooking variant="grid" slots={slots} />)
    await user.click(screen.getByRole('gridcell', { name: 'Monday, September 28, 07:00, 2 left' }))
    await user.click(screen.getByRole('button', { name: 'Mat flow' }))
    expect(screen.getByRole('region', { name: 'Your pick' })).toHaveTextContent('Pick a time')
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByRole('gridcell', { name: 'Monday, October 5, 07:00, 2 left' })).toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<SlotBooking variant="grid" slots={slots} embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Book a class' })).toBeInTheDocument()
  })
})

const from = new Date(2026, 9, 1).getTime()
const on = (days: number, hour: number) => new Date(2026, 9, 1 + days, hour).getTime()
/** Thursday: a Reformer with three places and a full Mat flow; Saturday: a Private; nothing else. */
const schedule = (day: number): SlotBookingSlot[] =>
  day === from
    ? [
        { id: 'r7', service: 'reformer', start: on(0, 7), left: 3, capacity: 8 },
        { id: 'm10', service: 'mat', start: on(0, 10), left: 0, capacity: 14 },
      ]
    : day === new Date(2026, 9, 3).getTime()
      ? [{ id: 'p9', service: 'private', start: on(2, 9), left: 1, capacity: 1 }]
      : []
const calendar = (props: Partial<React.ComponentProps<typeof SlotBooking>> = {}) => reduced(<SlotBooking schedule={schedule} from={from} {...props} />)
const reformer = '07:00, Reformer, with Lena Moser, 3 places left'

describe('SlotBooking, calendar (default)', () => {
  test('opens on the first open day: its classes in words, a full one out of reach', () => {
    calendar()
    expect(screen.getByRole('heading', { level: 2, name: 'Book a class' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All classes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'Thursday October 1' })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Classes on Thursday, October 1' })
    expect(within(list).getByRole('button', { name: reformer })).toBeEnabled()
    expect(within(list).getByRole('button', { name: '10:00, Mat flow, with Jonas Berg, Full' })).toBeDisabled()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  test('a class opens its review (who, when, duration, price); Change goes back to its row', async () => {
    const user = userEvent.setup()
    calendar()
    await user.click(screen.getByRole('button', { name: reformer }))
    const review = screen.getByRole('region', { name: 'Reformer' })
    expect(screen.getByRole('heading', { name: 'Reformer' })).toHaveFocus()
    expect(review).toHaveTextContent('Thursday, October 1 · 07:00–07:50')
    expect(review).toHaveTextContent('Lena Moser')
    expect(review).toHaveTextContent('50 min')
    expect(review).toHaveTextContent('€28.00')
    expect(review).toHaveTextContent('6 of 10 left')
    await user.click(within(review).getByRole('button', { name: 'Change' }))
    await waitFor(() => expect(screen.getByRole('button', { name: reformer })).toHaveFocus())
  })

  test('Book confirms, announces and marks the class as yours', async () => {
    const user = userEvent.setup()
    const booked: string[] = []
    calendar({ onBook: (slot, service) => void booked.push(`${service.id}:${slot.id}`) })
    await user.click(screen.getByRole('button', { name: reformer }))
    await user.click(screen.getByRole('button', { name: 'Book · €28.00' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'You’re booked' })).toHaveFocus())
    expect(booked).toEqual(['reformer:r7'])
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Booked for Thursday, October 1 at 07:00')
    await user.click(screen.getByRole('button', { name: 'Book another' }))
    expect(screen.getByRole('button', { name: '07:00, Reformer, with Lena Moser, You’re in' })).toBeDisabled()
  })

  test('a class filter narrows the day, and offers the next day that has one', async () => {
    const user = userEvent.setup()
    calendar()
    await user.click(screen.getByRole('button', { name: 'Private' }))
    expect(screen.getByText('No Private classes this day.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next one: Sat, Oct 3' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Saturday October 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '09:00, Private, with Aiko Tanaka, 1 place left' })).toBeEnabled()
  })

  test('picking a day on the calendar shows its classes; days without any are disabled', async () => {
    const user = userEvent.setup()
    calendar()
    expect(screen.getByRole('button', { name: /October 2nd/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /October 3rd/ }))
    expect(screen.getByRole('heading', { level: 3, name: 'Saturday October 3' })).toBeInTheDocument()
  })

  test('embedded, the day heads an h3 under the h2', () => {
    calendar({ embedded: true })
    expect(screen.getByRole('heading', { level: 2, name: 'Book a class' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Thursday October 1' })).toBeInTheDocument()
  })
})

describe('SlotBooking, your services', () => {
  const tutor: SlotBookingService = { id: 'algebra', name: 'Algebra', minutes: 50, capacity: 1, host: { name: 'Priya Raman', role: 'Math tutor', initials: 'PR' } }
  const lessons = (day: number): SlotBookingSlot[] => (day === from ? [{ id: 'a1', service: 'algebra', start: on(0, 16), left: 1, capacity: 1 }] : [])
  const row = '16:00, Algebra, with Priya Raman, 1 place left'

  test('a service with no price shows none, and Book carries no amount', async () => {
    const user = userEvent.setup()
    calendar({ services: [tutor], schedule: lessons })
    await user.click(screen.getByRole('button', { name: row }))
    const review = screen.getByRole('region', { name: 'Algebra' })
    expect(review).toHaveTextContent('Priya Raman')
    expect(review).not.toHaveTextContent('Price')
    expect(within(review).getByRole('button', { name: 'Book' })).toBeInTheDocument()
  })

  test('format rewrites the price, and a null pass drops the pass row and Top up', async () => {
    const user = userEvent.setup()
    calendar({ services: [{ ...tutor, price: 40 }], schedule: lessons, pass: null, format: (price) => `${price} credits` })
    expect(screen.queryByRole('button', { name: 'Top up pass' })).toBeNull()
    await user.click(screen.getByRole('button', { name: row }))
    const review = screen.getByRole('region', { name: 'Algebra' })
    expect(review).toHaveTextContent('40 credits')
    expect(review).not.toHaveTextContent('Class pass')
    expect(within(review).getByRole('button', { name: 'Book · 40 credits' })).toBeInTheDocument()
  })

  test('your pass counts down from its own figures', async () => {
    const user = userEvent.setup()
    calendar({ services: [{ ...tutor, price: 40 }], schedule: lessons, pass: { left: 2, total: 4 } })
    await user.click(screen.getByRole('button', { name: row }))
    expect(screen.getByRole('region', { name: 'Algebra' })).toHaveTextContent('2 of 4 left')
  })

  test('copy rewrites the title, the filter and the list words', () => {
    calendar({
      services: [tutor],
      schedule: lessons,
      copy: { title: 'Book a lesson', allServices: 'All subjects', slotsOn: (day) => `Lessons on ${day}` },
    })
    expect(screen.getByRole('heading', { level: 2, name: 'Book a lesson' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All subjects' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Lessons on Thursday, October 1' })).toBeInTheDocument()
  })

  test('with no services it shows the empty state instead of the timetable', () => {
    reduced(<SlotBooking services={[]} />)
    expect(screen.getByText('Nothing to book')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  test('your empty node replaces the default message', () => {
    reduced(<SlotBooking services={[]} empty={<p>No openings yet</p>} />)
    expect(screen.getByText('No openings yet')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to book')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<SlotBooking error="Couldn’t load the timetable." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the timetable.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the body’s place without the timetable', () => {
    reduced(<SlotBooking loading />)
    expect(screen.getByText('Loading the timetable')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
