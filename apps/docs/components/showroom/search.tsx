'use client'

import { useDeferredValue, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { CornerDownLeftIcon, SearchIcon, XIcon } from '@youj/icons'
import { ActionIsland, ActionIslandTile } from '@youj/react/components/ui/action-island'
import { Button, Kbd, Popover, PopoverContent, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@youj/react'
import { cn } from '@/lib/cn'
import { hasThumb, Thumbs, type ShowroomItem } from './thumb'

/* A showroom's search: a magnifier beside the viewfinder (a companion island of its own beside the hero's island, a
 * button at the end of the row under the stage on narrow screens) that opens a panel rising from the island over the
 * stage (a bottom sheet from the row): a field, the area's categories as chips (any number on), then every item that
 * matches as a roomy list, ranked by the area's own search. Typing filters, ↑ and ↓ move through the list (the field
 * keeps the focus: a combobox whose active option is aria-activedescendant), Enter puts the item on stage and closes,
 * Escape closes, and focus goes back to the magnifier. `/` opens it from anywhere on the page that isn't a field. It
 * rises on a spring with a quick fade and leaves quieter (a short fade and a few px); under reduced motion it only
 * appears. */

/** One item as the search lists it. */
export interface SearchEntry {
  item: ShowroomItem
  /** The line under its name: `Lifecycle · IllustrationEmpty`. */
  meta?: string
  /** A few of its words, faint under the meta line. */
  tags?: readonly string[]
  /** Its category's id, for the chips. */
  category?: string
}

export interface ShowroomSearchHandle {
  /** Opens the panel, optionally searching for something or narrowed to categories (a tag or a category picked elsewhere). */
  open: (preset?: { q?: string; categories?: string[] }) => void
}

export interface ShowroomSearchProps {
  /** Beside the hero's island (the panel rises over the stage) or at the end of the row under it (a bottom sheet). */
  placement: 'island' | 'row'
  /** `miniature`, `miniatures`. */
  noun: string
  plural: string
  /** Every item, in the area's order. */
  entries: readonly SearchEntry[]
  /** The ids that match a query, best first (every id in order for an empty one): the area's own ranking. */
  find: (query: string) => readonly string[]
  /** The area's categories, as chips; none, no chips. */
  categories?: readonly { id: string; name: string }[]
  /** The item on show (marked in the list, and where ↑/↓ start from before anything is typed). */
  current: string
  onSelect: (id: string) => void
  ref?: Ref<ShowroomSearchHandle>
}

/** A critically damped spring with a 2% overshoot over 550ms, as a CSS easing: the panel's rise. */
const RISE = 'linear(0,0.049,0.164,0.307,0.454,0.589,0.705,0.8,0.873,0.928,0.966,0.992,1.007,1.016,1.019,1.02,1.018,1.016,1.013,1.01,1.007,1.005,1.003,1.002,1)'

export function ShowroomSearch({ placement, noun, plural, entries, find, categories, current, onSelect, ref }: ShowroomSearchProps) {
  const island = placement === 'island'
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  // The active option by id, so a list that changes under it keeps it where it can (the first result otherwise).
  const [activeId, setActiveId] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const listId = `${id}-list`
  const optionId = (item: string) => `${id}-${item}`

  const byId = useMemo(() => new Map(entries.map((e) => [e.item.id, e])), [entries])
  const found = useMemo(() => find(q.trim()).flatMap((i) => byId.get(i) ?? []), [find, q, byId])
  const results = useMemo(() => (chosen.length ? found.filter((e) => e.category !== undefined && chosen.includes(e.category)) : found), [found, chosen])
  const counts = useMemo(() => {
    const by = new Map<string, number>()
    for (const e of found) if (e.category) by.set(e.category, (by.get(e.category) ?? 0) + 1)
    return by
  }, [found])
  const at = Math.max(0, results.findIndex((e) => e.item.id === activeId))
  const active = results[at]

  const show = (preset?: { q?: string; categories?: string[] }) => {
    if (preset) {
      setQ(preset.q ?? '')
      setChosen(preset.categories ?? [])
    }
    // Nothing asked for yet: the list opens on the item on show, so ↑ and ↓ step from it.
    setActiveId(preset?.q || preset?.categories?.length || q || chosen.length ? null : current)
    setOpen(true)
  }
  useImperativeHandle(ref, () => ({ open: show }))

  // `/` from anywhere on the page that isn't a field.
  const showRef = useRef(show)
  showRef.current = show
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      showRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // The active option stays in view as the arrows move it, and the list opens scrolled to it.
  // (A frame later: the panel's list mounts after the panel opens; it opens with the active one in its middle.) Only the
  // list scrolls: scrollIntoView would scroll the page as well, to bring the row to the window's middle.
  const wasOpen = useRef(false)
  useEffect(() => {
    const opening = open && !wasOpen.current
    wasOpen.current = open
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const box = list.current
      const row = box?.querySelector<HTMLElement>('[data-active]')
      if (box && row) box.scrollTop = listScroll(box, row, opening)
    })
    return () => cancelAnimationFrame(frame)
  }, [open, at, results])

  const choose = (item: string) => {
    if (item !== current) onSelect(item)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = results.length
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (n) setActiveId(results[(at + (e.key === 'ArrowDown' ? 1 : -1) + n) % n]!.item.id)
    } else if (e.key === 'Enter' && active) {
      e.preventDefault()
      choose(active.item.id)
    }
  }

  const toggle = (category: string) => {
    setChosen((was) => (was.includes(category) ? was.filter((c) => c !== category) : [...was, category]))
    setActiveId(null)
  }
  const clear = () => {
    setQ('')
    setChosen([])
    setActiveId(null)
    input.current?.focus()
  }

  const label = `Search ${plural}`
  return (
    <Popover open={open} onOpenChange={(next) => (next ? show() : setOpen(false))}>
      {island ? (
        // A companion island of the docs' own: the kit's, one tile.
        <ActionIsland size="lg" aria-label={label}>
          <ActionIslandTile ref={trigger} label={label} render={<PopoverTrigger aria-keyshortcuts="/" />}>
            <SearchIcon />
          </ActionIslandTile>
        </ActionIsland>
      ) : (
        <Tooltip>
          <TooltipTrigger render={<PopoverTrigger render={<Button ref={trigger} variant="outline" size="icon-lg" aria-label={label} aria-keyshortcuts="/" className="shrink-0 bg-surface" />} />}>
            <SearchIcon size={18} strokeWidth={1.75} />
          </TooltipTrigger>
          <TooltipContent side="top">
            {label}
            <span className="ms-2 text-fg-subtle">/</span>
          </TooltipContent>
        </Tooltip>
      )}

      <PopoverContent
        aria-label={label}
        presentation={island ? 'popover' : 'sheet'}
        side="top"
        sideOffset={10}
        anchor={() => trigger.current?.closest('[data-showroom-dock]') ?? trigger.current}
        // The field takes the focus where it is: focusing it mid-rise mustn't scroll the page to it.
        initialFocus={() => {
          input.current?.focus({ preventScroll: true })
          return false
        }}
        style={{ '--rise': RISE } as CSSProperties}
        // shape: the island panel rises out of the showroom's dock and keeps the dock's own 22px corner
        className={cn(
          'gap-0 overflow-hidden p-0',
          island
            ? cn(
                'max-h-[min(34rem,calc(var(--available-height)-0.5rem))] w-(--anchor-width) rounded-[22px] border-line bg-overlay/(--yj-glass) shadow-lg backdrop-blur-[18px] backdrop-saturate-150',
                // Rises on a spring with a quick fade; leaves quieter, a short fade and a few px down.
                '[transition:opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-enter),transform_calc(550ms*var(--yj-motion,1))_var(--rise)]!',
                'data-[starting-style]:[transform:translateY(14px)_scale(0.97)]! data-[ending-style]:[transform:translateY(6px)_scale(0.99)]!',
                'data-[ending-style]:[transition:opacity_calc(var(--yj-duration-instant)*var(--yj-motion,1))_var(--ease-exit),transform_calc(var(--yj-duration-instant)*var(--yj-motion,1))_var(--ease-exit)]!',
              )
            : 'max-h-[85dvh] px-0!',
        )}
      >
        <div className={cn('flex shrink-0 items-center gap-3 border-b border-line px-4', island ? 'h-14' : 'h-12')}>
          <SearchIcon aria-hidden size={18} strokeWidth={1.75} className="shrink-0 text-fg-muted" />
          <input
            ref={input}
            role="combobox"
            aria-label={label}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active ? optionId(active.item.id) : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActiveId(null)
            }}
            onKeyDown={onKeyDown}
            placeholder={`Search ${entries.length} ${plural}…`}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          />
          {(q || chosen.length > 0) && (
            <button type="button" onClick={clear} aria-label="Clear the search" className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-fg-subtle outline-none focus-ring hover:bg-hover hover:text-fg">
              <XIcon size={14} strokeWidth={2} />
            </button>
          )}
          {island && <Kbd>esc</Kbd>}
        </div>

        {categories && categories.length > 0 && (
          // A row cut by the panel's edge fades out under it, so the chips past it read as more to come.
          <div
            role="group"
            aria-label="Categories"
            className="flex shrink-0 gap-1.5 overflow-x-auto overscroll-x-contain border-b border-line px-4 py-2.5 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((c) => {
              const on = chosen.includes(c.id)
              const none = !counts.get(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    'flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap outline-none focus-ring',
                    'transition-[background-color,border-color,color] duration-(--yj-duration-fast) ease-standard motion-reduce:transition-none',
                    on ? 'border-accent bg-accent-subtle text-accent-text' : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                    // Nothing in it for this search: there, but quiet.
                    none && !on && 'opacity-50',
                  )}
                >
                  {c.name}
                  <span className={cn('tabular-nums', on ? 'text-accent-text' : 'text-fg-subtle')}>{counts.get(c.id) ?? 0}</span>
                </button>
              )
            })}
          </div>
        )}

        <div ref={list} id={listId} role="listbox" aria-label={`${results.length} ${results.length === 1 ? noun : plural}`} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <Rows count={results.length} at={at}>
            {(i) => {
              const e = results[i]!
              const on = e.item.id === current
              const isActive = i === at
              return (
                <div
                  key={e.item.id}
                  id={optionId(e.item.id)}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive || undefined}
                  onPointerMove={() => !isActive && setActiveId(e.item.id)}
                  // The field keeps the focus: a press on a row doesn't take it.
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => choose(e.item.id)}
                  // Every row one height (ROW), so the rows not drawn yet hold their exact room. A row out of the list's view
                  // isn't styled or laid out until it's scrolled near.
                  className="group/row flex h-[4.875rem] cursor-pointer items-center [contain-intrinsic-size:auto_4.875rem] [content-visibility:auto] gap-3.5 rounded-[14px] px-2.5 py-2.5 transition-colors duration-(--yj-duration-instant) ease-standard select-none motion-reduce:transition-none data-active:bg-hover"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-[11px] border border-line bg-surface">{hasThumb(e.item) && <Thumbs item={e.item} eager={false} square />}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14.5px] leading-5 font-medium text-fg">{e.item.label}</span>
                      {on && <span className="shrink-0 rounded-full bg-accent-subtle px-1.5 py-px font-mono text-[10px] leading-4 tracking-[0.06em] text-accent-text uppercase">On stage</span>}
                    </span>
                    {e.meta && <span className="truncate text-[12.5px] leading-[18px] text-fg-muted">{e.meta}</span>}
                    {e.tags && e.tags.length > 0 && <span className="truncate text-[11.5px] leading-4 text-fg-subtle">{e.tags.slice(0, 5).join(' · ')}</span>}
                  </span>
                  {island && <CornerDownLeftIcon aria-hidden size={15} strokeWidth={1.75} className="me-1 shrink-0 text-fg-subtle opacity-0 group-data-active/row:opacity-100" />}
                </div>
              )
            }}
          </Rows>
          {results.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-fg">No {plural} match{q.trim() && ` “${q.trim()}”`}</p>
              <p className="text-[12.5px] text-fg-muted">Try another word{chosen.length > 0 && ', or every category'}.</p>
              <Button variant="outline" size="sm" onClick={clear}>
                Clear the search
              </Button>
            </div>
          )}
        </div>

        <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-t border-line px-4 text-[11.5px] text-fg-subtle">
          <span aria-live="polite" className="tabular-nums">
            {results.length === entries.length ? `${entries.length} ${plural}` : `${results.length} of ${entries.length}`}
          </span>
          {island && (
            <span aria-hidden className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> move
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd> show
              </span>
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Every row's height, px (h-[4.875rem]): the room a row not drawn yet holds. */
const ROW = 78
/** How many rows either side of the active one the list draws as it opens. */
const AROUND = 10

/**
 * The list's rows. As the panel opens it draws only the rows around the active one, the others' room held by two
 * spacers of their exact height, so it opens at once on any number of items, scrolled to the right place; the rest are
 * drawn a moment later, in a render that gives way to typing and the arrows, and land without moving a pixel.
 */
function Rows({ count, at, children }: { count: number; at: number; children: (i: number) => ReactNode }) {
  const whole = useDeferredValue(true, false)
  const from = whole ? 0 : Math.max(0, at - AROUND)
  const to = whole ? count : Math.min(count, at + AROUND + 1)
  return (
    <>
      {from > 0 && <div aria-hidden style={{ height: from * ROW }} />}
      {Array.from({ length: to - from }, (_, k) => children(from + k))}
      {to < count && <div aria-hidden style={{ height: (count - to) * ROW }} />}
    </>
  )
}

/** The list's room kept over and under the active row as it moves, px: the list's own padding. */
const EDGE = 8

/**
 * Where the list scrolls to show its active row: in its middle as it opens, else just enough to bring the row in.
 * From the layout (the row's offset in the list), so the panel's entrance transform doesn't skew it.
 */
export function listScroll(box: HTMLElement, row: HTMLElement, centre: boolean) {
  const top = row.offsetTop
  const bottom = top + row.offsetHeight
  if (centre) return Math.max(0, top - (box.clientHeight - row.offsetHeight) / 2)
  if (top - EDGE < box.scrollTop) return Math.max(0, top - EDGE)
  if (bottom + EDGE > box.scrollTop + box.clientHeight) return bottom + EDGE - box.clientHeight
  return box.scrollTop
}
