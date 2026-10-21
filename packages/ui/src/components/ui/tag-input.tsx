'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
} from 'react'
import { animate } from 'motion/react'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { tagInputLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Badge, BadgeRemove } from './badge'
import { useFieldRequired } from './field'
import { InputGroup, InputGroupInput } from './input-group'

/* Free-form values as chips: an InputGroup whose text field sits inline after
 * the chips and wraps with them. Enter or a comma adds what you typed; a
 * pasted list ("a, b, c" or one per line) adds each. A value the `validate`
 * function rejects stays in the field: the frame shakes (a decaying 4/3/2 px,
 * the slow token), the border turns destructive and the reason grows in under
 * it (motion's Collapse) and is read out. A duplicate isn't added: the chip
 * that already holds it flashes, so you can see where it is. Chips enter,
 * leave and reorder through PresenceList (fade into the slot, glide aside).
 * Reduced motion: no shake or glide, the flash and message still show.
 *
 * Keyboard: in the field, Backspace (when empty) or ArrowLeft (at the start)
 * reaches the last chip. On a chip: arrows move between chips, Alt+arrows
 * move the chip itself, Home/End jump, Backspace or Delete removes it and
 * focus lands on its neighbor, Escape returns to the field. Moves and
 * removals are announced. */

interface TagInputProps {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Returns a reason to reject a tag, or nothing to accept it. `tags` is the current list. */
  validate?: (tag: string, tags: string[]) => string | null | undefined | void
  /** Keys that commit the typed text, besides Enter. Default [","]. */
  delimiters?: string[]
  /** Adds the typed text when the field loses focus. Default true. */
  addOnBlur?: boolean
  /** The most tags; the field stops accepting new ones at the limit. */
  maxTags?: number
  placeholder?: string
  disabled?: boolean
  /** Also submits each tag with a native form, under this name. */
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  'aria-label'?: string
}

const splitPattern = /[,\n\t;]+/

