import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MonthAgenda } from './month-agenda'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const tile = (iso: string) => document.querySelector(`[data-day="${iso}"] button, td[data-day="${iso}"] button`) as HTMLButtonElement
const footer = () => document.querySelector('[data-slot=card-footer]')!

describe('MonthAgenda', () => {
  test('puts the month on the kit Calendar, as a section with an h2, and counts what is active and new', () => {
    reduced(<MonthAgenda />)
    expect(screen.getByRole('heading', { level: 2, name: 'Subscriptions' })).toBeInTheDocument()
    expect(screen.getByText('9 active · 3 new')).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByText('October 2026', { selector: 'p' })).toBeInTheDocument()
    expect(footer()).toHaveTextContent('Due in October')
    expect(footer()).toHaveTextContent('$267.82')
  })

  test('a day that bills names its charges, with a mark and a cycle dot, and today is marked', () => {
    reduced(<MonthAgenda />)
    const seventh = tile('2026-10-07')
    expect(seventh).toHaveAttribute('data-yj-events', '1')
    expect(seventh.getAttribute('aria-label')).toMatch(/Bills Tessel, \$54\.99 Monthly$/)
    expect(tile('2026-10-10').getAttribute('aria-label')).toMatch(/Kite VPN, \$59\.88 Yearly$/)
    expect(tile('2026-10-08')).not.toHaveAttribute('data-yj-events')
    expect(tile('2026-10-13')).toHaveAttribute('data-yj-today')
    expect(screen.getByText('Next: Parcel Box, Oct 15')).toBeInTheDocument()
  })

  test('picking a day reports it and + adds on it; Today goes back', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onValueChange = vi.fn()
    const onMonthChange = vi.fn()
    reduced(<MonthAgenda onAdd={onAdd} onValueChange={onValueChange} onMonthChange={onMonthChange} />)
    await user.click(tile('2026-10-07'))
    expect(onValueChange).toHaveBeenCalledWith('2026-10-07')
    await user.click(screen.getByRole('button', { name: 'Add subscription' }))
    expect(onAdd).toHaveBeenCalledWith('2026-10-07')
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 10, 1))
    expect(screen.getByText('November 2026', { selector: 'p' })).toBeInTheDocument()
    expect(footer()).toHaveTextContent('$108.94')
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByText('October 2026', { selector: 'p' })).toBeInTheDocument()
    expect(onValueChange).toHaveBeenLastCalledWith('2026-10-13')
  })

  test('the arrow keys walk the days', async () => {
    const user = userEvent.setup()
    reduced(<MonthAgenda defaultValue="2026-10-07" />)
    tile('2026-10-07').focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tile('2026-10-08'))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(tile('2026-10-15'))
  })

  test('your events, money and words drive the content', () => {
    reduced(
      <MonthAgenda
        locale="de-DE"
        format={(n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)}
        today="2026-11-04"
        events={[
          { id: 'a', name: 'Planwerk', amount: 24, cycle: 'monthly', start: '2025-02-03', mark: 'diamond' },
          { id: 'b', name: 'Wolke 9', amount: 119, cycle: 'yearly', start: '2023-11-18' },
          { id: 'c', name: 'Formbar', amount: 15, cycle: 'monthly', start: '2026-11-18' },
          { id: 'd', name: 'Später', amount: 5, cycle: 'monthly', start: '2027-01-01' },
        ]}
        copy={{ title: 'Abos', monthTotal: (m) => `Fällig im ${m}`, subtitle: (n, a) => `${n} aktiv · ${a} neu` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Abos' })).toBeInTheDocument()
    expect(screen.getByText('3 aktiv · 1 neu')).toBeInTheDocument()
    expect(footer()).toHaveTextContent('Fällig im November')
    expect(footer()).toHaveTextContent('158,00 €')
    // A month that is shorter than the start day bills on its last day; one that hasn't started bills nothing.
    expect(tile('2026-11-03')).toHaveAttribute('data-yj-events', '1')
    expect(tile('2026-11-18')).toHaveAttribute('data-yj-events', '2')
  })

  test('with no events the month is still drawn and says so', () => {
    reduced(<MonthAgenda events={[]} today="2026-10-13" />)
    expect(screen.getByText('No subscriptions yet')).toBeInTheDocument()
    expect(footer()).toHaveTextContent('$0.00')
  })

  test('events without amounts show no money and the foot counts them', () => {
    reduced(
      <MonthAgenda
        today="2026-10-13"
        events={[
          { id: 'a', name: 'Mia', cycle: 'yearly', start: '1991-10-05' },
          { id: 'b', name: 'Jonas', cycle: 'yearly', start: '1988-10-13' },
        ]}
      />,
    )
    expect(footer()).toHaveTextContent('In October')
    expect(footer()).toHaveTextContent('2')
    expect(footer()).not.toHaveTextContent('$')
    expect(tile('2026-10-13').getAttribute('aria-label')).toMatch(/Bills Jonas, Yearly$/)
  })

  test('the legend names only the cycles in use', () => {
    reduced(<MonthAgenda today="2026-10-13" events={[{ id: 'a', name: 'Mia', cycle: 'yearly', start: '1991-10-05' }]} />)
    expect(screen.getByText('Yearly')).toBeInTheDocument()
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument()
  })

  test('format drives every figure', () => {
    reduced(
      <MonthAgenda
        today="2026-10-13"
        format={(n) => `${n} h`}
        events={[{ id: 'a', name: 'Boiler', amount: 4, cycle: 'monthly', start: '2026-01-07' }]}
      />,
    )
    expect(footer()).toHaveTextContent('4 h')
    expect(tile('2026-10-07').getAttribute('aria-label')).toMatch(/Boiler, 4 h Monthly$/)
  })

  test('empty replaces the none line', () => {
    reduced(<MonthAgenda events={[]} today="2026-10-13" empty="Nothing planned" />)
    expect(screen.getByText('Nothing planned')).toBeInTheDocument()
    expect(screen.queryByText('No subscriptions yet')).not.toBeInTheDocument()
  })

  test('an error shows its message over the month and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<MonthAgenda error="Couldn’t load the agenda." onRetry={onRetry} today="2026-10-13" />)
    expect(screen.getByText('Couldn’t load the agenda.')).toBeInTheDocument()
    expect(footer()).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the month as skeleton tiles with no events or figures', () => {
    reduced(<MonthAgenda loading today="2026-10-13" />)
    expect(screen.getByText('Loading the month')).toBeInTheDocument()
    expect(document.querySelector('[data-yj-events]')).toBeNull()
    expect(footer()).not.toHaveTextContent('$')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<MonthAgenda embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Subscriptions' })).toBeInTheDocument()
  })
})
