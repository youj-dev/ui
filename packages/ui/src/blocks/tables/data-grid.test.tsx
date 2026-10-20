import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DataGrid, type DataGridProps } from './data-grid'
import { createDataGridColumns } from './data-grid/columns'
import type { DataGridPerson } from './data-grid/model'

interface Account {
  id: string
  name: string
  domain: string
  health: 'healthy' | 'at-risk' | 'churning'
  plan: string
  mrr: number
  seats: number
  limit: number
  usage: number[]
  owners: DataGridPerson[]
  tags: string[]
  renews: string
  autoRenew: boolean
}

const NOW = Date.UTC(2026, 8, 29, 9, 0)
const DAY = 86_400_000
const mira = { id: 'mira', name: 'Mira Chen' }
const jonas = { id: 'jonas', name: 'Jonas Weber' }

const ACCOUNTS: Account[] = [
  { id: 'a', name: 'Aster', domain: 'aster.com', health: 'healthy', plan: 'Pro', mrr: 1200, seats: 8, limit: 10, usage: [10, 12, 14], owners: [mira], tags: ['sso', 'eu', 'beta', 'api'], renews: new Date(NOW + 3 * DAY).toISOString(), autoRenew: true },
  { id: 'b', name: 'Beacon', domain: 'beacon.com', health: 'at-risk', plan: 'Business', mrr: 5400, seats: 40, limit: 40, usage: [30, 25, 20], owners: [jonas], tags: [], renews: new Date(NOW - 2 * DAY).toISOString(), autoRenew: false },
  { id: 'c', name: 'Cobalt', domain: 'cobalt.com', health: 'churning', plan: 'Pro', mrr: 300, seats: 2, limit: 10, usage: [9, 5, 3], owners: [mira, jonas], tags: ['beta'], renews: new Date(NOW + 40 * DAY).toISOString(), autoRenew: true },
  { id: 'd', name: 'Driftwood', domain: 'driftwood.com', health: 'healthy', plan: 'Enterprise', mrr: 18000, seats: 180, limit: 200, usage: [100, 110, 130], owners: [jonas], tags: ['sso'], renews: new Date(NOW + 90 * DAY).toISOString(), autoRenew: true },
  { id: 'e', name: 'Ember', domain: 'ember.com', health: 'healthy', plan: 'Business', mrr: 2600, seats: 20, limit: 40, usage: [20, 21, 22], owners: [mira], tags: [], renews: new Date(NOW + 200 * DAY).toISOString(), autoRenew: false },
]

const TAGS = { sso: { label: 'SSO' }, eu: { label: 'EU data' }, beta: { label: 'Beta' }, api: { label: 'API-heavy' } }
const col = createDataGridColumns<Account>()
const columns = (onToggle?: (row: Account, value: boolean) => void) => [
  col.identity('name', { header: 'Account', secondary: (a) => a.domain, shape: 'square' }),
  col.status('health', { header: 'Health', options: { healthy: { label: 'Healthy', tone: 'success' }, 'at-risk': { label: 'At risk', tone: 'warning' }, churning: { label: 'Churning', tone: 'danger' } } }),
  col.text('plan', { header: 'Plan', groupable: true, facet: true }),
  col.currency('mrr', { header: 'MRR', currency: 'USD', unit: '/mo' }),
  col.meter('seats', { header: 'Seats', max: (a) => a.limit }),
  col.trend('usage', { header: 'Usage' }),
  col.people('owners', { header: 'Owners' }),
  col.tags('tags', { header: 'Tags', options: TAGS }),
  col.date('renews', { header: 'Renews' }),
  col.boolean('autoRenew', { header: 'Auto-renew', onToggle }),
  col.id('id', { header: 'ID' }),
]

function Grid(props: Partial<DataGridProps<Account>>) {
  return (
    <YoujProvider reducedMotion="always">
      <DataGrid<Account>
        label="Accounts"
        copy={{ noun: 'accounts' }}
        rows={ACCOUNTS}
        columns={columns()}
        getRowId={(a) => a.id}
        now={NOW}
        pageSize={false}
        densitySwitch={false}
        columnsMenu={false}
        {...props}
      />
    </YoujProvider>
  )
}

