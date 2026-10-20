import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { createDataTableColumnHelper, type DataTableColumnDef } from '../../../components/ui/data-table'
import { DataTable, type DataTableProps } from '../data-table'

interface Person {
  id: string
  name: string
  team: string
  commits: number
  joined: string
}

const PEOPLE: Person[] = [
  { id: 'a', name: 'Ada', team: 'Platform', commits: 3, joined: '2024-01-15' },
  { id: 'b', name: 'Ben', team: 'Design', commits: 1, joined: '2024-03-02' },
  { id: 'c', name: 'Cleo', team: 'Design', commits: 5, joined: '2024-06-20' },
  { id: 'd', name: 'Dmitri', team: 'Support', commits: 2, joined: '2025-02-11' },
  { id: 'e', name: 'Esme', team: 'Platform', commits: 4, joined: '2025-08-30' },
]

const col = createDataTableColumnHelper<Person>()
const COLUMNS: DataTableColumnDef<Person>[] = col.columns([
  col.accessor('name', { header: 'Name' }),
  col.accessor('team', { header: 'Team', meta: { filter: { type: 'select' } } }),
  col.accessor('commits', { header: 'Commits', meta: { numeric: true, filter: { type: 'number-range', min: 0, max: 10 } } }),
  col.accessor((p) => new Date(`${p.joined}T00:00:00`), {
    id: 'joined',
    header: 'Joined',
    cell: (ctx) => ctx.row.original.joined,
    meta: { label: 'Joined', filter: { type: 'date-range' } },
  }),
])

function Table(props: Partial<DataTableProps<Person>>) {
  return (
    <YoujProvider reducedMotion="always">
      <DataTable<Person>
        label="People"
        rows={PEOPLE}
        columns={COLUMNS}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.name}
        paginated={false}
        showDensityToggle={false}
        showColumnsMenu={false}
        {...props}
      />
    </YoujProvider>
  )
}

const grid = () => screen.getByRole('grid', { name: 'People' })
const names = () =>
  within(grid())
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('gridcell')[0]?.textContent)
const toolbar = () => document.querySelector<HTMLElement>('[data-slot=data-table-toolbar]')!
const filterKey = (name: string) => within(toolbar()).getByRole('button', { name: new RegExp(`^${name}`) })
const polite = () => document.querySelector('[role=status][aria-live=polite]')?.textContent ?? ''
const chips = () => screen.getByRole('group', { name: 'Active filters' })

describe('DataTable value filters', () => {
  test('list every value with its count, narrow the rows and announce how many match', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(filterKey('Team'))
    const popup = screen.getByRole('dialog', { name: 'Filter by Team' })
    expect(within(popup).getAllByRole('option').map((o) => o.textContent)).toEqual(['Design 2', 'Platform 2', 'Support 1'])

    await user.click(within(popup).getByRole('option', { name: /Design/ }))
    expect(within(popup).getByRole('option', { name: /Design/ })).toHaveAttribute('aria-checked', 'true')
    expect(names()).toEqual(['Ben', 'Cleo'])
    expect(filterKey('Team')).toHaveTextContent('Design')
    await waitFor(() => expect(polite()).toBe('2 rows match'))
  })

  test('counts follow the other filters; a value nothing matches stays listed', async () => {
    const user = userEvent.setup()
    render(<Table search initialState={{ globalFilter: 'e' }} />)
    await user.click(filterKey('Team'))
    const options = within(screen.getByRole('dialog', { name: 'Filter by Team' })).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['Design 2', 'Platform 1', 'Support 0'])
  })
})

