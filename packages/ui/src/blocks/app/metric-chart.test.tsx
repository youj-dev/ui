import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MetricChart, type MetricChartPoint } from './metric-chart'
import { DEMO, SERIES } from './metric-chart/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const number = new Intl.NumberFormat('en-US')
const sum = (points: MetricChartPoint[], ids = SERIES.map((s) => s.id), key: 'values' | 'previous' = 'values') =>
  points.reduce((t, p) => t + ids.reduce((s, id) => s + (p[key]?.[id] ?? 0), 0), 0)
const headline = () => document.querySelector('[data-slot=metric-chart-headline] [data-slot=stat-value]')!

describe('MetricChart block', () => {
  test('leads with the range total and its change, a legend of toggles and a named, described chart', () => {
    reduced(<MetricChart />)
    const points = DEMO['30d'].points
    expect(screen.getByRole('heading', { level: 2, name: 'Signups' })).toBeInTheDocument()
    expect(headline()).toHaveTextContent(number.format(sum(points)))
    expect(document.querySelector('[data-slot=stat-delta]')).toHaveTextContent('vs. previous 30 days')
    const legend = screen.getByRole('group', { name: 'Series' })
    expect(within(legend).getAllByRole('button').map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'true', 'true'])
    expect(within(legend).getByRole('button', { name: /Organic search/ })).toHaveTextContent(number.format(sum(points, ['organic'])))
    expect(screen.getByRole('figure', { name: 'Signups' })).toHaveAccessibleDescription(/^Signups, Sep 11\s–\sOct 10: .* in all, up .*\. Highest: .*\. Marked: Launch week, Tue, Sep 22; Signup outage, Tue, Sep 29; Pricing page v2, Sat, Oct 3\.$/)
    expect(screen.getByRole('button', { name: 'View data' })).toBeInTheDocument()
  })

  test('a legend press folds a series away, the total follows and the change is spoken; Alt-press shows one alone', async () => {
    const user = userEvent.setup()
    const onHiddenChange = vi.fn()
    reduced(<MetricChart onHiddenChange={onHiddenChange} />)
    const points = DEMO['30d'].points
    const paid = screen.getByRole('button', { name: /^Paid/ })
    await user.click(paid)
    expect(paid).toHaveAttribute('aria-pressed', 'false')
    expect(onHiddenChange).toHaveBeenLastCalledWith(['paid'])
    expect(headline()).toHaveTextContent(number.format(sum(points, ['organic', 'referral'])))
    expect(screen.getByText('Paid hidden')).toHaveAttribute('role', 'status')

    fireEvent.click(screen.getByRole('button', { name: /^Referral/ }), { altKey: true })
    expect(onHiddenChange).toHaveBeenLastCalledWith(['organic', 'paid', 'previous'])
    expect(headline()).toHaveTextContent(number.format(sum(points, ['referral'])))
    expect(screen.getByText('Only Referral shown')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Referral/ }), { altKey: true })
    expect(onHiddenChange).toHaveBeenLastCalledWith([])
  })

  test('hiding every series says so and offers to show them all', async () => {
    const user = userEvent.setup()
    reduced(<MetricChart defaultHidden={['organic', 'paid']} />)
    await user.click(screen.getByRole('button', { name: /^Referral/ }))
    expect(screen.getByText('Every series is hidden.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all' }))
    expect(screen.getByRole('slider', { name: 'Signups by date' })).toBeInTheDocument()
  })

  test('the chart is a slider: arrow keys pick a bucket, the header and legend read it, Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<MetricChart />)
    const points = DEMO['30d'].points
    const slider = screen.getByRole('slider', { name: 'Signups by date' })
    await user.tab()
    while (document.activeElement !== slider) await user.tab()
    expect(slider).toHaveAttribute('aria-valuenow', '29')
    expect(slider.getAttribute('aria-valuetext')).toMatch(/^Sat, Oct 10: .*, so far$/)
    expect(document.querySelector('[data-slot=metric-chart-reading]')).toHaveTextContent(/Sat, Oct 10so far/)

    await user.keyboard('{Home}')
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    const first = points[0]!
    expect(slider).toHaveAttribute(
      'aria-valuetext',
      `Fri, Sep 11: ${number.format(sum([first]))}. Organic search ${number.format(first.values.organic!)}, Paid ${number.format(first.values.paid!)}, Referral ${number.format(first.values.referral!)}, Previous period ${number.format(sum([first], undefined, 'previous'))}`,
    )
    expect(screen.getByRole('button', { name: /^Paid/ })).toHaveTextContent(number.format(first.values.paid!))
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '2')
    await user.keyboard('{Escape}')
    expect(document.querySelector('[data-slot=metric-chart-reading]')).toBeNull()
  })

  test('annotations are buttons named for their day; focusing one reads that day, pressing it calls back', async () => {
    const user = userEvent.setup()
    const onAnnotationSelect = vi.fn()
    reduced(<MetricChart onAnnotationSelect={onAnnotationSelect} />)
    const notes = within(screen.getByRole('group', { name: 'Annotations' })).getAllByRole('button')
    expect(notes.map((n) => n.getAttribute('aria-label'))).toEqual([
      'Launch week, Tue, Sep 22: Five launches in five days, and the front page of Product Hunt.',
      'Signup outage, Tue, Sep 29: Verification emails failed for three hours.',
      'Pricing page v2, Sat, Oct 3: The new page with the yearly toggle went live.',
    ])
    act(() => notes[1]!.focus())
    expect(document.querySelector('[data-slot=metric-chart-reading]')).toHaveTextContent('Signup outage')
    await user.click(notes[2]!)
    expect(onAnnotationSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'pricing' }))
  })

  test('the range switch swaps the window and speaks the new total; a controlled range asks first', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    const view = reduced(<MetricChart onRangeChange={onRangeChange} />)
    await user.click(screen.getByRole('button', { name: '7D' }))
    expect(onRangeChange).toHaveBeenCalledWith('7d')
    expect(headline()).toHaveTextContent(number.format(sum(DEMO['7d'].points)))
    expect(screen.getByText(new RegExp(`^last 7 days: ${number.format(sum(DEMO['7d'].points))}, (up|down) `))).toHaveAttribute('role', 'status')
    view.unmount()

    reduced(<MetricChart range="30d" onRangeChange={onRangeChange} />)
    await user.click(screen.getByRole('button', { name: '12M' }))
    expect(onRangeChange).toHaveBeenLastCalledWith('12m')
    expect(screen.getByRole('button', { name: '30D' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('loading, error with retry, and empty take the plot’s place', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<MetricChart loading />)
    expect(screen.getByText('Loading signups')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    loading.unmount()

    const failed = reduced(<MetricChart error="The analytics service timed out." onRetry={onRetry} />)
    expect(screen.getByText('The analytics service timed out.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()

    const empty = reduced(<MetricChart points={[]} />)
    expect(screen.getByText('No signups in this range')).toBeInTheDocument()
    empty.unmount()
    reduced(<MetricChart points={[]} empty={<p>Nothing yet</p>} />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })

  describe('with your data', () => {
    const points: MetricChartPoint[] = [
      { date: '2026-06-01', values: { a: 1200, b: 300 }, previous: { a: 1000, b: 250 } },
      { date: '2026-07-01', values: { a: 1500, b: 420 }, previous: { a: 1100, b: 300 } },
      { date: '2026-08-01', values: { a: 1800, b: 510 }, previous: { a: 1300, b: 350 } },
    ]
    const series = [
      { id: 'a', label: 'Team' },
      { id: 'b', label: 'Starter' },
    ]

    test('series, points, format, locale and copy drive the card; no demo annotations or hatch', () => {
      reduced(
        <MetricChart
          series={series}
          points={points}
          granularity="month"
          annotations={[]}
          ranges={[]}
          format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
          locale="de-DE"
          copy={{ title: 'Umsatz', previous: 'Vorjahr' }}
        />,
      )
      expect(screen.getByRole('heading', { level: 2, name: 'Umsatz' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Time range' })).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Annotations' })).not.toBeInTheDocument()
      expect(headline()).toHaveTextContent('5.730 €')
      expect(screen.getByRole('button', { name: /^Vorjahr/ })).toHaveTextContent('4.300 €')
      // Intl writes a no-break space before the euro sign.
      expect(screen.getByRole('slider').getAttribute('aria-valuetext')?.replace(/\s/g, ' ')).toBe('August 2026: 2.310 €. Team 1.800 €, Starter 510 €, Vorjahr 1.650 €')
    })

    test('custom ranges drive the switch, the comparison and the announcement', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      const ranges = [
        { id: 'term', label: 'Term', name: 'this term', comparison: 'vs. last term' },
        { id: 'year', label: 'Year', name: 'this school year', comparison: 'vs. last year' },
      ]
      reduced(<MetricChart series={series} points={points} granularity="month" annotations={[]} ranges={ranges} defaultRange="term" onRangeChange={onRangeChange} />)
      expect(screen.queryByRole('button', { name: '30D' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Term' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText('vs. last term')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Year' }))
      expect(onRangeChange).toHaveBeenCalledWith('year')
      expect(screen.getByText('vs. last year')).toBeInTheDocument()
    })

    test('hidden is controlled, and Download CSV hands over the rows shown', async () => {
      const user = userEvent.setup()
      const onHiddenChange = vi.fn()
      const onExport = vi.fn()
      reduced(<MetricChart series={series} points={points} granularity="month" hidden={['b']} onHiddenChange={onHiddenChange} onExport={onExport} ranges={[]} />)
      await user.click(screen.getByRole('button', { name: /^Team/ }))
      expect(onHiddenChange).toHaveBeenCalledWith(['b', 'a'])
      expect(screen.getByRole('button', { name: /^Team/ })).toHaveAttribute('aria-pressed', 'true')
      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(await screen.findByRole('menuitem', { name: /Download CSV/ }))
      expect(onExport).toHaveBeenCalledWith(
        [
          { date: 'June 2026', s0: 1200, previous: 1000 },
          { date: 'July 2026', s0: 1500, previous: 1100 },
          { date: 'August 2026', s0: 1800, previous: 1300 },
        ],
        '30d',
      )
    })

    test('embedded is a section named by its heading; standalone draws the page; className and rest reach the root', () => {
      const view = reduced(<MetricChart headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Signups' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Signups' })).toBeInTheDocument()
      view.unmount()
      reduced(<MetricChart embedded={false} />)
      expect(screen.getByRole('main', { name: 'Signups' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Signups' })).toBeInTheDocument()
    })
  })
})
