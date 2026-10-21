'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { useYouj, useLabels } from '@youj/core'
import { SearchIcon, XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../components/ui/input-group'
import { Kbd } from '../../components/ui/kbd'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { useFrame } from './shell'
import { matchPages, pagesOf, type Page } from './search-field/pages'
import { Suggestions } from './search-field/suggestions'

/* A search field for a frame's top bar that suggests pages as you type: the
 * frame's pages, each with its icon and where it lives (its section, or its
 * parent for a nested page), best matches first with the match picked out.
 * It's an ARIA combobox: ↑ ↓ move through the suggestions (a highlight
 * glides to the active one), Enter goes there, Escape closes the list and
 * then clears the field. Enter with no suggestion to go to calls `onSearch`.
 * `/` focuses it from anywhere you aren't typing. On phones the field waits
 * behind a search icon and opens out of it across the bar; Escape, going to
 * a page or leaving it folds it back into the icon. Reduced motion: the
 * same states, at once. */

interface FrameSearchFieldProps {
  /** The field's placeholder. Default "Search…". */
  placeholder?: string
  /** Enter with no page to go to: search everything for the query (your search page, say). */
  onSearch?: (query: string) => void
  className?: string
}

/** Where `/` keeps its own meaning: text you're typing, and widgets that own their keys. */
const TYPING = 'input, textarea, select, [role=dialog], [role=alertdialog], [role=menu], [role=listbox], [role=grid]'

function FrameSearchField({ placeholder, onSearch, className }: FrameSearchFieldProps) {
  const { nav, navigate } = useFrame()
  const labels = useLabels()
  const k = useYouj()
  const id = useId()
  const listId = `${id}-pages`
  const optionId = (page: string) => `${id}-page-${page}`
  const input = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Where the phone's field opens from: the icon's box, as a clip.
  const [from, setFrom] = useState<string>()
  const { announce, announcer } = useAnnouncer()

  const pages = useMemo(() => pagesOf(nav), [nav])
  const results = useMemo(() => matchPages(pages, query), [pages, query])
  // A closing list keeps its rows while it fades, rather than changing under the fade.
  const [kept, setKept] = useState(results)
  if (open && kept !== results) setKept(results)
  const rows = open ? results : kept
  const current = Math.min(active, rows.length - 1)
  const activePage = open ? rows[current] : undefined
  const listed = open && results.length > 0
  const empty = labels.pagesNoMatch(query.trim())

  // How many pages the query finds, once typing settles.
  const delay = k.ms('slow')
  useEffect(() => {
    if (!open) return
    const n = results.length
    const timer = setTimeout(() => announce(n ? labels.pagesFound(n) : empty), delay)
    return () => clearTimeout(timer)
  }, [open, results, empty, delay, announce, labels])

  // The active suggestion stays in sight in a list long enough to scroll.
  useEffect(() => {
    const el = list.current
    const option = el?.querySelector<HTMLElement>('[aria-selected=true]')
    if (!el || !option || !open) return
    const top = option.offsetTop - 4
    const bottom = option.offsetTop + option.offsetHeight + 4
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  }, [current, open, rows])

  const expand = useCallback(() => {
    const a = opener.current?.getBoundingClientRect()
    const b = panel.current?.getBoundingClientRect()
    // Shown before focus moves, in the same gesture, or a phone won't raise its keyboard.
    flushSync(() => {
      if (a && b) setFrom(`inset(${a.top - b.top}px ${b.right - a.right}px ${b.bottom - a.bottom}px ${a.left - b.left}px round var(--radius-md))`)
      setExpanded(true)
    })
    input.current?.focus()
  }, [])
  const collapse = (refocus: boolean) => {
    setOpen(false)
    setExpanded(false)
    if (refocus) opener.current?.focus()
  }

  // `/` from anywhere you aren't typing. Below md the field is behind its icon, which opens it.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest(TYPING))) return
      event.preventDefault()
      if (opener.current?.offsetParent) expand()
      else input.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [expand])

  const go = (page: Page) => {
    navigate(page.id)
    setQuery('')
    if (expanded) collapse(true)
    else setOpen(false)
  }
  const clear = () => {
    setQuery('')
    setOpen(false)
    input.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    const down = event.key === 'ArrowDown'
    if (down || event.key === 'ArrowUp') {
      event.preventDefault()
      const n = results.length
      if (event.altKey) {
        // Alt+↓ shows the suggestions with none active yet; Alt+↑ hides them.
        setOpen(down)
        if (down) setActive(-1)
      } else if (!open) {
        setOpen(true)
        setActive(down ? 0 : n - 1)
      } else if (n) {
        setActive(current < 0 ? (down ? 0 : n - 1) : (current + (down ? 1 : -1) + n) % n)
      }
    } else if (event.key === 'Enter') {
      if (activePage) {
        event.preventDefault()
        go(activePage)
      } else if (query.trim()) {
        event.preventDefault()
        setOpen(false)
        onSearch?.(query.trim())
      }
    } else if (event.key === 'Escape') {
      if (!open && !query && !expanded) return
      event.preventDefault()
      event.stopPropagation()
      if (open) setOpen(false)
      else if (query) setQuery('')
      else collapse(true)
    }
  }

  const trailing = query ? (
    <InputGroupButton size="icon-xs" aria-label={labels.clearSearch} onClick={clear}>
      <XIcon size={14} strokeWidth={1.75} />
    </InputGroupButton>
  ) : expanded ? (
    <InputGroupButton size="icon-xs" aria-label={labels.close} onClick={() => collapse(true)} className="md:hidden">
      <XIcon size={14} strokeWidth={1.75} />
    </InputGroupButton>
  ) : focused ? null : (
    <Kbd aria-hidden className="transition-opacity yj-duration-fast ease-standard starting:opacity-0 max-md:hidden">
      /
    </Kbd>
  )

  return (
    <div
      role="search"
      aria-label={labels.search}
      data-frame-search="field"
      data-slot="frame-search-field"
      // The phone's field folds away once focus leaves it and its buttons.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExpanded(false)
      }}
      className={cn('md:w-56 lg:w-64', className)}
    >
      <Button
        ref={opener}
        variant="ghost"
        size="icon"
        aria-label={labels.search}
        aria-expanded={expanded}
        onClick={expand}
        className="md:hidden"
      >
        <SearchIcon size={16} strokeWidth={1.75} />
      </Button>
      <div
        ref={panel}
        data-slot="frame-search-panel"
        data-expanded={expanded || undefined}
        style={{ '--frame-search-from': from ?? 'inset(0 0 0 100%)' } as CSSProperties}
        className={cn(
          'md:relative',
          // Phones: across the bar, clipped to the icon's box until it opens out of it.
          'max-md:invisible max-md:absolute max-md:inset-0 max-md:z-50 max-md:flex max-md:items-center max-md:bg-canvas max-md:px-3 max-md:opacity-0',
          'max-md:[clip-path:var(--frame-search-from)] max-md:transition-[clip-path,opacity,visibility] max-md:yj-duration-fast max-md:ease-exit',
          'data-expanded:max-md:visible data-expanded:max-md:opacity-100 data-expanded:max-md:[clip-path:inset(0_0_-100vh_0_round_0)]',
          'data-expanded:max-md:transition-[clip-path,opacity] data-expanded:max-md:yj-duration-base data-expanded:max-md:ease-enter',
        )}
      >
        <InputGroup className="transition-[border-color,box-shadow,background-color]">
          <InputGroupAddon>
            <SearchIcon active={focused} size={16} strokeWidth={1.75} />
          </InputGroupAddon>
          <InputGroupInput
            ref={input}
            role="combobox"
            aria-label={labels.search}
            aria-expanded={listed}
            aria-controls={listId}
            aria-activedescendant={listed && activePage ? optionId(activePage.id) : undefined}
            aria-autocomplete="list"
            aria-keyshortcuts="/"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder={placeholder ?? labels.searchPlaceholder}
            value={query}
            onChange={(event) => {
              const next = event.target.value
              setQuery(next)
              setActive(0)
              setOpen(next.trim() !== '')
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            // Suggestions belong to the field: they close when it loses focus (pressing one doesn't take it).
            onBlur={() => {
              setFocused(false)
              setOpen(false)
            }}
            onMouseDown={() => {
              if (query.trim()) setOpen(true)
            }}
          />
          <InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
        </InputGroup>
        <Suggestions
          open={open}
          rows={rows}
          current={current}
          listId={listId}
          optionId={optionId}
          listRef={list}
          empty={empty}
          searchable={Boolean(onSearch)}
          onActive={setActive}
          onPick={go}
        />
      </div>
      {announcer}
    </div>
  )
}

export { FrameSearchField }
export type { FrameSearchFieldProps }
