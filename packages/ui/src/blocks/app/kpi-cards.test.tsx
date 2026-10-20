import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { KpiCards, type KpiCardsKpi } from './kpi-cards'
import { DEMO, headline } from './kpi-cards/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const tile = (name: string) => screen.getByRole('group', { name })
const figure = (name: string) => within(tile(name)).getAllByText((_, el) => el?.getAttribute('data-slot') === 'stat-value')[0]!

describe('KpiCards block', () => {
  test('a tile per KPI, each a named group with its figure, its change and its definition', () => {
    reduced(<KpiCards />)
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument()
    const [revenue] = DEMO['30d'].kpis
    expect(figure('Revenue')).toHaveTextContent(new Intl.NumberFormat('en-US', revenue!.format).format(headline(revenue!.series)))
    expect(within(tile('Revenue')).getByText('vs. previous 30 days')).toBeInTheDocument()
    expect(within(tile('Refund rate')).getByText('vs. previous 30 days').closest('[data-slot=stat-delta]')).toHaveAttribute('data-tone', 'good')
    expect(screen.getByRole('button', { name: 'About Conversion: Visitors who placed an order.' })).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(4)
  })

  test('one tile’s slider moves the crosshair in every tile: arrows step, Home jumps, Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<KpiCards />)
    const slider = screen.getByRole('slider', { name: 'New customers by date' })
    slider.focus()
    expect(slider).toHaveAttribute('aria-valuenow', '29')
    expect(slider.getAttribute('aria-valuetext')).toMatch(/^Sat, Oct 10: \d+, so far$/)
    await user.keyboard('{Home}')
    const customers = DEMO['30d'].kpis[1]!
    const change = customers.series[0]! / customers.previous![0]! - 1
    expect(slider).toHaveAttribute(
      'aria-valuetext',
      `Fri, Sep 11: ${customers.series[0]}, ${change > 0 ? 'up' : 'down'} ${new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(Math.abs(change))}`,
    )
    // Every tile reads the same day.
    expect(document.querySelectorAll('[data-slot=kpi-reading]')).toHaveLength(4)
    for (const reading of document.querySelectorAll('[data-slot=kpi-reading]')) expect(reading).toHaveTextContent('Fri, Sep 11')
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '1')
    await user.keyboard('{Escape}')
    expect(document.querySelectorAll('[data-slot=kpi-reading]')).toHaveLength(0)
  })

  test('the looks: minimal is one panel of figures, bars draw a bar per bucket', () => {
    const view = reduced(<KpiCards variant="minimal" />)
    expect(document.querySelector('[data-stat-group]')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    view.unmount()
    reduced(<KpiCards variant="bars" defaultRange="7d" />)
    expect(within(tile('Revenue')).getAllByText((_, el) => el?.getAttribute('data-slot') === 'stat-bar')).toHaveLength(7)
  })

  test('the range switch swaps the window and speaks every figure; a controlled range asks first', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    const view = reduced(<KpiCards onRangeChange={onRangeChange} />)
    await user.click(screen.getByRole('button', { name: '7D' }))
    expect(onRangeChange).toHaveBeenCalledWith('7d')
    expect(within(tile('Revenue')).getByText('vs. previous 7 days')).toBeInTheDocument()
    expect(screen.getByText(/^last 7 days\. Revenue \$[\d,]+, (up|down) [\d.]+%; New customers/)).toHaveAttribute('role', 'status')
    view.unmount()
    reduced(<KpiCards range="30d" onRangeChange={onRangeChange} />)
    await user.click(screen.getByRole('button', { name: '90D' }))
    expect(onRangeChange).toHaveBeenLastCalledWith('90d')
    expect(screen.getByRole('button', { name: '30D' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('loading keeps each tile busy; an error offers Retry; no KPIs is an empty state', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<KpiCards loading />)
    expect(screen.getByText('Loading metrics')).toBeInTheDocument()
    expect(tile('Revenue')).toHaveAttribute('aria-busy', 'true')
    loading.unmount()
    const failed = reduced(<KpiCards error="The warehouse query timed out." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<KpiCards kpis={[]} dates={[]} />)
    expect(screen.getByText('No metrics yet')).toBeInTheDocument()
  })

  describe('with your data', () => {
    const kpis: KpiCardsKpi[] = [
      { id: 'solved', label: 'Tickets solved', series: [120, 140, 160], previous: [100, 100, 100] },
      { id: 'backlog', label: 'Open tickets', series: [300, 280, 250], aggregate: 'last', previousValue: 320, invert: true, unit: 'open' },
    ]
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03']

    test('kpis, dates, locale and copy drive the tiles; no demo hatch, no range switch', () => {
      reduced(<KpiCards kpis={kpis} dates={dates} ranges={[]} locale="de-DE" copy={{ title: 'Support' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Support' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Time range' })).not.toBeInTheDocument()
      expect(figure('Tickets solved')).toHaveTextContent('420')
      expect(figure('Open tickets')).toHaveTextContent('250')
      expect(within(tile('Open tickets')).getByText('open')).toBeInTheDocument()
      expect(within(tile('Open tickets')).getByText('vs. previous period').closest('[data-slot=stat-delta]')).toHaveAttribute('data-tone', 'good')
      const slider = screen.getByRole('slider', { name: 'Tickets solved by date' })
      // Intl writes a no-break space before the percent sign in German.
      expect(slider.getAttribute('aria-valuetext')?.replace(/\s/g, ' ')).toBe('Sa., 3. Okt.: 160, up 60 %')
    })

    test('custom ranges drive the switch, the comparison and the announcement', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      const ranges = [
        { id: 'week', label: 'Week', name: 'this week', comparison: 'vs. last week' },
        { id: 'term', label: 'Term', name: 'this term', comparison: 'vs. last term' },
      ]
      reduced(<KpiCards kpis={kpis} dates={dates} ranges={ranges} defaultRange="week" onRangeChange={onRangeChange} />)
      expect(screen.queryByRole('button', { name: '30D' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true')
      expect(within(tile('Tickets solved')).getByText('vs. last week')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Term' }))
      expect(onRangeChange).toHaveBeenCalledWith('term')
      expect(within(tile('Tickets solved')).getByText('vs. last term')).toBeInTheDocument()
    })

    test('embedded is a section named by its heading; standalone draws the page; className and rest reach the root', () => {
      const view = reduced(<KpiCards headingLevel={3} className="custom-root" data-testid="kpis" />)
      expect(screen.getByTestId('kpis')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Overview' })).toBeInTheDocument()
      view.unmount()
      reduced(<KpiCards embedded={false} />)
      expect(screen.getByRole('main', { name: 'Overview' })).toBeInTheDocument()
    })
  })
})
