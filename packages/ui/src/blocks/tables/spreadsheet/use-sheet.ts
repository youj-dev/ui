import { useLayoutEffect, useRef, useState } from 'react'
import { demo, type SpreadsheetTableEdit, type SpreadsheetTableField, type SpreadsheetTableRow } from './data'

/** One cell's change: what it held and what it holds. */
export interface Patch {
  id: string
  field: SpreadsheetTableField
  before: SpreadsheetTableRow[SpreadsheetTableField]
  after: SpreadsheetTableRow[SpreadsheetTableField]
}
/** What one edit, paste, undo or redo changed, undone as one. */
type Step = readonly Patch[]

const LIMIT = 100

function write(items: SpreadsheetTableRow[], step: Step, side: 'before' | 'after') {
  const touched = new Set(step.map((patch) => patch.id))
  return items.map((item) => {
    if (!touched.has(item.id)) return item
    const next: Record<string, unknown> = { ...item }
    for (const patch of step) if (patch.id === item.id) next[patch.field] = patch[side]
    return next as unknown as SpreadsheetTableRow
  })
}

/**
 * The sheet's rows and their history. Every change (an edit in a cell or the
 * formula bar, a paste, an undo, a redo) shows at once, goes to `onEdit` as
 * one batch, and is put back if the app refuses it. Undo and redo walk the
 * history a step at a time, a paste being one step.
 */
export function useSheet({
  source,
  onEdit,
  onFailure,
}: {
  source: SpreadsheetTableRow[]
  onEdit?: (edits: SpreadsheetTableEdit[]) => Promise<unknown> | unknown
  onFailure: (error: unknown) => void
}) {
  const [items, setItems] = useState(source)
  const [shown, setShown] = useState(source)
  const [history, setHistory] = useState<{ undo: Step[]; redo: Step[] }>({ undo: [], redo: [] })
  // New rows from the app replace the sheet. An app that stores each edit passes its rows back
  // after every one, so the history stays, less any step on a row that's gone.
  if (source !== shown) {
    setShown(source)
    setItems(source)
    const ids = new Set(source.map((item) => item.id))
    const kept = (steps: Step[]) => steps.filter((step) => step.every((patch) => ids.has(patch.id)))
    setHistory({ undo: kept(history.undo), redo: kept(history.redo) })
  }
  const latest = useRef(items)
  // Handlers read and write the history as of their last step, ahead of the render it brings.
  const historyNow = useRef(history)
  useLayoutEffect(() => {
    latest.current = items
    historyNow.current = history
  })
  const record = (next: { undo: Step[]; redo: Step[] }) => {
    historyNow.current = next
    setHistory(next)
  }

  const apply = (step: Step, side: 'before' | 'after') => {
    latest.current = write(latest.current, step, side)
    setItems(latest.current)
  }
  const send = (step: Step, side: 'before' | 'after') => {
    const edits = step.map<SpreadsheetTableEdit>((patch) => ({
      row: latest.current.find((item) => item.id === patch.id)!,
      field: patch.field,
      value: patch[side],
      previousValue: patch[side === 'after' ? 'before' : 'after'],
    }))
    return onEdit ? onEdit(edits) : demo('SpreadsheetTable: onEdit', 350)
  }
  const move = (from: 'undo' | 'redo', to: 'undo' | 'redo', step: Step) => {
    const now = historyNow.current
    record({
      ...now,
      [from]: now[from].filter((entry) => entry !== step),
      [to]: [...now[to], step].slice(-LIMIT),
    })
  }

  /** Makes a change. It rejects (after putting the cells back) if the app refuses it. */
  const commit = async (patches: Patch[]) => {
    const step = patches.filter((patch) => patch.before !== patch.after)
    if (step.length === 0) return
    apply(step, 'after')
    record({ undo: [...historyNow.current.undo, step].slice(-LIMIT), redo: [] })
    try {
      await send(step, 'after')
    } catch (error) {
      apply(step, 'before')
      record({ ...historyNow.current, undo: historyNow.current.undo.filter((entry) => entry !== step) })
      throw error
    }
  }

  /** Steps back (`undo`) or forward (`redo`); resolves to what it changed, or null when there was nothing to do or the app refused. */
  const walk = async (direction: 'undo' | 'redo'): Promise<Step | null> => {
    const step = historyNow.current[direction].at(-1)
    if (!step) return null
    const other = direction === 'undo' ? 'redo' : 'undo'
    const side = direction === 'undo' ? 'before' : 'after'
    apply(step, side)
    move(direction, other, step)
    try {
      await send(step, side)
      return step
    } catch (error) {
      apply(step, side === 'before' ? 'after' : 'before')
      move(other, direction, step)
      onFailure(error)
      return null
    }
  }

  return {
    items,
    commit,
    undo: () => walk('undo'),
    redo: () => walk('redo'),
    canUndo: history.undo.length > 0,
    canRedo: history.redo.length > 0,
  }
}