const grid = () => screen.getByRole('grid', { name: 'Accounts' })
const rows = () => [...grid().querySelectorAll<HTMLElement>('tbody tr[data-dg-kind=row]')]
const names = () => rows().map((row) => row.querySelector('[data-slot=data-grid-identity-name]')?.textContent)
const header = (name: string) => within(grid()).getByRole('columnheader', { name: new RegExp(`^${name}`) })
const polite = () => document.querySelector('[data-slot=data-grid] > [role=status][aria-live=polite]')?.textContent ?? ''
const bar = () => document.querySelector<HTMLElement>('[data-slot=data-table-selection-bar]')

describe('DataGrid semantics', () => {
  test('is a labelled grid with a header row, row indexes and a keyboard description', () => {
    render(<Grid selectable />)
    const g = grid()
    expect(g).toHaveAttribute('aria-multiselectable', 'true')
    expect(g).toHaveAttribute('aria-rowcount', '6')
    expect(document.getElementById(g.getAttribute('aria-describedby')!)).toHaveTextContent(/Arrow keys move between cells/)
    expect(rows()).toHaveLength(5)
    expect(rows()[0]).toHaveAttribute('aria-rowindex', '2')
    expect(rows()[0]).toHaveAttribute('aria-selected', 'false')
    expect(within(g).getAllByRole('gridcell').length).toBeGreaterThan(40)
  })

  test('says nothing on load: no state changed yet', async () => {
    render(<Grid selectable />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })
    expect(polite()).toBe('')
  })

  test('announces a change of state, once it happens', async () => {
    const user = userEvent.setup()
    render(<Grid />)
    await user.click(within(header('Account')).getByRole('button'))
    await waitFor(() => expect(polite()).toMatch(/Sorted by Account/))
  })

  test('has exactly one Tab stop', () => {
    render(<Grid selectable />)
    const stops = [...grid().querySelectorAll<HTMLElement>('[tabindex="0"]')]
    expect(stops).toHaveLength(1)
  })

  test('a re-render that keeps the Tab stop writes no tabindex (each write restyles the page at once)', async () => {
    const user = userEvent.setup()
    render(<Grid selectable />)
    // The first sort moves the stop to the sort button; the second keeps it there.
    await user.click(within(header('MRR')).getByRole('button'))
    const writes: string[] = []
    const observer = new MutationObserver((records) => records.forEach((r) => writes.push((r.target as Element).outerHTML.slice(0, 40))))
    observer.observe(grid(), { subtree: true, attributes: true, attributeFilter: ['tabindex'] })
    await user.click(within(header('MRR')).getByRole('button'))
    await act(async () => {})
    observer.disconnect()
    expect(writes).toEqual([])
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })
})

