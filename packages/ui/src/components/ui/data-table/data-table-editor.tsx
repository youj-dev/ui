'use client'

import { dataTableEditorLabels } from '@youj/core/labels'
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { type YoujLabels } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { fieldControlClass } from '../input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import type { DataTableEditor } from './data-table-model'

/* The editor sits exactly over its cell, inset by a hair so the field's
 * border and focus halo read as the cell becoming a field rather than a
 * popup appearing. The draft is local until it commits: Escape (or leaving
 * with an invalid value) throws it away and the value never changed. */

export interface DataTableCellEditorProps {
  editor: DataTableEditor
  value: unknown
  /** A character typed on the focused cell: it replaces the value. */
  typed?: string
  /** "Amount, ORD-1042": names the field for assistive tech. */
  label: string
  /** Returns a reason when the value is rejected. */
  onCommit: (value: unknown) => string | null
  onCancel: () => void
  /** Tab: commit, then move to the next (or previous) cell. */
  onTab: (value: unknown, backward: boolean) => string | null
}

export function DataTableCellEditor(props: DataTableCellEditorProps) {
  return props.editor.type === 'select' ? <SelectEditor {...props} /> : <InputEditor {...props} />
}

const CURRENCY = /^[$€£¥]/

export function parseDraft(
  editor: DataTableEditor,
  draft: string,
  labels: Pick<YoujLabels, 'enterNumber' | 'enterAtLeast' | 'enterAtMost'> = dataTableEditorLabels,
): { value: unknown; error?: string } {
  if (editor.type !== 'number') return { value: draft }
  const text = draft.trim().replace(CURRENCY, '').replace(/[\s,]/g, '')
  if (text === '') return { value: null, error: labels.enterNumber }
  const n = Number(text)
  if (!Number.isFinite(n)) return { value: null, error: labels.enterNumber }
  if (editor.min !== undefined && n < editor.min) return { value: n, error: labels.enterAtLeast(editor.min) }
  if (editor.max !== undefined && n > editor.max) return { value: n, error: labels.enterAtMost(editor.max) }
  return { value: n }
}

function InputEditor({ editor, value, typed, label, onCommit, onCancel, onTab }: DataTableCellEditorProps) {
  const [draft, setDraft] = useState(() => typed ?? (value === null || value === undefined ? '' : String(value)))
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const errorId = useId()
  const labels = useComponentLabels(dataTableEditorLabels)

  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    input.focus({ preventScroll: true })
    // Typing replaces the value (caret after the character); Enter/F2 selects it.
    if (typed === undefined) input.select()
    else input.setSelectionRange(input.value.length, input.value.length)
  }, [typed])

  const attempt = (then: (value: unknown) => string | null) => {
    const parsed = parseDraft(editor, draft, labels)
    const reason = parsed.error ?? then(parsed.value)
    if (reason) {
      setError(reason)
      return false
    }
    done.current = true
    return true
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      attempt(onCommit)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      done.current = true
      onCancel()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      attempt((v) => onTab(v, event.shiftKey))
    }
  }

  return (
    <>
      <input
        ref={ref}
        data-dt-editor=""
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        inputMode={editor.type === 'number' ? 'decimal' : undefined}
        placeholder={'placeholder' in editor ? editor.placeholder : undefined}
        maxLength={editor.type === 'text' ? editor.maxLength : undefined}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          if (error) setError(null)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Leaving commits a valid draft and discards an invalid one.
          if (!done.current && !attempt(onCommit)) {
            done.current = true
            onCancel()
          }
        }}
        className={cn(
          fieldControlClass,
          'absolute inset-x-1 inset-y-1 h-auto w-auto bg-(--dt-row-bg) px-2 own:text-ui shadow-xs',
          editor.type === 'number' && 'own:text-end own:tabular-nums',
        )}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="absolute start-1 top-[calc(100%_-_var(--spacing)*0.5)] z-10 rounded-md border border-line bg-overlay px-2 py-1 own:text-ui-sm whitespace-nowrap own:text-danger-text shadow-md"
        >
          {error}
        </span>
      )}
    </>
  )
}

function SelectEditor({ editor, value, label, onCommit, onCancel }: DataTableCellEditorProps) {
  const options = editor.type === 'select' ? editor.options : []
  const [open, setOpen] = useState(true)
  const committed = useRef(false)
  const items = Object.fromEntries(options.map((option) => [option.value, option.label]))
  return (
    <Select
      items={items}
      value={value === null || value === undefined ? null : String(value)}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next && !committed.current) onCancel()
      }}
      onValueChange={(next) => {
        committed.current = true
        if (next !== null && onCommit(next)) committed.current = false
      }}
    >
      <SelectTrigger
        data-dt-editor=""
        size="sm"
        aria-label={label}
        // shape: an editor laid over its cell, in the row's own fill, so the row doesn't change colour while it's edited
        className="absolute inset-x-1 inset-y-1 h-auto w-auto own:bg-(--dt-row-bg) shadow-xs"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
