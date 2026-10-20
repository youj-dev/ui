'use client'

import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useLabels } from '@youj/core'
import { SearchIcon, XIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { Kbd } from '../../../components/ui/kbd'
import { useSidebar } from '../../../components/ui/sidebar'

/* A sidebar's filter field: the kit's input group with a search icon, the
 * `/` key on a cap that reaches the field from anywhere but a text field,
 * and a clear button once something is typed. Enter goes to the first match,
 * ↓ hands the keyboard to the list, Escape clears (the phone's sheet closes
 * on the next one). It hides with the labels when the sidebar folds to
 * icons. Its landmark is search: the filter is how the sidebar is searched. */

/** A keystroke meant for a text field, not for the app. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export interface FrameFilterFieldProps {
  query: string
  onQuery: (query: string) => void
  /** Enter: go to the first match. */
  onSubmit?: () => void
  /** ↓: move into the list. */
  onEnterList?: () => void
  /** The field's name and hint. Default: the provider's "Filter pages". */
  label?: string
  placeholder?: string
  /** `/` focuses the field from anywhere. Default true. */
  shortcut?: boolean
}

export function FrameFilterField({ query, onQuery, onSubmit, onEnterList, label, placeholder, shortcut = true }: FrameFilterFieldProps) {
  const labels = useLabels()
  const { isMobile, openMobile, state, setOpen } = useSidebar()
  const field = useRef<HTMLInputElement>(null)
  const reach = shortcut && (!isMobile || openMobile)
  useEffect(() => {
    if (!reach) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented || isTyping(event.target)) return
      event.preventDefault()
      // Folded to icons the field is hidden: the sidebar opens first.
      if (state === 'collapsed' && !isMobile) setOpen(true)
      requestAnimationFrame(() => field.current?.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reach, state, isMobile, setOpen])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSubmit) {
      event.preventDefault()
      onSubmit()
    } else if (event.key === 'ArrowDown' && onEnterList) {
      event.preventDefault()
      onEnterList()
    } else if (event.key === 'Escape' && query) {
      // Clears first; a second Escape reaches the sheet (on phones) and closes it.
      event.preventDefault()
      event.stopPropagation()
      onQuery('')
    }
  }
  return (
    <div role="search" data-slot="frame-filter" className="group-data-[collapsible=icon]:hidden">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={field}
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? labels.filterPagesPlaceholder}
          aria-label={label ?? labels.filterPages}
          aria-keyshortcuts={shortcut ? '/' : undefined}
          autoComplete="off"
          spellCheck={false}
          className="[&::-webkit-search-cancel-button]:appearance-none"
        />
        <InputGroupAddon align="inline-end">
          {query ? (
            <InputGroupButton size="icon-xs" aria-label={labels.clearFilter} onClick={() => onQuery('')}>
              <XIcon />
            </InputGroupButton>
          ) : (
            shortcut && <Kbd aria-hidden>/</Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
