import { useMemo } from 'react'
import type { RowData } from '@tanstack/react-table'
import { cn } from '../../../lib/utils'
import type { GridColumnLayout } from './head'
import { HEAD_HEIGHT, ROW_HEIGHT, columnAlign, isUtilityColumn, metaOf, type DataGridColumn, type DataGridDensity, type DataGridInstance } from './model'

/**
 * Where each visible column sits (pinned, its shadow edge, alignment) and the
 * sizes as CSS variables on the root, so resizing a column restyles the grid
 * without re-rendering a row. A growing column flexes between its minSize and
 * what the frame leaves, so a narrow frame squeezes it before the grid scrolls.
 */
export function useGridLayout<TData extends RowData>(
  table: DataGridInstance<TData>,
  leafColumns: DataGridColumn<TData>[],
  /** The column defs: a new set re-reads every column's meta. */
  columns: unknown,
  density: DataGridDensity,
) {
  const structure = leafColumns.map((column) => `${column.id}:${column.getIsPinned() || ''}`).join('|')
  const { layout, fillerAt, metas } = useMemo(() => {
    const startCount = leafColumns.filter((column) => column.getIsPinned() === 'start').length
    const firstEnd = leafColumns.findIndex((column) => column.getIsPinned() === 'end')
    const grows = leafColumns.some((column) => metaOf(column)?.grow && !column.getIsPinned())
    const layout: GridColumnLayout[] = leafColumns.map((column, index) => {
      const meta = metaOf(column)
      const pinned = column.getIsPinned()
      return {
        id: column.id,
        index,
        pinned,
        edgeStart: pinned === 'start' && index === startCount - 1,
        edgeEnd: pinned === 'end' && index === firstEnd,
        align: isUtilityColumn(column.id) ? 'center' : columnAlign(meta),
        numeric: meta?.numeric === true,
        grow: meta?.grow === true && !pinned,
        kind: meta?.kind,
        utility: isUtilityColumn(column.id),
        cellClassName: meta?.cellClassName,
        headerClassName: meta?.headerClassName,
      }
    })
    return {
      layout,
      metas: leafColumns.map((column) => metaOf(column)),
      fillerAt: grows ? null : firstEnd === -1 ? leafColumns.length : firstEnd,
    }
    // Structure, not sizes: resizing a column must not re-render the rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- structure, not sizes: resizing a column must not re-render the rows
  }, [structure, columns])

  const give = leafColumns.reduce((sum, column) => (metaOf(column)?.grow && !column.getIsPinned() ? sum + column.getSize() - (column.columnDef.minSize ?? 72) : sum), 0)
  const vars: Record<string, string> = {
    '--dg-row-h': `calc(${ROW_HEIGHT[density]}px * var(--yj-scale, 1))`,
    '--dg-head-h': `calc(${HEAD_HEIGHT[density]}px * var(--yj-scale, 1))`,
    '--dg-avatar': `calc(${density === 'compact' ? 24 : density === 'spacious' ? 36 : 32}px * var(--yj-scale, 1))`,
    '--dg-min-w': `${table.getTotalSize() - Math.max(0, give)}px`,
    '--dg-pin-s': `${table.getStartTotalSize()}px`,
    '--dg-pin-e': `${table.getEndTotalSize()}px`,
    '--dg-detail-inset': `${leafColumns.filter((c) => isUtilityColumn(c.id) && c.getIsPinned() === 'start').reduce((sum, c) => sum + c.getSize(), 0)}px`,
  }
  leafColumns.forEach((column, i) => {
    vars[`--dg-w${i}`] = `${column.getSize()}px`
    const pinned = column.getIsPinned()
    if (pinned === 'start') vars[`--dg-s${i}`] = `${column.getStart('start')}px`
    if (pinned === 'end') vars[`--dg-e${i}`] = `${column.getAfter('end')}px`
  })
  const colgroup = (
    <colgroup>
      {leafColumns.flatMap((column, i) => {
        const grow = metaOf(column)?.grow && !column.getIsPinned()
        const col = <col key={column.id} style={grow ? undefined : { width: `var(--dg-w${i})` }} />
        return fillerAt === i ? [<col key="__filler" />, col] : [col]
      })}
      {fillerAt === leafColumns.length && <col key="__filler" />}
    </colgroup>
  )
  return { layout, metas, fillerAt, vars, colgroup, span: leafColumns.length + (fillerAt === null ? 0 : 1) }
}

/* The grid's surfaces, mixed into the card so they stay opaque: pinned cells
 * and rows crossing mid-sort cover what's under them. */
export const surfaceTokens = cn(
  '[--dg-row-bg:var(--color-surface)]',
  '[--dg-row-hover:color-mix(in_oklab,var(--color-surface),var(--color-fg)_3.5%)]',
  '[--dg-row-zebra:color-mix(in_oklab,var(--color-surface),var(--color-fg)_2.5%)]',
  '[--dg-row-selected:color-mix(in_oklab,var(--color-surface),var(--color-accent)_8%)]',
  '[--dg-row-selected-hover:color-mix(in_oklab,var(--color-surface),var(--color-accent)_11%)]',
  '[--dg-row-busy:color-mix(in_oklab,var(--color-surface),var(--color-fg)_4%)]',
  '[--dg-head-bg:color-mix(in_oklab,var(--color-surface),var(--color-fg)_2%)]',
  '[--dg-group-bg:color-mix(in_oklab,var(--color-surface),var(--color-fg)_4%)]',
  '[--dg-band:color-mix(in_oklab,var(--color-surface),var(--color-fg)_2.5%)]',
  '[--dg-detail-bg:color-mix(in_oklab,var(--color-surface),var(--color-fg)_2%)]',
  '[--dg-line:color-mix(in_oklab,var(--color-line)_75%,transparent)]',
  '[--dg-chip-bg:var(--color-surface)]',
  '[--dg-shadow:color-mix(in_oklab,var(--color-shadow)_calc(12%_+_28%_*_var(--yj-dark)),transparent)]',
)

/* What a click on a row leaves to itself: the row's controls, its actions and its detail panel. */
export const ROW_CONTROLS = 'button, a, input, label, select, textarea, [role=checkbox], [role=switch], [role=menuitem], [data-dg-focus], [data-dg-panel]'
export const rowClickable = '[&_tbody_tr[data-dg-kind=row]]:cursor-pointer [&_[data-slot=data-grid-card]]:cursor-pointer'

export const tableClass = 'w-full min-w-(--dg-min-w) table-fixed border-separate border-spacing-0 text-ui text-fg'

/* A refetch never fades the text (faded text fails AA): the rows' surfaces
 * sink a step, and the cursor turns busy, while the progress line moves. */
export const bodyDim = cn(
  'data-loading:cursor-progress data-loading:[&>tr]:[--dg-row-bg:var(--dg-row-busy)]',
  'data-loading:[&>tr>td]:[transition-delay:var(--yj-duration-fast)]',
)
