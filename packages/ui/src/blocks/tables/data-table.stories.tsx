import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ThemeInput } from '@youj/core'
import { Badge } from '../../components/ui/badge'
import { createDataTableColumnHelper, type DataTableView } from '../../components/ui/data-table'
import { DataTable, type DataTableCellEdit, type DataTableState } from './data-table'
import { NOW, makeOrders, orderColumns, type Order } from './data-table.fixtures'

const meta: Meta<typeof DataTable> = {
  title: 'Blocks/Tables/Data Table',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The complete dense table, for records people scan, compare and manage: your columns and rows with search, filters as chips, saved views, selection with bulk actions, inline editing, CSV export, server mode and virtualization. Rows glide when the sort changes, the selection bar rises with a rolling count, skeleton rows resolve into data, and the grid is one Tab stop driven by the arrow keys.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DataTable>

/** The block as it installs: 48 deployments with a status filter, a duration range, search, selection with Redeploy and Delete, row menus and CSV export. */
export const Default: Story = {}

const orders = makeOrders(64)
const views: DataTableView[] = [
  {
    id: 'refunds',
    name: 'Refunds',
    state: { sorting: [{ id: 'total', desc: true }], columnFilters: [{ id: 'status', value: ['refunded'] }], globalFilter: '', columnVisibility: {}, columnOrder: [], columnPinning: { start: [], end: [] }, density: 'standard' },
  },
]

/** Your rows and columns: 64 orders with their own filters and a saved view, fed through `rows`, `columns` and `views`, with `copy.noun` naming them. */
export const WithYourData: Story = {
  args: {
    rows: orders,
    columns: orderColumns() as never,
    getRowId: (order) => (order as Order).id,
    getRowLabel: (order) => (order as Order).number,
    title: 'Orders',
    description: `Placed through ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(NOW)}`,
    enableRowSelection: true,
    search: { placeholder: 'Search orders…' },
    views,
    exportable: { filename: 'orders' },
    copy: { noun: 'orders' },
    initialState: { pagination: { pageSize: 10 } },
  },
}

type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer'
interface Member {
  id: string
  name: string
  email: string
  role: Role
  projects: number
}
const ROLES: Role[] = ['Owner', 'Admin', 'Member', 'Viewer']
const member = createDataTableColumnHelper<Member>()
const memberColumns = member.columns([
  member.accessor('name', { header: 'Name', size: 160, minSize: 140, meta: { grow: true, editor: { type: 'text', maxLength: 40 }, validate: (value) => (String(value).trim() ? null : 'A name is required') } }),
  member.accessor('email', { header: 'Email', size: 200, meta: { cellClassName: 'text-fg-muted' } }),
  member.accessor('role', { header: 'Role', size: 128, meta: { editor: { type: 'select', options: ROLES.map((role) => ({ value: role, label: role })) } } }),
  member.accessor('projects', { header: 'Projects', size: 120, meta: { numeric: true, editor: { type: 'number', min: 0, max: 50, step: 1 } } }),
])
const MEMBERS: Member[] = [
  { id: 'u1', name: 'Priya Raman', email: 'priya@acme.dev', role: 'Owner', projects: 12 },
  { id: 'u2', name: 'Jonas Weber', email: 'jonas@acme.dev', role: 'Admin', projects: 8 },
  { id: 'u3', name: 'Ana Lima', email: 'ana@acme.dev', role: 'Member', projects: 5 },
  { id: 'u4', name: 'Kenji Sato', email: 'kenji@acme.dev', role: 'Member', projects: 3 },
  { id: 'u5', name: 'Sara Okafor', email: 'sara@acme.dev', role: 'Viewer', projects: 1 },
]

function EditingTable({ theme }: { theme?: ThemeInput }) {
  const [members, setMembers] = useState(MEMBERS)
  // The value shows at once while this runs. A rejection rolls the cell back, with its reason.
  const save = ({ rowId, columnId, value }: DataTableCellEdit<Member>) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        const owners = members.filter((m) => m.role === 'Owner' && m.id !== rowId)
        if (columnId === 'role' && value !== 'Owner' && owners.length === 0) return reject(new Error('A team needs at least one owner.'))
        setMembers((list) => list.map((m) => (m.id === rowId ? { ...m, [columnId]: value } : m)))
        resolve()
      }, 600),
    )
  return (
    <DataTable
      theme={theme}
      title="Team members"
      description="Double-click a cell, or focus it and press Enter. A team keeps at least one owner."
      rows={members}
      columns={memberColumns}
      getRowId={(m) => m.id}
      getRowLabel={(m) => m.name}
      paginated={false}
      showDensityToggle={false}
      showColumnsMenu={false}
      onCellEdit={save}
      copy={{ noun: 'members' }}
    />
  )
}

