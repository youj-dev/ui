import { useState } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { createDataTableColumnHelper, type DataTableColumnDef } from '../../components/ui/data-table'
import { DataTable, type DataTableProps } from './data-table'

interface Person {
  id: string
  name: string
  team: string
  commits: number
}

const PEOPLE: Person[] = [
  { id: 'a', name: 'Ada', team: 'Platform', commits: 3 },
  { id: 'b', name: 'Ben', team: 'Design', commits: 1 },
  { id: 'c', name: 'Cleo', team: 'Design', commits: 5 },
  { id: 'd', name: 'Dmitri', team: 'Support', commits: 2 },
  { id: 'e', name: 'Esme', team: 'Platform', commits: 4 },
]

const col = createDataTableColumnHelper<Person>()
const COLUMNS: DataTableColumnDef<Person>[] = col.columns([
  col.accessor('name', { header: 'Name' }),
  col.accessor('team', { header: 'Team' }),
  col.accessor('commits', { header: 'Commits', meta: { numeric: true } }),
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
const bodyRows = () => within(grid()).getAllByRole('row').slice(1)
const names = () => bodyRows().map((row) => within(row).getAllByRole('gridcell').map((c) => c.textContent)[0])
const header = (name: RegExp | string) => within(grid()).getByRole('columnheader', { name })
const sortButton = (name: string) => within(header(name)).getByRole('button', { name })
const polite = () => document.querySelector('[role=status][aria-live=polite]')?.textContent ?? ''
const settle = () => act(() => new Promise((r) => setTimeout(r, 120)))

describe('DataTable semantics', () => {
  test('is a labelled grid with column headers, row counts and a keyboard description', () => {
    render(<Table enableRowSelection />)
    const g = grid()
    expect(g).toHaveAttribute('aria-rowcount', '6')
    expect(g).toHaveAttribute('aria-multiselectable', 'true')
    expect(g.getAttribute('aria-describedby')).toBeTruthy()
    expect(document.getElementById(g.getAttribute('aria-describedby')!)).toHaveTextContent(/Arrow keys move between cells/)
    expect(within(g).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['', 'Name', 'Team', 'Commits'])
    expect(bodyRows()).toHaveLength(5)
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2')
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'false')
  })

  test('the scroll frame is a labelled Tab stop only while it scrolls', () => {
    const scroll = () => document.querySelector('[data-slot=data-table-scroll]')!
    const { unmount } = render(<Table />)
    expect(scroll()).not.toHaveAttribute('tabindex')
    expect(scroll()).not.toHaveAttribute('role')
    unmount()

    // Wider content than the frame: jsdom does no layout, so the sizes are stubbed.
    const width = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900)
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390)
    try {
      render(<Table />)
      expect(scroll()).toHaveAttribute('tabindex', '0')
      expect(screen.getByRole('group', { name: 'People' })).toBe(scroll())
    } finally {
      width.mockRestore()
      client.mockRestore()
    }
  })

  test('without selection, rows carry no aria-selected and the grid is not multiselectable', () => {
    render(<Table />)
    expect(grid()).not.toHaveAttribute('aria-multiselectable')
    expect(bodyRows()[0]).not.toHaveAttribute('aria-selected')
  })
})

