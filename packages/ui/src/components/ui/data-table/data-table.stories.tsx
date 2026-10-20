import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { TrashIcon } from '@youj/icons'
import { Button } from '../button'
import { DataTableConfirmAction, DataTablePagination, DataTableSelectionBar } from '.'
import { TasksTable, makeTasks } from './data-table.fixtures'

const meta: Meta<typeof TasksTable> = {
  title: 'UI/Data/Data table kit',
  component: TasksTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The parts a data table on TanStack Table v9 is built from: a column header that sorts, pins, moves, hides and resizes its column, a toolbar with a search, filters with counts and their chips, the columns menu, pagination, a checkbox column and the bar a selection raises. Compose them with `useTable` and the Table parts for a table of your own; the complete tables are blocks (Blocks → Data tables), built from the same parts.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TasksTable>

/** A table composed from the parts: search, two value filters with counts, chips, sortable headers with their menus, the columns menu, pages and the selection bar. */
export const Composed: Story = {
  render: () => {
    const [rows, setRows] = useState(() => makeTasks())
    return <TasksTable rows={rows} onDelete={(ids) => setRows((list) => list.filter((task) => !ids.includes(task.id)))} />
  },
}

/** The pagination on its own: the range, rows per page and the steps, driven by values rather than a table. */
export const Pagination: Story = {
  render: () => {
    const [page, setPage] = useState(2)
    const [size, setSize] = useState(25)
    return (
      <div className="max-w-3xl rounded-xl border border-line bg-surface">
        <DataTablePagination pageIndex={page} pageSize={size} pageCount={Math.ceil(1204 / size)} rowCount={1204} noun="orders" onPageChange={setPage} onPageSizeChange={setSize} />
      </div>
    )
  },
}

/** The selection bar over a table's lower edge, with a confirmed destructive action that names the count. */
export const SelectionBar: Story = {
  render: () => {
    const [count, setCount] = useState(12)
    return (
      <div className="relative h-56 max-w-3xl overflow-clip rounded-xl border border-line bg-surface">
        <div className="p-4">
          <Button variant="outline" size="sm" onClick={() => setCount((n) => n + 1)}>
            Select one more
          </Button>
        </div>
        <DataTableSelectionBar count={count} total={1204} noun="orders" canSelectAll onSelectAll={() => setCount(1204)} onClear={() => setCount(0)}>
          <DataTableConfirmAction label="Delete" icon={<TrashIcon />} count={count} noun="orders" onConfirm={() => setCount(0)} />
        </DataTableSelectionBar>
      </div>
    )
  },
}

/** The composed table straight in a plain CSS grid, laid out wide and then held to a 390px phone: the toolbar wraps, the table scrolls sideways in its own frame, and nothing holds the page wider than the screen. */
export const PhoneGrid: Story = {
  name: 'In a phone-width grid',
  render: () => (
    <div data-testid="frame" className="grid w-[900px] gap-4">
      <TasksTable />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid=frame]')!
    frame.style.width = '390px'
    await waitFor(() => expect(frame.scrollWidth).toBeLessThanOrEqual(390))
    for (const slot of ['data-table-toolbar', 'table-container', 'data-table-pagination']) {
      expect(frame.querySelector(`[data-slot=${slot}]`)!.getBoundingClientRect().width).toBeLessThanOrEqual(390)
    }
  },
}
