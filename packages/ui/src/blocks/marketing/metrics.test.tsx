import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { MarketingMetrics, type MetricsMetric } from './metrics'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Built for the traffic you’re hoping for'

describe('Metrics', () => {
  test('is a labelled section of four figures with their change spoken in words', () => {
    reduced(<MarketingMetrics />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent).slice(0, 4)).toEqual([
      'Uptime',
      'Median time to first byte',
      'Requests served',
      'Teams shipping',
    ])
    expect(screen.getByText('Up 12.4% on the previous period')).toBeInTheDocument()
  })

  test('a falling latency is a good change; a rising one would not be', () => {
    reduced(<MarketingMetrics />)
    const ttfb = screen.getByRole('heading', { name: 'Median time to first byte' }).closest('div')!.parentElement!
    const change = within(ttfb).getByText('Down 8% on the previous period').closest('p')!
    expect(change).toHaveClass('text-success-text')
    reduced(
      <MarketingMetrics
        metrics={[{ id: 'errors', label: 'Errors', better: 'down', values: { '30d': { value: 4, delta: 0.5 } } }]}
      />,
    )
    expect(screen.getByText('Up 50% on the previous period').closest('p')).toHaveClass('text-danger-text')
  })

  test('the period control swaps every figure, change and baseline, and announces the period', async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    reduced(<MarketingMetrics onPeriodChange={onPeriodChange} />)
    expect(screen.getByRole('status')).toHaveTextContent('Showing: Last 30 days')
    expect(screen.getByText('Up 12.4% on the previous period')).toBeInTheDocument()
    const control = screen.getByRole('group', { name: 'Period' })
    await user.click(within(control).getByRole('button', { name: 'Last 12 months' }))
    expect(onPeriodChange).toHaveBeenCalledWith('12m')
    expect(screen.getByRole('status')).toHaveTextContent('Showing: Last 12 months')
    expect(screen.getByText('Up 86% on the previous period')).toBeInTheDocument()
    await user.click(within(control).getByRole('button', { name: 'All time' }))
    expect(screen.getAllByText('Down 52% on the previous period')).toHaveLength(1)
    expect(screen.queryByText('Up 12.4% on the previous period')).not.toBeInTheDocument()
  })

  test('a baseline draws ours against theirs', () => {
    reduced(<MarketingMetrics />)
    const uptime = screen.getByRole('heading', { name: 'Uptime' }).closest('div')!.parentElement!
    expect(within(uptime).getByText('Industry median')).toBeInTheDocument()
    expect(within(uptime).getByText('Northwind')).toBeInTheDocument()
  })

  test('sources are numbered by first citation, each figure links to its footnote', () => {
    reduced(<MarketingMetrics />)
    const list = screen.getByRole('list', { name: 'Sources' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    const link = screen.getByRole('link', { name: 'Source 2' })
    const target = list.querySelector(link.getAttribute('href')!)
    expect(target).toHaveTextContent('Real-user measurements')
    expect(within(list).getByRole('link', { name: /Northwind status page/ })).toHaveAttribute('href', '#status')
  })

  test('a controlled period drives the shown figures; a period with no figure says so', () => {
    const metrics: MetricsMetric[] = [{ id: 'a', label: 'Orders', values: { q: { value: 12 } } }]
    reduced(
      <MarketingMetrics
        metrics={metrics}
        periods={[
          { id: 'q', label: 'Quarter' },
          { id: 'y', label: 'Year' },
        ]}
        period="y"
      />,
    )
    expect(screen.getByText('No data for this period')).toBeInTheDocument()
  })

  test('numbers are written in the given locale', () => {
    reduced(<MarketingMetrics locale="de-DE" metrics={[{ id: 'a', label: 'Umsatz', values: { '30d': { value: 1234.5, delta: 0.125 } } }]} />)
    expect(screen.getByText(/^Up 12,5\s%/)).toBeInTheDocument()
  })

  test('loading shows skeletons in place of figures', () => {
    reduced(<MarketingMetrics loading />)
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  test('copy rewrites the strings; headingLevel and rest props apply', () => {
    reduced(<MarketingMetrics id="numbers" headingLevel={1} copy={{ title: 'Figures', up: (p) => `+${p}` }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Figures' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Figures' })).toHaveAttribute('id', 'numbers')
    expect(screen.getByText('+12.4%')).toBeInTheDocument()
  })

  test('embedded: no page chrome; a theme renders it inside a ThemeScope', () => {
    reduced(<MarketingMetrics embedded theme={brutal} />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section.className).not.toMatch(/py-16/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
