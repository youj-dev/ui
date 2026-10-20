import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WeekCalendar, type CalendarEvent } from './week-calendar'

/* The calendar fed the app's events, calendars and clock: the week shown
 * follows `now` (or a controlled `date`), events land on their dates (a
 * recurring one on its weekday every week), and opening one tells the app. */

const wrap = (ui: ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const calendars = [
  { id: 'clinic', name: 'Appointments', tone: 'primary' as const },
  { id: 'admin', name: 'Admin', tone: 'success' as const },
]
const events: CalendarEvent[] = [
  { id: 'huddle', title: 'Huddle', date: '2027-03-15', start: 480, end: 510, calendar: 'admin', recurring: true },
  { id: 'okoro', title: 'Mr Okoro', date: '2027-03-16', start: 540, end: 570, calendar: 'clinic', location: 'Room 2' },
]
const now = new Date(2027, 2, 16, 13, 5)

describe('WeekCalendar with your data', () => {
  test('shows the week holding `now`, with your events and calendars', () => {
    wrap(<WeekCalendar events={events} calendars={calendars} now={now} defaultView="agenda" />)
    expect(screen.getByText('15 – 19 Mar 2027 · Week 11')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /, Monday 15 March|, Tuesday 16 March/ })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Mr Okoro, Tuesday 16 March, 09:00 to 09:30, Appointments' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Calendars' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Appointments', 'Admin'])
  })

  test('by default, a page of the app’s frame: the shared page header holds the title, the range and the week controls, with no main of its own', () => {
    const { container } = wrap(<WeekCalendar events={events} calendars={calendars} now={now} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Calendar' }))
    expect(header).toContainElement(screen.getByText('15 – 19 Mar 2027 · Week 11'))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Next week' }))
  })

  test('standalone, it is a main on its own canvas', () => {
    wrap(<WeekCalendar embedded={false} events={events} calendars={calendars} now={now} />)
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Calendar' }))
  })

  test('opening an event tells onSelect; recurring events carry to the next week', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onDateChange = vi.fn()
    wrap(<WeekCalendar events={events} calendars={calendars} now={now} onSelect={onSelect} onDateChange={onDateChange} copy={{ where: 'Room' }} defaultView="agenda" />)
    await user.click(screen.getByRole('button', { name: /^Mr Okoro/ }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'okoro' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('RoomRoom 2')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(onDateChange).toHaveBeenCalledWith('2027-03-22')
    expect(screen.getAllByRole('button', { name: /, (Monday|Tuesday|Wednesday|Thursday|Friday) \d+ March, \d\d:\d\d to/ }).map((b) => b.getAttribute('aria-label'))).toEqual(['Huddle, Monday 22 March, 08:00 to 08:30, Admin'])
  })

  test('a controlled date and view only change when the app passes new ones', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    const onDateChange = vi.fn()
    wrap(<WeekCalendar events={events} now={now} date="2027-03-01" view="agenda" onViewChange={onViewChange} onDateChange={onDateChange} />)
    expect(screen.getByText('1 – 5 Mar 2027 · Week 9')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Monday 1 March' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Week' }))
    expect(onViewChange).toHaveBeenCalledWith('week')
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(onDateChange).toHaveBeenCalledWith('2027-03-16')
    expect(screen.getByText('1 – 5 Mar 2027 · Week 9')).toBeInTheDocument()
  })

  test('an empty week shows your slot; an error offers Retry', async () => {
    const user = userEvent.setup()
    const first = wrap(<WeekCalendar events={[]} empty={<p>A quiet week</p>} />)
    expect(screen.getByText('A quiet week')).toBeInTheDocument()
    first.unmount()
    const onRetry = vi.fn()
    wrap(<WeekCalendar error="Calendar sync failed." onRetry={onRetry} />)
    expect(screen.getByText('Calendar sync failed.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
