'use client'

import { kanbanLabels } from '@youj/core/labels'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronsLeftRightIcon } from '@youj/icons/components/youj/icons/chevrons-left-right'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { SidebarIcon } from '@youj/icons/components/youj/icons/sidebar'
import { animate, m, useMotionValue } from 'motion/react'
import { useYoujScope, MotionFeatures } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'
import { Badge } from '../badge'
import { Button } from '../button'
import { Card } from '../card'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu'
import { Input } from '../input'
import { cellCards, moveCard, placeOf, samePlace, type KanbanCardData, type KanbanMove, type KanbanPlace } from './kanban-model'

/* A kanban board built from the library's own Card, Badge, Button, Input and
 * ContextMenu. Cards move by pointer, touch or keyboard.
 *
 * Pointer: press and move 4px (touch: press and hold) and the card lifts out of
 * the list into a tilted, shadowed preview under the pointer while a dashed
 * gap takes its place. The gap opens where the card would land and the cards
 * around it glide aside (motion `layout`, measured per list so a column
 * collapsing elsewhere doesn't set cards drifting). Near the board's edges,
 * or a column's, it scrolls. On release the preview settles into the gap on
 * the smooth spring; Escape puts it back.
 *
 * Keyboard (one Tab stop for all cards, arrows walk them): Space picks the
 * focused card up, arrows move it between positions, columns and lanes
 * (flipped under RTL), Space or Enter drops, Escape cancels. Every step is
 * announced: "Picked up Fix login. To do, position 2 of 5."
 *
 * Columns: header counts, a WIP limit that turns the header to warning when
 * exceeded (live, while you hover a card over it), collapse to a rail, and
 * an add-card composer. `onMove` may return a promise: the board shows the
 * move at once and puts the card back (and says so) if it rejects.
 *
 * Reduced motion: no lift or tilt, no gliding, cards land at once. */

export type { KanbanCardData, KanbanMove, KanbanPlace } from './kanban-model'

