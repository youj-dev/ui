import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WeekBlocks } from './week-blocks'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const plot = () => screen.getByRole('group', { name: 'Time entries by day' })
const readout = () => document.querySelector('[data-slot=week-blocks-readout]')!
const NOW = Date.parse('2026-10-09T13:20:00Z')

describe('Week blocks block', () => {
  test('leads with the week total and gives the totals per kind in the legend', () => {
    reduced(<WeekBlocks now={NOW} timeZone="UTC" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Time this week' })).toBeInTheDocument()
    const summary = document.querySelector('[data-slot=week-blocks-summary]')!
    expect(summary).toHaveTextContent('29h 30m')
    expect(summary).toHaveTextContent('23h 15mBillable')
    expect(summary).toHaveTextContent('6h 15mPersonal')
    expect(readout()).toHaveTextContent('Oct 5 – 9')
    expect(plot().querySelectorAll('[data-slot=week-blocks-block]')).toHaveLength(14)
  })

  test('marks today and draws the now line with its time in the gutter', () => {
    reduced(<WeekBlocks now={NOW} timeZone="UTC" />)
    expect(plot().querySelector('[data-yj-today]')).toHaveTextContent('9')
    expect(plot().querySelector('[data-slot=week-blocks-now-label]')).toHaveTextContent('13:20')
    expect(plot().querySelectorAll('[data-slot=week-blocks-now]')).toHaveLength(1)
  })

  test('has no now line when the clock is outside the hours or the week', () => {
    const { unmount } = reduced(<WeekBlocks now={Date.parse('2026-10-09T20:00:00Z')} timeZone="UTC" />)
    expect(plot().querySelector('[data-slot=week-blocks-now]')).toBeNull()
    expect(plot().querySelector('[data-yj-today]')).not.toBeNull()
    unmount()
    reduced(<WeekBlocks now={Date.parse('2026-10-14T11:00:00Z')} timeZone="UTC" />)
    expect(plot().querySelector('[data-slot=week-blocks-now]')).toBeNull()
    expect(plot().querySelector('[data-yj-today]')).toBeNull()
  })

  test('the arrow keys read an entry at a time and Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<WeekBlocks now={NOW} timeZone="UTC" />)
    await user.tab()
    expect(plot()).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(readout()).toHaveTextContent('Mon 09:00–09:45 · Personal · 45m')
    await user.keyboard('{ArrowRight}')
    expect(readout()).toHaveTextContent('Mon 10:00–12:30 · Billable · 2h 30m')
    expect(plot().querySelector('[data-active]')).toBe(plot().querySelectorAll('[data-slot=week-blocks-block]')[1])
    await user.keyboard('{End}')
    expect(readout()).toHaveTextContent('Fri 11:15–13:00 · Personal · 1h 45m')
    await user.keyboard('{Escape}')
    expect(readout()).toHaveTextContent('Oct 5 – 9')
  })

  test('pointing at a block reads it', async () => {
    const user = userEvent.setup()
    reduced(<WeekBlocks now={NOW} timeZone="UTC" />)
    await user.hover(plot().querySelectorAll('[data-slot=week-blocks-block]')[3]!)
    expect(readout()).toHaveTextContent('Tue 09:30–12:15 · Billable · 2h 45m')
    await user.unhover(plot().querySelectorAll('[data-slot=week-blocks-block]')[3]!)
    await user.hover(screen.getByRole('heading', { name: 'Time this week' }))
    expect(readout()).toHaveTextContent('Oct 5 – 9')
  })

  test('screen readers get every entry as text', () => {
    reduced(<WeekBlocks now={NOW} timeZone="UTC" />)
    const list = document.querySelector('ul.sr-only')!
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(14)
    expect(list).toHaveTextContent('Thu 13:30–16:15 · Billable · 2h 45m')
  })

  test('your entries, kinds and hours drive the content; copy and locale rewrite the words', () => {
    reduced(
      <WeekBlocks
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
        copy={{ title: 'Zeiten' }}
        now={Date.parse('2026-10-13T09:15:00Z')}
        timeZone="UTC"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Zeiten' })).toBeInTheDocument()
    // The 17th is a Saturday: the week grows to seven columns.
    expect(plot().querySelectorAll('[data-slot=week-blocks-block]')).toHaveLength(2)
    expect(plot().querySelector('[data-slot=week-blocks-now-label]')).toHaveTextContent('09:15')
    expect(document.querySelector('[data-slot=week-blocks-summary]')).toHaveTextContent('30 Min.')
    expect(document.querySelector('[data-slot=week-blocks-summary]')).toHaveTextContent('Abrechenbar')
    expect(readout()).toHaveTextContent('12.–18. Okt.')
  })

  test('another world drives it: its kinds, hours and words name the totals and the readings', () => {
    reduced(
      <WeekBlocks
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
    const summary = document.querySelector('[data-slot=week-blocks-summary]')!
    expect(summary).toHaveTextContent('2h 30m')
    expect(summary).toHaveTextContent('Planned')
    expect(summary).toHaveTextContent('Math')
    expect(summary).toHaveTextContent('1h 30m')
    expect(summary).toHaveTextContent('Reading')
  })

  test('without entries there is the empty message', () => {
    reduced(<WeekBlocks entries={[]} />)
    expect(screen.getByText('No time logged this week')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Time entries by day' })).toBeNull()
  })

  test('embedded it is a section named by the title; standalone it draws its own page', () => {
    const { unmount } = reduced(<WeekBlocks />)
    expect(screen.getByRole('region', { name: 'Time this week' })).toBeInTheDocument()
    unmount()
    reduced(<WeekBlocks embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Time this week' })).toBeInTheDocument()
  })
})
