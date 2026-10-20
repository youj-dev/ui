'use client'

import { FlexRender, type Header, type RowData } from '@tanstack/react-table'
import type { DataTableFeatures } from '../../../components/ui/data-table'
import { cn } from '../../../lib/utils'
import { edgeShadow, pinStyle, type ColumnLayout } from './head'

/* The totals row, from each column's `footer`. It sticks to the bottom of the
 * scroll area, so the totals stay in view while the rows scroll under it; its
 * hairline is a shadow one pixel above, which lies exactly on the last row's
 * border until something scrolls beneath it. */
const footCell = cn(
  'sticky bottom-0 z-2 own:h-(--dt-head-h) own:bg-(--dt-head-bg) own:px-3 align-middle',
  'own:text-ui-sm own:font-medium own:text-fg truncate shadow-[0_-1px_0_var(--color-line)]',
)

const ALIGN = { start: 'own:text-start', center: 'own:text-center', end: 'own:text-end' } as const

export function FootRow<TData extends RowData>({
  headers,
  columns,
  fillerAt,
  ariaRowIndex,
}: {
  headers: ReadonlyArray<Header<DataTableFeatures, TData, unknown>>
  columns: readonly ColumnLayout[]
  fillerAt: number | null
  ariaRowIndex: number
}) {
  const cells = headers.map((header, i) => {
    const layout = columns[i]!
    return (
      <td
        key={header.id}
        role="gridcell"
        style={pinStyle(layout)}
        className={cn(
          footCell,
          ALIGN[layout.align],
          layout.numeric && 'own:tabular-nums',
          layout.pinned && 'z-3',
          layout.edgeStart && edgeShadow.start,
          layout.edgeEnd && edgeShadow.end,
        )}
      >
        {header.isPlaceholder || header.column.columnDef.footer === undefined ? null : <FlexRender footer={header} />}
      </td>
    )
  })
  if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" aria-hidden className={footCell} />)
  return (
    <tfoot data-slot="data-table-foot">
      <tr aria-rowindex={ariaRowIndex}>{cells}</tr>
    </tfoot>
  )
}
