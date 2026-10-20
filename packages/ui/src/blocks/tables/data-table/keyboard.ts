import type { RefObject } from 'react'
import type { RowData } from '@tanstack/react-table'
import { DATA_TABLE_SELECT_COLUMN_ID, dataTableColumnLabel, useDataTableNavigation, type DataTableColumn, type DataTableRow } from '../../../components/ui/data-table'
import type { BodyHandlers } from './body'
import type { DataTableCopy } from './copy'
import type { DataTableActiveCell } from './props'
import type { ColumnLayout } from './head'
import type { TableModel } from './model'
import type { VirtualHandle } from './virtual'

/**
 * The grid's keys: the arrows between cells (the kit's navigation), Space and
 * Shift+Space to select, Ctrl/Cmd+A for every row, Escape to clear, Enter, F2
 * or typing to edit, Alt+↓ for a header's menu and Shift+←/→ to resize.
 */
export function useTableKeyboard<TData extends RowData>({
  model,
  rows,
  leafColumns,
  layout,
  tableRef,
  scrollRef,
  virtualizerRef,
  rowHeight,
  headHeight,
  virtualize,
  headerMenus,
  ctxRef,
  isSelected,
  selectAll,
  selectedCount,
  clearSelection,
  startEdit,
  openMenu,
  announce,
  copy,
  onActiveCellChange,
}: {
  model: TableModel<TData>
  rows: DataTableRow<TData>[]
  leafColumns: DataTableColumn<TData>[]
  layout: readonly ColumnLayout[]
  tableRef: RefObject<HTMLTableElement | null>
  scrollRef: RefObject<HTMLDivElement | null>
  virtualizerRef: RefObject<VirtualHandle | null>
  rowHeight: number
  headHeight: number
  virtualize: boolean
  headerMenus: boolean
  ctxRef: RefObject<BodyHandlers | null>
  isSelected: (row: DataTableRow<TData>) => boolean
  selectAll: () => void
  selectedCount: number
  clearSelection: () => void
  startEdit: (edit: { rowId: string; columnId: string; typed?: string }) => void
  openMenu: (id: string) => void
  announce: (message: string) => void
  copy: DataTableCopy
  onActiveCellChange?: (cell: DataTableActiveCell | null) => void
}) {
  return useDataTableNavigation({
    gridRef: tableRef,
    rowCount: rows.length,
    colCount: leafColumns.length,
    // A screenful of rows, measured when the key is pressed, not on every render.
    pageJump: () => Math.max(1, Math.floor(((scrollRef.current?.clientHeight ?? 400) - headHeight) / rowHeight) - 1),
    scrollToRow: virtualize ? (index) => virtualizerRef.current?.scrollToIndex(index, { align: 'auto' }) : undefined,
    onActiveChange: onActiveCellChange
      ? ({ row, col }) => {
          const rowId = rows[row]?.id
          const columnId = leafColumns[col]?.id
          onActiveCellChange(rowId && columnId ? { rowId, columnId, rowIndex: row } : null)
        }
      : undefined,
    handlers: {
      toggleRow: model.selectionEnabled
        ? (index, shift) => {
            const row = rows[index]
            if (row?.getCanSelect()) ctxRef.current?.toggleRow(row.id, !isSelected(row), shift)
          }
        : undefined,
      selectAll: model.selectionEnabled
        ? () => {
            selectAll()
            return true
          }
        : undefined,
      escape: () => {
        if (selectedCount === 0) return false
        clearSelection()
        return true
      },
      edit: (index, col, typed) => {
        const row = rows[index]
        const column = layout[col]
        if (!row || !column?.editable) return false
        // A select opens on Enter; typing a letter into it means nothing.
        if (typed !== undefined && leafColumns[col]?.columnDef.meta?.editor?.type === 'select') return false
        startEdit({ rowId: row.id, columnId: column.id, typed })
        return true
      },
      menu: (col) => {
        const column = leafColumns[col]
        if (!headerMenus || !column || column.id === DATA_TABLE_SELECT_COLUMN_ID) return false
        if (!column.getCanSort() && !column.getCanPin() && !column.getCanHide()) return false
        openMenu(column.id)
        return true
      },
      resize: (col, delta) => {
        const column = leafColumns[col]
        if (!column?.getCanResize() || layout[col]?.grow) return false
        const { minSize = 64, maxSize = 720 } = column.columnDef
        const size = Math.round(Math.min(maxSize, Math.max(minSize, column.getSize() + delta)))
        model.setColumnSizing((old) => ({ ...old, [column.id]: size }))
        announce(copy.columnWidth(dataTableColumnLabel(column), size))
        return true
      },
    },
  })
}
