import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { UsageCharges, type UsageChargesRecord, type UsageChargesSku } from './usage-charges'
import { dayRows, filterRecords, skuRows } from './usage-charges/model'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const skus: UsageChargesSku[] = [
  { id: 'gb', name: 'Transfer', tone: 'chart-1', unit: 'GB', included: 10, rate: 0.5 },
  { id: 'calls', name: 'Calls', tone: 'chart-2', unit: '', included: 1_000_000, rate: 0.00001 },
]
const records: UsageChargesRecord[] = [
  { date: '2026-10-01', project: 'web', sku: 'gb', quantity: 8, overage: 0 },
  { date: '2026-10-02', project: 'web', sku: 'gb', quantity: 9, overage: 2 },
  { date: '2026-10-02', project: 'api', sku: 'gb', quantity: 5, overage: 1 },
  { date: '2026-10-02', project: 'api', sku: 'calls', quantity: 400_000 },
]
const projects = [
  { id: 'web', name: 'Web' },
  { id: 'api', name: 'API' },
]
const props = { skus, records, projects }
const row = (name: string) => within(screen.getByRole('table', { name: 'Usage by SKU' })).getByRole('row', { name: new RegExp(`^${name}`) })

describe('usage and charges model', () => {
  test('filters by day and project, and sums usage, overage and charge per SKU', () => {
    const shown = filterRecords(records, { from: '2026-10-02' }, 'api')
    expect(shown).toHaveLength(2)
    const [gb, calls] = skuRows(shown, skus)
    expect(gb).toMatchObject({ used: 5, overage: 1, charge: 0.5 })
    expect(calls).toMatchObject({ used: 400_000, overage: 0, charge: 0 })
  })

  test('charges by day add up to the SKU rows', () => {
    const days = dayRows(records, skus)
    expect(days.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-02'])
    expect(days[1]).toMatchObject({ charges: { gb: 1.5, calls: 0 }, total: 1.5 })
    expect(days.reduce((sum, d) => sum + d.total, 0)).toBe(skuRows(records, skus).reduce((sum, r) => sum + r.charge, 0))
  })
})

describe('usage and charges block', () => {
  test('is a page with an h1, a named date range and project filter, and Export CSV', () => {
    reduced(<UsageCharges embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Usage charges' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Start date' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'End date' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Project' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument()
  })

  test('the table has a row per SKU with usage against its allowance, the part over it and the charge, and a total', () => {
    reduced(<UsageCharges embedded={false} {...props} />)
    const transfer = row('Transfer')
    expect(within(transfer).getByText('22 GB of 10 GB, over the allowance')).toBeInTheDocument()
    expect(within(transfer).getByText('3 GB')).toBeInTheDocument()
    expect(within(transfer).getByText('$1.50')).toBeInTheDocument()
    const calls = row('Calls')
    expect(within(calls).getByText('400K of 1M')).toBeInTheDocument()
    expect(within(calls).getByText('$0.00')).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'Usage by SKU' })).getByRole('row', { name: /^Total/ })).toHaveTextContent('$1.50')
    expect(screen.getByText('Total charges')).toBeInTheDocument()
  })

  test('the chart is a figure with the same days as a table for screen readers', () => {
    reduced(<UsageCharges embedded={false} {...props} />)
    expect(screen.getByRole('figure', { name: 'Charges by day' })).toHaveAccessibleDescription('$1.50 in charges over 2 days, stacked by SKU.')
    const days = screen.getByRole('table', { name: 'Charges by day and SKU' })
    expect(within(days).getByRole('row', { name: /Fri, Oct 2/ })).toHaveTextContent('$1.50')
  })

  test('choosing a project narrows the figures and reports the choice', async () => {
    const user = userEvent.setup()
    const onProjectChange = vi.fn()
    reduced(<UsageCharges embedded={false} {...props} onProjectChange={onProjectChange} />)
    await user.click(screen.getByRole('combobox', { name: 'Project' }))
    await user.click(await screen.findByRole('option', { name: 'API' }))
    expect(onProjectChange).toHaveBeenCalledWith('api')
    expect(within(row('Transfer')).getByText('5 GB of 10 GB')).toBeInTheDocument()
    expect(within(row('Transfer')).getByText('$0.50')).toBeInTheDocument()
  })

  test('a controlled range with no usage in it says so, in the chart’s room, and keeps the table', () => {
    reduced(<UsageCharges embedded={false} {...props} range={{ from: new Date(2026, 8, 1), to: new Date(2026, 8, 5) }} />)
    expect(screen.getByText('No usage in this range')).toBeInTheDocument()
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(within(row('Transfer')).getByText('0 GB of 10 GB')).toBeInTheDocument()
  })

  test('Export CSV hands the filters to onExport', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn().mockResolvedValue(undefined)
    reduced(<UsageCharges embedded={false} {...props} onExport={onExport} />)
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(onExport).toHaveBeenCalledWith({ from: '2026-10-01', to: '2026-10-02', project: 'all' })
  })

  test('copy rewrites the strings and the locale and currency change the figures', () => {
    reduced(<UsageCharges embedded={false} {...props} locale="de-DE" currency="EUR" copy={{ title: 'Nutzung', total: 'Summe', allProjects: 'Alle Projekte' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nutzung' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /^Summe/ })).toHaveTextContent('1,50')
    expect(screen.getByRole('combobox', { name: 'Project' })).toHaveTextContent('Alle Projekte')
  })

  test('loading is busy with skeleton figures; an error replaces the page’s content and retries', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<UsageCharges embedded={false} {...props} loading />)
    expect(screen.getByText('Loading usage')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Usage by SKU' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('$1.50')).not.toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <UsageCharges embedded={false} {...props} error="Couldn’t load your usage." onRetry={onRetry} />
      </YoujProvider>,
    )
    expect(screen.getByText('Couldn’t load your usage.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('by default, a page of the app’s frame: the shared header holds the title, range, project and export, with no main', () => {
    const { container } = reduced(<UsageCharges {...props} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Usage charges' }))
    expect(header).toContainElement(screen.getByRole('combobox', { name: 'Project' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /Export/ }))
  })
})
