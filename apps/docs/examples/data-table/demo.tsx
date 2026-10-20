'use client'

import { useState } from 'react'
import { useLocale } from '@youj/core'
import { Badge, Button, Table, TableBody, TableCell, TableHeader, TableRow } from '@youj/react'
import {
  DataTableColumnFilter,
  DataTableColumnHeader,
  DataTableFilterChips,
  DataTablePagination,
  DataTableSearch,
  DataTableSelectionBar,
  DataTableToolbar,
  DataTableViewOptions,
  createDataTableColumnHelper,
  createSelectColumn,
  dataTableFilterChips,
  useDataTable,
} from '@youj/react/data-table'

type Status = 'todo' | 'in-progress' | 'done' | 'canceled'
interface Task {
  id: string
  title: string
  status: Status
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  estimate: number
}

const STATUS = {
  todo: { label: 'Todo', variant: 'secondary' },
  'in-progress': { label: 'In progress', variant: 'default' },
  done: { label: 'Done', variant: 'success' },
  canceled: { label: 'Canceled', variant: 'outline' },
} as const

const TITLES = ['Fix the sign-in redirect', 'Debounce the search query', 'Add passkeys', 'Write the migration guide', 'Cache the read API', 'Dark mode for charts']
const STATUSES = Object.keys(STATUS) as Status[]
const PRIORITIES: Task['priority'][] = ['Urgent', 'High', 'Medium', 'Low']
const TASKS: Task[] = Array.from({ length: 24 }, (_, i) => ({
  id: `TSK-${1040 + i}`,
  title: TITLES[i % TITLES.length]!,
  status: STATUSES[(i * 7) % STATUSES.length]!,
  priority: PRIORITIES[(i * 3) % PRIORITIES.length]!,
  estimate: 1 + ((i * 5) % 13),
}))

const col = createDataTableColumnHelper<Task>()
const columns = [
  createSelectColumn<Task>({ label: (task) => task.id }),
  ...col.columns([
    col.accessor('id', { header: 'Task', size: 110, meta: { cellClassName: 'font-mono text-ui-sm text-fg-muted' } }),
    col.accessor('title', { header: 'Title', size: 280 }),
    col.accessor('status', {
      header: 'Status',
      size: 140,
      cell: (ctx) => <Badge variant={STATUS[ctx.getValue()].variant}>{STATUS[ctx.getValue()].label}</Badge>,
      meta: { filter: { type: 'select', options: STATUSES.map((value) => ({ value, label: STATUS[value].label })) } },
    }),
    col.accessor('priority', { header: 'Priority', size: 120, meta: { filter: { type: 'select' } } }),
    col.accessor('estimate', { header: 'Estimate', size: 110, cell: (ctx) => `${ctx.getValue()} pt`, meta: { numeric: true } }),
  ]),
]

export default function DataTableParts() {
  const locale = useLocale()
  const [rows, setRows] = useState(TASKS)
  // The table keeps its own state (sort, filters, search, selection, pages); pass `state` for any slice you own.
  const table = useDataTable({ data: rows, columns, getRowId: (task) => task.id, initialState: { pagination: { pageIndex: 0, pageSize: 8 } } })
  const selected = Object.keys(table.state.rowSelection)

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTableToolbar actions={<DataTableViewOptions table={table} />}>
        <DataTableSearch table={table} placeholder="Search tasks…" />
        <DataTableColumnFilter column={table.getColumn('status')!} />
        <DataTableColumnFilter column={table.getColumn('priority')!} />
      </DataTableToolbar>
      <DataTableFilterChips
        chips={dataTableFilterChips(table, locale)}
        onClearAll={() => {
          table.resetColumnFilters(true)
          table.setGlobalFilter('')
        }}
      />
      <div className="relative overflow-clip rounded-xl border border-line bg-surface">
        <Table aria-label="Tasks">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <DataTableColumnHeader key={header.id} header={header} style={{ width: header.getSize() }} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t border-line">
          <DataTablePagination table={table} noun="tasks" />
        </div>
        <DataTableSelectionBar count={selected.length} noun="tasks" onClear={() => table.resetRowSelection()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRows((list) => list.filter((task) => !selected.includes(task.id)))
              table.resetRowSelection()
            }}
          >
            Delete
          </Button>
        </DataTableSelectionBar>
      </div>
    </div>
  )
}
