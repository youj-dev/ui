import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WeekDial } from './week-dial'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const dial = () => screen.getByRole('group', { name: 'Time entries by weekday, round a dial' })
const arcs = () => dial().querySelectorAll('[data-slot=week-dial-arc]')
const readout = () => document.querySelector('[data-slot=week-dial-readout]')!
const NOW = Date.parse('2026-10-09T13:20:00Z')

beforeAll(() => {
  // jsdom lays nothing out; the dial draws at the width it measures.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 560 })
})

describe('Week dial block', () => {
  test('draws an arc per entry, the headline kind in the middle, and the week total with its legend', () => {
    reduced(<WeekDial now={NOW} timeZone="UTC" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Hours by weekday' })).toBeInTheDocument()
    expect(arcs()).toHaveLength(14)
    expect(dial().querySelector('svg')).toHaveTextContent('23h 15mBillable')
    const summary = document.querySelector('[data-slot=week-dial-summary]')!
    expect(summary).toHaveTextContent('29h 30m')
    expect(summary).toHaveTextContent('6h 15mPersonal')
    expect(readout()).toHaveTextContent('Oct 5 – 9')
  })

  test('labels the weekday initials, today in full strength, and the hours round the dial', () => {
    reduced(<WeekDial now={NOW} timeZone="UTC" />)
    const text = [...dial().querySelectorAll('text')].map((t) => t.textContent)
    expect(text).toEqual(expect.arrayContaining(['M', 'T', 'W', 'F', '09', '12', '15', '18']))
    const friday = [...dial().querySelectorAll('text')].find((t) => t.textContent === 'F')!
    expect(friday).toHaveClass('fill-fg')
  })

  test('draws the now hand with its time, and the hour label it would touch steps aside', () => {
    reduced(<WeekDial now={Date.parse('2026-10-09T12:05:00Z')} timeZone="UTC" />)
    const hand = dial().querySelector('[data-slot=week-dial-now]')!
    expect(hand).toHaveTextContent('Now 12:05')
    expect([...dial().querySelectorAll('text')].map((t) => t.textContent)).not.toContain('12')
  })

  test('has no hand when the clock is outside the hours or the week', () => {
    const { unmount } = reduced(<WeekDial now={Date.parse('2026-10-09T20:00:00Z')} timeZone="UTC" />)
    expect(dial().querySelector('[data-slot=week-dial-now]')).toBeNull()
    unmount()
    reduced(<WeekDial now={Date.parse('2026-10-14T11:00:00Z')} timeZone="UTC" />)
    expect(dial().querySelector('[data-slot=week-dial-now]')).toBeNull()
  })

  test('the arrow keys read an arc at a time and Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<WeekDial now={NOW} timeZone="UTC" />)
    await user.tab()
    expect(dial()).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(readout()).toHaveTextContent('Mon 10:00–12:30 · Billable · 2h 30m')
    expect(dial().querySelector('[data-active]')).toBe(arcs()[1])
    await user.keyboard('{ArrowLeft}')
    expect(readout()).toHaveTextContent('Mon 09:00–09:45 · Personal · 45m')
    await user.keyboard('{End}')
    expect(readout()).toHaveTextContent('Fri 11:15–13:00 · Personal · 1h 45m')
    await user.keyboard('{Escape}')
    expect(readout()).toHaveTextContent('Oct 5 – 9')
  })

  test('pointing at an arc reads it', async () => {
    const user = userEvent.setup()
    reduced(<WeekDial now={NOW} timeZone="UTC" />)
    await user.hover(arcs()[3]!.querySelector('path')!)
    expect(readout()).toHaveTextContent('Tue 09:30–12:15 · Billable · 2h 45m')
    await user.unhover(arcs()[3]!.querySelector('path')!)
    await user.hover(screen.getByRole('heading', { name: 'Hours by weekday' }))
    expect(readout()).toHaveTextContent('Oct 5 – 9')
  })

  test('screen readers get every entry as text', () => {
    reduced(<WeekDial now={NOW} timeZone="UTC" />)
    const list = document.querySelector('ul.sr-only')!
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(14)
    expect(list).toHaveTextContent('Thu 13:30–16:15 · Billable · 2h 45m')
  })

  test('your entries, kinds and hours drive the content; copy and locale rewrite the words', () => {
    reduced(
      <WeekDial
        entries={[
          { day: '2026-10-13', kind: 'a', start: '08:00', end: '10:30' },
          { day: '2026-10-17', kind: 'b', start: '10:00', end: '11:00' },
        ]}
        kinds={[
          { id: 'a', label: 'Abrechenbar', tone: 'chart-2' },
          { id: 'b', label: 'Intern', tone: 'neutral' },
        ]}
        hours={[8, 12]}
        locale="de-DE"
        copy={{ title: 'Zeiten', now: (t) => `Jetzt ${t}` }}
        now={Date.parse('2026-10-13T09:15:00Z')}
        timeZone="UTC"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Zeiten' })).toBeInTheDocument()
    expect(arcs()).toHaveLength(2)
    // The 17th is a Saturday: the week grows to seven rings, Monday to Sunday.
    expect([...dial().querySelectorAll('text')].map((t) => t.textContent)).toEqual(expect.arrayContaining(['M', 'D', 'M', 'D', 'F', 'S', 'S']))
    expect(dial().querySelector('[data-slot=week-dial-now]')).toHaveTextContent('Jetzt 09:15')
    expect(dial().querySelector('svg')).toHaveTextContent('Abrechenbar')
    expect(readout()).toHaveTextContent('12.–18. Okt.')
  })

  test('another world drives it: its kinds, hours and words name the totals and the readings', () => {
    reduced(
      <WeekDial
        entries={[
          { day: '2026-10-12', kind: 'math', start: '16:00', end: '17:30' },
          { day: '2026-10-13', kind: 'reading', start: '19:00', end: '20:00' },
        ]}
        kinds={[
          { id: 'math', label: 'Math', tone: 'chart-1' },
          { id: 'reading', label: 'Reading', tone: 'chart-2' },
        ]}
        hours={[15, 21]}
        copy={{ title: 'Study plan', total: 'Planned' }}
        now={Date.parse('2026-10-12T16:30:00Z')}
        timeZone="UTC"
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Study plan' })).toBeInTheDocument()
    const summary = document.querySelector('[data-slot=week-dial-summary]')!
    expect(summary).toHaveTextContent('2h 30m')
    expect(summary).toHaveTextContent('Planned')
    expect(summary).toHaveTextContent('Math')
    expect(summary).toHaveTextContent('1h 30m')
    expect(summary).toHaveTextContent('Reading')
  })

  test('without entries there is the empty message', () => {
    reduced(<WeekDial entries={[]} />)
    expect(screen.getByText('No time logged this week')).toBeInTheDocument()
    expect(screen.queryByRole('group')).toBeNull()
  })

  test('embedded it is a section named by the title; standalone it draws its own page', () => {
    const { unmount } = reduced(<WeekDial />)
    expect(screen.getByRole('region', { name: 'Hours by weekday' })).toBeInTheDocument()
    unmount()
    reduced(<WeekDial embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Hours by weekday' })).toBeInTheDocument()
  })
})
