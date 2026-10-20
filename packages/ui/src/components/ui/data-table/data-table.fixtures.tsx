import { useLocale } from '@youj/core'
import { Badge } from '../badge'
import { Button } from '../button'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../table'
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
  type DataTableColumnDef,
} from '.'

/* Story and test data: a table composed from the kit's parts, the way an app
 * builds its own. Not part of the kit's API. */

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'canceled'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  estimate: number
}

const STATUS: Record<TaskStatus, { label: string; variant: 'secondary' | 'default' | 'success' | 'outline' }> = {
  todo: { label: 'Todo', variant: 'secondary' },
  'in-progress': { label: 'In progress', variant: 'default' },
  done: { label: 'Done', variant: 'success' },
  canceled: { label: 'Canceled', variant: 'outline' },
}

const TITLES = [
  'Fix the sign-in redirect',
  'Debounce the search query',
  'Add passkeys',
  'Write the migration guide',
  'Cache the read API',
  'Dark mode for charts',
  'Export invoices as CSV',
  'Audit focus rings',
  'Rate limit the webhooks',
  'Translate the onboarding',
  'Shrink the bundle',
  'Retry failed payments',
]

export function makeTasks(count = 24): Task[] {
  let seed = 5
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const statuses = Object.keys(STATUS) as TaskStatus[]
  const priorities: Task['priority'][] = ['Urgent', 'High', 'Medium', 'Low']
  return Array.from({ length: count }, (_, i) => ({
    id: `TSK-${1040 + i}`,
    title: TITLES[i % TITLES.length]!,
    status: statuses[Math.floor(next() * statuses.length)]!,
    priority: priorities[Math.floor(next() * priorities.length)]!,
    estimate: 1 + Math.floor(next() * 13),
  }))
}

const col = createDataTableColumnHelper<Task>()
export const taskColumns: DataTableColumnDef<Task>[] = [
  createSelectColumn<Task>({ label: (task) => task.id }),
  ...col.columns([
    col.accessor('id', { header: 'Task', size: 110, meta: { cellClassName: 'font-mono text-ui-sm text-fg-muted' } }),
    col.accessor('title', { header: 'Title', size: 280, meta: { grow: true } }),
    col.accessor('status', {
      header: 'Status',
      size: 140,
      cell: (ctx) => <Badge variant={STATUS[ctx.getValue()].variant}>{STATUS[ctx.getValue()].label}</Badge>,
      meta: { filter: { type: 'select', options: (Object.keys(STATUS) as TaskStatus[]).map((value) => ({ value, label: STATUS[value].label })) } },
    }),
    col.accessor('priority', { header: 'Priority', size: 120, meta: { filter: { type: 'select' } } }),
    col.accessor('estimate', { header: 'Estimate', size: 110, cell: (ctx) => `${ctx.getValue()} pt`, meta: { numeric: true } }),
  ]),
]

/** A table built from the kit: TanStack's useTable with the kit's features, the Table parts, and the kit's toolbar, header, pagination and selection bar. */
const TASKS = makeTasks()

export function TasksTable({ rows = TASKS, onDelete }: { rows?: Task[]; onDelete?: (ids: string[]) => void }) {
  const locale = useLocale()
  // The table keeps its own state (sort, filters, search, selection, pages); pass `state` for any slice you own.
  const table = useDataTable({ data: rows, columns: taskColumns, getRowId: (task) => task.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } })
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
              onDelete?.(selected)
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
