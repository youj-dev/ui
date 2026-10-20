'use client'

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { SlidingIndicator } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { useFilterBuilder } from './filter-builder-context'

/* The tokens a rule is written in ("Stage" "is not" "Lost") and the menu each
 * one opens. A token is a soft, borderless segment at the small control
 * height; a rule's tokens sit side by side as one unit, a hairline apart.
 * Its popup is the builder's one open popup (`open` in the context), so
 * adding a rule can open its field menu and picking a field can go on to the
 * value.
 *
 * The menu is a listbox: arrows, Home and End move, Enter or Space picks,
 * a letter jumps to the next option that starts with it. A list of FILTER_AT
 * or more opens with a field that narrows it as you type (focus stays in
 * the field; the arrows still move through the list). One choice closes it;
 * a multiple-choice list toggles and stays open. The highlight is a
 * SlidingIndicator, as in the kit's menus. */

const FILTER_AT = 8

/** One segment of a rule. Hover and the open popup fill it a step deeper. */
const tokenClass = cn(
  'relative inline-flex h-control-sm min-w-0 shrink-0 items-center gap-1 own:bg-band own:px-2.5 own:text-ui whitespace-nowrap select-none',
  'own:rounded-xs first:rounded-s-control-sm last:rounded-e-control-sm',
  'transition-[background-color,color] yj-duration-fast ease-standard',
  'own:hover:bg-selected own:data-popup-open:bg-selected focus-ring focus-visible:z-10',
  'disabled:pointer-events-none disabled:opacity-50',
)

interface MenuOption {
  value: string
  label: string
}

interface TokenProps {
  /** The token's popup key in the builder, e.g. `field:fb3`. */
  popup: string
  /** What the token is ("Field"): it names the popup, and the token with what it says now ("Field: Stage"). */
  name: string
  /** What it says now, for its name. */
  spoken?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  ref?: Ref<HTMLButtonElement>
  className?: string
  /** What the token shows. */
  children: ReactNode
  /** The popup's content. */
  content: ReactNode
}

function Token({ popup, name, spoken, children, content, className, ref, ...aria }: TokenProps) {
  const { open, setOpen, openNow, disabled } = useFilterBuilder()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const refs = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  return (
    <Popover open={open === popup} onOpenChange={(next) => setOpen(next ? popup : open === popup ? null : open)}>
      <PopoverTrigger
        ref={refs}
        disabled={disabled}
        data-slot="filter-token"
        data-yj-token={popup.split(':')[0]}
        aria-label={spoken ? `${name}: ${spoken}` : name}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' || open === popup) return
          event.preventDefault()
          setOpen(popup)
        }}
        className={cn(tokenClass, aria['aria-invalid'] && 'own:bg-danger-subtle own:text-danger-text own:hover:bg-danger-subtle', className)}
        {...aria}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        aria-label={name}
        data-slot="filter-builder-menu"
        // Closing hands focus back to the token, unless it is handing on to another token's popup.
        finalFocus={() => {
          const now = openNow()
          return now === null || now === popup ? triggerRef.current : false
        }}
        className="w-max min-w-44 max-w-72 gap-0 own:p-1"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

interface OptionListProps {
  /** Names the listbox ("Field"). */
  label: string
  options: MenuOption[]
  selected: string[]
  multiple?: boolean
  onPick: (value: string) => void
}

function OptionList({ label, options, selected, multiple, onPick }: OptionListProps) {
  const { labels } = useFilterBuilder()
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const filterable = options.length >= FILTER_AT
  const needle = query.trim().toLocaleLowerCase()
  const shown = needle ? options.filter((o) => o.label.toLocaleLowerCase().includes(needle)) : options
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => selected.includes(o.value)),
    ),
  )
  const current = Math.min(active, shown.length - 1)
  const optionId = (index: number) => `${id}-${index}`

  const move = (index: number) => {
    setActive(index)
    listRef.current?.querySelector(`[id="${optionId(index)}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const last = shown.length - 1
    if (last < 0) return
    const key = event.key
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      event.preventDefault()
      if (key === 'Home') return move(0)
      if (key === 'End') return move(last)
      return move(key === 'ArrowDown' ? (current >= last ? 0 : current + 1) : current <= 0 ? last : current - 1)
    }
    if (key === 'Enter' || (key === ' ' && !filterable)) {
      event.preventDefault()
      const option = shown[current]
      if (option) onPick(option.value)
      return
    }
    // Typeahead: a letter jumps to the next option that starts with it.
    if (!filterable && key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const letter = key.toLocaleLowerCase()
      const order = [...shown.slice(current + 1), ...shown.slice(0, current + 1)]
      const hit = order.find((o) => o.label.toLocaleLowerCase().startsWith(letter))
      if (hit) move(shown.indexOf(hit))
    }
  }

  const activeId = shown.length ? optionId(current) : undefined
  return (
    <>
      {filterable && (
        <input
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          className="own:mb-1 h-control-sm w-full own:rounded-md own:border-b own:border-line-subtle own:bg-transparent own:px-2 own:text-ui outline-none placeholder:text-fg-muted"
        />
      )}
      <div
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        aria-multiselectable={multiple || undefined}
        aria-activedescendant={filterable ? undefined : activeId}
        tabIndex={filterable ? -1 : 0}
        onKeyDown={filterable ? undefined : onKeyDown}
        className="relative isolate own:flex max-h-64 flex-col overflow-y-auto overscroll-contain outline-none yj-scrollbar"
      >
        {shown.map((option, index) => {
          const on = selected.includes(option.value)
          return (
            <div
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={on}
              data-highlighted={index === current || undefined}
              onPointerMove={() => index !== current && setActive(index)}
              onClick={() => onPick(option.value)}
              className="relative own:flex min-h-control-sm cursor-default items-center gap-2 own:rounded-md own:px-2 own:pe-8 own:text-ui select-none data-highlighted:yj-on-cursor"
            >
              <span className="truncate">{option.label}</span>
              {on && <CheckIcon trigger="mount" size={16} strokeWidth={2.25} className="absolute end-2 own:text-accent" />}
            </div>
          )
        })}
        {shown.length === 0 && <p className="own:px-2 own:py-1.5 own:text-ui own:text-fg-muted">{labels.noResults}</p>}
        <SlidingIndicator match="[data-highlighted]" linger className="own:rounded-md own:bg-cursor" />
      </div>
    </>
  )
}

export { OptionList, Token }
