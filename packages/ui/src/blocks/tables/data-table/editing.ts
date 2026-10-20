import { useEffect, useRef, useState } from 'react'
import type { RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { dataTableColumnLabel } from '../../../components/ui/data-table'
import type { PendingEdit } from './body'
import type { DataTableCopy } from './copy'
import type { TableModel } from './model'
import type { DataTableCellEdit } from './props'

type Announce = (message: string, options?: { assertive?: boolean; delay?: number }) => void

/**
 * Inline editing, optimistic: a committed value shows at once and saves
 * through `onCellEdit`; a promise marks the cell saving, a resolution glows it
 * saved, a rejection rolls it back (with a shake) and says why. Each edit
 * carries a token, so a late answer never overwrites a newer edit.
 */
export function useEditing<TData extends RowData>({
  model,
  onCellEdit,
  rowLabel,
  announce,
  copy,
}: {
  model: TableModel<TData>
  onCellEdit?: (edit: DataTableCellEdit<TData>) => void | Promise<unknown>
  rowLabel: (rowId: string) => string
  announce: Announce
  copy: DataTableCopy
}) {
  const { table, setEdits } = model
  const k = useYouj()
  const [editing, setEditing] = useState<{ rowId: string; columnId: string; typed?: string } | null>(null)
  const editToken = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }
  const setEdit = (rowId: string, columnId: string, edit: (PendingEdit & { token: number }) | null, token?: number) => {
    setEdits((old) => {
      const current = old[rowId]?.[columnId] as (PendingEdit & { token?: number }) | undefined
      if (token !== undefined && current?.token !== token) return old
      const rowEdits = { ...old[rowId] }
      if (edit) rowEdits[columnId] = edit
      else delete rowEdits[columnId]
      const next = { ...old }
      if (Object.keys(rowEdits).length) next[rowId] = rowEdits
      else delete next[rowId]
      return next
    })
  }

  /** Validates and commits a draft. Returns the reason it was refused, or null. */
  const commit = (rowId: string, columnId: string, value: unknown): string | null => {
    const column = table.getColumn(columnId)
    const row = table.getRowModel().rowsById[rowId] ?? table.getCoreRowModel().rowsById[rowId]
    if (!column || !row) return null
    const reason = column.columnDef.meta?.validate?.(value)
    if (reason) return reason
    setEditing(null)
    const previousValue = row.getValue(columnId)
    if (Object.is(previousValue, value) || (value === '' && (previousValue === null || previousValue === undefined))) return null
    const token = ++editToken.current
    setEdit(rowId, columnId, { value, status: 'saving', token })
    const label = copy.cellOf(dataTableColumnLabel(column), rowLabel(rowId))
    let result: unknown
    try {
      result = onCellEdit?.({ row: row.original, rowId, columnId, value, previousValue })
    } catch (thrown) {
      result = Promise.reject(thrown)
    }
    Promise.resolve(result).then(
      () => {
        setEdit(rowId, columnId, { value, status: 'saved', token }, token)
        announce(copy.cellSaved(label))
        later(() => setEdit(rowId, columnId, null, token), k.ms('deliberate') * 2)
      },
      (failure: unknown) => {
        setEdit(rowId, columnId, { value, status: 'error', token }, token)
        const detail = failure instanceof Error ? failure.message : typeof failure === 'string' ? failure : ''
        announce(copy.cellSaveFailed(label, detail), { assertive: true })
        later(() => setEdit(rowId, columnId, null, token), k.ms('deliberate') * 2)
      },
    )
    return null
  }

  return { editing, setEditing, commit }
}