describe('DataTable sorting', () => {
  test('a header cycles through its sort, sets aria-sort and announces it', async () => {
    const user = userEvent.setup()
    render(<Table />)
    const name = sortButton('Name')
    await user.click(name)
    expect(header('Name')).toHaveAttribute('aria-sort', 'ascending')
    expect(names()).toEqual(['Ada', 'Ben', 'Cleo', 'Dmitri', 'Esme'])
    await user.click(name)
    expect(header('Name')).toHaveAttribute('aria-sort', 'descending')
    expect(names()).toEqual(['Esme', 'Dmitri', 'Cleo', 'Ben', 'Ada'])
    await waitFor(() => expect(polite()).toBe('Sorted by Name, descending'))
    // The third press removes the sort: the data's own order comes back.
    await user.click(name)
    expect(header('Name')).not.toHaveAttribute('aria-sort')
    await waitFor(() => expect(polite()).toBe('Sort cleared'))
  })

  test('figures sort largest first', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(sortButton('Commits'))
    expect(header('Commits')).toHaveAttribute('aria-sort', 'descending')
    expect(names()[0]).toBe('Cleo')
  })

  test('Shift+click adds a column: priorities show, aria-sort stays on the first', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(sortButton('Team'))
    await user.keyboard('{Shift>}')
    await user.click(sortButton('Commits'))
    await user.keyboard('{/Shift}')
    expect(header('Team')).toHaveAttribute('aria-sort', 'ascending')
    expect(header('Commits')).not.toHaveAttribute('aria-sort')
    // Design (5, 1), Platform (4, 3), Support (2)
    expect(names()).toEqual(['Cleo', 'Ben', 'Esme', 'Ada', 'Dmitri'])
    expect(header('Team').querySelector('[data-slot=data-table-sort-indicator]')).toHaveTextContent('1')
    expect(header('Commits').querySelector('[data-slot=data-table-sort-indicator]')).toHaveTextContent('2')
    await waitFor(() => expect(polite()).toBe('Sorted by Team, ascending, then Commits, descending'))
  })

  test('controlled sorting reports and waits for the parent', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(<Table state={{ sorting: [] }} onSortingChange={onSortingChange} />)
    await user.click(sortButton('Name'))
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }])
    expect(header('Name')).not.toHaveAttribute('aria-sort')
  })
})

describe('DataTable selection', () => {
  const checkbox = (name: string) => screen.getByRole('checkbox', { name: `Select ${name}` })

  test('a row checkbox selects the row, raises the bar and announces the count', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection />)
    expect(screen.queryByRole('group', { name: 'Selection actions' })).not.toBeInTheDocument()
    await user.click(checkbox('Ben'))
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true')
    const bar = screen.getByRole('group', { name: 'Selection actions' })
    expect(bar).toHaveTextContent('1')
    await waitFor(() => expect(polite()).toBe('1 row selected'))
  })

  test('Shift+click selects the range from the last row toggled', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection />)
    await user.click(checkbox('Ben'))
    await user.keyboard('{Shift>}')
    await user.click(checkbox('Esme'))
    await user.keyboard('{/Shift}')
    expect(bodyRows().map((r) => r.getAttribute('aria-selected'))).toEqual(['false', 'true', 'true', 'true', 'true'])
    await waitFor(() => expect(polite()).toBe('4 rows selected'))
  })

  test('the range follows the sorted order on screen', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection />)
    await user.click(sortButton('Commits'))
    // Cleo 5, Esme 4, Ada 3, Dmitri 2, Ben 1
    await user.click(checkbox('Esme'))
    await user.keyboard('{Shift>}')
    await user.click(checkbox('Dmitri'))
    await user.keyboard('{/Shift}')
    const selected = bodyRows().filter((r) => r.getAttribute('aria-selected') === 'true')
    expect(selected.map((r) => within(r).getAllByRole('gridcell')[1]!.textContent)).toEqual(['Esme', 'Ada', 'Dmitri'])
  })

  test('the header checkbox selects the page, then the bar offers every page', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection paginated initialState={{ pagination: { pageSize: 2 } }} />)
    const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' })
    await user.click(checkbox('Ada'))
    expect(all).toHaveAttribute('aria-checked', 'mixed')
    await user.click(all)
    expect(all).toHaveAttribute('aria-checked', 'true')
    const bar = screen.getByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: 'Select all 5 rows' }))
    await waitFor(() => expect(polite()).toBe('5 rows selected'))
    expect(within(bar).queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument()
  })

  test('rows that cannot be selected are skipped, and Escape clears the selection', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection={(p) => p.team !== 'Support'} />)
    expect(checkbox('Dmitri')).toHaveAttribute('data-disabled')
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }))
    expect(bodyRows().filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(4)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(polite()).toBe('Selection cleared'))
    expect(bodyRows().filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(0)
  })

  test('bulk actions receive the selected rows; the bar clears the selection', async () => {
    const user = userEvent.setup()
    const seen = vi.fn()
    render(
      <Table
        enableRowSelection
        bulkActions={(selection) => {
          seen(selection.rows.map((r) => r.name), selection.count)
          return <button type="button">Archive</button>
        }}
      />,
    )
    await user.click(checkbox('Cleo'))
    await user.click(checkbox('Ada'))
    expect(seen).toHaveBeenLastCalledWith(['Ada', 'Cleo'], 2)
    const bar = screen.getByRole('group', { name: 'Selection actions' })
    expect(within(bar).getByRole('button', { name: 'Archive' })).toBeInTheDocument()
    await user.click(within(bar).getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByRole('group', { name: 'Selection actions' })).not.toBeInTheDocument()
  })

  test('selected ids whose rows are removed are dropped', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = vi.fn()
    const { rerender } = render(<Table enableRowSelection onRowSelectionChange={onRowSelectionChange} />)
    await user.click(checkbox('Ben'))
    rerender(<Table enableRowSelection onRowSelectionChange={onRowSelectionChange} rows={PEOPLE.filter((p) => p.id !== 'b')} />)
    await waitFor(() => expect(onRowSelectionChange).toHaveBeenLastCalledWith({}))
  })
})