describe('DataGrid column types', () => {
  test('money mutes its symbol and unit, and a meter says its value in words', () => {
    render(<Grid />)
    const row = rows()[1]!
    const mrr = row.querySelector('[data-slot=data-grid-figure]')!
    expect(mrr.textContent).toBe('$5,400/mo')
    expect(within(mrr as HTMLElement).getByText('$')).toHaveClass('own:text-fg-muted')
    expect(within(row).getByRole('meter')).toHaveAttribute('aria-valuetext', '40 of 40')
  })

  test('status reads as its label, tags keep every value in their text, people are named', () => {
    render(<Grid />)
    const first = rows()[0]!
    expect(within(first).getByText('Healthy')).toBeInTheDocument()
    expect(first.textContent).toContain('EU data')
    expect(first.textContent).toContain('API-heavy')
    expect(within(first).getAllByText('Mira Chen').length).toBeGreaterThan(0)
  })

  test('a status option in a chart color tints its badge and dot with it', () => {
    const plans = col.status('plan', { header: 'Plan', options: { Pro: { label: 'Pro', tone: 'chart-2' }, Business: { label: 'Business', tone: 'chart-4' }, Enterprise: { label: 'Enterprise', tone: 'success' } } })
    render(<Grid columns={[col.identity('name', { header: 'Account' }), plans]} />)
    const pro = within(rows()[0]!).getByText('Pro').closest<HTMLElement>('[data-slot=badge]')!
    expect(pro).toHaveAttribute('data-tone', 'chart-2')
    expect(pro.style.backgroundColor).toContain('var(--color-chart-2)')
    expect(pro.querySelector<HTMLElement>('[data-slot=badge-dot]')!.style.backgroundColor).toBe('var(--color-chart-2)')
    // A state keeps its own badge variant.
    expect(within(rows()[3]!).getByText('Enterprise').closest('[data-slot=badge]')).toHaveAttribute('data-tone', 'success')
  })

  test('a trend states its direction, and dates are relative with the exact moment', () => {
    render(<Grid />)
    const falling = rows()[1]!
    expect(falling.querySelector('[data-slot=data-grid-delta]')).toHaveAttribute('data-direction', 'down')
    expect(falling.textContent).toContain('Down')
    const renews = rows()[0]!.querySelector('time')!
    expect(renews.textContent).toMatch(/in 3 days/)
  })

  test('a boolean with onToggle is a named switch that reports the row', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<Grid columns={columns(onToggle)} />)
    const toggle = within(rows()[1]!).getByRole('switch', { name: 'Auto-renew for Beacon' })
    await user.click(toggle)
    expect(onToggle).toHaveBeenCalledWith(ACCOUNTS[1], true)
  })

  test('an id copies itself and says so', async () => {
    const user = userEvent.setup()
    // After setup: user-event installs a clipboard of its own.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<Grid />)
    await user.click(within(rows()[2]!).getByRole('button', { name: 'Copy c' }))
    expect(writeText).toHaveBeenCalledWith('c')
    await waitFor(() => expect(polite()).toBe('Copied'))
  })
})

describe('DataGrid link cells', () => {
  const links = (href: (a: Account) => string) => [col.identity('name', { header: 'Account' }), col.link('domain', { header: 'Website', href })]
  const website = (name: string) => within(rows().find((row) => row.textContent?.includes(name))!)

  test('a link to http(s), mailto or a route is an anchor', () => {
    render(<Grid columns={links((a) => (a.id === 'a' ? `https://${a.domain}` : a.id === 'b' ? `mailto:hi@${a.domain}` : `/accounts/${a.id}`))} />)
    expect(website('Aster').getByRole('link', { name: 'aster.com' })).toHaveAttribute('href', 'https://aster.com/')
    expect(website('Beacon').getByRole('link', { name: 'beacon.com' })).toHaveAttribute('href', 'mailto:hi@beacon.com')
    expect(website('Cobalt').getByRole('link', { name: 'cobalt.com' })).toHaveAttribute('href', '/accounts/c')
  })

  test.each(['javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>'])('a row URL of %j renders as plain text, with no anchor', (url) => {
    render(<Grid columns={links(() => url)} />)
    expect(within(grid()).queryByRole('link')).toBeNull()
    expect(grid().querySelector('a[href]')).toBeNull()
    expect(website('Aster').getByText('aster.com', { selector: 'span.truncate' })).toBeInTheDocument()
  })
})

describe('DataGrid sorting', () => {
  test('a header sorts (figures largest first), sets aria-sort, and a second click reverses it', async () => {
    const user = userEvent.setup()
    render(<Grid />)
    await user.click(within(header('MRR')).getByRole('button'))
    expect(header('MRR')).toHaveAttribute('aria-sort', 'descending')
    expect(names()).toEqual(['Driftwood', 'Beacon', 'Ember', 'Aster', 'Cobalt'])
    await user.click(within(header('MRR')).getByRole('button'))
    expect(header('MRR')).toHaveAttribute('aria-sort', 'ascending')
    expect(names()[0]).toBe('Cobalt')
    await waitFor(() => expect(polite()).toMatch(/Sorted by MRR, ascending/))
  })

  test('status sorts in the order of its options, not alphabetically', async () => {
    const user = userEvent.setup()
    render(<Grid />)
    await user.click(within(header('Health')).getByRole('button'))
    expect(names()).toEqual(['Aster', 'Driftwood', 'Ember', 'Beacon', 'Cobalt'])
  })
})

