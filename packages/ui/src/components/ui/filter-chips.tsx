'use client'

import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent, type Ref } from 'react'
import { animate } from 'motion/react'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { filterChipsLabels, useComponentLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { BadgeRemove } from './badge'
import { InputGroup, InputGroupInput } from './input-group'

/* A filter query as chips (`priority:in(p1,p2)`, a price range), with a
 * field for the next one after them, in a filled well. It's the
 * TagInput's model (same field, keyboard and feedback) for text that is a
 * query: a token ends at a space, never inside brackets or quotes, so
 * `priority:in(p1, p2)` stays whole, and a finished `key:value` becomes a
 * chip as soon as you type the space after it (or press Enter). A chip is
 * editable: click it, or focus it and press Enter, and its text returns to
 * the field. A chip keeps its place while its value changes (it's keyed by
 * its field), so a filter that mirrors a control updates in place instead
 * of leaving and re-entering.
 *
 * Motion: chips enter, leave and make room through PresenceList. A token
 * `validate` rejects stays in the field: the frame shakes (a decaying 4/3/2px
 * on the slow token), the border turns destructive and the reason grows in
 * under it (Collapse). A duplicate flashes the chip that holds it. Reduced
 * motion: no shake or glide; the flash and the reason still show.
 *
 * Keyboard: in the field, Backspace (when empty) or ArrowLeft (at the start)
 * reaches the last chip. On a chip: arrows move between chips, Home/End jump,
 * Enter or F2 edits it, Backspace or Delete removes it and focus lands on its
 * neighbor, Escape returns to the field. Additions and removals are
 * announced. */

interface FilterChipsProps {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Returns a reason to reject a token, or nothing to accept it. `tokens` is the current list. */
  validate?: (token: string, tokens: string[]) => string | null | undefined | void
  /** Default: "Add a filter…" (the `queryPlaceholder` label, then `queryAddAnother` once there are chips). */
  placeholder?: string
  disabled?: boolean
  /** Also submits each token with a native form, under this name. */
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** Splits text into tokens at whitespace outside brackets and quotes; `open` is true while a bracket or quote is unclosed. */
function scan(text: string) {
  const tokens: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    else if (/\s/.test(ch) && depth === 0) {
      if (current) tokens.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current) tokens.push(current)
  return { tokens, open: depth > 0 || quote !== null }
}

/** A chip's field: the text before its first colon. */
const fieldOf = (token: string) => token.split(':')[0]!.toLowerCase()

function FilterChips({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  validate,
  placeholder,
  disabled,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: FilterChipsProps) {
  const k = useYouj()
  const labels = useComponentLabels(filterChipsLabels)
  const rtl = useDirection() === 'rtl'
  const [tokens, setTokens] = useControllableState(valueProp, defaultValue)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [focusChip, setFocusChip] = useState<number | null>(null)
  const [caret, setCaret] = useState<number | null>(null)
  const { announce, announcer } = useAnnouncer()
  const errorId = useId()
  const hintId = useId()
  const frame = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement | null>(null)

  // A chip keeps its element while its value changes: keyed by its field, or by its text when the field repeats.
  const keys = useMemo(() => {
    const fields = tokens.map(fieldOf)
    return tokens.map((token, i) => (fields.indexOf(fields[i]!) === fields.lastIndexOf(fields[i]!) ? `field:${fields[i]}` : `token:${token}`))
  }, [tokens])

  const commit = (next: string[]) => {
    setTokens(next)
    onValueChange?.(next)
  }

  const chips = () => [...(frame.current?.querySelectorAll<HTMLButtonElement>('[data-slot=filter-chips-list] > li:not([inert]) [data-slot=query-chip-edit]') ?? [])]

  // After a removal, focus lands on the right chip once it's rendered; after an edit, the caret on the chip's text.
  useEffect(() => {
    if (focusChip !== null) {
      const buttons = chips()
      if (buttons.length === 0) input.current?.focus()
      else buttons[Math.min(focusChip, buttons.length - 1)]?.focus()
      setFocusChip(null)
    }
    if (caret !== null && input.current) {
      input.current.focus()
      input.current.setSelectionRange(caret, caret)
      setCaret(null)
    }
  })

  // The duplicate's flash fades after the deliberate token.
  useEffect(() => {
    if (flash === null) return
    const timer = setTimeout(() => setFlash(null), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  }, [flash, k])

  const reject = (reason: string) => {
    setError(reason)
    if (!k.reduced && frame.current) animate(frame.current, { x: [0, -4, 4, -3, 3, -2, 0] }, k.tween('slow', 'standard'))
  }

  /** Adds each candidate that passes; returns the ones that didn't, with the first reason shown. */
  const add = (candidates: string[]) => {
    const next = [...tokens]
    const rejected: string[] = []
    let reason: string | null = null
    let duplicate: string | null = null
    for (const token of candidates) {
      const existing = next.find((t) => t.toLowerCase() === token.toLowerCase())
      if (existing) {
        duplicate ??= existing
        continue
      }
      const problem = validate?.(token, next)
      if (problem) {
        rejected.push(token)
        reason ??= problem
        continue
      }
      next.push(token)
    }
    if (next.length > tokens.length) {
      commit(next)
      announce(labels.added(next.slice(tokens.length).join(', ')))
    }
    if (duplicate && !reason) {
      setFlash(duplicate)
      announce(labels.alreadyAdded(duplicate))
    }
    if (reason) reject(reason)
    return rejected
  }

  const addTyped = (typed = text) => {
    const { tokens: found } = scan(typed)
    if (found.length === 0) return
    setText(add(found).join(' '))
  }

  const remove = (index: number, spoken = true) => {
    const token = tokens[index]
    if (token === undefined) return
    commit(tokens.filter((_, i) => i !== index))
    if (spoken) announce(labels.removed(token))
  }

  /** Puts a chip's text back in the field, ahead of anything typed, with the caret after it. */
  const edit = (index: number) => {
    const token = tokens[index]
    if (token === undefined || disabled) return
    remove(index, false)
    setError(null)
    setText(text ? `${token} ${text}` : token)
    setCaret(token.length)
  }

  const [back, forward] = rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight']

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const field = event.currentTarget
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0
    const atEnd = field.selectionStart === text.length
    if (event.key === 'Enter') {
      // Enter with nothing typed is left alone, so it can still submit a form.
      if (!text.trim()) return
      event.preventDefault()
      addTyped()
    } else if (event.key === ' ' && atEnd) {
      // A space after a finished key:value makes it a chip; inside brackets or quotes it's just a space.
      const { tokens: found, open } = scan(text)
      if (open || found.length === 0 || !found.every((t) => /^[^:\s]+:\S/.test(t))) return
      event.preventDefault()
      addTyped()
    } else if ((event.key === 'Backspace' && text === '') || (event.key === back && atStart)) {
      if (tokens.length === 0) return
      event.preventDefault()
      chips().at(-1)?.focus()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    if (!/\s/.test(pasted.trim())) return
    event.preventDefault()
    addTyped(`${text} ${pasted}`)
  }

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = chips()
    const focus = (to: number) => {
      event.preventDefault()
      if (to >= buttons.length) input.current?.focus()
      else buttons[Math.max(0, to)]?.focus()
    }
    if (event.key === back) focus(index - 1)
    else if (event.key === forward) focus(index + 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(buttons.length - 1)
    else if (event.key === 'Escape') focus(buttons.length)
    else if (event.key === 'F2') {
      event.preventDefault()
      edit(index)
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      if (disabled) return
      remove(index)
      setFocusChip(Math.max(0, event.key === 'Backspace' ? index - 1 : index))
    }
  }

  const onFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, input')) return
    input.current?.focus()
  }

  return (
    <div data-slot="filter-chips" className={cn('own:flex own:w-full own:min-w-0 flex-col', className)}>
      {/* shape: a field that wraps its chips grows past one control height; rounded-field-area is the theme's corner for a multi-line field */}
      <InputGroup
        ref={frame}
        role={undefined}
        data-invalid={error ? '' : undefined}
        onClick={onFrameClick}
        className="h-auto min-h-control own:rounded-field-area cursor-text own:p-1.5 own:data-invalid:border-danger"
      >
        <PresenceList as="ul" data-slot="filter-chips-list" aria-label={labels.activeFilters} className="own:flex own:min-w-0 own:flex-1 flex-wrap items-center gap-1.5">
          {tokens.map((token, index) => (
            <PresenceItem as="li" key={keys[index]} data-slot="filter-chips-item" aria-setsize={tokens.length} aria-posinset={index + 1} className="flex min-w-0 max-w-full">
              <span
                data-slot="query-chip"
                data-flash={flash === token || undefined}
                className={cn(
                  'own:inline-flex own:h-7 own:max-w-full own:min-w-0 items-center gap-1 own:rounded-chip border own:border-accent-line own:bg-accent-subtle own:ps-2.5 own:pe-1.5 own:font-mono own:text-ui-sm own:text-accent focus-ring-within',
                  'transition-[background-color,border-color] yj-duration-slow ease-standard',
                  'own:data-flash:border-accent own:data-flash:bg-accent-line data-flash:yj-duration-instant',
                )}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  data-slot="query-chip-edit"
                  disabled={disabled}
                  aria-describedby={hintId}
                  onClick={() => edit(index)}
                  onKeyDown={(event) => onChipKeyDown(event, index)}
                  className="own:min-w-0 cursor-text truncate text-start outline-none disabled:cursor-not-allowed"
                >
                  {token}
                </button>
                <BadgeRemove
                  tabIndex={-1}
                  disabled={disabled}
                  aria-label={labels.removeFilter(token)}
                  onClick={() => {
                    remove(index)
                    input.current?.focus()
                  }}
                />
              </span>
            </PresenceItem>
          ))}
          {/* A list holds only <li>s (axe list), so the field is the last item; the chips give their own place in the set. */}
          <PresenceItem as="li" key={'\u0000input'} data-slot="filter-chips-input-item" className="flex min-w-24 flex-1">
            <InputGroupInput
              ref={(node: HTMLInputElement | null) => {
                input.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
              }}
              id={id}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={text}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
              placeholder={placeholder ?? (tokens.length ? labels.queryAddAnother : labels.queryPlaceholder)}
              onChange={(event) => {
                if (error) setError(null)
                setText(event.target.value)
              }}
              onKeyDown={onInputKeyDown}
              onPaste={onPaste}
              onBlur={() => {
                addTyped()
                onBlur?.()
              }}
              className="h-7 own:px-1.5 font-mono text-ui-sm"
            />
          </PresenceItem>
        </PresenceList>
      </InputGroup>
      <Collapse open={!!error}>
        <p id={errorId} role="alert" data-slot="filter-chips-error" className="own:pt-1.5 own:text-ui-sm own:font-medium own:text-danger">
          {error}
        </p>
      </Collapse>
      <span id={hintId} data-slot="filter-chips-hint" className="sr-only">
        {labels.queryChipHint}
      </span>
      {name && tokens.map((token) => <input key={token} type="hidden" name={name} value={token} />)}
      {announcer}
    </div>
  )
}

export { FilterChips, type FilterChipsProps }