describe('DataTable keyboard grid', () => {
  const active = () => document.activeElement as HTMLElement
  const coords = () => {
    const cell = active().closest('[data-dt-cell]') as HTMLElement
    return [Number(cell.dataset.dtRow), Number(cell.dataset.dtCol)]
  }
  const tabStops = () => [...grid().querySelectorAll('[tabindex="0"]')]

  test('the grid is one Tab stop and arrow keys move the active cell', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <Table enableRowSelection />
        <button type="button">After</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    // Enters on the first header cell: the select-all checkbox is its widget.
    expect(coords()).toEqual([-1, 0])
    expect(active()).toHaveAttribute('role', 'checkbox')
    expect(tabStops()).toHaveLength(1)
    await user.keyboard('{ArrowDown}{ArrowRight}')
    expect(coords()).toEqual([0, 1])
    expect(active().tagName).toBe('TD')
    await user.keyboard('{End}')
    expect(coords()).toEqual([0, 3])
    await user.keyboard('{Control>}{End}{/Control}')
    expect(coords()).toEqual([4, 3])
    await user.keyboard('{Control>}{Home}{/Control}')
    expect(coords()).toEqual([-1, 0])
    await user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(coords()).toEqual([-1, 0])
    expect(tabStops()).toHaveLength(1)
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
    // Coming back lands on the cell that was active.
    await user.tab({ shift: true })
    expect(coords()).toEqual([-1, 0])
  })

  test('Space selects a row and Shift+Space selects a range', async () => {
    const user = userEvent.setup()
    render(<Table enableRowSelection />)
    await user.click(within(bodyRows()[0]!).getAllByRole('gridcell')[1]!)
    await user.keyboard(' ')
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}{ArrowDown}{Shift>} {/Shift}')
    expect(bodyRows().map((r) => r.getAttribute('aria-selected'))).toEqual(['true', 'true', 'true', 'false', 'false'])
  })

  test('Enter sorts from a header, Shift+Enter adds to the sort', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(sortButton('Team'))
    expect(header('Team')).toHaveAttribute('aria-sort', 'ascending')
    await user.keyboard('{ArrowRight}')
    expect(sortButton('Commits')).toHaveFocus()
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(header('Commits').querySelector('[data-slot=data-table-sort-indicator]')).toHaveTextContent('2')
  })

  test('Shift+Arrow on a header resizes its column and announces the width', async () => {
    const user = userEvent.setup()
    const onColumnSizingChange = vi.fn()
    render(<Table onColumnSizingChange={onColumnSizingChange} />)
    await user.click(sortButton('Team'))
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ team: 176 })
    await waitFor(() => expect(polite()).toBe('Team column, 176 pixels wide'))
  })
})

