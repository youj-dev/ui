'use client'

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { PlusIcon, XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Kbd } from '../../../components/ui/kbd'
import { SortableList, SortableListHandle, SortableListItem } from '../../../components/ui/sortable-list'
import { letter, type SurveyOption } from '../question/data'
import { freshId, type SurveyBuilderCopy } from './data'

/* A list of options to edit: each a field with its letter, a grip to reorder
 * it (drag, or Space and the arrows), and × to remove it. Enter in one adds
 * the next and moves there; Backspace in an empty one removes it and goes
 * back; a pasted list becomes one option per line. An option keeps its value
 * while its label changes, so answers and logic that read it hold. */

interface OptionsEditorProps {
  label: string
  options: SurveyOption[]
  onChange: (options: SurveyOption[], key?: string) => void
  copy: SurveyBuilderCopy
  /** The new option's label: "Option 4", "Statement 3". */
  next: (n: number) => string
  /** The values' stem: `option-4`, `row-3`. */
  prefix: string
  addLabel: string
  /** Letters beside each, as respondents press them. Default true. */
  letters?: boolean
}

export function OptionsEditor({ label, options, onChange, copy, next, prefix, addLabel, letters = true }: OptionsEditorProps) {
  const list = useRef<HTMLDivElement>(null)
  const focusAt = (index: number) =>
    requestAnimationFrame(() => {
      const input = list.current?.querySelectorAll<HTMLInputElement>('input')[index]
      input?.focus()
      input?.select()
    })

  const insert = (at: number, labels: string[]) => {
    const taken = options.map((o) => o.value)
    const added = labels.map((text) => {
      const value = freshId(taken, `${prefix}-${taken.length + 1}`)
      taken.push(value)
      return { value, label: text }
    })
    onChange([...options.slice(0, at), ...added, ...options.slice(at)])
    focusAt(at + added.length - 1)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      insert(index + 1, [next(options.length + 1)])
    } else if (event.key === 'Backspace' && event.currentTarget.value === '' && options.length > 1) {
      event.preventDefault()
      onChange(options.filter((_, i) => i !== index))
      focusAt(Math.max(0, index - 1))
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    const lines = event.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length < 2) return
    event.preventDefault()
    // Into an empty option, or over all of its words, the first line replaces them; the rest follow it.
    const input = event.currentTarget
    const replaces = !input.value || (input.selectionStart === 0 && input.selectionEnd === input.value.length)
    const [first, ...rest] = lines
    const updated = options.map((o, i) => (i === index && replaces ? { ...o, label: first! } : o))
    const extra = replaces ? rest : lines
    const taken = updated.map((o) => o.value)
    const added = extra.map((text) => {
      const value = freshId(taken, `${prefix}-${taken.length + 1}`)
      taken.push(value)
      return { value, label: text }
    })
    onChange([...updated.slice(0, index + 1), ...added, ...updated.slice(index + 1)])
    focusAt(index + added.length)
  }

  const byValue = new Map(options.map((o) => [o.value, o]))
  return (
    <div ref={list} className="flex flex-col gap-2">
      <SortableList
        aria-label={label}
        value={options.map((o) => o.value)}
        onValueChange={(order) => onChange(order.map((v) => byValue.get(v)!))}
        className="gap-1.5"
      >
        {options.map((option, index) => (
          <SortableListItem
            key={option.value}
            value={option.value}
            textValue={option.label || copy.optionLabel(index + 1)}
            className="gap-2 bg-surface py-1 ps-1.5 pe-1"
          >
            <SortableListHandle aria-label={copy.reorderOption(option.label || copy.optionLabel(index + 1))} />
            {letters && (
              <Kbd aria-hidden className="shrink-0">
                {letter(index)}
              </Kbd>
            )}
            <Input
              value={option.label}
              aria-label={copy.optionLabel(index + 1)}
              placeholder={copy.optionLabel(index + 1)}
              onChange={(event) =>
                onChange(
                  options.map((o) => (o.value === option.value ? { ...o, label: event.target.value } : o)),
                  `option:${option.value}`,
                )
              }
              onKeyDown={(event) => onKeyDown(event, index)}
              onPaste={(event) => onPaste(event, index)}
              // shape: an option's label edits in place: it reads as text until the pointer or focus is on it
              className="h-control-sm min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-line focus-visible:border-line"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={copy.removeOption(option.label || copy.optionLabel(index + 1))}
              disabled={options.length <= 1}
              onClick={() => {
                onChange(options.filter((o) => o.value !== option.value))
                focusAt(Math.max(0, index - 1))
              }}
            >
              <XIcon size={14} />
            </Button>
          </SortableListItem>
        ))}
      </SortableList>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ms-2 gap-1" onClick={() => insert(options.length, [next(options.length + 1)])}>
          <PlusIcon size={14} />
          {addLabel}
        </Button>
        <span className="text-ui-sm text-fg-subtle touch:hidden">{copy.pasteHint}</span>
      </div>
    </div>
  )
}
