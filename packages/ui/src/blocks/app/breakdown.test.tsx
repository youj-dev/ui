import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Breakdown, type BreakdownItem } from './breakdown'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => within(screen.getByRole('list', { name: /largest first/ })).getAllByRole('listitem')
const crumbs = () => within(screen.getByRole('navigation', { name: 'Breakdown path' })).getAllByRole('listitem').map((li) => li.textContent)
/** What the ring's hole says: the figure's spoken text and the caption. */
const hole = () => {
  const ring = document.querySelector('[data-slot=breakdown-ring]')!
  return `${ring.querySelector('[data-slot=counter] .sr-only')?.textContent} ${ring.querySelector('.truncate')?.textContent}`
}

describe('Breakdown block', () => {
  test('the top level, largest first, each part named with its figure, share and change; the ring holds the total', () => {
    reduced(<Breakdown />)
    expect(screen.getByRole('heading', { level: 2, name: 'Revenue by region' })).toBeInTheDocument()
    expect(rows().map((r) => r.textContent?.split('$')[0])).toEqual(['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'])
    expect(screen.getByRole('button', { name: 'Europe: $346K, 29.6% of the total, up 6.2%. 6 parts inside' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=breakdown-ring] svg')).toHaveAttribute('aria-hidden')
    expect(hole()).toBe('$1.17M Total')
    expect(crumbs()).toEqual(['All regions'])
  })

  test('pressing a part zooms in: the breadcrumb follows, the tail folds into Other, focus lands on the first row and it is spoken', async () => {
    const user = userEvent.setup()
    const onPathChange = vi.fn()
    reduced(<Breakdown onPathChange={onPathChange} />)
    screen.getByRole('button', { name: /^Europe/ }).focus()
    await user.keyboard('{Enter}')
    expect(onPathChange).toHaveBeenCalledWith(['eu'])
    expect(crumbs()).toEqual(['All regions', 'Europe'])
    expect(rows().map((r) => r.textContent?.split('$')[0])).toEqual(['Germany', 'United Kingdom', 'France', 'Netherlands', 'Sweden', 'Other (4)'])
    expect(screen.getByRole('button', { name: /^Germany/ })).toHaveFocus()
    expect(screen.getByText('Europe: $346K across 6 parts.')).toHaveAttribute('role', 'status')
    expect(hole()).toBe('$346K Europe')

    await user.click(screen.getByRole('button', { name: /^Other \(4\)/ }))
    expect(crumbs()).toEqual(['All regions', 'Europe', 'Other (4)'])
    expect(rows().map((r) => r.textContent?.split('$')[0])).toEqual(['Spain', 'Poland', 'Italy', 'Switzerland'])
  })

  test('Escape goes up a level and focus returns to the part you opened; the breadcrumb jumps to the top', async () => {
    const user = userEvent.setup()
    reduced(<Breakdown defaultPath={['eu', 'de']} />)
    expect(crumbs()).toEqual(['All regions', 'Europe', 'Germany'])
    // Germany's plans are the last level: rows, not buttons, while the app doesn't listen.
    expect(within(screen.getByRole('list', { name: /largest first/ })).queryAllByRole('button')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Europe' }))
    expect(crumbs()).toEqual(['All regions', 'Europe'])
    expect(screen.getByRole('button', { name: /^Germany/ })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(crumbs()).toEqual(['All regions'])
    expect(screen.getByRole('button', { name: /^Europe/ })).toHaveFocus()
  })

  test('pointing at a part lights its row and puts its figure and share in the ring', async () => {
    const user = userEvent.setup()
    reduced(<Breakdown />)
    const asia = screen.getByRole('button', { name: /^Asia Pacific/ })
    await user.hover(asia)
    expect(asia).toHaveAttribute('data-yj-lit')
    expect(hole()).toBe('$199K Asia Pacific · 17.1%')
    expect(document.querySelector('[data-slot=breakdown-ring] path[data-yj-key="apac"]')).toHaveAttribute('data-state', 'lifted')
    expect(document.querySelector('[data-slot=breakdown-ring] path[data-yj-key="eu"]')).toHaveAttribute('data-state', 'back')
  })

  test('loading, an error with Retry, and nothing to split', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<Breakdown loading />)
    expect(screen.getByText('Loading the breakdown')).toBeInTheDocument()
    loading.unmount()
    const failed = reduced(<Breakdown error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<Breakdown items={[]} />)
    expect(screen.getByText('Nothing to break down yet')).toBeInTheDocument()
  })

  describe('with your data', () => {
    const items: BreakdownItem[] = [
      { id: 'a', label: 'Alpha', value: 60, previous: 50, children: [{ id: 'a1', label: 'Alpha one', value: 40 }, { id: 'a2', label: 'Alpha two', value: 20 }] },
      { id: 'b', label: 'Beta', value: 40 },
    ]

    test('items, format, copy and locale drive the card; a last-level part calls back with its path', async () => {
      const user = userEvent.setup()
      const onItemSelect = vi.fn()
      reduced(<Breakdown items={items} format={{ maximumFractionDigits: 0 }} locale="de-DE" copy={{ title: 'Teile', all: 'Alle' }} onItemSelect={onItemSelect} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Teile' })).toBeInTheDocument()
      expect(crumbs()).toEqual(['Alle'])
      expect(screen.getByRole('button', { name: (name) => name.replace(/\s/g, ' ') === 'Alpha: 60, 60 % of the total, up 20 %. 2 parts inside' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^Alpha/ }))
      await user.click(screen.getByRole('button', { name: /^Alpha two/ }))
      expect(onItemSelect).toHaveBeenCalledWith(items[0]!.children![1], ['a', 'a2'])
    })

    test('a controlled path asks first; top folds sooner', async () => {
      const user = userEvent.setup()
      const onPathChange = vi.fn()
      const view = reduced(<Breakdown path={[]} onPathChange={onPathChange} />)
      await user.click(screen.getByRole('button', { name: /^Europe/ }))
      expect(onPathChange).toHaveBeenCalledWith(['eu'])
      expect(crumbs()).toEqual(['All regions'])
      view.unmount()
      reduced(<Breakdown top={2} />)
      expect(rows().map((r) => r.textContent?.split('$')[0])).toEqual(['North America', 'Europe', 'Other (3)'])
    })

    test('another world: hours by project drill into tasks, formatted as hours, with its own copy', async () => {
      const user = userEvent.setup()
      const hours: BreakdownItem[] = [
        { id: 'site', label: 'Coffee site', value: 30, previous: 24, children: [{ id: 'build', label: 'Build', value: 20 }, { id: 'design', label: 'Design', value: 10 }] },
        { id: 'admin', label: 'Admin', value: 10, previous: 12 },
      ]
      reduced(<Breakdown items={hours} format={{ style: 'unit', unit: 'hour', unitDisplay: 'short', maximumFractionDigits: 0 }} copy={{ title: 'Time by project', all: 'All projects', total: 'Logged' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Time by project' })).toBeInTheDocument()
      expect(crumbs()).toEqual(['All projects'])
      expect(screen.getByRole('button', { name: /^Coffee site: 30 hr, 75% of the total, up 25%/ })).toBeInTheDocument()
      expect(hole()).toBe('40 hr Logged')
      await user.click(screen.getByRole('button', { name: /^Coffee site/ }))
      expect(crumbs()).toEqual(['All projects', 'Coffee site'])
      expect(rows().map((r) => r.textContent?.split(/\d/)[0])).toEqual(['Build', 'Design'])
    })

    test('embedded is a section named by its heading; standalone draws the page', () => {
      const view = reduced(<Breakdown headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Revenue by region' })).toBeInTheDocument()
      view.unmount()
      reduced(<Breakdown embedded={false} />)
      expect(screen.getByRole('main', { name: 'Revenue by region' })).toBeInTheDocument()
    })
  })
})
