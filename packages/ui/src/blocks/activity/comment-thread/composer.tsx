'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { InputGroup, InputGroupTextarea } from '../../../components/ui/input-group'
import { cn } from '../../../lib/utils'
import { ComposerBar, FORMATS, useApple } from './composer-bar'
import type { CommentThreadCopy, CommentThreadPerson } from './data'
import { handleOf, mentionIds, peopleByHandle } from './markdown'
import { caretPoint, matchPeople, mentionAt, MentionList } from './mentions'

/* The comment field: a plain textarea that grows with its text, a row of
 * formatting under it and the send button. Typing @ opens the people list at
 * the caret (↑ ↓ to choose, Enter or Tab to insert, Esc to close); ⌘/Ctrl+B,
 * I and E wrap the selection in bold, italic or code; ⌘/Ctrl+Enter sends;
 * Esc cancels an edit or a reply; ↑ in an empty field edits your last
 * comment. Insertions go through the browser's own editing, so ⌘Z undoes
 * them like typing. */

interface Mention {
  start: number
  query: string
  active: number
  top: number
  x: number
  above: boolean
  rtl: boolean
}

export interface ComposerProps {
  people: readonly CommentThreadPerson[]
  copy: CommentThreadCopy
  /** The field's accessible name. */
  label: string
  placeholder: string
  submitLabel: string
  /** The text it opens with (an edit). */
  initial?: string
  autoFocus?: boolean
  /** Who's already in the conversation: they lead the mention list. */
  participants?: readonly string[]
  onSubmit: (body: string, mentions: string[]) => void
  /** Shows Cancel, and Esc calls it. */
  onCancel?: () => void
  /** ↑ in the empty field. */
  onEditLast?: () => void
  className?: string
}

