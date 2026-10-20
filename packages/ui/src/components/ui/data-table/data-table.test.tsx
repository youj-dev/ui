import { render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DataTablePagination, DataTableSelectionBar, useDataTable } from '.'
import { TasksTable, makeTasks, taskColumns } from './data-table.fixtures'

/* The kit's parts, composed the way an app composes them (data-table.fixtures):
 * each part reads and writes the TanStack table it's given. */

function renderTasks(props: Parameters<typeof TasksTable>[0] = {}) {
  const user = userEvent.setup()
  render(
    <YoujProvider reducedMotion="always">
      <TasksTable {...props} />
    </YoujProvider>,
  )
  return user
}

const bodyRows = () => within(screen.getByRole('table', { name: 'Tasks' })).getAllByRole('row').slice(1)
const firstIds = (n: number) => bodyRows().slice(0, n).map((row) => within(row).getAllByRole('cell')[1]!.textContent)

describe('DataTableColumnHeader', () => {
  test('its label sorts the column, and the header says how', async () => {
    const user = renderTasks()
    const header = screen.getByRole('columnheader', { name: 'Title' })
    expect(header).not.toHaveAttribute('aria-sort')
    await user.click(within(header).getByRole('button', { name: 'Title' }))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    await user.click(within(header).getByRole('button', { name: 'Title' }))
    expect(header).toHaveAttribute('aria-sort', 'descending')
  })

  test('Alt+Down opens the column menu, which sorts and hides the column', async () => {
    const user = renderTasks()
    within(screen.getByRole('columnheader', { name: 'Title' })).getByRole('button', { name: 'Title' }).focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: /Sort ascending/ })).toBeInTheDocument()
    await user.click(within(menu).getByRole('menuitem', { name: /Hide/ }))
    await waitFor(() => expect(screen.queryByRole('columnheader', { name: 'Title' })).not.toBeInTheDocument())
  })

  test('a right-click opens the menu too', async () => {
    const user = renderTasks()
    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('columnheader', { name: 'Priority' }) })
    expect(await screen.findByRole('menu')).toBeInTheDocument()
  })
})

describe('useDataTable', () => {
  test("a numeric column's cells line up with its header, in tabular figures, with nothing wired", () => {
    renderTasks()
    const header = screen.getByRole('columnheader', { name: /Estimate/ })
    const estimate = within(bodyRows()[0]!).getByText(/ pt$/)
    expect(header).toHaveClass('own:text-end')
    expect(estimate).toHaveClass('own:text-end', 'own:tabular-nums')
    expect(within(bodyRows()[0]!).getAllByRole('cell')[2]).not.toHaveClass('own:text-end')
  })

  test('paginate={false} hands every row to the row model, past the default page size', () => {
    const data = makeTasks(24)
    const paged = renderHook(() => useDataTable({ data, columns: taskColumns, getRowId: (task) => task.id }))
    expect(paged.result.current.getRowModel().rows).toHaveLength(10)
    const all = renderHook(() => useDataTable({ data, columns: taskColumns, getRowId: (task) => task.id, paginate: false }))
    expect(all.result.current.getRowModel().rows).toHaveLength(24)
  })
})

describe('filters, search and chips', () => {
  test('a value filter lists each value with its count, narrows the rows and adds a chip', async () => {
    const user = renderTasks({ rows: makeTasks(24) })
    const done = makeTasks(24).filter((task) => task.status === 'done').length
    const toolbar = document.querySelector<HTMLElement>('[data-slot=data-table-toolbar]')!
    await user.click(within(toolbar).getByRole('button', { name: 'Status' }))
    // The list opens in a popover: give it time on a loaded machine.
    const option = await screen.findByRole('option', { name: new RegExp(`Done\\s*${done}`) }, { timeout: 5000 })
    await user.click(option)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(bodyRows()).toHaveLength(Math.min(10, done)), { timeout: 5000 })
    const chips = await screen.findByRole('group', { name: 'Active filters' }, { timeout: 5000 })
    await user.click(within(chips).getByRole('button', { name: /Remove .*Status/ }))
    await waitFor(() => expect(bodyRows()).toHaveLength(10), { timeout: 5000 })
  })

  test('the search filters every column on Enter, and Escape clears it', async () => {
    const user = renderTasks()
    const search = screen.getByRole('searchbox')
    await user.type(search, 'passkeys{Enter}')
    expect(bodyRows().every((row) => row.textContent?.includes('Add passkeys'))).toBe(true)
    await user.keyboard('{Escape}')
    expect(bodyRows()).toHaveLength(10)
  })
})

describe('createSelectColumn and DataTableSelectionBar', () => {
  test('the header checkbox selects the page, the bar counts it, and Escape in the bar clears it', async () => {
    const user = renderTasks()
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }))
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    expect(bar).toHaveTextContent('10')
    await user.click(within(bar).getByRole('button', { name: 'Clear selection' }))
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Selection actions' })).not.toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: 'Select all rows on this page' })).not.toBeChecked()
  })

  test('a row checkbox is named for its row, and the bar acts on the selection', async () => {
    const onDelete = vi.fn()
    const user = renderTasks({ onDelete })
    await user.click(screen.getByRole('checkbox', { name: 'Select TSK-1041' }))
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(['TSK-1041'])
  })

  test('with the page selected and more beyond it, the bar offers every row', async () => {
    const onSelectAll = vi.fn()
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <div className="relative">
          <DataTableSelectionBar count={25} total={1204} noun="orders" canSelectAll onSelectAll={onSelectAll} onClear={() => {}} />
        </div>
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Select all 1,204 orders' }))
    expect(onSelectAll).toHaveBeenCalled()
  })
})

describe('DataTablePagination', () => {
  test('from a table: the range, and steps that stay focusable at the ends', async () => {
    const user = renderTasks()
    const nav = screen.getByRole('navigation', { name: 'Pagination' })
    expect(screen.getByText(/of 24 tasks/)).toBeInTheDocument()
    const previous = within(nav).getByRole('button', { name: 'Previous page' })
    expect(previous).toHaveAttribute('aria-disabled', 'true')
    await user.click(within(nav).getByRole('button', { name: 'Next page' }))
    expect(firstIds(1)).toEqual(['TSK-1050'])
  })

  test('from values: it reports the page and the size it was asked for', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <DataTablePagination pageIndex={0} pageSize={25} pageCount={4} rowCount={90} onPageChange={onPageChange} onPageSizeChange={() => {}} noun="orders" />
      </YoujProvider>,
    )
    expect(screen.getByText(/of 90 orders/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Last page' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
