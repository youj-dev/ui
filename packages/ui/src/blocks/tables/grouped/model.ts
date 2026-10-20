import { useMemo, useState } from 'react'
import {
  aggregationFn_sum,
  columnGroupingFeature,
  createColumnHelper,
  createExpandedRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  rowAggregationFeature,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ExpandedState,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import type { GroupedTableGrouping, GroupedTableLine } from './data'

/* TanStack Table does the hard part: it gathers the lines into groups (one
 * level or two), sums each group's money on the way up, sorts inside every
 * level and flattens what's open into the rows to draw. */
const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowAggregationFeature,
  aggregationFns: { sum: aggregationFn_sum },
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic },
})

export type GroupedRow = Row<typeof features, GroupedTableLine>
export type GroupedSortable = 'name' | 'budget' | 'actual' | 'variance' | 'used'

/** A row's name: a group's value, or a line's name. */
export const rowName = (row: GroupedRow) => (row.getIsGrouped() ? String(row.groupingValue) : row.original.name)
export const money = (row: GroupedRow) => {
  const budget = row.getValue<number>('budget')
  const actual = row.getValue<number>('actual')
  return { budget, actual, variance: actual - budget, used: budget > 0 ? actual / budget : 0 }
}

const col = createColumnHelper<typeof features, GroupedTableLine>()
const columns = col.columns([
  col.accessor('name', { sortFn: (a, b) => rowName(a).localeCompare(rowName(b)) }),
  col.accessor('group', {}),
  col.accessor('subgroup', {}),
  col.accessor('category', {}),
  col.accessor('owner', {}),
  col.accessor('budget', { aggregationFn: 'sum', sortFn: 'basic', sortDescFirst: true }),
  col.accessor('actual', { aggregationFn: 'sum', sortFn: 'basic', sortDescFirst: true }),
  col.accessor((line) => line.actual - line.budget, { id: 'variance', aggregationFn: 'sum', sortFn: 'basic', sortDescFirst: true }),
  // A group's share is its sums' ratio, not a sum of ratios.
  col.accessor((line) => line.actual / line.budget, { id: 'used', sortFn: (a, b) => money(a).used - money(b).used, sortDescFirst: true }),
])

/** What's open at first: a grouping that starts open shows its first level's subtotals; the other groupings start folded. */
function opening(grouping: GroupedTableGrouping, lines: readonly GroupedTableLine[]): ExpandedState {
  const first = grouping.by[0]
  if (!grouping.open || !first) return {}
  if (grouping.open === 'all') return true
  return Object.fromEntries([...new Set(lines.map((line) => line[first]))].map((value) => [`${first}:${value}`, true]))
}

export function useGrouped(lines: GroupedTableLine[], grouping: GroupedTableGrouping) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>(() => opening(grouping, lines))
  // A new grouping folds back to its opening state.
  const [shownGrouping, setShownGrouping] = useState(grouping.id)
  if (shownGrouping !== grouping.id) {
    setShownGrouping(grouping.id)
    setExpanded(opening(grouping, lines))
  }
  const table = useTable({
    features,
    data: lines,
    columns,
    getRowId: (line) => line.id,
    state: { grouping: grouping.by, expanded, sorting },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    groupedColumnMode: false,
    autoResetExpanded: false,
  })
  const rows = table.getRowModel().rows
  const totals = useMemo(() => {
    const budget = lines.reduce((sum, line) => sum + line.budget, 0)
    const actual = lines.reduce((sum, line) => sum + line.actual, 0)
    return { budget, actual, variance: actual - budget, used: budget > 0 ? actual / budget : 0 }
  }, [lines])
  return { table, rows, sorting, setSorting, expanded, setExpanded, totals, canExpand: grouping.by.length > 0 }
}
