import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { UsageOverview, type UsageDay, type UsageInvoice, type UsageMeter } from './usage-overview'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('usage block', () => {
  test('names its landmarks, summary groups and meters', () => {
    reduced(<UsageOverview embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Usage & billing' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'This cycle' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Month-to-date spend' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Included usage' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /Compute: 1,412 of 1,600 GB-hrs included/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download August 2026 invoice' })).toBeInTheDocument()
  })

  test('the range control switches the chart’s range', async () => {
    const user = userEvent.setup()
    reduced(<UsageOverview />)
    expect(screen.getByText('over 30 days')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '7 d' }))
    expect(screen.getByRole('button', { name: '7 d' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('over 7 days')).toBeInTheDocument()
  })

  test('lowering the spend cap below the projection warns', async () => {
    const user = userEvent.setup()
    reduced(<UsageOverview />)
    expect(screen.getByText('Headroom at this pace')).toBeInTheDocument()
    expect(screen.queryByText(/you reach the cap/)).not.toBeInTheDocument()
    // jsdom can't measure the thumb, so it's "hidden"; its aria-label still names it.
    const cap = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Spend cap')!
    cap.focus()
    await user.keyboard('{Home}')
    expect(screen.getByText('Projected overage')).toBeInTheDocument()
    expect(screen.getByText(/you reach the cap around day \d+ of the cycle/)).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame in the host’s theme: the shared page header names it, with no main or brand of its own', () => {
    const { container } = reduced(<UsageOverview />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Usage & billing' }))
    expect(screen.queryByText('Cumulus')).not.toBeInTheDocument()
    // No scope of its own: the host's ThemeScope decides how it looks.
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })

  describe('with your data', () => {
    const daily: UsageDay[] = Array.from({ length: 10 }, (_, i) => ({ day: `Oct ${i + 1}`, costs: { gpu: 100, egress: 20 } }))
    const meters: UsageMeter[] = [{ id: 'gpu', label: 'GPU hours', used: 90, included: 100, unit: 'h', alert: 0.8 }]
    const invoices: UsageInvoice[] = [{ id: 'INV-9', period: 'September 2026', amount: 3200, status: 'paid' }]
    const props = {
      resources: [
        { key: 'egress', label: 'Egress', color: 'var(--color-chart-2)' },
        { key: 'gpu', label: 'GPU', color: 'var(--color-chart-1)' },
      ],
      daily,
      meters,
      invoices,
      budget: 5000,
      cycleDays: 31,
      today: 10,
    }

    test('figures, meters, invoices and copy come from props', () => {
      reduced(<UsageOverview {...props} embedded={false} brand={{ name: 'Lumen' }} copy={{ title: 'Compute bill', workspace: 'Render farm' }} />)
      expect(screen.getByRole('heading', { level: 1, name: 'Compute bill' })).toBeInTheDocument()
      expect(screen.getByText('Lumen')).toBeInTheDocument()
      expect(screen.getByText('Render farm')).toBeInTheDocument()
      expect(screen.getByRole('progressbar', { name: 'GPU hours: 90 of 100 h included' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download September 2026 invoice' })).toBeInTheDocument()
      // 10 days at 120 = 1,200 so far; 31 days at that pace = 3,720.
      expect(screen.getByText('21')).toBeInTheDocument()
      expect(screen.getByText('over 10 days')).toBeInTheDocument()
    })

    test('the range is controlled', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      reduced(<UsageOverview {...props} range="7d" onRangeChange={onRangeChange} />)
      expect(screen.getByText('over 7 days')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Cycle' }))
      expect(onRangeChange).toHaveBeenCalledWith('cycle')
      expect(screen.getByText('over 7 days')).toBeInTheDocument()
    })

    test('save and download call back with their payload; a rejection shows its message', async () => {
      const user = userEvent.setup()
      const onSaveCap = vi.fn().mockRejectedValue(new Error('Billing is read-only'))
      const onDownloadInvoice = vi.fn()
      reduced(<UsageOverview {...props} defaultCap={3000} onCapChange={() => {}} onSaveCap={onSaveCap} onDownloadInvoice={onDownloadInvoice} />)
      await user.click(screen.getByRole('button', { name: 'Download September 2026 invoice' }))
      await waitFor(() => expect(onDownloadInvoice).toHaveBeenCalledWith(invoices[0]))
      await user.click(screen.getByRole('button', { name: 'Save cap' }))
      await waitFor(() => expect(onSaveCap).toHaveBeenCalledWith(3000))
      expect(await screen.findByText('Billing is read-only')).toBeInTheDocument()
    })

    test('no invoices: the empty copy, or the empty slot', () => {
      const { unmount } = reduced(<UsageOverview {...props} invoices={[]} />)
      expect(screen.getByText(/No invoices yet/)).toBeInTheDocument()
      unmount()
      reduced(<UsageOverview {...props} invoices={[]} empty={<p>Billing starts next month</p>} />)
      expect(screen.getByText('Billing starts next month')).toBeInTheDocument()
    })

    test('loading keeps the layout with skeletons; an error replaces it with Try again', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { unmount } = reduced(<UsageOverview {...props} loading />)
      expect(screen.getByRole('region', { name: 'This cycle' })).toHaveAttribute('aria-busy', 'true')
      expect(screen.queryByRole('button', { name: /Download/ })).toBeNull()
      unmount()
      reduced(<UsageOverview {...props} error="Metering is catching up" onRetry={onRetry} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Metering is catching up')
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalled()
    })

    test('headingLevel, className and rest props reach the root', () => {
      reduced(<UsageOverview headingLevel={3} className="custom-root" data-testid="root" />)
      expect(screen.getByRole('heading', { level: 3, name: 'Usage & billing' })).toBeInTheDocument()
      expect(screen.getByTestId('root')).toHaveClass('custom-root')
    })
  })

  test('a 31-day cycle draws its days in two rows, as a 30-day one does', () => {
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <UsageOverview cycleDays={31} />
      </YoujProvider>,
    )
    const grid = container.querySelector('[role=group] [style*=grid-template-columns]') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(16, minmax(0, 1fr))')
    expect(grid.children).toHaveLength(31)
  })
})