describe('DataTable inline editing', () => {
  const editable: DataTableColumnDef<Person>[] = col.columns([
    col.accessor('name', { header: 'Name', meta: { editor: { type: 'text' }, validate: (v) => (String(v).trim() ? null : 'A name is required') } }),
    col.accessor('team', { header: 'Team' }),
    col.accessor('commits', { header: 'Commits', meta: { numeric: true, editor: { type: 'number', min: 0 } } }),
  ])

  function Editable({ onCellEdit }: { onCellEdit: DataTableProps<Person>['onCellEdit'] }) {
    const [data, setData] = useState(PEOPLE)
    return (
      <Table
        rows={data}
        columns={editable}
        onCellEdit={async (edit) => {
          await onCellEdit?.(edit)
          setData((rows) => rows.map((r) => (r.id === edit.rowId ? { ...r, [edit.columnId]: edit.value } : r)))
        }}
      />
    )
  }

  const cell = (row: number, col: number) => within(bodyRows()[row]!).getAllByRole('gridcell')[col]!

  test('Enter edits, Enter commits: the new value shows while it saves, then sticks', async () => {
    const user = userEvent.setup()
    let resolve!: () => void
    const onCellEdit = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<Editable onCellEdit={onCellEdit} />)
    await user.click(cell(1, 0))
    await user.keyboard('{Enter}')
    const input = screen.getByRole('textbox', { name: 'Name, Ben' })
    expect(input).toHaveValue('Ben')
    await user.clear(input)
    await user.type(input, 'Benedict{Enter}')
    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ rowId: 'b', columnId: 'name', value: 'Benedict', previousValue: 'Ben' }))
    // Optimistic: shown at once, marked busy while it saves, focus back on the cell.
    expect(cell(1, 0)).toHaveTextContent('Benedict')
    expect(cell(1, 0)).toHaveAttribute('aria-busy', 'true')
    expect(cell(1, 0)).toHaveFocus()
    await act(async () => resolve())
    expect(cell(1, 0)).not.toHaveAttribute('aria-busy')
    expect(cell(1, 0)).toHaveTextContent('Benedict')
    // Named as it was when the edit began.
    await waitFor(() => expect(polite()).toBe('Saved Name for Ben'))
  })

  test('Escape cancels: the value never changed', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn()
    render(<Editable onCellEdit={onCellEdit} />)
    await user.dblClick(cell(0, 0))
    await user.type(screen.getByRole('textbox', { name: 'Name, Ada' }), 'Lovelace{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(cell(0, 0)).toHaveTextContent('Ada')
    expect(cell(0, 0)).toHaveFocus()
    expect(onCellEdit).not.toHaveBeenCalled()
  })

  test('typing on a cell starts editing with that character', async () => {
    const user = userEvent.setup()
    render(<Editable onCellEdit={vi.fn()} />)
    await user.click(cell(0, 2))
    await user.keyboard('9')
    expect(screen.getByRole('textbox', { name: 'Commits, Ada' })).toHaveValue('9')
  })

  test('an invalid draft keeps the editor open with its reason', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn()
    render(<Editable onCellEdit={onCellEdit} />)
    await user.dblClick(cell(0, 0))
    const input = screen.getByRole('textbox', { name: 'Name, Ada' })
    await user.clear(input)
    await user.keyboard('{Enter}')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('A name is required')
    expect(onCellEdit).not.toHaveBeenCalled()
    await user.clear(input)
    await user.type(input, '-2{Enter}')
    expect(onCellEdit).toHaveBeenCalledTimes(1)
  })

  test('numbers are parsed and bounded', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn()
    render(<Editable onCellEdit={onCellEdit} />)
    await user.dblClick(cell(0, 2))
    const input = screen.getByRole('textbox', { name: 'Commits, Ada' })
    await user.clear(input)
    await user.type(input, 'lots{Enter}')
    expect(input).toHaveAccessibleDescription('Enter a number')
    await user.clear(input)
    await user.type(input, '-1{Enter}')
    expect(input).toHaveAccessibleDescription('Enter 0 or more')
    await user.clear(input)
    await user.type(input, '1,204{Enter}')
    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ value: 1204 }))
  })

  test('a rejected save rolls back and says why, assertively', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn(() => Promise.reject(new Error('Commits are read-only today.')))
    render(<Table columns={editable} onCellEdit={onCellEdit} />)
    await user.dblClick(cell(0, 2))
    const input = screen.getByRole('textbox', { name: 'Commits, Ada' })
    await user.clear(input)
    await user.type(input, '40{Enter}')
    await waitFor(() => expect(cell(0, 2)).toHaveAttribute('data-edit', 'error'))
    expect(cell(0, 2)).toHaveTextContent('3')
    await waitFor(() =>
      expect(document.querySelector('[role=alert][aria-live=assertive]')).toHaveTextContent(
        "Couldn't save Commits for Ada. Commits are read-only today. The previous value is back.",
      ),
    )
  })

  test('Tab commits and moves to the next cell', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn()
    render(<Editable onCellEdit={onCellEdit} />)
    await user.dblClick(cell(0, 0))
    await user.type(screen.getByRole('textbox', { name: 'Name, Ada' }), 'x')
    await user.keyboard('{Tab}')
    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ value: 'Adax' }))
    expect(cell(0, 1)).toHaveFocus()
  })
})

