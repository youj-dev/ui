import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MonthForecast } from './month-forecast'
import { cumulative, projectForecast } from './month-forecast/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Month forecast block', () => {
  test('leads with the month-end projection, how far it lands from the budget, and the chart', () => {
    reduced(<MonthForecast />)
    expect(screen.getByRole('heading', { level: 2, name: 'Cloud spend' })).toBeInTheDocument()
    expect(screen.getByText('$13,110.00')).toBeInTheDocument()
    expect(screen.getByText('Over by $1,110')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cloud spend forecast for September' })).toHaveAccessibleDescription(/Crosses budget Sep 28$/)
    expect(screen.getByText('compute: $3,700 spent, $6,030 projected')).toBeInTheDocument()
  })

  test('the savings plan brings the projection under the budget and removes the crossing', async () => {
    const user = userEvent.setup()
    reduced(<MonthForecast />)
    await user.click(screen.getByRole('button', { name: 'Savings plan' }))
    expect(screen.getByText('$11,570.00')).toBeInTheDocument()
    expect(screen.getByText('Under by $430')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Crosses budget/)).toBeNull())
    expect(screen.getByText('compute: $3,700 spent, $4,700 projected')).toBeInTheDocument()
    // Spoken in the block's polite live region.
    expect(await screen.findByText('Projected $11,570, Under by $430.')).toHaveAttribute('role', 'status')
  })

  test('a new budget moves the line and the verdict', async () => {
    const user = userEvent.setup()
    reduced(<MonthForecast />)
    await user.click(screen.getByRole('button', { name: 'Adjust budget' }))
    await user.click(await screen.findByRole('menuitemradio', { name: '$14,000' }))
    expect(screen.getByText('Under by $890')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cloud spend forecast for September' })).toHaveAccessibleDescription(/Stays within budget$/)
  })

  test('Set alert hands the budget to onSetAlert', async () => {
    const user = userEvent.setup()
    const onSetAlert = vi.fn()
    reduced(<MonthForecast onSetAlert={onSetAlert} />)
    await user.click(screen.getByRole('button', { name: 'Set alert' }))
    await waitFor(() => expect(onSetAlert).toHaveBeenCalledWith(12000))
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<MonthForecast embedded copy={{ title: 'Spend' }} />)
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('region', { name: 'Spend' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Spend' })).toBeInTheDocument()
  })

  describe('with your data', () => {
    const actual = cumulative([10, 12, 11, 9])
    const props = {
      actual,
      format: (value: number) => `${Math.round(value)} tickets`,
      scenarios: [
        { id: 'pace', label: 'At this pace' },
        { id: 'fewer', label: 'With self-serve' },
      ],
      forecasts: {
        pace: projectForecast(actual, () => 10, 3, 10),
        fewer: projectForecast(actual, () => 6, 3, 10),
      },
      series: [
        { id: 'email', name: 'email', spent: 30, projected: { pace: 45, fewer: 38 }, tone: 'chart-1' as const },
        { id: 'chat', name: 'chat', spent: 12, projected: { pace: 15, fewer: 12 }, tone: 'chart-2' as const },
      ],
      budget: 70,
      budgets: [60, 70, 80],
      max: 100,
      copy: { budget: 'Capacity', breakdown: 'By channel', chart: 'Ticket forecast', adjust: 'Adjust capacity' },
    }

    test('your scenarios, series, format and labels drive every figure', async () => {
      const user = userEvent.setup()
      reduced(<MonthForecast {...props} />)
      // 42 so far, 3 more days at 10 or 6.
      expect(screen.getByText('72 tickets')).toBeInTheDocument()
      expect(screen.getByText('Over by 2 tickets')).toBeInTheDocument()
      expect(screen.getByText('Capacity')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'By channel' })).toBeInTheDocument()
      expect(screen.getByText('email: 30 tickets spent, 45 tickets projected')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Ticket forecast' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'With self-serve' }))
      expect(screen.getByText('60 tickets')).toBeInTheDocument()
      expect(screen.getByText('Under by 10 tickets')).toBeInTheDocument()
      expect(screen.getByText('email: 30 tickets spent, 38 tickets projected')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Adjust capacity' }))
      expect(await screen.findByRole('menuitemradio', { name: '80 tickets' })).toBeInTheDocument()
    })

    test('defaultScenario opens on another scenario', () => {
      reduced(<MonthForecast {...props} defaultScenario="fewer" />)
      expect(screen.getByText('Under by 10 tickets')).toBeInTheDocument()
    })

    test('loading shows skeletons, no demo figures, and the busy label', () => {
      reduced(<MonthForecast loading />)
      expect(screen.getByText('Loading the forecast')).toBeInTheDocument()
      expect(screen.queryByText(/13,110/)).toBeNull()
      expect(screen.queryByText('compute')).toBeNull()
      expect(screen.getByRole('button', { name: 'Set alert' })).toBeDisabled()
    })

    test('an error replaces the chart with its message and Retry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<MonthForecast error="Couldn’t load" onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load')).toBeInTheDocument()
      expect(screen.queryByText(/13,110/)).toBeNull()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    test('no data shows the empty message, or your own', () => {
      const { unmount } = reduced(<MonthForecast actual={[]} />)
      expect(screen.getByText('No data for this period yet')).toBeInTheDocument()
      unmount()
      reduced(<MonthForecast actual={[]} empty={<p>Nothing yet</p>} copy={{ title: 'Tickets' }} />)
      const card = screen.getByRole('region', { name: 'Tickets' })
      expect(within(card).getByText('Nothing yet')).toBeInTheDocument()
    })
  })
})