export interface KanbanColumn {
  id: string
  title: string
  /** Work-in-progress limit. Over it, the header turns warning. */
  limit?: number
  /** A status dot beside the title. */
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

export interface KanbanLane {
  id: string
  /** The lane's heading: a name, or a node (an avatar and a name). */
  title: ReactNode
  /** The lane's name in words, for its landmark and announcements. Needed when `title` isn't a string; defaults to it, else the id. */
  label?: string
}

export interface KanbanProps<C extends KanbanCardData> extends Omit<ComponentProps<'div'>, 'children' | 'onDrop'> {
  columns: KanbanColumn[]
  cards: C[]
  /** Swimlanes: each card's `lane` names one. */
  lanes?: KanbanLane[]
  /** Hides a lane while it has no cards (the lane a card is leaving stays until the move lands). */
  hideEmptyLanes?: boolean
  /** The inside of a card. The Card itself (surface, focus, drag, the selected look) is the board's. */
  renderCard: (card: C, state: { lifted: boolean; selected: boolean }) => ReactNode
  /** A card moved. Return a promise to have the board roll the move back if it rejects. */
  onMove?: (move: KanbanMove<C>, next: C[]) => unknown
  /** Enables the add-card composer at the foot of each column. */
  onAddCard?: (place: { column: string; lane?: string }, title: string) => void
  /** Enter, or a click, on a card. The event carries its modifier keys (Shift, ⌘/Ctrl), for selecting several. */
  onCardAction?: (card: C, event: ReactMouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void
  /** The cards the app has selected: the board draws them selected and tells assistive tech. Selection is the app's (see onCardAction). */
  selectedIds?: ReadonlyArray<string>
  /** Context-menu items for a card. */
  cardMenu?: (card: C) => ReactNode
  collapsed?: string[]
  defaultCollapsed?: string[]
  onCollapsedChange?: (ids: string[]) => void
  /** Columns grow to share the board's width, each at least its usual 18rem. A collapsed one still folds to a rail. */
  fill?: boolean
  /** Horizontal scrolling snaps a column to the board's start edge: for phones, where one column fills the view. Off while a card is dragged. */
  snap?: boolean
}

type Session = {
  id: string
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  width: number
  height: number
  active: boolean
  timer?: ReturnType<typeof setTimeout>
  lastX: number
  lastY: number
  frame?: number
}

/* The card that is the board's one tab stop lives in a store, not in state: a
 * focus move then re-renders the two cards whose answer changed, not the board
 * and every card on it. */
interface TabStopStore {
  /** The card last focused or clicked. */
  focusId: string | null
  /** The card that is the tab stop: that card if it is showing, else the first on the board. */
  value: string | null
  resolve: (focusId: string | null) => string | null
  listeners: Set<() => void>
}

interface BoardContext {
  tabStops: TabStopStore
  liftedId: string | null
  selected: ReadonlySet<string>
  dragId: string | null
  dragHeight: number
  instructionsId: string
  reduced: boolean
  onCardPointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: string) => void
  onCardKeyDown: (event: KeyboardEvent<HTMLDivElement>, id: string) => void
  onCardFocus: (id: string) => void
  onCardClick: (event: ReactMouseEvent<HTMLElement>, id: string) => void
  onCardContextMenu: (id: string) => void
  flip: { current: { id: string; rect: DOMRect } | null }
}

const Ctx = createContext<BoardContext | null>(null)
const useBoard = () => useContext(Ctx)!

function useIsTabStop(id: string) {
  const { tabStops } = useBoard()
  const subscribe = useCallback(
    (listener: () => void) => {
      tabStops.listeners.add(listener)
      return () => void tabStops.listeners.delete(listener)
    },
    [tabStops],
  )
  const read = () => tabStops.value === id
  return useSyncExternalStore(subscribe, read, read)
}

const DRAG_DISTANCE = 4
const TOUCH_HOLD = 200 // youj-allow: press-and-hold threshold for touch, not motion
const TOUCH_SLOP = 8
const EDGE = 56

const toneDot: Record<NonNullable<KanbanColumn['tone']>, string> = {
  neutral: 'own:bg-fg-subtle',
  accent: 'own:bg-accent',
  success: 'own:bg-success',
  warning: 'own:bg-warning',
  danger: 'own:bg-danger',
}

export function Kanban<C extends KanbanCardData>({
  columns,
  cards,
  lanes: allLanes,
  hideEmptyLanes,
  renderCard,
  onMove,
  onAddCard,
  onCardAction,
  selectedIds,
  cardMenu,
  collapsed: collapsedProp,
  defaultCollapsed = [],
  onCollapsedChange,
  fill,
  snap,
  className,
  'aria-label': label,
  ...props
}: KanbanProps<C>) {
  const k = useYouj()
  const labels = useComponentLabels(kanbanLabels)
  label ??= labels.kanbanBoard
  const scope = useYoujScope()
  const instructionsId = useId()
  const { announce, announcer } = useAnnouncer()
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  // The board follows `cards`: a new array replaces it while rendering, so no frame shows the old one.
  const [board, setBoard] = useState(cards)
  const [boardFrom, setBoardFrom] = useState(cards)
  if (boardFrom !== cards) {
    setBoardFrom(cards)
    setBoard(cards)
  }
  const [preview, setPreview] = useState<C[] | null>(null)
  const shown = preview ?? board
  const [collapsedList, setCollapsedList] = useControllableState(collapsedProp, defaultCollapsed)
  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList])
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])
  const hasLanes = !!allLanes?.length
  // An emptied lane hides once the board commits: while a card is in flight, its lane still holds it.
  const lanes = useMemo(() => (hideEmptyLanes ? allLanes?.filter((l) => board.some((c) => c.lane === l.id)) : allLanes), [hideEmptyLanes, allLanes, board])
  const cells = useMemo(
    () => (hasLanes ? lanes!.flatMap((l) => columns.map((c) => ({ column: c.id, lane: l.id as string | undefined }))) : columns.map((c) => ({ column: c.id, lane: undefined as string | undefined }))),
    [hasLanes, lanes, columns],
  )

  const [tabStops] = useState<TabStopStore>(() => ({ focusId: null, value: null, resolve: () => null, listeners: new Set() }))
  const setFocusId = useCallback(
    (id: string) => {
      tabStops.focusId = id
      const next = tabStops.resolve(id)
      if (next === tabStops.value) return
      tabStops.value = next
      for (const listener of tabStops.listeners) listener()
    },
    [tabStops],
  )
  const [lifted, setLifted] = useState<{ id: string; origin: C[] } | null>(null)
  const [drag, setDrag] = useState<{ id: string; width: number; height: number; dropping: boolean } | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const session = useRef<Session | null>(null)
  const suppressClick = useRef(false)
  const flip = useRef<{ id: string; rect: DOMRect } | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const latest = useRef({ board, preview, shown, collapsed, lifted })
  latest.current = { board, preview, shown, collapsed, lifted }

  const columnTitle = useCallback((id: string) => columns.find((c) => c.id === id)?.title ?? id, [columns])
  const laneTitle = useCallback((id?: string) => {
    const lane = allLanes?.find((l) => l.id === id)
    return lane && laneLabel(lane)
  }, [allLanes])
  const describe = useCallback(
    (list: C[], id: string) => {
      const place = placeOf(list, id, hasLanes)
      if (!place) return ''
      const count = cellCards(list, place.column, place.lane).length
      const col = columns.find((c) => c.id === place.column)
      const lane = laneTitle(place.lane)
      const over = col?.limit !== undefined && cellCards(list, place.column, undefined).length > col.limit
      return labels.kanbanPlace(columnTitle(place.column), lane, place.index + 1, count, over ? col!.limit : undefined)
    },
    [hasLanes, columns, columnTitle, laneTitle, labels],
  )
  const titleOf = (list: C[], id: string) => list.find((c) => c.id === id)?.title ?? ''

  /* ── Committing a move, optimistically ────────────────────────────────── */
  const commit = useCallback(
    (origin: C[], next: C[], id: string) => {
      const from = placeOf(origin, id, hasLanes)
      const to = placeOf(next, id, hasLanes)
      setBoard(next)
      if (!from || !to || samePlace(from, to)) return
      const card = next.find((c) => c.id === id)!
      const result = onMove?.({ card, from, to }, next) as PromiseLike<unknown> | undefined
      if (result && typeof result.then === 'function') {
        result.then(undefined, () => {
          setBoard((current) => moveCard(current, id, from))
          announce(labels.kanbanMoveFailed(card.title, columnTitle(from.column)))
        })
      }
    },
    [hasLanes, onMove, announce, columnTitle, labels],
  )

  /* ── Pointer drag ─────────────────────────────────────────────────────── */
  const hitTest = useCallback(
    (px: number, py: number, id: string): KanbanPlace | null => {
      const root = rootRef.current
      if (!root) return null
      let best: HTMLElement | null = null
      let bestD = Infinity
      for (const cell of root.querySelectorAll<HTMLElement>('[data-kanban-cell]')) {
        const r = cell.getBoundingClientRect()
        const dx = px < r.left ? r.left - px : px > r.right ? px - r.right : 0
        const dy = py < r.top ? r.top - py : py > r.bottom ? py - r.bottom : 0
        const d = dx * dx + dy * dy * 4
        if (d < bestD) {
          bestD = d
          best = cell
        }
      }
      if (!best) return null
      const column = best.dataset.column!
      const lane = best.dataset.lane || undefined
      const list = latest.current.shown
      const others = cellCards(list, column, lane).filter((c) => c.id !== id)
      if (latest.current.collapsed.has(column)) return { column, lane, index: others.length }
      const ul = best.querySelector<HTMLElement>('[data-kanban-list]')!
      const ly = py - ul.getBoundingClientRect().top + ul.scrollTop
      let index = 0
      for (const el of ul.querySelectorAll<HTMLElement>(':scope > [data-kanban-item]')) {
        if (el.dataset.kanbanItem === id) continue
        if (el.offsetTop + el.offsetHeight / 2 < ly) index++
      }
      return { column, lane, index }
    },
    [],
  )

  const track = useCallback(
    (px: number, py: number) => {
      const s = session.current
      if (!s?.active) return
      x.set(px - s.offsetX)
      y.set(py - s.offsetY)
      const target = hitTest(px, py, s.id)
      const current = latest.current.preview
      if (!target || !current) return
      if (!samePlace(placeOf(current, s.id, hasLanes), target)) setPreview(moveCard(current, s.id, target))
    },
    [hitTest, hasLanes, x, y],
  )

  // Edge scrolling: the board horizontally, the hovered column vertically.
  const autoScroll = useCallback(() => {
    const s = session.current
    if (!s?.active) return
    const speed = (dist: number) => Math.round(((EDGE - dist) / EDGE) * 16)
    const scroller = scrollerRef.current
    let moved = false
    if (scroller) {
      const r = scroller.getBoundingClientRect()
      if (s.lastX < r.left + EDGE && scroller.scrollLeft > 0) (scroller.scrollLeft -= speed(s.lastX - r.left)), (moved = true)
      else if (s.lastX > r.right - EDGE && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth) (scroller.scrollLeft += speed(r.right - s.lastX)), (moved = true)
    }
    for (const ul of rootRef.current?.querySelectorAll<HTMLElement>('[data-kanban-list]') ?? []) {
      const r = ul.getBoundingClientRect()
      if (s.lastX < r.left || s.lastX > r.right || ul.scrollHeight <= ul.clientHeight) continue
      if (s.lastY < r.top + EDGE && s.lastY > r.top - EDGE && ul.scrollTop > 0) (ul.scrollTop -= speed(Math.max(0, s.lastY - r.top))), (moved = true)
      else if (s.lastY > r.bottom - EDGE && s.lastY < r.bottom + EDGE) (ul.scrollTop += speed(Math.max(0, r.bottom - s.lastY))), (moved = true)
    }
    if (moved) track(s.lastX, s.lastY)
    s.frame = requestAnimationFrame(autoScroll)
  }, [track])

  // biome-ignore lint/correctness/useExhaustiveDependencies: removes the first render's window handlers, the ones onCardPointerDown added; they only read refs
  const endSession = useCallback(() => {
    const s = session.current
    if (!s) return
    clearTimeout(s.timer)
    if (s.frame) cancelAnimationFrame(s.frame)
    session.current = null
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowCancel)
    window.removeEventListener('keydown', onWindowKey, true)
    window.removeEventListener('touchmove', preventScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- removes the first render's window handlers, the ones onCardPointerDown added; they only read refs
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: titleOf is a pure lookup rebuilt each render and setFocusId is stable; listing them would rebuild settle every render
  const settle = useCallback(
    async (cancelled: boolean) => {
      const s = session.current
      if (!s?.active) {
        endSession()
        return
      }
      const id = s.id
      const origin = latest.current.board
      const next = cancelled ? origin : (latest.current.preview ?? origin)
      endSession()
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false))
      if (cancelled) setPreview(origin)
      if (!k.reduced) {
        setDrag((d) => (d ? { ...d, dropping: true } : d))
        // Wait a frame so a canceled preview has put the gap back, then settle into it.
        await new Promise((r) => requestAnimationFrame(r))
        const gap = rootRef.current?.querySelector<HTMLElement>(`[data-kanban-item="${CSS.escape(id)}"]`)
        if (gap) {
          const r = gap.getBoundingClientRect()
          const spring = k.spring('smooth')
          await Promise.all([animate(x, r.left, spring), animate(y, r.top, spring)])
        }
      }
      setDrag(null)
      setPreview(null)
      commit(origin, next, id)
      setFocusId(id)
      announce(cancelled ? labels.kanbanCancelled(titleOf(origin, id), describe(origin, id)) : labels.kanbanDropped(titleOf(next, id), describe(next, id)))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- titleOf is a pure lookup rebuilt each render and setFocusId is stable; listing them would rebuild settle every render
    [k, x, y, commit, announce, describe, endSession, labels],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: titleOf is a pure lookup rebuilt each render; listing it would rebuild activate every render
  const activate = useCallback(() => {
    const s = session.current
    if (!s || s.active) return
    s.active = true
    const origin = latest.current.board
    setPreview(origin)
    setDrag({ id: s.id, width: s.width, height: s.height, dropping: false })
    x.set(s.lastX - s.offsetX)
    y.set(s.lastY - s.offsetY)
    announce(labels.kanbanPickedUp(titleOf(origin, s.id), describe(origin, s.id)))
    s.frame = requestAnimationFrame(autoScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- titleOf is a pure lookup rebuilt each render; listing it would rebuild activate every render
  }, [announce, describe, autoScroll, x, y, labels])

  // Window listeners read the latest callbacks through refs, so a session's listeners stay the same functions.
  const handlers = useRef({ track, settle, activate })
  handlers.current = { track, settle, activate }
  function onWindowMove(event: PointerEvent) {
    const s = session.current
    if (!s || event.pointerId !== s.pointerId) return
    s.lastX = event.clientX
    s.lastY = event.clientY
    const moved = Math.hypot(event.clientX - s.startX, event.clientY - s.startY)
    if (!s.active) {
      if (s.pointerType === 'touch') {
        if (moved > TOUCH_SLOP) endSession() // a scroll, not a drag
      } else if (moved > DRAG_DISTANCE) handlers.current.activate()
      return
    }
    handlers.current.track(event.clientX, event.clientY)
  }
  function onWindowUp(event: PointerEvent) {
    if (session.current && event.pointerId === session.current.pointerId) handlers.current.settle(false)
  }
  function onWindowCancel() {
    handlers.current.settle(true)
  }
  function onWindowKey(event: globalThis.KeyboardEvent) {
    if (event.key === 'Escape' && session.current?.active) {
      event.preventDefault()
      event.stopPropagation()
      handlers.current.settle(true)
    }
  }
  function preventScroll(event: TouchEvent) {
    if (session.current?.active) event.preventDefault()
  }

  useEffect(() => endSession, [endSession])

  // biome-ignore lint/correctness/useExhaustiveDependencies: made once so the window handlers it adds are the ones endSession removes; board state is read through refs
  const onCardPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
      if (event.button !== 0 || latest.current.lifted || session.current) return
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [data-no-drag]')) return
      const r = event.currentTarget.getBoundingClientRect()
      session.current = {
        id,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        offsetX: event.clientX - r.left,
        offsetY: event.clientY - r.top,
        width: r.width,
        height: r.height,
        active: false,
      }
      if (event.pointerType === 'touch') session.current.timer = setTimeout(() => handlers.current.activate(), TOUCH_HOLD)
      window.addEventListener('pointermove', onWindowMove)
      window.addEventListener('pointerup', onWindowUp)
      window.addEventListener('pointercancel', onWindowCancel)
      window.addEventListener('keydown', onWindowKey, true)
      window.addEventListener('touchmove', preventScroll, { passive: false })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- made once so the window handlers it adds are the ones endSession removes; board state is read through refs
    [],
  )

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const flushFocus = () => {
    const id = pendingFocus.current
    if (!id) return
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(id)}"]`)
    if (el && document.activeElement !== el) el.focus({ preventScroll: false })
    if (el) pendingFocus.current = null
  }
  // `now`: nothing else will render, so the card is already there to focus (a walk between cards).
  const focusCard = (id: string, now = false) => {
    setFocusId(id)
    pendingFocus.current = id
    if (now) flushFocus()
  }
  useLayoutEffect(flushFocus)

  const openCells = cells.filter((c) => !collapsed.has(c.column))
  const neighbour = (list: C[], id: string, key: string, rtl: boolean): KanbanPlace | null => {
    const place = placeOf(list, id, hasLanes)
    if (!place) return null
    const count = cellCards(list, place.column, place.lane).length
    const colIds = columns.map((c) => c.id).filter((c) => !collapsed.has(c))
    const laneIds: (string | undefined)[] = lanes?.map((l) => l.id) ?? [undefined]
    const ci = colIds.indexOf(place.column)
    const li = laneIds.indexOf(place.lane)
    const left = rtl ? 'ArrowRight' : 'ArrowLeft'
    const right = rtl ? 'ArrowLeft' : 'ArrowRight'
    if (key === 'ArrowUp') {
      if (place.index > 0) return { ...place, index: place.index - 1 }
      if (li > 0) return { column: place.column, lane: laneIds[li - 1], index: cellCards(list, place.column, laneIds[li - 1]).filter((c) => c.id !== id).length }
      return null
    }
    if (key === 'ArrowDown') {
      if (place.index < count - 1) return { ...place, index: place.index + 1 }
      if (li >= 0 && li < laneIds.length - 1) return { column: place.column, lane: laneIds[li + 1], index: 0 }
      return null
    }
    if (key === left || key === right) {
      const nc = colIds[ci + (key === right ? 1 : -1)]
      if (!nc) return null
      return { column: nc, lane: place.lane, index: Math.min(place.index, cellCards(list, nc, place.lane).filter((c) => c.id !== id).length) }
    }
    return null
  }

  // Walking between cards while none is lifted: the nearest card in the direction pressed.
  const walk = (list: C[], id: string, key: string, rtl: boolean): string | null => {
    const place = placeOf(list, id, hasLanes)
    if (!place) return null
    const inCellNow = cellCards(list, place.column, place.lane)
    if (key === 'ArrowUp') return inCellNow[place.index - 1]?.id ?? null
    if (key === 'ArrowDown') return inCellNow[place.index + 1]?.id ?? null
    const i = openCells.findIndex((c) => c.column === place.column && c.lane === place.lane)
    const step = (key === 'ArrowRight') !== rtl ? 1 : -1
    for (let j = i + step; j >= 0 && j < openCells.length; j += step) {
      const cell = openCells[j]!
      if (cell.lane !== place.lane) break
      const there = cellCards(list, cell.column, cell.lane)
      if (there.length) return there[Math.min(place.index, there.length - 1)]!.id
    }
    return null
  }

  const onCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.target !== event.currentTarget || session.current) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const key = event.key
    const now = latest.current
    if (now.lifted?.id === id) {
      if (key === ' ' || key === 'Enter') {
        const next = now.preview ?? now.board
        setLifted(null)
        setPreview(null)
        commit(now.lifted.origin, next, id)
        announce(labels.kanbanDropped(titleOf(next, id), describe(next, id)))
      } else if (key === 'Escape') {
        const origin = now.lifted.origin
        flip.current = { id, rect: event.currentTarget.getBoundingClientRect() }
        setLifted(null)
        setPreview(null)
        focusCard(id)
        announce(labels.kanbanCancelled(titleOf(origin, id), describe(origin, id)))
      } else if (key.startsWith('Arrow')) {
        const list = now.preview ?? now.board
        const target = neighbour(list, id, key, rtl)
        if (target) {
          flip.current = { id, rect: event.currentTarget.getBoundingClientRect() }
          const next = moveCard(list, id, target)
          setPreview(next)
          focusCard(id)
          announce(`${titleOf(next, id)}: ${describe(next, id)}`)
        }
      } else if (key !== 'Tab') return
      event.preventDefault()
      return
    }
    if (key === ' ') {
      setLifted({ id, origin: now.board })
      setPreview(now.board)
      announce(labels.kanbanPickedUpKeyboard(titleOf(now.board, id), describe(now.board, id)))
    } else if (key === 'Enter') {
      const card = now.board.find((c) => c.id === id)
      if (card) onCardAction?.(card, event)
    } else if (key.startsWith('Arrow')) {
      const target = walk(now.board, id, key, rtl)
      if (target) focusCard(target, true)
    } else if (key === 'Home' || key === 'End') {
      const place = placeOf(now.board, id, hasLanes)
      const there = place ? cellCards(now.board, place.column, place.lane) : []
      const target = key === 'Home' ? there[0] : there[there.length - 1]
      if (target) focusCard(target.id, true)
    } else return
    event.preventDefault()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: titleOf is a pure lookup rebuilt each render; listing it would rebuild onCardBlur every render
  const onCardBlur = useCallback(() => {
    // Focus leaving a lifted card (a click elsewhere) cancels the move.
    requestAnimationFrame(() => {
      const now = latest.current.lifted
      if (!now) return
      const el = rootRef.current?.querySelector(`[data-kanban-card="${CSS.escape(now.id)}"]`)
      if (el && document.activeElement === el) return
      if (pendingFocus.current) return
      setLifted(null)
      setPreview(null)
      announce(labels.kanbanCancelled(titleOf(now.origin, now.id), describe(now.origin, now.id)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- titleOf is a pure lookup rebuilt each render; listing it would rebuild onCardBlur every render
  }, [announce, describe, labels])

  const toggleCollapsed = (column: string) => {
    const next = collapsed.has(column) ? collapsedList.filter((c) => c !== column) : [...collapsedList, column]
    setCollapsedList(next)
    onCollapsedChange?.(next)
  }

  const resolveTabStop = (focusId: string | null) => {
    const visible = shown.filter((c) => !collapsed.has(c.column))
    if (focusId && visible.some((c) => c.id === focusId)) return focusId
    // The first card in board order, column by column.
    for (const cell of cells) {
      if (collapsed.has(cell.column)) continue
      const first = cellCards(shown, cell.column, cell.lane)[0]
      if (first) return first.id
    }
    return null
  }
  tabStops.resolve = resolveTabStop
  // Cards rendered with this pass read the new stop; the rest are told after it commits.
  const tabStop = resolveTabStop(tabStops.focusId)
  tabStops.value = tabStop
  useLayoutEffect(() => {
    for (const listener of tabStops.listeners) listener()
  }, [tabStop, tabStops])

  const context: BoardContext = {
    tabStops,
    liftedId: lifted?.id ?? null,
    selected,
    dragId: drag?.id ?? null,
    dragHeight: drag?.height ?? 0,
    instructionsId,
    reduced: k.reduced,
    onCardPointerDown,
    onCardKeyDown,
    onCardFocus: (id) => setFocusId(id),
    onCardClick: (event, id) => {
      if (suppressClick.current) return
      setFocusId(id)
      const card = board.find((c) => c.id === id)
      if (card) onCardAction?.(card, event)
    },
    onCardContextMenu: (id) => setMenuId(id),
    flip,
  }

  const dragged = drag ? shown.find((c) => c.id === drag.id) : undefined
  const menuCard = menuId ? board.find((c) => c.id === menuId) : undefined

  const renderCell = (column: KanbanColumn, lane: string | undefined) => (
    <Cell
      key={`${lane ?? ''}:${column.id}`}
      column={column}
      lane={lane}
      cards={cellCards(shown, column.id, lane)}
      collapsed={collapsed.has(column.id)}
      renderCard={renderCard}
      onAddCard={onAddCard}
      onBlurCard={onCardBlur}
      laneTitle={laneTitle(lane)}
    />
  )

  const columnHeader = (column: KanbanColumn) => (
    <ColumnHeader
      key={column.id}
      column={column}
      count={cellCards(shown, column.id, undefined).length}
      collapsed={collapsed.has(column.id)}
      onToggle={() => toggleCollapsed(column.id)}
    />
  )

  const content = (
    <div
      ref={scrollerRef}
      data-kanban-scroller=""
      data-yj-snap={snap || undefined}
      className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain yj-scrollbar data-yj-snap:snap-x data-yj-snap:snap-mandatory data-yj-snap:scroll-ps-1 group-data-dragging/kanban:snap-none"
    >
      {hasLanes ? (
        <div className="own:flex w-max min-w-full flex-col gap-3 p-1">
          <div className="sticky top-0 own:flex gap-3 ps-0">{columns.map((c) => <div key={c.id} className={cn(colWidth, colSnap, collapsed.has(c.id) && colCollapsedWidth)}>{columnHeader(c)}</div>)}</div>
          {lanes!.map((lane) => (
            <section key={lane.id} aria-label={labels.kanbanLane(laneLabel(lane))} className="own:flex flex-col gap-2">
              <h3 className="own:flex items-center gap-2 px-1 own:text-ui-sm own:font-medium own:text-fg-muted">
                {lane.title}
                <span className="own:tabular-nums">{shown.filter((c) => c.lane === lane.id).length}</span>
              </h3>
              <div className="own:flex gap-3">{columns.map((c) => renderCell(c, lane.id))}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="own:flex h-full w-max min-w-full gap-3 p-1">
          {columns.map((column) => (
            <section
              key={column.id}
              aria-label={column.title}
              data-collapsed={collapsed.has(column.id) || undefined}
              className={cn(
                'own:flex max-h-full min-h-0 flex-col own:rounded-xl own:bg-transparent transition-[width,flex-grow] yj-duration-base ease-standard',
                colWidth,
                colSnap,
                collapsed.has(column.id) && colCollapsedWidth,
              )}
            >
              {columnHeader(column)}
              {renderCell(column, undefined)}
            </section>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <MotionFeatures>
      <Ctx.Provider value={context}>
        <div
          ref={rootRef}
          role="group"
          aria-label={label}
          aria-roledescription={labels.kanbanRoleBoard}
          data-slot="kanban"
          data-reduced-motion={k.reduced || undefined}
          data-dragging={drag ? '' : undefined}
          data-fill={fill || undefined}
          className={cn('group/kanban own:flex own:min-h-0 flex-col own:text-ui data-dragging:cursor-grabbing data-dragging:select-none', className)}
          {...props}
        >
          <p id={instructionsId} className="sr-only">
            {labels.kanbanInstructions}
          </p>
          {cardMenu ? (
            <ContextMenu onOpenChange={(open) => !open && setMenuId(null)}>
              <ContextMenuTrigger
                render={<div className="own:flex min-h-0 flex-1 flex-col" />}
                onContextMenu={(event: React.MouseEvent & { preventBaseUIHandler?: () => void }) => {
                  if (!(event.target as HTMLElement).closest('[data-kanban-card]') || drag) event.preventBaseUIHandler?.()
                }}
              >
                {content}
              </ContextMenuTrigger>
              <ContextMenuContent className="min-w-44">{menuCard && cardMenu(menuCard)}</ContextMenuContent>
            </ContextMenu>
          ) : (
            content
          )}
          {announcer}
        </div>
        {drag &&
          dragged &&
          createPortal(
            <div {...scope} className="pointer-events-none fixed inset-0 z-50 cursor-grabbing">
              <m.div
                aria-hidden
                // youj-allow: physical side, the drag overlay follows the pointer in px
                className="absolute top-0 left-0 origin-center"
                style={{ x, y, width: drag.width }}
                initial={k.reduced ? false : { scale: 1, rotate: 0 }}
                animate={k.reduced || drag.dropping ? { scale: 1, rotate: 0 } : { scale: 1.04, rotate: 2.5 }}
                transition={k.spring(drag.dropping ? 'smooth' : 'snappy')}
              >
                <Card size="sm" className={cn(cardShell, 'own:shadow-lg own:ring-1 ring-accent-line', drag.dropping && 'own:shadow-md')}>
                  <div className={cardBody}>{renderCard(dragged, { lifted: true, selected: selected.has(dragged.id) })}</div>
                </Card>
              </m.div>
            </div>,
            document.body,
          )}
      </Ctx.Provider>
    </MotionFeatures>
  )
}

/* The card's own padding and rhythm live on an inner column rather than the
 * Card: a component style may pad a card's sections instead of the card
 * (Bezel does), and this keeps renderCard's rows padded and spaced in every
 * style. Content still pads its own inline edges with px-(--card-spacing). */
const cardShell = 'own:gap-0 own:py-0'
const cardBody = 'own:flex min-w-0 flex-col gap-2 py-(--card-spacing)'
const colWidth = 'w-72 shrink-0 group-data-fill/kanban:grow'
const colCollapsedWidth = 'w-11 group-data-fill/kanban:grow-0'
// With `snap`, each column is a stop: a swipe lands a column at the board's start edge.
const colSnap = 'snap-start'

const laneLabel = (lane: KanbanLane) => lane.label ?? (typeof lane.title === 'string' ? lane.title : lane.id)

function ColumnHeader({ column, count, collapsed, onToggle }: { column: KanbanColumn; count: number; collapsed: boolean; onToggle: () => void }) {
  const over = column.limit !== undefined && count > column.limit
  const at = column.limit !== undefined && count === column.limit
  const labels = useComponentLabels(kanbanLabels)
  // A div, not <header>: outside a section (the swimlane header row) a header is a banner landmark.
  return (
    <div
      data-slot="kanban-column-header"
      data-over-limit={over || undefined}
      className={cn(
        'own:flex shrink-0 items-center gap-2 own:rounded-t-xl own:px-3 own:pt-2.5 own:pb-1.5 transition-[background-color] yj-duration-fast ease-standard',
        // Over its limit, the header takes a warning wash (the count turns warning too).
        'own:data-over-limit:bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]',
        collapsed && 'flex-col gap-2 own:px-0 own:pt-3',
      )}
    >
      {collapsed ? (
        <>
          <Button variant="ghost" size="icon-xs" aria-label={labels.kanbanExpand(column.title)} aria-expanded={false} onClick={onToggle}>
            <ChevronsLeftRightIcon />
          </Button>
          <Count count={count} limit={column.limit} over={over} at={at} />
          <h2 className="own:text-ui own:font-medium own:text-fg [writing-mode:vertical-rl]">{column.title}</h2>
        </>
      ) : (
        <>
          {column.tone && <span aria-hidden className={cn('size-2 shrink-0 own:rounded-full', toneDot[column.tone])} />}
          <h2 className={cn('min-w-0 truncate own:text-ui own:font-medium own:text-fg', over && 'own:text-warning-text')}>{column.title}</h2>
          <Count count={count} limit={column.limit} over={over} at={at} />
          <Button variant="ghost" size="icon-xs" aria-label={labels.kanbanCollapse(column.title)} aria-expanded className="own:ms-auto own:-me-1.5" onClick={onToggle}>
            <SidebarIcon className="rtl:-scale-x-100" />
          </Button>
        </>
      )}
    </div>
  )
}

function Count({ count, limit, over, at }: { count: number; limit?: number; over: boolean; at: boolean }) {
  const labels = useComponentLabels(kanbanLabels)
  const label = labels.kanbanCardCount(count, limit, over)
  return (
    <Badge variant={over ? 'warning' : 'secondary'} aria-label={label} className={cn('own:tabular-nums', at && 'own:text-fg')}>
      {limit === undefined ? count : `${count}/${limit}`}
    </Badge>
  )
}

function Cell<C extends KanbanCardData>({
  column,
  lane,
  laneTitle,
  cards,
  collapsed,
  renderCard,
  onAddCard,
  onBlurCard,
}: {
  column: KanbanColumn
  lane: string | undefined
  laneTitle?: string
  cards: C[]
  collapsed: boolean
  renderCard: KanbanProps<C>['renderCard']
  onAddCard: KanbanProps<C>['onAddCard']
  onBlurCard: () => void
}) {
  const board = useBoard()
  const labels = useComponentLabels(kanbanLabels)
  const hovering = board.dragId !== null && cards.some((c) => c.id === board.dragId)
  const inLane = lane !== undefined
  return (
    <div
      data-kanban-cell=""
      data-column={column.id}
      data-lane={lane}
      data-drop-target={hovering || undefined}
      className={cn(
        'own:flex min-h-0 flex-col',
        inLane && ['own:rounded-xl own:bg-transparent transition-[width,flex-grow] yj-duration-base ease-standard', colWidth, collapsed && colCollapsedWidth],
        !inLane && 'flex-1',
        collapsed && 'own:data-drop-target:bg-hover',
      )}
    >
      <m.ul
        layoutRoot
        layoutScroll
        data-kanban-list=""
        aria-label={inLane ? `${column.title}, ${laneTitle ?? lane}` : column.title}
        hidden={collapsed}
        className={cn('relative own:flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto yj-scrollbar px-2 pt-1 pb-2', inLane && 'pt-2')}
      >
        {cards.map((card) => (
          <Item key={card.id} card={card} renderCard={renderCard} onBlur={onBlurCard} />
        ))}
        {cards.length === 0 && (
          <li aria-hidden className="own:grid min-h-16 place-items-center own:rounded-lg border border-dashed border-line own:text-ui-sm own:text-fg-muted">
            {labels.kanbanNoCards}
          </li>
        )}
      </m.ul>
      {onAddCard && !collapsed && <Composer onAdd={(title) => onAddCard({ column: column.id, lane }, title)} columnTitle={column.title} />}
    </div>
  )
}

function Item<C extends KanbanCardData>({ card, renderCard, onBlur }: { card: C; renderCard: KanbanProps<C>['renderCard']; onBlur: () => void }) {
  const board = useBoard()
  const k = useYouj()
  const labels = useComponentLabels(kanbanLabels)
  const ref = useRef<HTMLLIElement>(null)
  const tabStop = useIsTabStop(card.id)
  const placeholder = board.dragId === card.id
  const lifted = board.liftedId === card.id
  const selected = board.selected.has(card.id)

  // A card re-mounted in another column by the keyboard glides in from where it was.
  // biome-ignore lint/correctness/useExhaustiveDependencies: plays once, as the card mounts after a keyboard move; board.flip, card.id and k are read at that moment
  useLayoutEffect(() => {
    const from = board.flip.current
    const el = ref.current
    if (!from || from.id !== card.id || !el) return
    board.flip.current = null
    if (k.reduced) return
    const to = el.getBoundingClientRect()
    const dx = from.rect.left - to.left
    const dy = from.rect.top - to.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    animate(el, { x: [dx, 0], y: [dy, 0] }, k.spring('smooth'))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once, as the card mounts after a keyboard move; board.flip, card.id and k are read at that moment
  }, [])

  return (
    <m.li
      ref={ref}
      layout="position"
      transition={{ layout: k.reduced ? { type: false } : k.spring('smooth') }}
      data-kanban-item={card.id}
      className={cn('relative', lifted && 'z-10')}
    >
      {placeholder ? (
        <m.div
          aria-hidden
          data-kanban-placeholder=""
          initial={false}
          animate={{ height: board.dragHeight }}
          className="own:rounded-xl border border-dashed border-accent-line own:bg-hover"
          style={{ height: board.dragHeight }}
        />
      ) : (
        // shape: a card's hover and lifted edge colours show its state; its corner and height stay the Card's
        <Card
          size="sm"
          role="button"
          tabIndex={tabStop ? 0 : -1}
          aria-roledescription={labels.kanbanRoleCard}
          aria-describedby={board.instructionsId}
          aria-pressed={lifted}
          data-kanban-card={card.id}
          data-lifted={lifted || undefined}
          data-selected={selected || undefined}
          onPointerDown={(e) => board.onCardPointerDown(e, card.id)}
          onKeyDown={(e) => board.onCardKeyDown(e, card.id)}
          onFocus={(e) => e.target === e.currentTarget && board.onCardFocus(card.id)}
          onBlur={onBlur}
          onClick={(e) => board.onCardClick(e, card.id)}
          onContextMenu={() => board.onCardContextMenu(card.id)}
          className={cn(
            cardShell,
            'cursor-grab touch-manipulation outline-none select-none focus-ring',
            'transition-[box-shadow,border-color,scale] yj-duration-fast ease-standard own:hover:border-line-control',
            'data-lifted:scale-[1.02] own:data-lifted:border-focus own:data-lifted:shadow-lg reduced:data-lifted:scale-100',
            // Selected: an accent edge and the accent's tint laid over the card's own surface.
            'own:data-selected:border-accent own:data-selected:ring-1 ring-accent',
            'own:data-selected:[background:linear-gradient(var(--color-accent-subtle),var(--color-accent-subtle)),var(--color-surface)]',
          )}
        >
          <div className={cardBody}>{renderCard(card, { lifted, selected })}</div>
          {selected && <span className="sr-only">, {labels.selected}</span>}
        </Card>
      )}
    </m.li>
  )
}

function Composer({ onAdd, columnTitle }: { onAdd: (title: string) => void; columnTitle: string }) {
  const labels = useComponentLabels(kanbanLabels)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const close = () => {
    setOpen(false)
    setValue('')
    requestAnimationFrame(() => trigger.current?.focus())
  }
  if (!open)
    return (
      <div className="px-2 pb-2">
        <Button ref={trigger} variant="ghost" size="sm" className="w-full justify-start own:text-fg-muted" onClick={() => setOpen(true)}>
          <PlusIcon trigger="none" /> {labels.kanbanAddCard}
        </Button>
      </div>
    )
  return (
    <form
      className="own:flex flex-col own:gap-2 own:px-2 own:pb-2"
      onSubmit={(e) => {
        e.preventDefault()
        const title = value.trim()
        if (!title) return
        onAdd(title)
        setValue('')
      }}
    >
      <Input
        autoFocus
        aria-label={labels.kanbanNewCard(columnTitle)}
        placeholder={labels.kanbanCardTitle}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), close())}
      />
      <div className="own:flex gap-1.5">
        <Button type="submit" size="sm" disabled={!value.trim()}>
          {labels.add}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  )
}
