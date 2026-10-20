import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShareGauge } from './share-gauge'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const list = () => screen.getByRole('list', { name: 'Spend by service, largest first' })
const rows = () => within(list()).getAllByRole('listitem')
const arc = (id: string) => document.querySelector<SVGPathElement>(`[data-slot=share-gauge-arc][data-yj-segment=${id}]`)!
const name = (row: HTMLElement) => row.querySelector('.font-medium')?.textContent

describe('Share gauge block', () => {
  test('ranks the biggest items and folds the rest into Other, with whole shares that add up', () => {
    reduced(<ShareGauge />)
    expect(screen.getByRole('heading', { level: 2, name: 'Spend by service' })).toBeInTheDocument()
    expect(rows().map(name)).toEqual(['Compute hours', 'Object storage', 'Managed database', 'Email delivery', 'Edge network', 'Other · 8'])
    expect(rows()[0]).toHaveTextContent('Orrery')
    expect(rows()[0]).toHaveTextContent('$4,820')
    const shares = rows().map((r) => Number.parseInt(r.querySelector('.text-fg-muted.tabular-nums')?.textContent ?? '0', 10))
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100)
  })

  test('the middle holds the period and the picture is named by its words', () => {
    reduced(<ShareGauge />)
    expect(screen.getAllByText('September 2026').length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: /^\$15,\d{3} in September 2026\. Compute hours \d+%/ })).toBeInTheDocument()
  })

  test('pointing at a row lights its segment and quiets the others, and leaving restores them', async () => {
    const user = userEvent.setup()
    reduced(<ShareGauge />)
    await user.hover(rows()[1]!)
    expect(rows()[1]).toHaveAttribute('data-active')
    expect(arc('storage')).not.toHaveClass('opacity-30')
    expect(arc('compute')).toHaveClass('opacity-30')
    expect(document.querySelector('[data-slot=share-gauge-tag]')).toHaveTextContent('Object storage')
    await user.unhover(rows()[1]!)
    expect(arc('compute')).not.toHaveClass('opacity-30')
  })

  test('the list is one tab stop and the arrow keys move between rows, lighting the segment', async () => {
    const user = userEvent.setup()
    reduced(<ShareGauge />)
    await user.tab()
    await user.tab()
    expect(rows()[0]).toHaveFocus()
    expect(rows().filter((r) => r.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(rows()[2]).toHaveFocus()
    expect(rows()[2]).toHaveAttribute('data-active')
    expect(arc('compute')).toHaveClass('opacity-30')
    await user.keyboard('{End}')
    expect(rows()[5]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(rows()[0]).toHaveFocus()
  })

  test('switching the period swaps the figures, reports the id, and keeps the list as tall', async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    reduced(<ShareGauge onPeriodChange={onPeriodChange} />)
    const kept = list().style.minHeight
    await user.click(screen.getByRole('button', { name: 'Year' }))
    expect(onPeriodChange).toHaveBeenCalledWith('year')
    expect(screen.getAllByText('2026 so far').length).toBeGreaterThan(0)
    expect(rows()[0]).toHaveTextContent('$40,491')
    expect(list().style.minHeight).toBe(kept)
  })

  test('props drive the content and copy rewrites the text', () => {
    reduced(
      <ShareGauge
        top={2}
        copy={{ title: 'Costs', other: (n: number) => `Rest (${n})` }}
        periods={[
          {
            id: 'p',
            label: 'P',
            name: 'Spring',
            items: [
              { id: 'a', label: 'Alpha', value: 50 },
              { id: 'b', label: 'Beta', value: 30 },
              { id: 'c', label: 'Gamma', value: 15 },
              { id: 'd', label: 'Delta', value: 5 },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Costs' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'P' })).not.toBeInTheDocument()
    expect(rows().map(name)).toEqual(['Alpha', 'Beta', 'Rest (2)'])
  })

  test('another world: channels, a second period and copy drive the rows, figures and period', async () => {
    const user = userEvent.setup()
    reduced(
      <ShareGauge
        copy={{ title: 'Ad budget', listLabel: 'Ad budget, largest first' }}
        periods={[
          { id: 'm', label: 'Month', name: 'October 2026', items: [{ id: 'search', label: 'Search ads', detail: 'Northline Media', value: 600 }, { id: 'social', label: 'Social ads', detail: 'Brightpost', value: 400 }] },
          { id: 'q', label: 'Quarter', name: 'Q4 2026', items: [{ id: 'search', label: 'Search ads', detail: 'Northline Media', value: 1800 }, { id: 'social', label: 'Social ads', detail: 'Brightpost', value: 1200 }] },
        ]}
      />,
    )
    const channels = () => within(screen.getByRole('list', { name: 'Ad budget, largest first' })).getAllByRole('listitem')
    expect(screen.getByRole('heading', { name: 'Ad budget' })).toBeInTheDocument()
    expect(channels().map(name)).toEqual(['Search ads', 'Social ads'])
    expect(channels()[0]).toHaveTextContent('Northline Media')
    expect(channels()[0]).toHaveTextContent('$600')
    expect(channels()[0]).toHaveTextContent('60%')
    await user.click(screen.getByRole('button', { name: 'Quarter' }))
    expect(channels()[0]).toHaveTextContent('$1,800')
    expect(screen.getAllByText('Q4 2026').length).toBeGreaterThan(0)
  })

  test('empty, loading and error states stand in for the gauge', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<ShareGauge periods={[{ id: 'm', label: 'M', name: 'Now', items: [] }]} />)
    expect(screen.getByText('No spend yet')).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <ShareGauge loading />
      </YoujProvider>,
    )
    expect(screen.getByText('Loading the spend')).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <ShareGauge error="Down" onRetry={onRetry} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