export function Composer({
  people,
  copy,
  label,
  placeholder,
  submitLabel,
  initial = '',
  autoFocus,
  participants,
  onSubmit,
  onCancel,
  onEditLast,
  className,
}: ComposerProps) {
  const [value, setValue] = useState(initial)
  const [mention, setMention] = useState<Mention | null>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const selection = useRef<[number, number] | null>(null)
  const dismissed = useRef<number | null>(null)
  const listId = useId()
  const hintId = useId()
  const apple = useApple()
  const byHandle = useMemo(() => peopleByHandle(people), [people])
  const matches = useMemo(() => (mention ? matchPeople(people, mention.query, participants) : []), [mention, people, participants])
  const open = mention !== null && matches.length > 0

  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    // A selection the fallback path wrote, restored once React has the new value.
    if (selection.current) {
      el.setSelectionRange(...selection.current)
      selection.current = null
    }
  })
  useLayoutEffect(() => {
    const el = field.current
    if (!autoFocus || !el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [autoFocus])
  useLayoutEffect(() => {
    // Keep the list inside the composer's width.
    const el = list.current
    const box = wrap.current
    if (!el || !box || !mention) return
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const shift = r.right > b.right ? b.right - r.right : r.left < b.left ? b.left - r.left : 0
    el.style.left = `${mention.x + shift}px`
  })

  /** Reads the mention at the caret, and where its list goes. */
  const track = (el: HTMLTextAreaElement) => {
    const at = el.selectionStart === el.selectionEnd ? mentionAt(el.value, el.selectionStart) : null
    if (!at || at.start === dismissed.current) {
      if (!at) dismissed.current = null
      setMention(null)
      return
    }
    const caret = caretPoint(el, at.start)
    const fieldBox = el.getBoundingClientRect()
    const box = wrap.current!.getBoundingClientRect()
    const rtl = getComputedStyle(el).direction === 'rtl'
    const room = window.innerHeight - (fieldBox.top + caret.top + caret.height)
    const above = room < 220 && fieldBox.top + caret.top > room
    setMention((current) => ({
      start: at.start,
      query: at.query,
      active: current?.start === at.start && current.query === at.query ? current.active : 0,
      top: fieldBox.top - box.top + caret.top + (above ? -4 : caret.height + 4),
      // From the @: a little before it in the reading direction.
      x: fieldBox.left - box.left + caret.left + (rtl ? 14 : -6),
      above,
      rtl,
    }))
  }

  /** Replaces a range through the browser's editing (so ⌘Z undoes it), or by hand where that isn't there. */
  const replace = (start: number, end: number, text: string, select?: [number, number]) => {
    const el = field.current
    if (!el) return
    el.focus()
    el.setSelectionRange(start, end)
    let done = false
    try {
      done = document.execCommand('insertText', false, text)
    } catch {
      done = false
    }
    if (done) {
      if (select) el.setSelectionRange(...select)
      track(el)
      return
    }
    setValue(el.value.slice(0, start) + text + el.value.slice(end))
    selection.current = select ?? [start + text.length, start + text.length]
  }

  const pick = (person: CommentThreadPerson) => {
    const el = field.current
    if (!el || !mention) return
    const insert = `@${handleOf(person)} `
    setMention(null)
    replace(mention.start, el.selectionStart, insert)
  }

  const format = (marker: string) => {
    const el = field.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const selected = el.value.slice(start, end)
    replace(start, end, `${marker}${selected}${marker}`, [start + marker.length, end + marker.length])
  }

  const insertAt = () => {
    const el = field.current
    if (!el) return
    const start = el.selectionStart
    const before = el.value[start - 1]
    dismissed.current = null
    replace(start, el.selectionEnd, before && !/\s/.test(before) ? ' @' : '@')
  }

  const submit = () => {
    const body = value.trim()
    if (!body) return
    onSubmit(body, mentionIds(body, byHandle))
    setValue('')
    setMention(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return
    if (open && mention) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setMention({ ...mention, active: (mention.active + step + matches.length) % matches.length })
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        pick(matches[mention.active]!)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        dismissed.current = mention.start
        setMention(null)
        return
      }
    }
    const mod = event.metaKey || event.ctrlKey
    if (event.key === 'Enter' && mod) {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape' && onCancel) {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
    } else if (event.key === 'ArrowUp' && !value && onEditLast) {
      event.preventDefault()
      onEditLast()
    } else if (mod && !event.shiftKey && !event.altKey) {
      const found = FORMATS.find((f) => f.letter === event.key.toUpperCase())
      if (found) {
        event.preventDefault()
        format(found.marker)
      }
    }
  }

  return (
    <div ref={wrap} data-slot="composer" className={cn('@container/composer relative', className)}>
      <InputGroup className="flex-col">
        <InputGroupTextarea
          ref={field}
          rows={2}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={hintId}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && mention ? `${listId}-${mention.active}` : undefined}
          onChange={(event) => {
            setValue(event.currentTarget.value)
            track(event.currentTarget)
          }}
          onSelect={(event) => track(event.currentTarget)}
          onKeyDown={onKeyDown}
          onBlur={() => setMention(null)}
          className="min-h-15 max-h-60"
        />
        <ComposerBar
          copy={copy}
          apple={apple}
          hintId={hintId}
          submitLabel={submitLabel}
          canSend={value.trim().length > 0}
          onFormat={format}
          onMention={insertAt}
          onCancel={onCancel}
          onSubmit={submit}
        />
      </InputGroup>
      {open && mention && (
        <MentionList
          ref={list}
          id={listId}
          label={copy.mentionList}
          people={matches}
          active={mention.active}
          top={mention.top}
          x={mention.x}
          above={mention.above}
          rtl={mention.rtl}
          onPick={pick}
          onHover={(active) => setMention({ ...mention, active })}
        />
      )}
      {/* Says how many match while the list is open; there from the first render so it's heard. */}
      <span role="status" className="sr-only">
        {mention ? copy.mentionResults(matches.length) : ''}
      </span>
    </div>
  )
}