describe('DataGrid selection', () => {
  test('ticking rows raises the bar with the count; Shift+click selects the range', async () => {
    const user = userEvent.setup()
    render(<Grid selectable bulkActions={(s) => <button type="button">Archive {s.count}</button>} />)
    expect(bar()).toBeNull()
    await user.click(within(rows()[0]!).getByRole('checkbox', { name: 'Select Aster' }))
    expect(bar()).not.toBeNull()
    await user.keyboard('{Shift>}')
    await user.click(within(rows()[3]!).getByRole('checkbox', { name: 'Select Driftwood' }))
    await user.keyboard('{/Shift}')
    expect(rows().filter((row) => row.getAttribute('aria-selected') === 'true')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Archive 4' })).toBeInTheDocument()
    await waitFor(() => expect(polite()).toMatch(/4 rows selected/))
  })

  test('the header selects the page, the bar offers every page, Escape clears', async () => {
    const user = userEvent.setup()
    render(<Grid selectable pageSize={2} />)
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }))
    expect(rows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Select all 5 accounts' }))
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(rows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true)
    await user.keyboard('{Escape}')
    await user.click(within(rows()[0]!).getByRole('checkbox'))
    bar()!.focus()
    await user.keyboard('{Escape}')
    expect(bar()).toBeNull()
  })
})

