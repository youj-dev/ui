'use client'

import {
  Children,
  createContext,
  isValidElement,
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
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { m, useDragControls, useMotionValue, useTransform, type DragControls } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { sortableListLabels } from '@youj/core/labels'
import { GripIcon } from '@youj/icons'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* A vertical list the user puts in order. Built on the same motion/react
 * layer as Kanban: the dragged row follows the pointer (a y-drag on the row
 * itself, so it stays in the list and in the accessibility tree; it swaps with
 * a neighbor once its leading edge passes that neighbor's middle, as motion's
 * Reorder does, but without Reorder, whose Group and Item Rolldown drops from
 * builds with `strictExecutionOrder`, e.g. Storybook's), the rows around
 * it glide aside with `layout` on the smooth spring, and letting go settles
 * the row into its slot. Escape mid-drag puts it back.
 *
 * Keyboard: the handles are one tab stop; ↑/↓ walk between them, Home/End
 * jump. Space or Enter picks a row up; ↑/↓ move it (Home/End to the ends),
 * Space or Enter drops it, Escape (or leaving it) cancels. Every step is
 * announced: "Picked up Design review. Position 2 of 5."
 *
 * The order is the items' `value`s: controlled (`value` + `onValueChange`),
 * or uncontrolled from `defaultValue`, or from the children's own order.
 * `onValueChange` fires once per drop, not on every step of a drag.
 * Reduced motion: rows jump into place; dragging still follows the pointer. */

/* Which handle is the one tab stop. It is a store, not context state, so a
 * focus move re-renders the two rows whose answer changed, not every row. */
interface TabStopStore {
  value: string | null
  listeners: Set<() => void>
}

interface ListContext {
  tabStops: TabStopStore
  liftedId: string | null
  draggingId: string | null
  instructionsId: string
  disabled: boolean
  transition: object
  onHandleKeyDown: (event: KeyboardEvent<HTMLElement>, id: string) => void
  onHandleFocus: (id: string) => void
  onHandleBlur: () => void
  onDragStart: (id: string, controls: DragControls) => void
  onDragEnd: (id: string) => void
  /** A row's measured vertical extent, from layout projection. */
  onRowMeasure: (id: string, box: Extent) => void
  /** While dragging: how far the row has moved from its slot, and its velocity. */
  onRowDrag: (id: string, offset: number, velocity: number) => void
}

interface Extent {
  min: number
  max: number
}

const Ctx = createContext<ListContext | null>(null)
const ItemCtx = createContext<{ value: string; label?: string; lifted: boolean; startDrag: (event: ReactPointerEvent<HTMLElement>) => void } | null>(null)

/** Whether this row's handle is the list's tab stop. `enabled` false (a row that isn't its own handle) never re-renders. */
function useIsTabStop(value: string, enabled = true) {
  const { tabStops } = useList()
  const subscribe = useCallback(
    (listener: () => void) => {
      tabStops.listeners.add(listener)
      return () => void tabStops.listeners.delete(listener)
    },
    [tabStops],
  )
  const read = () => enabled && tabStops.value === value
  return useSyncExternalStore(subscribe, read, read)
}

function useList() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('SortableListItem must be used inside SortableList')
  return ctx
}

interface SortableListProps extends Omit<ComponentProps<'ul'>, 'defaultValue' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'onAnimationStart'> {
  /** The items' values in order (controlled). */
  value?: string[]
  /** The starting order when uncontrolled. Default: the children's order. */
  defaultValue?: string[]
  /** Called with the new order when a row is dropped somewhere new. */
  onValueChange?: (value: string[]) => void
  /** Turn reordering off; the rows stay as a plain list. */
  disabled?: boolean
  /** Names the list for assistive tech. */
  'aria-label'?: string
  children?: ReactNode
}

type ItemElement = ReactElement<SortableListItemProps>

/** Present ids in `order`, then any child not in it yet (a new item), in child order. */
function normalize(order: string[], ids: string[]) {
  const present = new Set(ids)
  const kept = order.filter((id) => present.has(id))
  const seen = new Set(kept)
  return [...kept, ...ids.filter((id) => !seen.has(id))]
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

function SortableList({ value, defaultValue, onValueChange, disabled = false, className, children, ...props }: SortableListProps) {
  const k = useYouj()
  const labels = useComponentLabels(sortableListLabels)
  const instructionsId = useId()
  const { announce, announcer } = useAnnouncer()
  const rootRef = useRef<HTMLUListElement>(null)

  const items = Children.toArray(children).filter((c): c is ItemElement => isValidElement(c) && typeof (c.props as SortableListItemProps).value === 'string')
  const ids = items.map((c) => c.props.value)
  const byId = new Map(items.map((c) => [c.props.value, c]))

  const [orderState, setOrderState] = useControllableState(value, defaultValue ?? ids)
  const order = normalize(orderState, ids)
  const [preview, setPreview] = useState<string[] | null>(null)
  const shown = preview ? normalize(preview, ids) : order

  const [focusId, setFocusId] = useState<string | null>(null)
  const [lifted, setLifted] = useState<{ id: string; origin: string[] } | null>(null)
  const [dragging, setDragging] = useState<{ id: string; origin: string[]; controls: DragControls } | null>(null)
  const cancelled = useRef(false)
  const pendingFocus = useRef<string | null>(null)

  const latest = useRef({ order, shown, lifted, dragging })
  latest.current = { order, shown, lifted, dragging }

  // biome-ignore lint/correctness/useExhaustiveDependencies: byId is derived from items; labelOf is rebuilt when they change
  const labelOf = useCallback(
    (id: string) => {
      const text = byId.get(id)?.props.textValue
      if (text) return text
      const el = rootRef.current?.querySelector(`[data-sortable-item="${CSS.escape(id)}"]`)
      return el?.textContent?.trim() || id
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- byId is derived from items; labelOf is rebuilt when they change
    [items],
  )
  const where = (list: string[], id: string) => labels.sortablePosition(list.indexOf(id) + 1, list.length)

  const commit = useCallback(
    (next: string[]) => {
      if (same(next, latest.current.order)) return
      setOrderState(next)
      onValueChange?.(next)
    },
    [setOrderState, onValueChange],
  )

  const focusHandle = (id: string) => {
    setFocusId(id)
    pendingFocus.current = id
  }
  // A row React moved in the DOM can drop focus; put it back on its handle.
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-sortable-handle="${CSS.escape(id)}"]`)
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
    if (el) pendingFocus.current = null
  })

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const onHandleKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.target !== event.currentTarget || disabled || latest.current.dragging) return
    const key = event.key
    const now = latest.current
    if (now.lifted?.id === id) {
      const list = now.shown
      const i = list.indexOf(id)
      if (key === ' ' || key === 'Enter') {
        setLifted(null)
        setPreview(null)
        commit(list)
        announce(labels.sortableDropped(labelOf(id), where(list, id)))
      } else if (key === 'Escape') {
        setLifted(null)
        setPreview(null)
        focusHandle(id)
        announce(labels.sortableCancelled(labelOf(id), where(now.lifted.origin, id)))
      } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End') {
        const to = key === 'Home' ? 0 : key === 'End' ? list.length - 1 : i + (key === 'ArrowUp' ? -1 : 1)
        if (to >= 0 && to < list.length && to !== i) {
          const next = list.filter((v) => v !== id)
          next.splice(to, 0, id)
          setPreview(next)
          focusHandle(id)
          announce(labels.sortableMoved(labelOf(id), where(next, id)))
        }
      } else return
      event.preventDefault()
      return
    }
    const list = now.order
    const i = list.indexOf(id)
    if (key === ' ' || key === 'Enter') {
      setLifted({ id, origin: list })
      setPreview(list)
      announce(labels.sortablePickedUpKeyboard(labelOf(id), where(list, id)))
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      const target = list[i + (key === 'ArrowUp' ? -1 : 1)]
      if (target) focusHandle(target)
    } else if (key === 'Home' || key === 'End') {
      const target = key === 'Home' ? list[0] : list[list.length - 1]
      if (target) focusHandle(target)
    } else return
    event.preventDefault()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: where is a pure lookup rebuilt each render from labels; labelOf and announce cover what changes
  const onHandleBlur = useCallback(() => {
    // Focus leaving a lifted row (a click elsewhere, Tab) cancels the move.
    requestAnimationFrame(() => {
      const now = latest.current.lifted
      if (!now || pendingFocus.current) return
      const el = rootRef.current?.querySelector(`[data-sortable-handle="${CSS.escape(now.id)}"]`)
      if (el && document.activeElement === el) return
      setLifted(null)
      setPreview(null)
      announce(labels.sortableCancelled(labelOf(now.id), where(now.origin, now.id)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- where is a pure lookup rebuilt each render from labels; labelOf and announce cover what changes
  }, [announce, labelOf])

  /* ── Pointer drag ─────────────────────────────────────────────────────── */
  const onDragStart = useCallback(
    (id: string, controls: DragControls) => {
      const origin = latest.current.order
      cancelled.current = false
      setDragging({ id, origin, controls })
      setPreview(origin)
      setFocusId(id)
      announce(labels.sortablePickedUp(labelOf(id), where(origin, id)))
    },
    [announce, labelOf],
  )

  const onDragEnd = useCallback(
    (id: string) => {
      const now = latest.current
      setDragging(null)
      setPreview(null)
      if (cancelled.current) {
        announce(labels.sortableCancelled(labelOf(id), where(now.dragging?.origin ?? now.order, id)))
        return
      }
      commit(now.shown)
      announce(labels.sortableDropped(labelOf(id), where(now.shown, id)))
    },
    [announce, labelOf, commit],
  )

  // Escape mid-drag: back to the origin order, then let go so the row settles into its old slot.
  useEffect(() => {
    if (!dragging) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      cancelled.current = true
      setPreview(dragging.origin)
      requestAnimationFrame(() => dragging.controls.stop())
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [dragging])

  /* ── Swapping while dragged ───────────────────────────────────────────── */
  const extents = useRef(new Map<string, Extent>())
  // One swap per render: the next waits until the rows have re-measured.
  const swapping = useRef(false)
  useEffect(() => {
    swapping.current = false
  })
  const onRowMeasure = useCallback((id: string, box: Extent) => void extents.current.set(id, box), [])
  const onRowDrag = useCallback((id: string, offset: number, velocity: number) => {
    const list = latest.current.shown
    if (swapping.current || !velocity || !latest.current.dragging) return
    const i = list.indexOf(id)
    const step = velocity > 0 ? 1 : -1
    const neighbour = list[i + step]
    const row = extents.current.get(id)
    const next = neighbour ? extents.current.get(neighbour) : undefined
    if (i === -1 || !row || !next) return
    const middle = (next.min + next.max) / 2
    if (step === 1 ? row.max + offset > middle : row.min + offset < middle) {
      const order = [...list]
      order[i] = neighbour!
      order[i + step] = id
      swapping.current = true
      setPreview(order)
    }
  }, [])

  const tabStop = useMemo(() => (focusId && shown.includes(focusId) ? focusId : (shown[0] ?? null)), [focusId, shown])
  const [tabStops] = useState<TabStopStore>(() => ({ value: null, listeners: new Set() }))
  // Rows rendered with this pass read the new stop; the rest are told after it commits.
  tabStops.value = tabStop
  // biome-ignore lint/correctness/useExhaustiveDependencies: tabStop is the trigger: listeners are told when the stop changes, though the effect never reads it
  useLayoutEffect(() => {
    for (const listener of tabStops.listeners) listener()
  }, [tabStop, tabStops])

  const transition = useMemo(() => (k.reduced ? { type: false } : k.spring('smooth')), [k])

  /* The rows read this context, so it changes only when a row's own answer can:
   * the handlers go through a ref and keep their identity, and the focus stop
   * lives in the store above. Keeping it still is what lets a focus move or a
   * preview step leave the other rows alone. */
  const handlers = useRef({ onHandleKeyDown, onHandleBlur, onDragStart, onDragEnd })
  handlers.current = { onHandleKeyDown, onHandleBlur, onDragStart, onDragEnd }
  const stable = useMemo(
    () => ({
      onHandleKeyDown: (event: KeyboardEvent<HTMLElement>, id: string) => handlers.current.onHandleKeyDown(event, id),
      onHandleFocus: setFocusId,
      onHandleBlur: () => handlers.current.onHandleBlur(),
      onDragStart: (id: string, controls: DragControls) => handlers.current.onDragStart(id, controls),
      onDragEnd: (id: string) => handlers.current.onDragEnd(id),
      onRowMeasure,
      onRowDrag,
    }),
    [onRowMeasure, onRowDrag],
  )
  const liftedId = lifted?.id ?? null
  const draggingId = dragging?.id ?? null
  // Motion's feature provider hands every motion element a new context value each time it renders,
  // so the rows are rebuilt only when the order or the children change, not on a focus move.
  const orderKey = shown.join('\0')
  // biome-ignore lint/correctness/useExhaustiveDependencies: orderKey stands for shown and children for byId; the rows are rebuilt only when the order or the children change
  const rows = useMemo(
    () => <MotionFeatures features="max">{shown.map((id) => byId.get(id))}</MotionFeatures>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- orderKey stands for shown and children for byId; the rows are rebuilt only when the order or the children change
    [orderKey, children],
  )
  const context = useMemo<ListContext>(
    () => ({ tabStops, liftedId, draggingId, instructionsId, disabled, transition, ...stable }),
    [tabStops, liftedId, draggingId, instructionsId, disabled, transition, stable],
  )

  return (
    <Ctx.Provider value={context}>
      <ul
        ref={rootRef}
        data-slot="sortable-list"
        data-reduced-motion={k.reduced || undefined}
        data-dragging={dragging ? '' : undefined}
        className={cn('relative own:flex flex-col gap-1.5 data-dragging:cursor-grabbing data-dragging:select-none', className)}
        {...props}
      >
        {rows}
      </ul>
      <p id={instructionsId} className="sr-only">
        {labels.sortableInstructions}
      </p>
      {announcer}
    </Ctx.Provider>
  )
}

interface SortableListItemProps extends Omit<ComponentProps<'li'>, 'value' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'onAnimationStart'> {
  /** This item's id in the list's value. */
  value: string
  /** What announcements call this item. Default: its text. */
  textValue?: string
  /** The whole row is the handle: it takes focus and starts a drag from anywhere on it. Default false (render a SortableListHandle). */
  asHandle?: boolean
}

function SortableListItem({ value, textValue, asHandle = false, className, style, children, ...props }: SortableListItemProps) {
  const list = useList()
  const labels = useComponentLabels(sortableListLabels)
  const controls = useDragControls()
  const y = useMotionValue(0)
  // The dragged row rides above its neighbors until it has settled back to its slot.
  const zIndex = useTransform(y, (v) => (v ? 1 : 'auto'))
  const lifted = list.liftedId === value
  const dragging = list.draggingId === value

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (list.disabled || event.button !== 0 || list.liftedId) return
    controls.start(event)
  }
  const tabStop = useIsTabStop(value, asHandle)
  const handleProps = asHandle ? { ...handleAttributes(list, value, tabStop), 'aria-roledescription': labels.sortableRoleItem } : {}

  return (
    <ItemCtx.Provider value={{ value, label: textValue, lifted, startDrag }}>
      <m.li
        layout
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragSnapToOrigin
        style={{ ...style, y, zIndex }}
        transition={list.transition}
        onLayoutMeasure={(box) => list.onRowMeasure(value, box.y)}
        onDrag={(_, info) => list.onRowDrag(value, y.get(), info.velocity.y)}
        onDragStart={() => list.onDragStart(value, controls)}
        onDragEnd={() => list.onDragEnd(value)}
        data-slot="sortable-list-item"
        data-sortable-item={value}
        data-lifted={lifted || undefined}
        data-dragging={dragging || undefined}
        {...handleProps}
        onPointerDown={
          asHandle
            ? (event: ReactPointerEvent<HTMLLIElement>) => {
                if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [data-no-drag]')) return
                startDrag(event)
              }
            : undefined
        }
        className={cn(
          'relative flex min-h-control items-center gap-2 own:rounded-lg border own:border-line own:bg-surface own:px-2 own:py-1.5 text-ui own:text-fg',
          'transition-[box-shadow,border-color,scale] yj-duration-fast ease-standard',
          'data-lifted:scale-[1.015] own:data-lifted:border-focus own:data-lifted:shadow-lg data-dragging:scale-[1.015] data-dragging:shadow-lg',
          'reduced:data-lifted:scale-100 reduced:data-dragging:scale-100',
          asHandle && 'cursor-grab touch-none outline-none select-none focus-ring data-dragging:cursor-grabbing',
          className,
        )}
        {...(props as object)}
      >
        {children}
      </m.li>
    </ItemCtx.Provider>
  )
}

function handleAttributes(list: ListContext, value: string, tabStop: boolean) {
  return {
    tabIndex: list.disabled ? -1 : tabStop ? 0 : -1,
    'aria-describedby': list.instructionsId,
    'data-sortable-handle': value,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => list.onHandleKeyDown(event, value),
    onFocus: (event: React.FocusEvent<HTMLElement>) => event.target === event.currentTarget && list.onHandleFocus(value),
    onBlur: list.onHandleBlur,
  }
}

interface SortableListHandleProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Names the handle. Default: "Reorder" plus the item's `textValue`. */
  'aria-label'?: string
}

/** The grip that picks its row up: a button, so it is the row's keyboard stop too. */
function SortableListHandle({ className, 'aria-label': label, ...props }: SortableListHandleProps) {
  const list = useList()
  const labels = useComponentLabels(sortableListLabels)
  const item = useContext(ItemCtx)
  if (!item) throw new Error('SortableListHandle must be used inside SortableListItem')
  const tabStop = useIsTabStop(item.value)
  const active = item.lifted || list.draggingId === item.value
  return (
    <button
      type="button"
      data-slot="sortable-list-handle"
      aria-label={label ?? (item.label ? labels.sortableReorderItem(item.label) : labels.sortableReorder)}
      aria-pressed={item.lifted}
      disabled={list.disabled}
      {...handleAttributes(list, item.value, tabStop)}
      onPointerDown={item.startDrag}
      className={cn(
        // 24px mark, a 32px target: the hit area reaches past the glyph.
        'relative own:-my-1 own:inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center own:rounded-md own:text-fg-muted select-none',
        'transition-colors yj-duration-fast ease-standard own:hover:bg-hover hover:text-fg focus-ring',
        'after:absolute after:-inset-1 own:aria-pressed:bg-selected aria-pressed:text-fg disabled:cursor-default disabled:opacity-50',
        'in-data-dragging:cursor-grabbing',
        className,
      )}
      {...props}
    >
      <GripIcon size={14} active={active} aria-hidden />
    </button>
  )
}

export { SortableList, SortableListItem, SortableListHandle }
export type { SortableListProps, SortableListItemProps, SortableListHandleProps }