describe('DataTable pagination', () => {
  const many = Array.from({ length: 23 }, (_, i) => ({ id: `p${i}`, name: `Person ${String(i + 1).padStart(2, '0')}`, team: 'Ops', commits: i }))

  test('pages through the rows with the range, the steps and the page size', async () => {
    const user = userEvent.setup()
    render(<Table rows={many} paginated initialState={{ pagination: { pageSize: 10 } }} />)
    const footer = document.querySelector('[data-slot=data-table-pagination]') as HTMLElement
    expect(footer).toHaveTextContent('1–10 of 23 rows')
    expect(within(footer).getByRole('button', { name: 'Previous page' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(within(footer).getByRole('button', { name: 'Next page' }))
    expect(footer).toHaveTextContent('11–20 of 23 rows')
    expect(names()[0]).toBe('Person 11')
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '12')
    await waitFor(() => expect(polite()).toBe('Page 2 of 3'))
    await user.click(within(footer).getByRole('button', { name: 'Last page' }))
    expect(footer).toHaveTextContent('21–23 of 23 rows')
    // Stays focusable at the end, so keyboard focus is not dropped.
    expect(within(footer).getByRole('button', { name: 'Last page' })).toHaveFocus()
    expect(within(footer).getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true')
  })

  test('changing the page size keeps the first row in view', async () => {
    const user = userEvent.setup()
    render(<Table rows={many} paginated initialState={{ pagination: { pageIndex: 2, pageSize: 10 } }} />)
    expect(names()[0]).toBe('Person 21')
    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    await user.click(await screen.findByRole('option', { name: '25' }))
    expect(names()).toHaveLength(23)
  })

  test('a page left past the end steps back', () => {
    const { rerender } = render(<Table rows={many} paginated initialState={{ pagination: { pageIndex: 2, pageSize: 10 } }} />)
    rerender(<Table rows={many.slice(0, 12)} paginated initialState={{ pagination: { pageIndex: 2, pageSize: 10 } }} />)
    expect(names()).toEqual(['Person 11', 'Person 12'])
  })

  test('sorting starts again from the first page', async () => {
    const user = userEvent.setup()
    render(<Table rows={many} paginated initialState={{ pagination: { pageIndex: 1, pageSize: 10 } }} />)
    await user.click(sortButton('Commits'))
    expect(names()[0]).toBe('Person 23')
  })
})

describe('DataTable server mode', () => {
  test('reports sorting and paging instead of doing them, and trusts rowCount', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    const onPaginationChange = vi.fn()
    const page = PEOPLE.slice(0, 2)
    render(
      <Table
        manual
        paginated
        rowCount={40}
        rows={page}
        state={{ pagination: { pageIndex: 0, pageSize: 2 }, sorting: [] }}
        onSortingChange={onSortingChange}
        onPaginationChange={onPaginationChange}
      />,
    )
    expect(grid()).toHaveAttribute('aria-rowcount', '41')
    expect(document.querySelector('[data-slot=data-table-pagination]')).toHaveTextContent('1–2 of 40 rows')
    await user.click(sortButton('Commits'))
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'commits', desc: true }])
    // Not sorted here: the server owns the order.
    expect(names()).toEqual(['Ada', 'Ben'])
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 1, pageSize: 2 })
  })

  test('loading with no rows shows skeleton rows hidden from assistive tech', () => {
    render(<Table rows={[]} loading />)
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    const busy = document.querySelector('[aria-busy=true]')
    expect(busy).toBeInTheDocument()
    expect(document.querySelectorAll('table[aria-hidden=true] tbody tr').length).toBeGreaterThan(0)
  })

  test('loading with rows keeps them, marks the grid busy and moves nothing', () => {
    const { rerender } = render(<Table />)
    rerender(<Table loading />)
    expect(grid()).toHaveAttribute('aria-busy', 'true')
    expect(bodyRows()).toHaveLength(5)
    expect(grid().querySelector('tbody')).toHaveAttribute('data-loading')
  })

  test('select all in server mode selects every matching row, minus the ones unticked', async () => {
    const user = userEvent.setup()
    const seen = vi.fn()
    render(
      <Table
        manual
        paginated
        rowCount={40}
        rows={PEOPLE.slice(0, 2)}
        state={{ pagination: { pageIndex: 0, pageSize: 2 } }}
        enableRowSelection
        bulkActions={(s) => {
          seen(s.count, s.allMatching, s.excludedIds)
          return null
        }}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }))
    await user.click(screen.getByRole('button', { name: 'Select all 40 rows' }))
    expect(seen).toHaveBeenLastCalledWith(40, true, [])
    await user.click(screen.getByRole('checkbox', { name: 'Select Ada' }))
    expect(seen).toHaveBeenLastCalledWith(39, true, ['a'])
  })
})

