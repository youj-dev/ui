import { useMemo } from 'react'
import type { RowData } from '@tanstack/react-table'
import { dataTableColumnAlign, type DataTableColumn, type DataTableDensity, type DataTableInstance } from '../../../components/ui/data-table'
import { cn } from '../../../lib/utils'
import type { ColumnLayout } from './head'

/* Surfaces are opaque mixes into the card, so pinned cells and rows crossing
 * mid-sort cover what is under them. */
export const surfaceTokens = cn(
  '[--dt-row-bg:var(--color-surface)]',
  '[--dt-row-hover:color-mix(in_oklab,var(--color-surface),var(--color-fg)_3.5%)]',
  '[--dt-row-selected:color-mix(in_oklab,var(--color-surface),var(--color-accent)_8%)]',
  '[--dt-row-selected-hover:color-mix(in_oklab,var(--color-surface),var(--color-accent)_11%)]',
  '[--dt-row-busy:color-mix(in_oklab,var(--color-surface),var(--color-fg)_4%)]',
  '[--dt-head-bg:color-mix(in_oklab,var(--color-surface),var(--color-fg)_2.5%)]',
  '[--dt-head-hover:color-mix(in_oklab,var(--color-surface),var(--color-fg)_5%)]',
  '[--dt-shadow:color-mix(in_oklab,var(--color-shadow)_calc(12%_+_43%_*_var(--yj-dark)),transparent)]',
)

export const tableClass = 'w-full min-w-(--dt-min-w) table-fixed border-separate border-spacing-0 text-ui text-fg'

/* A refetch never fades the text (faded text fails AA): the rows' surfaces
 * sink a step toward muted and the cursor turns busy, while the progress line
 * under the header carries the motion. Nothing moves or resizes. */
export const bodyDim = cn(
  'data-loading:cursor-progress data-loading:[&>tr]:[--dt-row-bg:var(--dt-row-busy)]',
  // It waits one beat, so a quick answer never flickers; it lifts at once.
  'data-loading:[&>tr>td]:[transition-delay:var(--yj-duration-fast)]',
)

export const ROW_HEIGHT: Record<DataTableDensity, number> = { compact: 32, standard: 40, comfortable: 48 }
export const HEAD_HEIGHT: Record<DataTableDensity, number> = { compact: 32, standard: 36, comfortable: 40 }
/** The narrowest a growing column is squeezed to. A larger minSize raises it; a smaller size lowers it. */
const GROW_FLOOR = 160

/**
 * Where each visible column sits (pinned, its shadow edge, alignment) and the
 * sizes as CSS variables on the root, so resizing a column restyles the grid
 * without re-rendering a row. A growing column flexes between a floor and
 * whatever the frame leaves over, so a narrow frame squeezes it before the
 * table starts to scroll; it usually names the row, so on a phone the table
 * scrolls sideways rather than cutting the name to a few letters.
 */
export function useColumnLayout<TData extends RowData>(
  table: DataTableInstance<TData>,
  leafColumns: DataTableColumn<TData>[],
  /** The column defs: a new set re-reads every column's meta. */
  columns: unknown,
  editingEnabled: boolean,
  density: DataTableDensity,
) {
  const structure = leafColumns.map((column) => `${column.id}:${column.getIsPinned() || ''}`).join('|')
  const { layout, fillerAt, metas } = useMemo(() => {
    const startCount = leafColumns.filter((column) => column.getIsPinned() === 'start').length
    const firstEnd = leafColumns.findIndex((column) => column.getIsPinned() === 'end')
    const grows = leafColumns.some((column) => column.columnDef.meta?.grow && !column.getIsPinned())
    const layout: ColumnLayout[] = leafColumns.map((column, index) => {
      const meta = column.columnDef.meta
      const pinned = column.getIsPinned()
      return {
        id: column.id,
        index,
        pinned,
        edgeStart: pinned === 'start' && index === startCount - 1,
        edgeEnd: pinned === 'end' && index === firstEnd,
        align: dataTableColumnAlign(meta),
        numeric: meta?.numeric === true,
        editable: editingEnabled && meta?.editor !== undefined,
        grow: meta?.grow === true && !pinned,
        cellClassName: meta?.cellClassName,
        headerClassName: meta?.headerClassName,
      }
    })
    return {
      layout,
      metas: leafColumns.map((column) => column.columnDef.meta),
      fillerAt: grows ? null : firstEnd === -1 ? leafColumns.length : firstEnd,
    }
    // Structure, not sizes: resizing a column must not re-render the rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- structure, not sizes: resizing a column must not re-render the rows
  }, [structure, columns, editingEnabled])

  const give = leafColumns.reduce((sum, column) => {
    if (!column.columnDef.meta?.grow || column.getIsPinned()) return sum
    const size = column.getSize()
    return sum + size - Math.max(column.columnDef.minSize ?? 64, Math.min(size, GROW_FLOOR))
  }, 0)
  const vars: Record<string, string> = {
    '--dt-row-h': `calc(${ROW_HEIGHT[density]}px * var(--yj-scale, 1))`,
    '--dt-head-h': `calc(${HEAD_HEIGHT[density]}px * var(--yj-scale, 1))`,
    '--dt-min-w': `${table.getTotalSize() - Math.max(0, give)}px`,
    '--dt-pin-s': `${table.getStartTotalSize()}px`,
    '--dt-pin-e': `${table.getEndTotalSize()}px`,
  }
  leafColumns.forEach((column, i) => {
    vars[`--dt-w${i}`] = `${column.getSize()}px`
    const pinned = column.getIsPinned()
    if (pinned === 'start') vars[`--dt-s${i}`] = `${column.getStart('start')}px`
    if (pinned === 'end') vars[`--dt-e${i}`] = `${column.getAfter('end')}px`
  })
  const colgroup = (
    <colgroup>
      {leafColumns.flatMap((column, i) => {
        const grow = column.columnDef.meta?.grow && !column.getIsPinned()
        const col = <col key={column.id} style={grow ? undefined : { width: `var(--dt-w${i})` }} />
        return fillerAt === i ? [<col key="__filler" />, col] : [col]
      })}
      {fillerAt === leafColumns.length && <col key="__filler" />}
    </colgroup>
  )
  return {
    layout,
    metas,
    fillerAt,
    vars,
    colgroup,
    hasPinnedStart: layout.some((column) => column.edgeStart),
    hasPinnedEnd: layout.some((column) => column.edgeEnd),
  }
}
