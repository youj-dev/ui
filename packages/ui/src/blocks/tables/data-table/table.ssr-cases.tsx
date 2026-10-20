import type { ReactElement } from 'react'
import { YoujProvider } from '@youj/core'
import { createRowActionsColumn } from '../../../components/ui/data-table'
import { createDataTableColumnHelper, type DataTableColumnDef } from '../../../components/ui/data-table'
import type { DataTableView } from '../../../components/ui/data-table'
import { DataTable } from '../data-table'

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * data-table-ssr.test.tsx. Fixed data (no clock), so both sides agree. */

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
]

const col = createDataTableColumnHelper<Person>()
const COLUMNS: DataTableColumnDef<Person>[] = [
  ...col.columns([
    col.accessor('name', { header: 'Name' }),
    col.accessor('team', { header: 'Team', meta: { filter: { type: 'select' } } }),
    col.accessor('commits', { header: 'Commits', meta: { numeric: true, filter: { type: 'number-range', min: 0, max: 10 } } }),
  ]),
  createRowActionsColumn<Person>({ label: (p) => p.name, actions: () => [{ label: 'Rename', onSelect: () => {} }] }),
]

const VIEWS: DataTableView[] = [
  {
    id: 'design',
    name: 'Design',
    state: {
      sorting: [],
      columnFilters: [{ id: 'team', value: ['Design'] }],
      globalFilter: '',
      columnVisibility: {},
      columnOrder: [],
      columnPinning: { start: [], end: ['actions'] },
      density: 'standard',
    },
  },
]

export const cases: Record<string, () => ReactElement> = {
  DataTable: () => (
    <YoujProvider>
      <DataTable<Person> label="People" rows={PEOPLE} columns={COLUMNS} getRowId={(p) => p.id} enableRowSelection exportable />
    </YoujProvider>
  ),
  'DataTable filtered, with views and search': () => (
    <YoujProvider>
      <DataTable<Person>
        label="People"
        rows={PEOPLE}
        columns={COLUMNS}
        getRowId={(p) => p.id}
        search
        views={VIEWS}
        defaultActiveViewId="design"
        initialState={{ columnFilters: [{ id: 'team', value: ['Design'] }], columnPinning: { end: ['actions'] } }}
        toolbar={<h2>People</h2>}
      />
    </YoujProvider>
  ),
  'DataTable loading': () => (
    <YoujProvider>
      <DataTable<Person> label="People" rows={[]} columns={COLUMNS} loading />
    </YoujProvider>
  ),
  'DataTable virtualized': () => (
    <YoujProvider>
      <DataTable<Person> label="People" rows={PEOPLE} columns={COLUMNS} getRowId={(p) => p.id} virtualize height={320} />
    </YoujProvider>
  ),
}