describe('DataTable states', () => {
  test('no rows shows the empty state; an error replaces the rows and offers a retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = render(<Table rows={[]} copy={{ noun: 'people' }} />)
    expect(screen.getByText('No people').closest('[role=status]')).toBeInTheDocument()
    rerender(<Table error="The directory is down." onRetry={onRetry} copy={{ noun: 'people' }} />)
    expect(screen.getByText("Couldn't load people").closest('[role=alert]')).toHaveTextContent("Couldn't load peopleThe directory is down.")
    expect(bodyRows()).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('density switches the row height', async () => {
    const user = userEvent.setup()
    render(<Table showDensityToggle />)
    const root = document.querySelector('[data-slot=data-table]') as HTMLElement
    expect(root).toHaveAttribute('data-density', 'standard')
    // Each density's height, times the UI scale (youj.css section 5).
    expect(root.style.getPropertyValue('--dt-row-h')).toBe('calc(40px * var(--yj-scale, 1))')
    await user.click(screen.getByRole('button', { name: 'Compact rows' }))
    expect(root).toHaveAttribute('data-density', 'compact')
    expect(root.style.getPropertyValue('--dt-row-h')).toBe('calc(32px * var(--yj-scale, 1))')
  })

  test('starts compact inside a compact layout density, unless it is given a density', () => {
    const tree = (props: Partial<DataTableProps<Person>>) => (
      <YoujProvider density="compact" scaling="90%">
        <Table {...props} />
      </YoujProvider>
    )
    const { unmount } = render(tree({}))
    expect(document.querySelector('[data-slot=data-table]')).toHaveAttribute('data-density', 'compact')
    unmount()
    render(tree({ defaultDensity: 'comfortable' }))
    expect(document.querySelector('[data-slot=data-table]')).toHaveAttribute('data-density', 'comfortable')
  })

  test('follows the layout density when it changes, until a density is picked', async () => {
    const user = userEvent.setup()
    const tree = (density: 'compact' | 'roomy') => (
      <YoujProvider density={density}>
        <Table showDensityToggle />
      </YoujProvider>
    )
    const { rerender } = render(tree('compact'))
    const root = () => document.querySelector('[data-slot=data-table]')
    expect(root()).toHaveAttribute('data-density', 'compact')
    rerender(tree('roomy'))
    expect(root()).toHaveAttribute('data-density', 'standard')
    await user.click(screen.getByRole('button', { name: 'Comfortable rows' }))
    rerender(tree('compact'))
    expect(root()).toHaveAttribute('data-density', 'comfortable')
  })

  test('marks itself for reduced motion', () => {
    render(<Table />)
    expect(document.querySelector('[data-slot=data-table]')).toHaveAttribute('data-reduced-motion')
  })

  test('unmounting with a save in flight is quiet', async () => {
    const user = userEvent.setup()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(
      <Table columns={[col.accessor('name', { header: 'Name', meta: { editor: { type: 'text' } } })]} onCellEdit={() => new Promise(() => {})} />,
    )
    await user.dblClick(within(bodyRows()[0]!).getAllByRole('gridcell')[0]!)
    await user.type(screen.getByRole('textbox'), '!{Enter}')
    unmount()
    await settle()
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})

describe('DataTable virtualization', () => {
  test('renders a window of 10,000 rows and counts them all', () => {
    // jsdom has no layout: give the scroll area the height it would have.
    const size = (el: HTMLElement) => (el.dataset.slot === 'data-table-scroll' ? 400 : 0)
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return size(this)
    })
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return size(this) * 2
    })
    const many = Array.from({ length: 10_000 }, (_, i) => ({ id: String(i), name: `Row ${i}`, team: 'x', commits: i }))
    render(<Table rows={many} virtualize height={400} enableRowSelection />)
    height.mockRestore()
    width.mockRestore()
    expect(grid()).toHaveAttribute('aria-rowcount', '10001')
    const rendered = grid().querySelectorAll('tbody tr[data-row-id]').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(60)
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument()
  })
})

