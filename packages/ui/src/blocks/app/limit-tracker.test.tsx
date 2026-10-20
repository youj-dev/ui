import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LimitTracker } from './limit-tracker'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const meter = () => screen.getByRole('meter', { name: 'Card limit' })

describe('Limit tracker block', () => {
  test('shows what is available on the ruler with the freeze line, the pace and the categories', () => {
    reduced(<LimitTracker />)
    expect(screen.getByRole('heading', { level: 2, name: 'Team card' })).toBeInTheDocument()
    expect(screen.getByText('Design · renews 1 Nov')).toBeInTheDocument()
    expect(meter()).toHaveAttribute('aria-valuetext', '€1,366.80 spent of €2,000.00, €633.20 left, freeze at €1,800.00')
    expect(screen.getByText('6 days')).toBeInTheDocument()
    expect(screen.getByText('until the freeze')).toBeInTheDocument()
    expect(screen.getByText('€71.94')).toBeInTheDocument()
    const tiles = within(screen.getByRole('region', { name: 'By category' })).getAllByRole('listitem')
    expect(tiles).toHaveLength(4)
    expect(tiles[0]).toHaveTextContent('software45%€612.40')
  })

  test('turning the freeze off takes its line off the ruler and counts to the limit instead', async () => {
    const user = userEvent.setup()
    reduced(<LimitTracker />)
    await user.click(screen.getByRole('switch', { name: /Freeze at/ }))
    expect(meter()).toHaveAttribute('aria-valuetext', '€1,366.80 spent of €2,000.00, €633.20 left')
    expect(screen.getByText('until the limit')).toBeInTheDocument()
    expect(screen.getByText('8 days')).toBeInTheDocument()
  })

  test('its sections sit one level under the title, standalone or embedded, so the outline never skips a level', () => {
    const { unmount } = reduced(<LimitTracker embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Team card' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['By category', 'Rules'])
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    unmount()
    reduced(<LimitTracker />)
    expect(screen.getByRole('heading', { level: 2, name: 'Team card' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['By category', 'Rules'])
    // The section labels are the kit's Eyebrow, so a component style gives them its label voice.
    expect(screen.getByRole('heading', { level: 3, name: 'Rules' })).toHaveAttribute('data-slot', 'eyebrow')
  })

  test('Request increase raises the limit, and Change limit picks a new one', async () => {
    const user = userEvent.setup()
    reduced(<LimitTracker />)
    await user.click(screen.getByRole('button', { name: 'Request increase' }))
    await waitFor(() => expect(meter()).toHaveAttribute('aria-valuemax', '2250'))
    await user.click(screen.getByRole('button', { name: 'Change limit' }))
    await user.click(await screen.findByRole('menuitemradio', { name: '€5,000' }))
    await waitFor(() => expect(meter()).toHaveAttribute('aria-valuemax', '5000'))
  })

  test('a limit under the freeze line leaves the line off the ruler and counts to the limit', () => {
    reduced(<LimitTracker limit={1500} />)
    expect(meter()).toHaveAttribute('aria-valuetext', '€1,366.80 spent of €1,500.00, €133.20 left')
    expect(screen.getByText('1 day')).toBeInTheDocument()
    expect(screen.getByText('until the limit')).toBeInTheDocument()
  })

  test('Request increase asks onRequestIncrease for the limit plus 250', async () => {
    const user = userEvent.setup()
    const onRequestIncrease = vi.fn()
    reduced(<LimitTracker onRequestIncrease={onRequestIncrease} />)
    await user.click(screen.getByRole('button', { name: 'Request increase' }))
    await waitFor(() => expect(onRequestIncrease).toHaveBeenCalledWith(2250))
  })
})

describe('Limit tracker with your data', () => {
  const days = (value: number) => `${Math.round(value * 10) / 10} days`
  const data = {
    format: days,
    entries: [
      { id: 'vacation', name: 'vacation', amount: 10 },
      { id: 'sick', name: 'sick', amount: 2 },
    ],
    limit: 25,
    limits: [20, 25, 30],
    increase: 5,
    count: 7,
    elapsed: 6,
    rules: [
      {
        id: 'approval',
        title: (format: (value: number) => string) => `Approval past ${format(20)}`,
        hint: 'Goes to a manager',
        on: true,
        line: { at: 20, label: 'approval' },
      },
      { id: 'team', title: 'Tell the team', hint: 'On every request' },
    ],
    copy: {
      meter: 'Yearly allowance',
      runway: (count: number) => `${count} months`,
      untilLine: 'until approval',
      countLabel: 'requests so far',
      perUnit: 'a month on average',
      increase: 'Ask for more days',
      change: 'Change allowance',
    },
  }
  const allowance = () => screen.getByRole('meter', { name: 'Yearly allowance' })

  test('your entries, format, rules and labels drive the ruler, the pace and the tiles', () => {
    reduced(<LimitTracker {...data} />)
    expect(allowance()).toHaveAttribute('aria-valuetext', '12 days spent of 25 days, 13 days left, approval at 20 days')
    // 12 used in 6 months is 2 a month: 8 left to the line is 4 months.
    expect(screen.getByText('4 months')).toBeInTheDocument()
    expect(screen.getByText('until approval')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    // The average and the sick tile.
    expect(screen.getAllByText('2 days')).toHaveLength(2)
    expect(screen.getByText('Approval past 20 days')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Approval past/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: /Tell the team/ })).not.toBeChecked()
    const tiles = within(screen.getByRole('region', { name: 'By category' })).getAllByRole('listitem')
    expect(tiles).toHaveLength(2)
    expect(tiles[0]).toHaveTextContent('vacation83%10 days')
  })

  test('switching a rule with a line off counts the pace to the limit', async () => {
    const user = userEvent.setup()
    reduced(<LimitTracker {...data} />)
    await user.click(screen.getByRole('switch', { name: /Approval past/ }))
    expect(allowance()).toHaveAttribute('aria-valuetext', '12 days spent of 25 days, 13 days left')
    expect(screen.getByText('6 months')).toBeInTheDocument()
    expect(screen.getByText('until the limit')).toBeInTheDocument()
  })

  test('the request adds your increase and the menu offers your limits', async () => {
    const user = userEvent.setup()
    const onRequestIncrease = vi.fn()
    reduced(<LimitTracker {...data} onRequestIncrease={onRequestIncrease} />)
    await user.click(screen.getByRole('button', { name: 'Ask for more days' }))
    await waitFor(() => expect(onRequestIncrease).toHaveBeenCalledWith(30))
    await waitFor(() => expect(allowance()).toHaveAttribute('aria-valuemax', '30'))
    await user.click(screen.getByRole('button', { name: 'Change allowance' }))
    expect(await screen.findByRole('menuitemradio', { name: '20 days' })).toBeInTheDocument()
  })

  test('loading shows skeletons and no demo figures', () => {
    reduced(<LimitTracker loading />)
    expect(screen.getByText('Loading the limit')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByText(/612|2,000|software/)).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.getByRole('button', { name: 'Request increase' })).toBeDisabled()
  })

  test('an error shows its message and Retry in place of the ruler', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<LimitTracker error="Couldn’t load" onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByText(/612|software/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('no entries shows the empty message, or your own', () => {
    const { unmount } = reduced(<LimitTracker entries={[]} />)
    expect(screen.getByText('Nothing used yet')).toBeInTheDocument()
    unmount()
    reduced(<LimitTracker entries={[]} empty={<p>No entries</p>} />)
    expect(screen.getByText('No entries')).toBeInTheDocument()
  })

  test('data that arrives after loading fills the ruler and the rules', () => {
    const { rerender } = reduced(<LimitTracker loading />)
    rerender(
      <YoujProvider reducedMotion="always">
        <LimitTracker {...data} />
      </YoujProvider>,
    )
    expect(allowance()).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Approval past/ })).toBeChecked()
  })
})