describe('DataTable range filters', () => {
  test('a number range takes exact bounds from its fields', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(filterKey('Commits'))
    const popup = screen.getByRole('dialog', { name: 'Filter by Commits' })
    // jsdom can't measure the thumbs, so Base UI keeps them hidden: query them as such.
    const thumbs = within(popup).getAllByRole('slider', { hidden: true })
    expect(thumbs.map((s) => s.getAttribute('aria-label'))).toEqual(['Minimum commits', 'Maximum commits'])

    const min = within(popup).getByRole('textbox', { name: 'Min' })
    await user.type(min, '3{Enter}')
    expect(names()).toEqual(['Ada', 'Cleo', 'Esme'])
    expect(filterKey('Commits')).toHaveTextContent('≥ 3')
    // Committing keeps the field (and focus) in place.
    expect(min).toHaveFocus()
    expect(min).toHaveValue('3')
  })

  test('a date range keeps whole days between its bounds, both included', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(filterKey('Joined'))
    const popup = screen.getByRole('dialog', { name: 'Filter by Joined' })
    fireEvent.change(within(popup).getByLabelText('From'), { target: { value: '2024-03-02' } })
    fireEvent.change(within(popup).getByLabelText('To'), { target: { value: '2025-02-11' } })
    expect(names()).toEqual(['Ben', 'Cleo', 'Dmitri'])
    // The chip row opens on the next frame.
    const row = await screen.findByRole('group', { name: 'Active filters' })
    expect(within(row).getByText('Joined')).toBeInTheDocument()
  })

  test('date presets say which one is on', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(filterKey('Joined'))
    const presets = within(screen.getByRole('group', { name: 'Presets' }))
    const year = presets.getByRole('button', { name: 'This year' })
    expect(year).toHaveAttribute('aria-pressed', 'false')
    await user.click(year)
    expect(year).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('DataTable search', () => {
  test('filters after a pause in typing, at once on Enter, and Escape clears it', async () => {
    const user = userEvent.setup()
    render(<Table search />)
    const box = screen.getByRole('searchbox', { name: 'Search' })
    await user.click(box)
    // The pause is a timer, faked so "not yet" never depends on how fast a busy runner gets here.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.change(box, { target: { value: 'cle' } })
      act(() => vi.advanceTimersByTime(199))
      expect(names()).toHaveLength(5)
      act(() => vi.advanceTimersByTime(1))
      expect(names()).toEqual(['Cleo'])
    } finally {
      vi.useRealTimers()
    }

    await user.keyboard('{Escape}')
    expect(box).toHaveValue('')
    expect(names()).toHaveLength(5)

    await user.type(box, 'ben{Enter}')
    expect(names()).toEqual(['Ben'])
  })

  test('/ jumps to the search from anywhere but a text field', async () => {
    const user = userEvent.setup()
    render(<Table search />)
    await user.keyboard('/')
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus()
  })
})

describe('DataTable filter chips', () => {
  const filtered = {
    columnFilters: [
      { id: 'team', value: ['Design'] },
      { id: 'commits', value: { min: 2 } },
    ],
    globalFilter: 'e',
  }

  test('repeat the filters in force; removing one hands focus to the next', async () => {
    const user = userEvent.setup()
    render(<Table search initialState={filtered} />)
    const buttons = () => within(chips()).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)
    expect(buttons()).toEqual(['Remove Search filter', 'Remove Team filter', 'Remove Commits filter', 'Clear all'])
    expect(chips()).toHaveTextContent('Commits≥ 2')
    expect(names()).toEqual(['Cleo'])

    within(chips()).getByRole('button', { name: 'Remove Team filter' }).focus()
    await user.keyboard('{Enter}')
    expect(buttons()).toEqual(['Remove Search filter', 'Remove Commits filter', 'Clear all'])
    expect(within(chips()).getByRole('button', { name: 'Remove Commits filter' })).toHaveFocus()
    expect(names()).toEqual(['Cleo', 'Esme'])
  })

  test('Clear all lifts every filter and the search', async () => {
    const user = userEvent.setup()
    render(<Table search initialState={filtered} />)
    await user.click(within(chips()).getByRole('button', { name: 'Clear all' }))
    expect(names()).toHaveLength(5)
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('')
    await waitFor(() => expect(polite()).toBe('5 rows in total'))
  })

  test('when nothing matches, the table says so and offers to clear the filters', async () => {
    const user = userEvent.setup()
    render(<Table search initialState={{ globalFilter: 'zzz' }} />)
    expect(screen.getByText('No matching rows')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(names()).toHaveLength(5)
  })
})

describe('DataTable server-side filtering', () => {
  test('reports filter changes, shows no counts and announces the count once the rows arrive', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    const { rerender } = render(<Table manual rowCount={5} onColumnFiltersChange={onColumnFiltersChange} />)
    await user.click(filterKey('Team'))
    const popup = screen.getByRole('dialog', { name: 'Filter by Team' })
    // One loaded page can't know the counts.
    expect(within(popup).getAllByRole('option').map((o) => o.textContent)).toEqual(['Design', 'Platform', 'Support'])
    await user.click(within(popup).getByRole('option', { name: /Support/ }))
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([{ id: 'team', value: ['Support'] }])

    // The server answers with its page: only then is the count announced.
    await act(() => new Promise((r) => setTimeout(r, 600)))
    expect(polite()).not.toMatch(/match/)
    rerender(
      <Table
        manual
        rows={PEOPLE.filter((p) => p.team === 'Support')}
        rowCount={1}
        state={{ columnFilters: [{ id: 'team', value: ['Support'] }] }}
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )
    await waitFor(() => expect(polite()).toBe('1 row matches'))
  })
})
