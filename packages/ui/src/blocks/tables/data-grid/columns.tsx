'use client'

import { createColumnHelper, type RowData } from '@tanstack/react-table'
import { columnMaker } from './column-kit'
import { figureColumns } from './figure-columns'
import type { DataGridFeatures } from './model'
import { recordColumns } from './record-columns'

export type { DataGridColumnOptions, DataGridStatusOptions } from './column-kit'

/* The column types. Each is a TanStack column definition with the grid's
 * defaults for that kind of value: how it draws, sorts, searches, filters,
 * groups, totals, loads and sits on a card. Any of them takes `render` to
 * draw the cell yourself while keeping the rest, and `meta` to change any
 * default. For anything else, `accessor` and `display` are TanStack's own. */
export function createDataGridColumns<TData extends RowData>() {
  const helper = createColumnHelper<DataGridFeatures, TData>()
  const make = columnMaker(helper)
  return {
    /** TanStack's own accessor column, for anything the types don't cover. */
    accessor: helper.accessor,
    /** TanStack's own display column (no value). */
    display: helper.display,
    ...recordColumns(make),
    ...figureColumns(make),
  }
}
