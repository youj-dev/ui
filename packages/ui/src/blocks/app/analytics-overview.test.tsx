import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AnalyticsOverview } from './analytics-overview'
import { lastDays, LAUNCH, spanDays, summarise } from './analytics-overview/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const today = new Date(2026, 8, 29)

describe('analytics overview block', () => {
  test('names its landmarks, KPIs, charts and tables', () => {
    reduced(<AnalyticsOverview embedded={false} defaultRange={lastDays(today, 30)} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Analytics overview' })).toBeInTheDocument()
    const kpis = screen.getByRole('region', { name: 'Key metrics' })
    for (const name of ['Revenue', 'Orders', 'Conversion rate', 'Average order']) expect(within(kpis).getByRole('group', { name })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'Revenue over time' })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'Revenue by channel' })).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'Top products by revenue' })).getAllByRole('row')).toHaveLength(6)
    expect(screen.getByText(/Aug 31 – Sep 29, 2026/)).toBeInTheDocument()
  })

  test('a preset recomputes the page for the new span and announces it', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    reduced(<AnalyticsOverview onRangeChange={onRangeChange} />)
    await user.click(screen.getAllByRole('button', { name: 'Choose dates' })[0]!)
    await user.click(await screen.findByRole('button', { name: 'Last 7 days' }))
    expect(onRangeChange).toHaveBeenCalledTimes(1)
    const span = onRangeChange.mock.calls[0]![0]
    expect(spanDays(span)).toBe(7)
    expect(screen.getByText(/against the previous 7 days/)).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((el) => /^Showing .+: \$[\d,]+ revenue/.test(el.textContent ?? ''))).toBe(true)
  })

  test('the metric switch redraws the trend for that metric', async () => {
    const user = userEvent.setup()
    reduced(<AnalyticsOverview defaultRange={lastDays(today, 30)} />)
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    expect(screen.getByRole('button', { name: 'Orders' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('figure', { name: 'Orders over time' })).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared page header, with no landmark or store header of its own', () => {
    const { container } = reduced(<AnalyticsOverview defaultRange={lastDays(today, 30)} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Analytics overview' }))
    expect(header).toContainElement(screen.getAllByRole('button', { name: 'Choose dates' })[0]!)
    expect(screen.queryByText('Fieldnote Supply')).not.toBeInTheDocument()
  })
})

describe('analytics overview data', () => {
  test('the same span always sums to the same figures, and the series adds up to the totals', () => {
    const a = summarise(lastDays(today, 30), 'en-US')
    const b = summarise(lastDays(today, 30), 'en-US')
    expect(a.totals).toEqual(b.totals)
    expect(a.series.reduce((t, p) => t + p.orders, 0)).toBe(a.totals.orders)
    expect(a.channels.reduce((t, c) => t + c.revenue, 0)).toBeCloseTo(a.totals.revenue, 2)
    expect(a.unit).toBe('day')
    expect(a.previousSeries).toHaveLength(a.series.length)
  })

  test('buckets by hour, week or month as the span grows, weeks counting back from the last day', () => {
    expect(summarise(lastDays(today, 1), 'en-US').series).toHaveLength(24)
    const quarter = summarise(lastDays(today, 91), 'en-US')
    expect(quarter.unit).toBe('week')
    expect(quarter.series).toHaveLength(13)
    expect(summarise({ from: LAUNCH, to: today }, 'en-US').unit).toBe('month')
  })

  test('before the store opened there is nothing to compare with', () => {
    const first = summarise({ from: LAUNCH, to: new Date(2025, 0, 12) }, 'en-US')
    expect(first.previousTotals.revenue).toBe(0)
    expect(first.totals.revenue).toBeGreaterThan(0)
  })
})

describe('analytics overview with your data', () => {
  const span = { from: new Date(2026, 8, 21), to: new Date(2026, 8, 22) }
  const day = (label: string, orders: number) => ({ label, visitors: orders * 30, orders, revenue: orders * 40 })
  const series = [day('Mon', 10), day('Tue', 12)]
  const summary = {
    span,
    previousSpan: { from: new Date(2026, 8, 19), to: new Date(2026, 8, 20) },
    days: 2,
    unit: 'day' as const,
    totals: { visitors: 660, orders: 22, revenue: 880 },
    previousTotals: { visitors: 600, orders: 20, revenue: 800 },
    series,
    previousSeries: series,
    channels: [{ key: 'cafes', label: 'Partner cafés', revenue: 880 }],
    products: [{ id: 'guji', name: 'Ethiopia Guji', category: 'single', revenue: 880, units: 22, previous: 800, trend: [400, 480] }],
    categories: [{ key: 'single', label: 'Single origin', revenue: 880 }],
  }

  test('the summary, KPIs, brand, currency and copy come from props', () => {
    reduced(
      <AnalyticsOverview
        embedded={false}
        summary={summary}
        range={span}
        currency="EUR"
        locale="en-GB"
        brand={{ name: 'Lumen Roasters' }}
        kpis={[{ label: 'Takings', value: (d) => d.revenue, format: { style: 'currency', maximumFractionDigits: 0 }, tone: 'chart-1' }]}
        copy={{ title: 'This week', productsTitle: 'Best sellers' }}
        data-testid="root"
        className="custom"
      />,
    )
    expect(screen.getByTestId('root')).toHaveClass('custom')
    expect(screen.getByRole('heading', { level: 1, name: 'This week' })).toBeInTheDocument()
    expect(screen.getByText('Lumen Roasters')).toBeInTheDocument()
    const kpis = screen.getByRole('region', { name: 'Key metrics' })
    expect(within(kpis).getAllByRole('group')).toHaveLength(1)
    expect(within(kpis).getByRole('group', { name: 'Takings' })).toBeInTheDocument()
    expect(screen.getByText('Partner cafés')).toBeInTheDocument()
    expect(screen.getByText('Best sellers')).toBeInTheDocument()
    const products = screen.getByRole('table', { name: 'Top products by revenue' })
    expect(within(products).getByText('Ethiopia Guji')).toBeInTheDocument()
    expect(within(products).getByText('Single origin')).toBeInTheDocument()
    expect(within(products).getByText('€880')).toBeInTheDocument()
  })

  test('the metric is controlled and reported', async () => {
    const user = userEvent.setup()
    const onMetricChange = vi.fn()
    reduced(<AnalyticsOverview defaultRange={lastDays(today, 30)} metric="visitors" onMetricChange={onMetricChange} />)
    expect(screen.getByRole('figure', { name: 'Visitors over time' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    expect(onMetricChange).toHaveBeenCalledWith('orders')
    expect(screen.getByRole('figure', { name: 'Visitors over time' })).toBeInTheDocument()
  })

  test('headingLevel sets the title, today bounds the default span', () => {
    reduced(<AnalyticsOverview embedded headingLevel={3} today={new Date(2026, 8, 29)} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Analytics overview' })).toBeInTheDocument()
    expect(screen.getByText(/Aug 31 – Sep 29, 2026/)).toBeInTheDocument()
  })

  test('loading, error and empty states', async () => {
    const user = userEvent.setup()
    const { unmount } = reduced(<AnalyticsOverview defaultRange={lastDays(today, 30)} loading />)
    expect(screen.queryByRole('figure', { name: 'Revenue over time' })).not.toBeInTheDocument()
    expect(screen.getByText('Loading the overview')).toBeInTheDocument()
    unmount()

    const onRetry = vi.fn()
    const second = reduced(<AnalyticsOverview defaultRange={lastDays(today, 30)} error="The analytics API timed out." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('The analytics API timed out.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
    second.unmount()

    const zero = { visitors: 0, orders: 0, revenue: 0 }
    reduced(<AnalyticsOverview summary={{ ...summary, totals: zero }} empty={<p>No orders yet.</p>} />)
    expect(screen.getByText('No orders yet.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Key metrics' })).not.toBeInTheDocument()
  })
})
