'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { FunctionIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import type { SpreadsheetTableCopy } from './data'

/** The cell the bar is showing. */
export interface FormulaCell {
  /** Where it is, as the sheet names it: "E7". */
  address: string
  /** What's in it: the value as typed, or the formula of a worked-out cell ("=E7*G7"). */
  text: string
  /** False for the row number, the SKU and Value. */
  editable: boolean
}

/**
 * The name box and the formula bar over the sheet: the active cell's address
 * and what's in it. Typing here edits that cell; Enter commits and goes back
 * to the grid, Escape goes back without changing it. A value that doesn't fit
 * the column stays in the bar with the reason beside it.
 */
export function FormulaBar({
  cell,
  copy,
  onCommit,
  onLeave,
}: {
  cell: FormulaCell | null
  copy: SpreadsheetTableCopy
  /** Applies the text; returns why it doesn't fit, or null. */
  onCommit: (text: string) => string | null
  /** Hands focus back to the cell. */
  onLeave: () => void
}) {
  const shownKey = cell ? `${cell.address}\n${cell.text}` : ''
  const [key, setKey] = useState(shownKey)
  const [draft, setDraft] = useState(cell?.text ?? '')
  const [error, setError] = useState<string | null>(null)
  // Another cell, or a new value in this one: the bar shows it, dropping any draft.
  if (key !== shownKey) {
    setKey(shownKey)
    setDraft(cell?.text ?? '')
    setError(null)
  }
  const errorId = useId()

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && cell?.editable) {
      event.preventDefault()
      const reason = draft === cell.text ? null : onCommit(draft)
      setError(reason)
      if (!reason) onLeave()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(cell?.text ?? '')
      setError(null)
      onLeave()
    }
  }

  return (
    <InputGroup aria-label={copy.formulaBar} data-slot="spreadsheet-formula-bar" className="h-control-sm min-w-0 flex-1 basis-72">
      <InputGroupAddon align="inline-start" className="gap-0 py-0 ps-0">
        <output aria-label={copy.nameBox} className="flex h-full w-14 items-center justify-center border-e border-line font-mono text-ui-xs text-fg tabular-nums">
          {cell?.address ?? ''}
        </output>
        <FunctionIcon aria-hidden className="ms-2.5 size-3.5 text-fg-subtle" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={cell ? copy.formulaLabel(cell.address) : copy.formulaBar}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={!cell}
        readOnly={!cell?.editable}
        placeholder={copy.formulaPlaceholder}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          setError(null)
        }}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        className="font-mono text-ui-sm read-only:text-fg-muted"
      />
      {error && (
        <InputGroupAddon align="inline-end">
          <span id={errorId} role="alert" className="max-w-56 truncate text-ui-xs text-danger-text">
            {error}
          </span>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