describe('DataTable narrow frames', () => {
  const scrollEl = () => document.querySelector<HTMLElement>('[data-slot=data-table-scroll]')!
  const minWidth = () => scrollEl().closest<HTMLElement>('[style*="--dt-min-w"]')!.style.getPropertyValue('--dt-min-w')
  const cues = () => scrollEl().parentElement!.querySelectorAll(':scope > [aria-hidden]')
  const withName = (def: { size?: number; minSize?: number }) =>
    col.columns([col.accessor('name', { header: 'Name', meta: { grow: true }, ...def }), col.accessor('team', { header: 'Team', size: 120 })])

  test('a growing column without a minSize keeps 160px before the table scrolls', () => {
    render(<Table columns={withName({ size: 240 })} />)
    // The floor (160) plus Team (120), not the old 64 + 120.
    expect(minWidth()).toBe('280px')
  })

  test('its own larger minSize wins, and a size under the floor is the floor', () => {
    const { unmount } = render(<Table columns={withName({ size: 300, minSize: 200 })} />)
    expect(minWidth()).toBe('320px')
    unmount()
    render(<Table columns={withName({ size: 100 })} />)
    expect(minWidth()).toBe('220px')
  })

  test('a scroll cue shades each side that has no pinned column', () => {
    const { unmount } = render(<Table />)
    expect(cues()).toHaveLength(2)
    unmount()
    render(<Table initialState={{ columnPinning: { end: ['commits'] } }} />)
    expect(cues()).toHaveLength(1)
  })
})