/** Cells that edit in place: Enter, F2, a double click or typing starts; each save takes 600 ms, and demoting the last owner is refused and rolls back. */
export const InlineEditing: Story = { render: (args) => <EditingTable theme={args.theme} /> }

/** The first load: skeleton rows in each column's shape, under the real header. */
export const Loading: Story = { args: { rows: [], columns: orderColumns() as never, loading: true, title: 'Orders', copy: { noun: 'orders' } } }

/** Nothing yet: the empty state names the rows. */
export const Empty: Story = { args: { rows: [], columns: orderColumns() as never, title: 'Orders', copy: { noun: 'orders' } } }

/** A failed load: the error panel replaces the rows, with Try again. */
export const LoadError: Story = {
  args: { rows: [], columns: orderColumns() as never, title: 'Orders', error: 'The orders service timed out after 30 seconds.', onRetry: () => {}, copy: { noun: 'orders' } },
}

interface Build {
  id: string
  project: string
  status: 'Ready' | 'Error'
  duration: number
}
const PROJECTS = ['acme-web', 'acme-docs', 'orion', 'orion-api', 'lumen', 'status-page']
const BUILDS: Build[] = Array.from({ length: 240 }, (_, i) => ({ id: `bld_${String(9000 - i)}`, project: PROJECTS[(i * 7) % PROJECTS.length]!, status: i % 9 === 4 ? 'Error' : 'Ready', duration: 20 + ((i * 37) % 130) }))
type Query = Pick<DataTableState, 'sorting' | 'pagination' | 'columnFilters' | 'globalFilter'>
function fetchBuilds({ sorting, pagination, columnFilters, globalFilter }: Query) {
  const status = columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined
  let rows = BUILDS.filter((b) => (!status || status.includes(b.status)) && `${b.id} ${b.project}`.includes(globalFilter.toLowerCase()))
  const [sort] = sorting
  if (sort) {
    const key = sort.id as keyof Build
    rows = [...rows].sort((a, b) => (a[key] === b[key] ? 0 : a[key] > b[key] ? 1 : -1) * (sort.desc ? -1 : 1))
  }
  const start = pagination.pageIndex * pagination.pageSize
  return new Promise<{ rows: Build[]; total: number }>((resolve) => setTimeout(() => resolve({ rows: rows.slice(start, start + pagination.pageSize), total: rows.length }), 450))
}
const build = createDataTableColumnHelper<Build>()
const buildColumns = build.columns([
  build.accessor('id', { header: 'Build', size: 140, meta: { cellClassName: 'font-mono text-ui-sm' } }),
  build.accessor('project', { header: 'Project', size: 180, meta: { grow: true } }),
  build.accessor('status', {
    header: 'Status',
    size: 120,
    cell: (ctx) => <Badge variant={ctx.getValue() === 'Ready' ? 'success' : 'danger'}>{ctx.getValue()}</Badge>,
    meta: { filter: { type: 'select', options: [{ value: 'Ready', label: 'Ready' }, { value: 'Error', label: 'Error' }] } },
  }),
  build.accessor('duration', { header: 'Duration', size: 110, cell: (ctx) => `${ctx.getValue()}s`, meta: { numeric: true } }),
])