function TagInput({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  validate,
  delimiters = [','],
  addOnBlur = true,
  maxTags,
  placeholder,
  disabled,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
}: TagInputProps) {
  const k = useYouj()
  const labels = useComponentLabels(tagInputLabels)
  placeholder ??= labels.addTag
  const rtl = useDirection() === 'rtl'
  const [tags, setTags] = useControllableState(valueProp, defaultValue)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [focusChip, setFocusChip] = useState<number | null>(null)
  const { announce, announcer } = useAnnouncer()
  const errorId = useId()
  const hintId = useId()
  const frame = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const full = maxTags !== undefined && tags.length >= maxTags
  const required = useFieldRequired()

  const commit = (next: string[]) => {
    setTags(next)
    onValueChange?.(next)
  }

  const chipButtons = () => [
    ...(frame.current?.querySelectorAll<HTMLButtonElement>(
      '[data-slot=tag-input-chips] > li:not([inert]) [data-slot=badge-remove]',
    ) ?? []),
  ]

  // After a removal or a move, focus lands on the right chip once it's rendered.
  useEffect(() => {
    if (focusChip === null) return
    const buttons = chipButtons()
    if (buttons.length === 0) input.current?.focus()
    else buttons[Math.min(focusChip, buttons.length - 1)]?.focus()
    setFocusChip(null)
  })

  // The duplicate's flash fades after the deliberate token.
  useEffect(() => {
    if (flash === null) return
    const timer = setTimeout(() => setFlash(null), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  }, [flash, k])

  const reject = (reason: string) => {
    setError(reason)
    if (!k.reduced && frame.current) {
      animate(frame.current, { x: [0, -4, 4, -3, 3, -2, 0] }, k.tween('slow', 'standard'))
    }
  }

  /** Adds each candidate that passes; returns the ones that didn't, with the first reason. */
  const add = (candidates: string[]) => {
    const next = [...tags]
    const rejected: string[] = []
    let reason: string | null = null
    let duplicate: string | null = null
    for (const raw of candidates) {
      const tag = raw.trim()
      if (!tag) continue
      const existing = next.find((t) => t.toLowerCase() === tag.toLowerCase())
      if (existing) {
        duplicate ??= existing
        continue
      }
      if (maxTags !== undefined && next.length >= maxTags) {
        rejected.push(tag)
        reason ??= labels.upToTags(maxTags)
        continue
      }
      const problem = validate?.(tag, next)
      if (problem) {
        rejected.push(tag)
        reason ??= problem
        continue
      }
      next.push(tag)
    }
    const added = next.length - tags.length
    if (added > 0) {
      commit(next)
      announce(added === 1 ? labels.added(next.at(-1)!) : labels.addedTags(added))
    }
    if (duplicate && !reason) {
      setFlash(duplicate)
      announce(labels.alreadyAdded(duplicate))
    }
    if (reason) reject(reason)
    return rejected
  }

  const addTyped = () => {
    if (!text.trim()) return
    const rejected = add([text])
    setText(rejected.join(', '))
  }

  const remove = (index: number) => {
    const tag = tags[index]
    if (tag === undefined) return
    commit(tags.filter((_, i) => i !== index))
    announce(labels.removed(tag))
  }

  const move = (index: number, to: number) => {
    if (to < 0 || to >= tags.length) return
    const next = [...tags]
    const [tag] = next.splice(index, 1)
    next.splice(to, 0, tag!)
    commit(next)
    setFocusChip(to)
    announce(labels.movedTo(tag!, to + 1, next.length))
  }

  const [back, forward] = rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight']

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const atStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0
    if (event.key === 'Enter' || delimiters.includes(event.key)) {
      // Enter with nothing typed is left alone, so it can still submit a form.
      if (event.key === 'Enter' && !text.trim()) return
      event.preventDefault()
      addTyped()
    } else if ((event.key === 'Backspace' && text === '') || (event.key === back && atStart)) {
      if (tags.length === 0) return
      event.preventDefault()
      chipButtons().at(-1)?.focus()
    }
  }

  /* Text that arrives without a key press (autofill, drop, an IME commit, a
   * programmatic fill) can carry delimiters: every finished item is added and
   * the text after the last delimiter stays in the field. */
  const onTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null)
    const value = event.target.value
    const separators = [',', '\n', '\t', ';', ...delimiters.filter((d) => d.length === 1)]
    const at = Math.max(...separators.map((d) => value.lastIndexOf(d)))
    if (at < 0 || (event.nativeEvent as InputEvent).isComposing) {
      setText(value)
      return
    }
    const rest = value.slice(at + 1).trimStart()
    const items = separators.reduce((parts, d) => parts.flatMap((part) => part.split(d)), [value.slice(0, at)])
    const rejected = add(items)
    setText([...rejected, rest].filter(Boolean).join(', '))
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    if (!splitPattern.test(pasted)) return
    event.preventDefault()
    const rejected = add((text + pasted).split(splitPattern))
    setText(rejected.join(', '))
  }

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = chipButtons()
    const focus = (to: number) => {
      event.preventDefault()
      if (to >= buttons.length) input.current?.focus()
      else buttons[Math.max(0, to)]?.focus()
    }
    if (event.altKey && (event.key === back || event.key === forward)) {
      event.preventDefault()
      move(index, index + (event.key === back ? -1 : 1))
    } else if (event.key === back) focus(index - 1)
    else if (event.key === forward) focus(index + 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(buttons.length - 1)
    else if (event.key === 'Escape') focus(buttons.length)
    else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      remove(index)
      setFocusChip(Math.max(0, event.key === 'Backspace' ? index - 1 : index))
    }
  }

  const onFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, input')) return
    input.current?.focus()
  }

  return (
    <div data-slot="tag-input" className={cn('own:flex own:w-full own:min-w-0 flex-col', className)}>
      {/* shape: a field that wraps its tags grows past one control height; rounded-field-area is the theme's corner for a multi-line field */}
      <InputGroup
        ref={frame}
        role={undefined}
        onClick={onFrameClick}
        data-invalid={error ? '' : undefined}
        className="h-auto min-h-control own:rounded-field-area cursor-text own:py-1 own:ps-1.5 own:pe-1.5 own:data-invalid:border-danger"
      >
        <PresenceList
          as="ul"
          data-slot="tag-input-chips"
          aria-label={labels.tags}
          aria-disabled={disabled || undefined}
          className="own:flex own:min-w-0 own:flex-1 flex-wrap items-center gap-1"
        >
          {tags.map((tag, index) => (
            <PresenceItem as="li" key={tag} aria-setsize={tags.length} aria-posinset={index + 1} className="own:flex own:min-w-0">
              <Badge
                variant="secondary"
                data-flash={flash === tag || undefined}
                className={cn(
                  'own:max-w-full own:min-w-0 gap-1 own:ps-2 own:pe-1 own:text-fg focus-ring-within',
                  'transition-[background-color,box-shadow] yj-duration-slow ease-standard',
                  'own:data-flash:bg-warning-line data-flash:shadow-[inset_0_0_0_1px_var(--color-warning)] data-flash:yj-duration-instant',
                )}
              >
                <span className="truncate">{tag}</span>
                <BadgeRemove
                  tabIndex={-1}
                  disabled={disabled}
                  aria-label={labels.remove(tag)}
                  aria-describedby={hintId}
                  onClick={() => {
                    remove(index)
                    input.current?.focus()
                  }}
                  onKeyDown={(event) => onChipKeyDown(event, index)}
                />
              </Badge>
            </PresenceItem>
          ))}
          {/* A list holds only <li>s (axe list), so the field is the last item; the chips give their own place in the set. */}
          <PresenceItem as="li" key={'\u0000input'} className="own:flex own:min-w-20 own:flex-1">
            <InputGroupInput
              ref={(node: HTMLInputElement | null) => {
                input.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
              }}
              id={id}
              aria-label={ariaLabel}
              // The list is what's required, not the text being typed: no native `required`.
              required={false}
              aria-required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={text}
              disabled={disabled}
              placeholder={full ? labels.limitOfReached(maxTags!) : tags.length ? undefined : placeholder}
              readOnly={full}
              onChange={onTextChange}
              onKeyDown={onInputKeyDown}
              onPaste={onPaste}
              onBlur={() => {
                if (addOnBlur) addTyped()
                onBlur?.()
              }}
              className="h-6 own:px-1"
            />
          </PresenceItem>
        </PresenceList>
      </InputGroup>
      <Collapse open={!!error}>
        <p id={errorId} role="alert" className="pt-1.5 own:text-ui-sm own:font-medium own:text-danger">
          {error}
        </p>
      </Collapse>
      <span id={hintId} className="sr-only">
        {labels.tagHint}
      </span>
      {name && tags.map((tag) => <input key={tag} type="hidden" name={name} value={tag} />)}
      {announcer}
    </div>
  )
}

export { TagInput, type TagInputProps }
