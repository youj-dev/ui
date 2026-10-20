import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MeetingBooking } from './meeting-booking'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('booking block', () => {
  test('names its landmarks and the meeting', async () => {
    reduced(<MeetingBooking />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Meeting' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio review' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Length' })).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Available times' })).toBeInTheDocument()
  })

  test('embedded, it is the booking card alone: no page landmark and no brand', async () => {
    reduced(<MeetingBooking embedded />)
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.queryByText('Tempo')).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Meeting' })).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Available times' })).toBeInTheDocument()
  })

  test('a slot splits into Next, the details are checked, and the booking confirms', async () => {
    const user = userEvent.setup()
    reduced(<MeetingBooking />)
    const times = await screen.findByRole('list', { name: 'Available times' })
    const first = within(times).getAllByRole('button')[0]!
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(times).getByRole('button', { name: /^Next: book/ }))

    const confirm = await screen.findByRole('button', { name: 'Confirm booking' }, { timeout: 2000 })
    await user.click(confirm)
    expect(await screen.findByText('Tell Maya who’s coming.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Rui Alves')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'rui@studio.com')
    // The error holds the button for a beat before it takes presses again.
    await user.click(await screen.findByRole('button', { name: 'Confirm booking' }, { timeout: 4000 }))
    expect(await screen.findByRole('heading', { name: 'You’re booked' }, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByText(/rui@studio.com/)).toBeInTheDocument()
  })
})

describe('booking block with your data', () => {
  const host = { name: 'Jonas Weber', role: 'Solutions engineer, Northwind' }
  const meeting = { title: 'Platform demo', description: 'A tour of the dashboard.', location: 'Google Meet' }
  const today = new Date(2027, 0, 4)
  const availability = (date: Date, duration: number) => (date.getDay() === 2 ? [10 * 60, 14 * 60 + duration] : [])

  test('renders the host, meeting, lengths, slots and copy you pass', () => {
    reduced(
      <MeetingBooking
        host={host}
        meeting={meeting}
        durations={[20, 60]}
        defaultDuration={20}
        today={today}
        availability={availability}
        brand={{ name: 'Northwind' }}
        headingLevel={2}
        data-testid="booking-root"
        className="custom-root"
        copy={{ pickDay: 'Choose a date', slotsOpen: (n) => `${n} free` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Platform demo' })).toBeInTheDocument()
    expect(screen.getByTestId('booking-root')).toHaveClass('custom-root')
    expect(screen.getByText('Jonas Weber')).toBeInTheDocument()
    expect(screen.getByText('JW')).toBeInTheDocument()
    expect(screen.getByText('Google Meet')).toBeInTheDocument()
    expect(screen.getByText('Northwind')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Choose a date' })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Length' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['20 min', '60 min'])
    // The first open day after Monday Jan 4 is Tuesday Jan 5, with its two slots.
    expect(screen.getByRole('heading', { name: /Tuesday, January 5/ })).toHaveTextContent('2 free')
    const times = within(screen.getByRole('list', { name: 'Available times' })).getAllByRole('button')
    expect(times.map((b) => b.textContent)).toEqual(['10:00am', '2:20pm'])
  })

  test('onBook receives the slot and the details; the confirmation offers calendar and reschedule', async () => {
    const user = userEvent.setup()
    const onBook = vi.fn()
    const onAddToCalendar = vi.fn()
    const onReschedule = vi.fn()
    reduced(
      <MeetingBooking
        host={host}
        meeting={meeting}
        today={today}
        availability={availability}
        onBook={onBook}
        onAddToCalendar={onAddToCalendar}
        onReschedule={onReschedule}
      />,
    )
    const times = screen.getByRole('list', { name: 'Available times' })
    await user.click(within(times).getByRole('button', { name: '10:00am' }))
    await user.click(within(times).getByRole('button', { name: /^Next: book/ }))
    await user.type(await screen.findByRole('textbox', { name: 'Name' }, { timeout: 2000 }), 'Ada Byrne')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@acme.io')
    await user.type(screen.getByRole('textbox', { name: 'What should Jonas look at?' }), 'Our SSO setup')
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
    expect(await screen.findByRole('heading', { name: 'You’re booked' }, { timeout: 4000 })).toBeInTheDocument()
    expect(onBook).toHaveBeenCalledWith({ date: new Date(2027, 0, 5), minutes: 600, duration: 30, zone: 'lisbon', name: 'Ada Byrne', email: 'ada@acme.io', notes: 'Our SSO setup' })
    expect(screen.getByText(/with Jonas Weber/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))
    expect(onAddToCalendar).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@acme.io' }))
    await user.click(screen.getByRole('button', { name: 'Reschedule' }))
    expect(onReschedule).toHaveBeenCalledOnce()
    expect(screen.getByRole('list', { name: 'Available times' })).toBeInTheDocument()
  })

  test('a failed booking shows the rejection’s message and stays on the form', async () => {
    const user = userEvent.setup()
    const onBook = vi.fn(() => Promise.reject(new Error('That slot was just taken.')))
    reduced(<MeetingBooking today={today} availability={availability} onBook={onBook} />)
    const times = screen.getByRole('list', { name: 'Available times' })
    await user.click(within(times).getByRole('button', { name: '10:00am' }))
    await user.click(within(times).getByRole('button', { name: /^Next: book/ }))
    await user.type(await screen.findByRole('textbox', { name: 'Name' }, { timeout: 2000 }), 'Ada Byrne')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@acme.io')
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
    expect(await screen.findByText('That slot was just taken.')).toHaveAttribute('role', 'alert')
    expect(screen.queryByRole('heading', { name: 'You’re booked' })).not.toBeInTheDocument()
  })

  test('the length is controllable', async () => {
    const user = userEvent.setup()
    const onDurationChange = vi.fn()
    reduced(<MeetingBooking duration={45} onDurationChange={onDurationChange} />)
    const length = screen.getByRole('group', { name: 'Length' })
    expect(within(length).getByRole('button', { name: '45 min' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(length).getByRole('button', { name: '15 min' }))
    expect(onDurationChange).toHaveBeenCalledWith(15)
    // Controlled: it stays where the app holds it.
    expect(within(length).getByRole('button', { name: '45 min' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the demo starts from a fixed today, so the server and the browser agree', () => {
    reduced(<MeetingBooking />)
    expect(screen.getByRole('heading', { name: /^\w+day, (September|October) \d+/ })).toBeInTheDocument()
  })
})