describe('DataGrid keyboard', () => {
  test('arrows move one Tab stop between cells; Space selects; Enter opens the row', async () => {
    const onRowOpen = vi.fn()
    const user = userEvent.setup()
    render(<Grid selectable onRowOpen={onRowOpen} />)
    // The grid's one stop starts on the header's select-all checkbox.
    const stop = grid().querySelector<HTMLElement>('[tabindex="0"]')!
    expect(stop).toHaveAccessibleName('Select all rows')
    act(() => stop.focus())
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName('Select Aster')
    await user.keyboard('{ArrowRight}')
    const cell = document.activeElement as HTMLElement
    expect(cell).toHaveAttribute('data-kind', 'identity')
    expect(cell).toHaveAttribute('tabindex', '0')
    await user.keyboard(' ')
    expect(rows()[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(onRowOpen).toHaveBeenCalledWith(ACCOUNTS[0])
    await user.keyboard('{End}')
    expect((document.activeElement as HTMLElement).closest('td')).toHaveAttribute('data-kind', 'id')
    await user.keyboard('{Control>}{Home}{/Control}')
    expect((document.activeElement as HTMLElement).closest('[data-dg-row]')).toHaveAttribute('data-dg-row', '-1')
  })

  test('Ctrl+A selects every row', async () => {
    const user = userEvent.setup()
    render(<Grid selectable />)
    act(() => grid().querySelector<HTMLElement>('[tabindex="0"]')!.focus())
    await user.keyboard('{ArrowDown}{ArrowRight}{Control>}a{/Control}')
    expect(rows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true)
  })
})

describe('DataGrid search and filters', () => {
  test('the search narrows the rows and announces how many match', async () => {
    const user = userEvent.setup()
    render(<Grid />)
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'drift{Enter}')
    await waitFor(() => expect(names()).toEqual(['Driftwood']))
    await waitFor(() => expect(polite()).toMatch(/1 account matches/))
  })

  test('a filter in force is a chip; removing it brings the rows back', async () => {
    const user = userEvent.setup()
    render(<Grid initialState={{ columnFilters: [{ id: 'health', value: ['healthy'] }] }} />)
    expect(names()).toEqual(['Aster', 'Driftwood', 'Ember'])
    const chips = screen.getByRole('list', { name: 'Active filters' })
    expect(chips).toHaveTextContent('Healthy')
    await user.click(within(chips).getByRole('button', { name: 'Remove Health filter' }))
    expect(names()).toHaveLength(5)
  })

  test('filters match any value of a list (tags, people)', () => {
    render(<Grid initialState={{ columnFilters: [{ id: 'owners', value: ['jonas'] }] }} />)
    expect(names()).toEqual(['Beacon', 'Cobalt', 'Driftwood'])
  })

  test('no matches offers to clear the filters', async () => {
    const user = userEvent.setup()
    render(<Grid initialState={{ globalFilter: 'nothing like this' }} />)
    expect(screen.getByText('No matching accounts')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(names()).toHaveLength(5)
  })
})

describe('DataGrid detail panels and groups', () => {
  test('a row opens a named detail region from its expander, and Enter toggles it', async () => {
    const user = userEvent.setup()
    render(<Grid renderDetail={(a) => <p>Contact for {a.name}</p>} />)
    const expander = within(rows()[1]!).getByRole('button', { name: 'Show details for Beacon' })
    await user.click(expander)
    expect(expander).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('region', { name: 'Beacon' })).toHaveTextContent('Contact for Beacon')
    await user.click(within(rows()[1]!).getByRole('button', { name: 'Hide details for Beacon' }))
    await waitFor(() => expect(screen.queryByText('Contact for Beacon')).toBeNull())
  })

  test('grouping heads each group with its count and a total; a group folds', async () => {
    const user = userEvent.setup()
    render(<Grid initialState={{ grouping: 'plan' }} />)
    const groups = [...grid().querySelectorAll<HTMLElement>('tr[data-dg-kind=group]')]
    expect(groups.map((g) => g.textContent)).toEqual(['Business2', 'Enterprise1', 'Pro2'])
    const footers = [...grid().querySelectorAll<HTMLElement>('tr[data-dg-kind=footer]')]
    expect(footers[0]).toHaveTextContent('Total')
    expect(footers[0]).toHaveTextContent('$8,000/mo')
    await user.click(within(groups[0]!).getByRole('button', { name: 'Business, 2 accounts' }))
    expect(names()).toEqual(['Driftwood', 'Aster', 'Cobalt'])
    expect(polite()).toBe('')
  })
})

describe('DataGrid states and layouts', () => {
  test('loading with no rows is busy and shaped like the columns', () => {
    render(<Grid rows={[]} loading />)
    expect(document.querySelector('[aria-busy=true]')).not.toBeNull()
    expect(document.querySelectorAll('table[aria-hidden=true] tbody tr').length).toBeGreaterThan(0)
  })

  test('empty and error states say what happened and offer the way out', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Grid rows={[]} empty={{ title: 'No accounts yet', action: <button type="button">Import</button> }} />)
    expect(screen.getByText('No accounts yet').closest('[role=status]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument()
    rerender(<Grid rows={[]} error="The server didn’t answer." onRetry={onRetry} />)
    expect(screen.getByText('The server didn’t answer.').closest('[role=alert]')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('onRowClick fires for a click on a row, not on its own controls', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(<Grid selectable onRowClick={onRowClick} />)
    await user.click(within(rows()[1]!).getByRole('checkbox', { name: 'Select Beacon' }))
    expect(onRowClick).not.toHaveBeenCalled()
    await user.click(within(rows()[1]!).getByText('beacon.com'))
    expect(onRowClick).toHaveBeenCalledExactlyOnceWith(ACCOUNTS[1])
  })

  test('activeRowId marks the row open elsewhere, in rows and in cards', () => {
    const { rerender } = render(<Grid activeRowId={ACCOUNTS[1]!.id} />)
    expect(rows()[1]).toHaveAttribute('aria-current', 'true')
    expect(rows()[1]).toHaveAttribute('data-active')
    expect(rows()[0]).not.toHaveAttribute('aria-current')
    rerender(<Grid activeRowId={null} />)
    expect(rows()[1]).not.toHaveAttribute('aria-current')
    rerender(<Grid layout="cards" activeRowId={ACCOUNTS[2]!.id} />)
    expect(screen.getAllByRole('article')[2]).toHaveAttribute('aria-current', 'true')
  })

  test('a virtualized grid with no rows still shows its empty state', () => {
    render(<Grid rows={[]} virtualize height={300} empty={{ title: 'No accounts yet' }} />)
    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
  })

  test('the card layout is a list of labelled cards with every control of the row', async () => {
    const user = userEvent.setup()
    render(<Grid layout="cards" selectable rowActions={() => [{ label: 'Archive', onSelect: () => {} }]} />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
    expect(cards[0]).toHaveAccessibleName('Aster')
    expect(within(cards[0]!).getByText('MRR')).toBeInTheDocument()
    await user.click(within(cards[0]!).getByRole('checkbox', { name: 'Select Aster' }))
    expect(bar()).not.toBeNull()
  })

  test('row actions: inline buttons and a named menu per row', () => {
    render(<Grid rowActions={() => [{ label: 'Email', icon: () => <svg />, inline: true, onSelect: () => {} }, { label: 'Archive', onSelect: () => {} }]} />)
    expect(within(rows()[0]!).getByRole('button', { name: 'Email' })).toBeInTheDocument()
    expect(within(rows()[0]!).getByRole('button', { name: 'Actions for Aster' })).toBeInTheDocument()
  })

  test('inline rowActions and renderDetail do not re-render the rows, and a click reaches the latest closure', async () => {
    const user = userEvent.setup()
    let renders = 0
    const counted = [{ id: 'probe', accessorKey: 'name', header: 'Name', cell: () => (renders++, 'x') }] as never
    const picked: string[] = []
    const view = (tag: string) => (
      <Grid
        columns={counted}
        rowActions={() => [{ label: 'Archive', inline: true, icon: () => <svg />, onSelect: (a) => picked.push(`${tag}:${a.id}`) }]}
        renderDetail={(a) => <p>{a.name}</p>}
      />
    )
    const { rerender } = render(view('one'))
    const before = renders
    rerender(view('two'))
    rerender(view('three'))
    expect(renders).toBe(before)
    await user.click(within(rows()[0]!).getByRole('button', { name: 'Archive' }))
    expect(picked).toEqual(['three:a'])
  })

  test('marks itself for reduced motion, and unmounts cleanly', async () => {
    const { unmount } = render(<Grid selectable />)
    expect(document.querySelector('[data-slot=data-grid]')).toHaveAttribute('data-reduced-motion')
    await act(async () => unmount())
    expect(document.querySelector('[data-slot=data-grid]')).toBeNull()
  })
})

describe('DataGrid layout density', () => {
  test('starts compact inside a compact layout density, with its rows sized by the UI scale', () => {
    render(
      <YoujProvider density="compact" scaling="90%">
        <Grid />
      </YoujProvider>,
    )
    const root = document.querySelector<HTMLElement>('[data-slot=data-grid]')!
    expect(root).toHaveAttribute('data-density', 'compact')
    expect(root.style.getPropertyValue('--dg-row-h')).toBe('calc(40px * var(--yj-scale, 1))')
  })

  test('follows the layout density when it changes', () => {
    const tree = (density: 'compact' | 'roomy') => (
      <YoujProvider density={density}>
        <Grid />
      </YoujProvider>
    )
    const { rerender } = render(tree('roomy'))
    expect(document.querySelector('[data-slot=data-grid]')).toHaveAttribute('data-density', 'comfortable')
    rerender(tree('compact'))
    expect(document.querySelector('[data-slot=data-grid]')).toHaveAttribute('data-density', 'compact')
  })

  test('stays comfortable by default, and a given density wins over the layout', () => {
    const { unmount } = render(<Grid />)
    expect(document.querySelector('[data-slot=data-grid]')).toHaveAttribute('data-density', 'comfortable')
    unmount()
    render(
      <YoujProvider density="compact">
        <Grid defaultDensity="spacious" />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=data-grid]')).toHaveAttribute('data-density', 'spacious')
  })
})

describe('DataGrid locale', () => {
  test('a group total without its own format is written in the provider locale', () => {
    const big = ACCOUNTS.map((a) => ({ ...a, mrr: a.mrr * 1000 }))
    const raw = [col.text('plan', { header: 'Plan', groupable: true }), { accessorKey: 'mrr', header: 'MRR', meta: { aggregate: 'sum' } }] as ReturnType<typeof columns>
    render(
      <YoujProvider locale="de-DE" reducedMotion="always">
        <DataGrid<Account> label="Accounts" copy={{ noun: 'accounts' }} rows={big} columns={raw} getRowId={(a) => a.id} now={NOW} pageSize={false} densitySwitch={false} columnsMenu={false} initialState={{ grouping: 'plan' }} />
      </YoujProvider>,
    )
    const footers = [...grid().querySelectorAll<HTMLElement>('tr[data-dg-kind=footer]')]
    expect(footers[0]).toHaveTextContent('8.000.000')
  })
})