function ServerTable({ theme }: { theme?: ThemeInput }) {
  const [query, setQuery] = useState<Query>({ sorting: [], pagination: { pageIndex: 0, pageSize: 10 }, columnFilters: [], globalFilter: '' })
  const [page, setPage] = useState<{ rows: Build[]; total: number }>({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const latest = useRef(0)
  useEffect(() => {
    const request = ++latest.current
    void fetchBuilds(query).then((result) => {
      // Drop answers to queries that were already replaced.
      if (request !== latest.current) return
      setPage(result)
      setLoading(false)
    })
  }, [query])
  const set =
    <K extends keyof Query>(key: K) =>
    (value: Query[K]) => {
      setLoading(true)
      setQuery((q) => ({ ...q, [key]: value, ...(key === 'pagination' ? {} : { pagination: { ...q.pagination, pageIndex: 0 } }) }))
    }
  return (
    <DataTable
      theme={theme}
      title="Builds"
      manual
      rows={page.rows}
      rowCount={page.total}
      columns={buildColumns}
      getRowId={(b) => b.id}
      loading={loading}
      state={query}
      onSortingChange={set('sorting')}
      onPaginationChange={set('pagination')}
      onColumnFiltersChange={set('columnFilters')}
      onGlobalFilterChange={set('globalFilter')}
      search={{ placeholder: 'Search builds…', debounce: 300 }}
      pageSizeOptions={[10, 25, 50]}
      showDensityToggle={false}
      copy={{ noun: 'builds' }}
    />
  )
}

/** Server mode: sorting, filtering and paging go through a request with 450 ms of latency; answers to replaced queries are dropped. */
export const ServerMode: Story = { render: (args) => <ServerTable theme={args.theme} /> }

interface Request {
  id: string
  time: string
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  status: number
  ms: number
}
const PATHS = ['/', '/pricing', '/api/deployments', '/api/domains', '/api/checkout', '/docs/install', '/api/webhooks/git', '/blog/launch-week']
const METHODS: Request['method'][] = ['GET', 'GET', 'GET', 'GET', 'POST', 'DELETE']
const LOG: Request[] = Array.from({ length: 10_000 }, (_, i) => {
  const seconds = 43_200 - i * 4
  return {
    id: `req_${i}`,
    time: `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`,
    method: METHODS[(i * 5) % METHODS.length]!,
    path: PATHS[(i * 3 + (i >> 4)) % PATHS.length]!,
    status: i % 53 === 0 ? 500 : i % 17 === 0 ? 404 : 200,
    ms: 8 + ((i * 7919) % 340),
  }
})
const request = createDataTableColumnHelper<Request>()
const requestColumns = request.columns([
  request.accessor('time', { header: 'Time', size: 104, meta: { cellClassName: 'font-mono text-ui-sm text-fg-muted' } }),
  request.accessor('method', { header: 'Method', size: 96, meta: { cellClassName: 'font-mono text-ui-sm' } }),
  request.accessor('path', { header: 'Path', size: 220, meta: { grow: true, cellClassName: 'font-mono text-ui-sm' } }),
  request.accessor('status', {
    header: 'Status',
    size: 96,
    cell: (ctx) => <Badge variant={ctx.getValue() >= 500 ? 'danger' : ctx.getValue() >= 400 ? 'warning' : 'secondary'}>{ctx.getValue()}</Badge>,
    meta: { skeleton: 'badge' },
  }),
  request.accessor('ms', { header: 'Duration', size: 104, cell: (ctx) => `${ctx.getValue()} ms`, meta: { numeric: true } }),
])

/** Ten thousand requests, virtualized: only the rows in view are in the page, and the keyboard reaches every one. */
export const Virtualized: Story = {
  args: { rows: LOG as never, columns: requestColumns as never, getRowId: (r) => (r as Request).id, title: 'Requests', virtualize: true, height: 440, enableRowSelection: true, defaultDensity: 'compact', copy: { noun: 'requests' } },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the table alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }
