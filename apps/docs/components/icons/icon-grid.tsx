'use client'

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { defaultRangeExtractor, useWindowVirtualizer, type Range } from '@tanstack/react-virtual'
import { useYouj } from '@youj/core'
import { useResultMotion } from '@/components/explorer/result-motion'
import { cn } from '@/lib/cn'
import { IconIsland, type IconCardActions } from './card-actions'
import { isState, type Entry } from './catalog'
import { Glyph, RestGlyph } from './glyph'
import { inkColor, useDisplay } from './settings'

/* The grid: only the rows in view (plus a few either side) are rendered, so
 * two thousand icons scroll as lightly as twenty. Each icon is a card: a
 * small stage, drawn in CSS alone (.icon-card-stage in styles/site.css: a
 * faint grid on the icon's own box and the accent's light, a step stronger
 * while you're on it), the icon on it a size up from the one you'll copy
 * (previewSize), and its name at the foot. While you're on a card the icon
 * plays and an island of actions takes the name's place (card-actions.tsx).
 * Cards are static SVG until one is asked to move, and an island is drawn
 * only once its card has been pointed at or focused. The grid is one tab
 * stop (an ARIA grid with a roving focus): arrows move and select, Home/End
 * go to the row's ends (with ⌘ or Ctrl, the whole grid's), Page Up/Down a
 * screen, Enter opens, ⌘C copies, typing starts a search, and Tab steps from
 * the focused card into its island (Escape steps back). */

const GAP = 8
const LIST_GAP = 2
/** The card's hairline, and its name's line at the foot (where the island rises). */
const FRAME = 1
const NAME = 40
/** Under 560px of grid (a phone) cards are narrower, so three still fit a row. */
const NARROW = 560

interface IconGridProps {
  entries: Entry[]
  selectedId: string | null
  /** The chain, as id → position: those cards are marked and numbered, and stand in for the selection. */
  marks?: ReadonlyMap<string, number> | null
  /** A pick by pointer or keyboard: on a phone, a tap opens the inspector; arrowing doesn't. */
  onSelect: (entry: Entry, via: 'pointer' | 'keyboard') => void
  onActivate: (entry: Entry) => void
  onCopy: (entry: Entry) => void
  label: string
  empty: ReactNode
  /** What each card's island does. Without it, cards have no island. */
  actions?: IconCardActions
  /** A touch screen: a tap reveals the chosen card's island. */
  touch?: boolean
  /** The card whose code dialog is open: its island stays up, so focus can come back to it. */
  pinnedId?: string | null
  /** Rendered above the rows (a section intro). */
  header?: ReactNode
}

/** A card draws its icon a size up from the one you'll copy (24 shows at 40), so its motion reads; the list draws it as it is. */
export function previewSize(size: number) {
  return Math.round((size * 5) / 3)
}

/** The narrowest a card gets before the grid drops a column: six across the grid beside the details at 1440. */
export function cardMin(preview: number, narrow: boolean) {
  return narrow ? Math.max(104, preview + 64) : Math.max(156, preview + 104)
}

/** The stage's height for a card's width: close to square with its name, never cramped round the icon. */
export function stageHeight(preview: number, width: number, narrow: boolean) {
  return Math.max(preview + 56, Math.round(width * (narrow ? 0.8 : 0.72)))
}

function listHeight(size: number) {
  return Math.max(44, size + 20)
}

export function IconGrid({ entries: results, selectedId, marks = null, onSelect, onActivate, onCopy, label, empty, actions, touch = false, pinnedId = null, header }: IconGridProps) {
  const { size, density, ink } = useDisplay()
  const scroller = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  // What's on screen: the results, moved into place when they change (explorer/result-motion.ts).
  const entries = useResultMotion(results, grid, scroller)
  const [width, setWidth] = useState<number | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  // Where the grid starts on the page: the window is what scrolls.
  const [pageTop, setPageTop] = useState(0)
  const list = density === 'list'
  const gap = list ? LIST_GAP : GAP
  const preview = previewSize(size)
  const narrow = width !== null && width < NARROW
  const min = cardMin(preview, narrow)
  const columns = list ? 1 : Math.max(1, Math.floor(((width ?? 0) + gap) / (min + gap)))
  const cardWidth = width === null ? min : (width - gap * (columns - 1)) / columns
  const stage = stageHeight(preview, cardWidth, narrow)
  const rowHeight = list ? listHeight(size) : stage + NAME + FRAME * 2
  const rowCount = Math.ceil(entries.length / columns)

  const selectedIndex = selectedId ? entries.findIndex((e) => e.id === selectedId) : -1
  const [focusIndex, setFocusIndex] = useState(Math.max(0, selectedIndex))
  // The roving focus follows the selection when it changes from outside (a search, a related icon).
  useEffect(() => {
    if (selectedIndex >= 0) setFocusIndex(selectedIndex)
    else setFocusIndex((i) => Math.min(i, Math.max(0, entries.length - 1)))
  }, [selectedIndex, entries.length])
  const focusRow = Math.floor(focusIndex / columns)

  const hasHeader = Boolean(header)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      setWidth(el.clientWidth - 2 * GAP)
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0)
      setPageTop(el.getBoundingClientRect().top + window.scrollY)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // The hero above grows and shrinks (a chain's panel, a window resize): the grid's place moves with it.
    observer.observe(document.documentElement)
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [hasHeader])

  // The focused row stays rendered wherever it is, so focus never lands on nothing.
  const rangeExtractor = useCallback(
    (range: Range) => {
      const rows = defaultRangeExtractor(range)
      if (focusRow < rowCount && !rows.includes(focusRow)) rows.push(focusRow)
      return rows.sort((a, b) => a - b)
    },
    [focusRow, rowCount],
  )

  // While the grid scrolls, tiles sliding under a still pointer don't count as hovered: no icon wakes mid-scroll.
  const scrolling = useRef(false)
  const virtualizer = useWindowVirtualizer({
    onChange: (instance) => {
      scrolling.current = instance.isScrolling
    },
    count: rowCount,
    estimateSize: () => rowHeight + gap,
    overscan: 3,
    paddingStart: GAP,
    paddingEnd: 24,
    scrollMargin: pageTop + headerHeight,
    rangeExtractor,
    initialRect: { width: 880, height: 720 },
  })

  useEffect(() => {
    virtualizer.measure()
  }, [virtualizer, rowHeight, gap, columns])

  // A selection made elsewhere (a link, a related icon) is brought into view, and so is one that
  // arrives in the results later; one already in view stays put.
  // Not on every change of results, so a new search still starts at the top.
  const present = selectedIndex >= 0
  useEffect(() => {
    if (present) virtualizer.scrollToIndex(Math.floor(selectedIndex / columns), { align: 'auto' })
  }, [selectedId, present])

  const cell = (index: number) => grid.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)

  // Stable handlers, so a scroll re-renders the rows without re-rendering a single tile.
  const latest = useRef({ onSelect, onActivate, actions })
  latest.current = { onSelect, onActivate, actions }
  const pick = useCallback((index: number, entry: Entry) => {
    setFocusIndex(index)
    latest.current.onSelect(entry, 'pointer')
  }, [])
  const open = useCallback((entry: Entry) => latest.current.onActivate(entry), [])
  // The islands' actions, stable too.
  const [cardActions] = useState<IconCardActions>(() => ({
    copy: (entry) => latest.current.actions?.copy(entry) ?? Promise.resolve(false),
    code: (entry, opener) => latest.current.actions?.code(entry, opener),
    save: (...args) => latest.current.actions?.save(...args),
    chain: (entry) => latest.current.actions?.chain(entry),
  }))

  const moveTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), entries.length - 1)
    setFocusIndex(next)
    const entry = entries[next]
    if (entry) onSelect(entry, 'keyboard')
  }

  // Keyboard moves land focus on the new cell once it has rendered.
  const pending = useRef(false)
  useEffect(() => {
    if (!pending.current) return
    pending.current = false
    cell(focusIndex)?.focus()
  })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // From the cell that has focus, however it got there.
    const from = (e.target as HTMLElement).closest('[data-index]')?.getAttribute('data-index')
    const i = from === null || from === undefined ? focusIndex : Number(from)
    const rtl = (e.currentTarget.closest('[dir]')?.getAttribute('dir') ?? getComputedStyle(e.currentTarget).direction) === 'rtl'
    const pageRows = Math.max(1, Math.floor(window.innerHeight / (rowHeight + gap)) - 1)
    const rowStart = i - (i % columns)
    const mod = e.metaKey || e.ctrlKey
    const moves: Record<string, number> = {
      ArrowRight: i + (rtl ? -1 : 1),
      ArrowLeft: i - (rtl ? -1 : 1),
      ArrowDown: i + columns,
      ArrowUp: i - columns,
      Home: mod ? 0 : rowStart,
      End: mod ? entries.length - 1 : Math.min(entries.length - 1, rowStart + columns - 1),
      PageDown: i + columns * pageRows,
      PageUp: i - columns * pageRows,
    }
    const entry = entries[i]
    if (e.key in moves) {
      const target = moves[e.key]!
      // Up from the top row stays put; down from a short last row lands on the last icon.
      if (target < 0 && e.key === 'ArrowUp') return
      if (target >= entries.length && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) return
      e.preventDefault()
      pending.current = true
      moveTo(target)
      return
    }
    if (!entry) return
    if (e.key === 'Enter') {
      e.preventDefault()
      onActivate(entry)
    } else if (mod && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
      e.preventDefault()
      onCopy(entry)
    }
  }

  const rows = virtualizer.getVirtualItems()
  const settled = !virtualizer.isScrolling

  return (
    <div
      ref={scroller}
      className="gutter relative mx-auto max-w-[110rem]"
      style={{
        // A chosen ink paints every icon; the default follows each card's own text color.
        ...(ink === 'default' ? {} : { '--icon-ink': inkColor(ink) }),
      } as CSSProperties}
    >
      {header && <div ref={headerRef}>{header}</div>}
      {entries.length === 0 ? (
        empty
      ) : width === null ? (
        // Room is held on the server and through hydration; tiles show once their column count and header offset are known.
        <div aria-hidden className="h-[70dvh]" />
      ) : (
        <div
          ref={grid}
          role="grid"
          aria-label={label}
          aria-rowcount={rowCount}
          aria-colcount={columns}
          onKeyDown={onKeyDown}
          className="relative"
          // Every card's stage draws its grid on the icon's size (styles/site.css).
          style={{ height: virtualizer.getTotalSize(), '--preview': `${preview}px` } as CSSProperties}
        >
          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              aria-rowindex={row.index + 1}
              className="absolute inset-x-0 top-0 grid"
              style={{
                height: rowHeight,
                transform: `translateY(${row.start - pageTop - headerHeight}px)`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
              }}
            >
              {entries.slice(row.index * columns, row.index * columns + columns).map((entry, col) => {
                const index = row.index * columns + col
                return (
                  <Tile
                    key={entry.id}
                    entry={entry}
                    index={index}
                    row={row.index}
                    col={col}
                    tabbable={index === focusIndex}
                    selected={marks ? marks.has(entry.id) : entry.id === selectedId}
                    mark={marks?.get(entry.id)}
                    pinned={entry.id === pinnedId}
                    list={list}
                    touch={touch}
                    actions={actions ? cardActions : undefined}
                    onPick={pick}
                    onOpen={open}
                    scrolling={scrolling}
                    settled={settled}
                  />
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Tiles ─────────────────────────────────────────────────────────────── */

interface TileProps {
  entry: Entry
  index: number
  row: number
  col: number
  tabbable: boolean
  selected: boolean
  /** Its place in the chain. */
  mark?: number
  pinned: boolean
  list: boolean
  touch: boolean
  actions?: IconCardActions
  onPick: (index: number, entry: Entry) => void
  onOpen: (entry: Entry) => void
  scrolling: RefObject<boolean>
  /** False while the grid scrolls: tiles arriving then wait to start looping until it stops. */
  settled: boolean
}

function describe(entry: Entry) {
  if (entry.kind === 'pair') return `${entry.from.name} to ${entry.to.name}`
  return entry.states ? `${entry.name}, ${entry.states[0]} to ${entry.states[1]}` : entry.name
}

const Tile = memo(function Tile({ entry, index, row, col, tabbable, selected, mark, pinned, list, touch, actions, onPick, onOpen, scrolling, settled }: TileProps) {
  const k = useYouj()
  const { size, strokeWidth, ink, mode, transition, waveAt } = useDisplay()
  const self = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  // A menu the island opened holds it up.
  const [held, setHeld] = useState(false)
  // Once a tile has moved it stays live, so it can settle instead of snapping back to the snapshot.
  const [awake, setAwake] = useState(false)
  const state = isState(entry)

  // The morph wave: state icons turn one diagonal step after another, timed from when the wave began.
  const waveTarget = mode === 'morph' && state
  const [waved, setWaved] = useState(waveTarget)
  useEffect(() => {
    if (waved === waveTarget) return
    const step = k.stagger('tight') * 1000
    const delay = k.reduced ? 0 : Math.max(0, waveAt + (row + col) * step - performance.now())
    const timer = setTimeout(() => setWaved(waveTarget), delay)
    return () => clearTimeout(timer)
  }, [waveTarget, waved, waveAt, row, col, k])

  // Loop mode: a tile starts looping once the grid is still, a column step after its left neighbor,
  // so a row mounts over several frames instead of one, and a fast scroll mounts nothing. While the
  // grid scrolls, looping tiles drop back to their snapshot (a full-width grid of live icons costs
  // frames to scroll on a slow device), and they rejoin the wave once it settles. Leaving Loop mode
  // lets them settle instead.
  const [looping, setLooping] = useState(false)
  useEffect(() => {
    if (mode !== 'loop') {
      setLooping(false)
      return
    }
    if (!settled) {
      if (!looping) return
      setLooping(false)
      if (!hovered && !focused) setAwake(false)
      return
    }
    if (looping) return
    const timer = setTimeout(() => {
      setLooping(true)
      setAwake(true)
    }, col * k.stagger('tight') * 1000)
    return () => clearTimeout(timer)
  }, [mode, looping, settled, col, k, hovered, focused])
  const loop = mode === 'loop' && looping
  const live = awake || (mode === 'morph' && state) || waved
  const hot = hovered || focused

  // The island: drawn the first time the card is asked for it, then kept, so it can leave as it came.
  const asked = Boolean(actions) && (hot || pinned || held || (touch && selected))
  const [island, setIsland] = useState(asked)
  if (asked && !island) setIsland(true)
  const up = hovered || pinned || held || (touch && selected)

  // A card draws its icon a size up; a list row draws it as it is.
  const drawn = list ? size : previewSize(size)
  const glyph = (
    <span className={cn('grid shrink-0 place-items-center', ink !== 'default' && 'text-(--icon-ink)')} style={{ width: drawn, height: drawn }}>
      <Glyph entry={entry} live={live} active={waved || hot} loop={loop} size={drawn} strokeWidth={strokeWidth} transition={transition} />
    </span>
  )
  const islandNode =
    island && actions ? (
      <IconIsland entry={entry} actions={actions} touch={touch} list={list} onPin={setHeld} onEscape={() => self.current?.focus()} />
    ) : null

  return (
    <div
      ref={self}
      role="gridcell"
      data-index={index}
      data-id={entry.id}
      aria-selected={selected}
      aria-colindex={col + 1}
      aria-label={mark === undefined ? describe(entry) : `${describe(entry)}, morph ${mark}`}
      tabIndex={tabbable ? 0 : -1}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch' || scrolling.current) return
        setHovered(true)
        setAwake(true)
      }}
      onPointerMove={(e) => {
        // A pointer that settles on a tile after a scroll still wakes it.
        if (hovered || e.pointerType === 'touch' || scrolling.current) return
        setHovered(true)
        setAwake(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(e) => {
        // The card's own visible focus, or one inside it (its island's buttons).
        const visible = e.currentTarget.matches(':focus-visible, :has(:focus-visible)')
        setFocused(visible)
        if (visible) setAwake(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onClick={() => onPick(index, entry)}
      onDoubleClick={() => onOpen(entry)}
      data-selected={selected || undefined}
      data-hot={up || undefined}
      className={cn(
        // Not outline-none: in Tailwind v4 it zeroes the outline style the focus ring needs.
        'group/tile island-host relative flex min-w-0 cursor-default rounded-xl text-fg-muted select-none',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-solid',
        list
          ? [
              'items-center gap-3 border border-transparent px-3 focus-visible:-outline-offset-2',
              'transition-[color,background-color,border-color] yj-duration-fast ease-standard',
              'hover:border-line hover:bg-surface hover:text-fg data-selected:border-line-strong data-selected:bg-surface data-selected:text-fg',
            ]
          : [
              // The stage, its lift and its light are CSS (.icon-card, styles/site.css).
              'icon-card flex-col overflow-hidden border border-line bg-surface [--island-inset:5px] focus-visible:outline-offset-2',
              'hover:border-line-strong hover:text-fg data-selected:border-accent data-selected:text-fg data-selected:shadow-[0_0_0_1px_var(--color-accent)]',
            ],
      )}
    >
      {list ? (
        <>
          {glyph}
          <ListLabel entry={entry} />
          {islandNode}
        </>
      ) : (
        <>
          <div className="icon-card-stage relative isolate grid min-h-0 flex-1 place-items-center">
            <span className="relative">{glyph}</span>
            {entry.kind === 'pair' && (
              <span aria-hidden className="absolute end-2.5 top-2.5 opacity-45">
                <RestGlyph entry={entry.to} size={12} strokeWidth={1.75} />
              </span>
            )}
            {mark !== undefined && (
              <span aria-hidden className="absolute start-2.5 top-2.5 grid size-4 place-items-center rounded-[3px] bg-accent font-mono text-[10px] leading-none text-on-accent">
                {mark}
              </span>
            )}
            {state && (
              // A state icon's mark: quiet at rest, the accent once you're on it.
              <span aria-hidden className="absolute end-3 top-3 size-1 rounded-[1px] bg-line-strong transition-colors yj-duration-fast ease-standard group-hover/tile:bg-accent group-data-selected/tile:bg-accent" />
            )}
          </div>
          <CardName entry={entry} />
          {islandNode}
        </>
      )}
    </div>
  )
})

/** The card's name, at its foot: the island takes its place while you're on the card (card-caption, styles/site.css). */
function CardName({ entry }: { entry: Entry }) {
  if (entry.kind === 'pair') {
    return (
      <span className="card-caption flex h-10 max-w-full shrink-0 flex-col items-center justify-center px-2 text-center text-[12px] leading-[15px]">
        <span className="max-w-full truncate">{entry.from.name}</span>
        <span className="max-w-full truncate text-fg-subtle">→ {entry.to.name}</span>
      </span>
    )
  }
  // Two lines before it truncates, breaking at the name's hyphens, so align-center-horizontal and align-center-vertical stay told apart.
  return (
    <span className="card-caption grid h-10 shrink-0 place-items-center px-2">
      <span className="line-clamp-2 max-w-full text-center text-[12.5px] leading-[15px] text-balance [overflow-wrap:anywhere]">{entry.name}</span>
    </span>
  )
}

function ListLabel({ entry }: { entry: Entry }) {
  const meta = entry.kind === 'youj' ? entry.category : 'pair'
  const words = entry.kind === 'pair' ? `${entry.from.component} → ${entry.to.component}` : entry.keywords.slice(0, 6).join(' · ')
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className="w-44 shrink-0 truncate text-[13px] font-medium text-fg">{entry.kind === 'pair' ? `${entry.from.name} → ${entry.to.name}` : entry.name}</span>
      <span className="hidden w-24 shrink-0 truncate text-[12.5px] text-fg-muted capitalize sm:block">{meta}</span>
      <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-fg-muted md:block">{words}</span>
      {isState(entry) && (
        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11.5px] text-fg-muted">
          {entry.states![0]} ↔ {entry.states![1]}
        </span>
      )}
    </span>
  )
}
