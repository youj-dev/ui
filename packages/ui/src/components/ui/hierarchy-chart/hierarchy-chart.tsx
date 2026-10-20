'use client'

import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { hierarchyChartLabels, useComponentLabels } from '@youj/core/labels'
import { useDirection, useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { MaximizeIcon } from '@youj/icons/components/youj/icons/maximize'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../../lib/utils'
import { Button } from '../button'
import { elbowPath, layoutHierarchy, type HierarchyLayout, type HierarchyLayoutNode, type HierarchyOrientation } from './hierarchy-chart-layout'
import { HierarchyNodeCard, type HierarchyNode, type HierarchyNodeState } from './hierarchy-chart-node'
import { BAND, clampView, fitView, MAX_ZOOM, MIN_ZOOM, OPEN_FLOOR, zoomAt, ZOOM_STEP, type Rect, type View } from './hierarchy-chart-view'

/* A hierarchy drawn as a tidy tree: an org chart, a team of teams, a product's
 * structure. Each node is a card joined to its parent by an elbow with
 * rounded corners; the layout is Reingold–Tilford (hierarchy-chart-layout.ts).
 * - Branches open and close (the chip on a card's foot, Enter, or the arrow
 *   keys). The node you toggle stays put and the rest glide around it on the
 *   kit's spring, the connectors redrawing as they go; a closed branch's chip
 *   counts everyone it hides ("+6").
 * - Pan by dragging anywhere (a click that doesn't move still picks a node),
 *   with the wheel, or with one finger across; zoom with Ctrl or ⌘ and the
 *   wheel, a pinch, the corner buttons, or + and −; 0 fits the whole chart.
 * - Selecting a node (click or Space) lights the path down to it from its root.
 * - A WAI-ARIA tree: one Tab stop, ↑ ↓ move through the nodes in reading
 *   order, → opens a branch or steps into it, ← closes it or steps out to its
 *   parent (mirrored under RTL), Home / End, * opens every sibling branch.
 *   Focus brings its node into view.
 * - Reduced motion: no gliding; nodes, connectors and the view land in place.
 * - RTL mirrors the chart: roots on the right when horizontal, first children
 *   on the right when vertical. */

export interface HierarchyChartHandle {
  /** Opens the branches above a node, focuses it and centers it. */
  focusNode: (id: string) => void
  /** Fits the whole chart in view. */
  fit: () => void
}

export interface HierarchyChartProps<T extends HierarchyNode = HierarchyNode> extends Omit<ComponentProps<'div'>, 'children' | 'ref' | 'defaultValue' | 'onChange'> {
  /** The tree: one root, or several side by side. Ids must be unique. */
  nodes: T | readonly T[]
  /** A node's card contents, inside the chart's card frame (which draws focus, selection and the path). Default: avatar, name, role and badge. */
  renderNode?: (node: T, state: HierarchyNodeState) => ReactNode
  /** `vertical` (default) grows down from the root; `horizontal` grows along the reading direction. */
  orientation?: HierarchyOrientation
  /** Open branches (controlled). */
  expanded?: string[]
  /** Default: every branch open. */
  defaultExpanded?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** The selected node (controlled); `null` for none. */
  selected?: string | null
  defaultSelected?: string | null
  onSelectedChange?: (id: string | null) => void
  /** Every card's size in pixels. Default 224 × 64. */
  nodeSize?: { width: number; height: number }
  /** The canvas height in pixels. Default 480. */
  height?: number
  /** The tree's accessible name. Default: the labels' "Hierarchy chart". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** With sound on, selecting plays `select`, opening a branch `open` and closing it `close`. Default true. */
  sound?: boolean
  ref?: Ref<HierarchyChartHandle>
}

const NODE = { width: 224, height: 64 }
const RADIUS = 10

/** Every node by id, with its parent, over the whole data (closed branches included). */
function indexNodes<T extends HierarchyNode>(roots: readonly T[]) {
  const index = new Map<string, { node: T; parent: string | null }>()
  const walk = (list: readonly HierarchyNode[], parent: string | null) => {
    for (const node of list) {
      index.set(node.id, { node: node as T, parent })
      if (node.children) walk(node.children, node.id)
    }
  }
  walk(roots, null)
  return index
}

const ancestorsOf = (id: string, index: Map<string, { parent: string | null }>) => {
  const out: string[] = []
  for (let p = index.get(id)?.parent; p; p = index.get(p)?.parent) out.push(p)
  return out
}

/** A path with the elbow's commands that sits at one point: where a connector grows from and shrinks back to. */
const pointPath = (x: number, y: number) => `M${x} ${y}L${x} ${y}Q${x} ${y} ${x} ${y}L${x} ${y}Q${x} ${y} ${x} ${y}L${x} ${y}`

/** Whether focus arrived from the keyboard (older engines don't know the selector). */
const keyboardFocus = (el: Element) => {
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}

export function HierarchyChart<T extends HierarchyNode = HierarchyNode>({
  nodes,
  renderNode,
  orientation = 'vertical',
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  nodeSize = NODE,
  height = 480,
  label,
  locale: localeProp,
  sound = true,
  ref,
  className,
  style,
  onKeyDown,
  ...props
}: HierarchyChartProps<T>) {
  const k = useYouj()
  const labels = useComponentLabels(hierarchyChartLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const rtl = useDirection() === 'rtl'
  const hintId = useId()
  const baseId = useId()
  const roots = useMemo(() => (Array.isArray(nodes) ? (nodes as readonly T[]) : [nodes as T]), [nodes])
  const index = useMemo(() => indexNodes(roots), [roots])
  const [expandedList, setExpandedList] = useControllableState(expandedProp, defaultExpanded ?? [...index.values()].filter((e) => e.node.children?.length).map((e) => e.node.id))
  const [selected, setSelected] = useControllableState(selectedProp, defaultSelected)
  const expanded = useMemo(() => new Set(expandedList), [expandedList])

  const layout = useMemo(
    () => layoutHierarchy(roots, { orientation, isOpen: (id) => expanded.has(id), nodeWidth: nodeSize.width, nodeHeight: nodeSize.height }),
    [roots, orientation, expanded, nodeSize.width, nodeSize.height],
  )

  /* World placement: mirrored under RTL, then shifted by `offset`, which keeps
   * a toggled node where it was while the rest of the tree re-flows. */
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [anchor, setAnchor] = useState<{ id: string; x: number; y: number } | null>(null)
  const place = (n: HierarchyLayoutNode, l: HierarchyLayout = layout, o = offset) => ({ x: (rtl ? l.width - n.x - n.width : n.x) + o.x, y: n.y + o.y })
  const content: Rect = { x: offset.x, y: offset.y, w: layout.width, h: layout.height }

  const viewportRef = useRef<HTMLDivElement>(null)
  const items = useRef(new Map<string, HTMLLIElement>())
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const [smooth, setSmooth] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const fitted = useRef(true)
  const pending = useRef<{ id: string; center: boolean } | null>(null)

  /* Keep the toggled node in place: shift the world by however far the new
   * layout moved it. Set while rendering, so the first frame of the glide
   * (and where leaving nodes head) already knows the shift. */
  const [laidOut, setLaidOut] = useState(layout)
  if (laidOut !== layout) {
    setLaidOut(layout)
    const n = anchor && layout.nodes.get(anchor.id)
    if (anchor) setAnchor(null)
    if (anchor && n) {
      const at = place(n, layout, { x: 0, y: 0 })
      setOffset({ x: anchor.x - at.x, y: anchor.y - at.y })
    }
  }

  // Reset the shift when the chart's shape changes underneath it.
  const shapeKey = `${orientation}|${rtl}|${nodeSize.width}x${nodeSize.height}|${roots.map((r) => r.id).join(',')}`
  const [lastShape, setLastShape] = useState(shapeKey)
  if (lastShape !== shapeKey) {
    setLastShape(shapeKey)
    setOffset({ x: 0, y: 0 })
    fitted.current = true
  }

  // Measure the viewport; the view keeps fitting until someone pans, zooms or toggles.
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => {
      const box = el.getBoundingClientRect()
      if (box.width > 0 && box.height > 0) setSize((s) => (s && s.w === box.width && s.h === box.height ? s : { w: box.width, h: box.height }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rootFocus = () => {
    const first = layout.nodes.get(layout.order[0] ?? '')
    if (!first) return undefined
    const p = place(first)
    return { x: p.x + first.width / 2, y: p.y + first.height / 2 }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: refits when the size or the content's box changes.
  useLayoutEffect(() => {
    if (!size) return
    setView((v) => (fitted.current ? fitView(size.w, size.h, content, OPEN_FLOOR, rootFocus()) : clampView(v, size.w, size.h, content)))
  }, [size, layout.width, layout.height, offset.x, offset.y, rtl]) // eslint-disable-line react-hooks/exhaustive-deps -- refits when the size or the content's box changes.

  const move = (next: View, glide: boolean) => {
    if (!size) return
    fitted.current = false
    setSmooth(glide && !k.reduced)
    setView(clampView(next, size.w, size.h, content))
  }
  const fit = () => {
    if (!size) return
    fitted.current = true
    setSmooth(!k.reduced)
    setView(fitView(size.w, size.h, content, MIN_ZOOM))
  }
  const zoomBy = (factor: number, point?: { x: number; y: number }) => {
    if (!size) return
    move(zoomAt(view, view.k * factor, point?.x ?? size.w / 2, (point?.y ?? (size.h - BAND) / 2)), true)
  }

  /** Brings a node into view (or to the center), gliding. */
  const reveal = (id: string, center = false) => {
    const n = layout.nodes.get(id)
    if (!n || !size) return
    const p = place(n)
    const x0 = view.x + p.x * view.k
    const y0 = view.y + p.y * view.k
    const [w, h] = [n.width * view.k, n.height * view.k]
    const margin = 16
    if (!center && x0 >= margin && y0 >= margin && x0 + w <= size.w - margin && y0 + h <= size.h - BAND) return
    move({ ...view, x: size.w / 2 - (p.x + n.width / 2) * view.k, y: (size.h - BAND) / 2 - (p.y + n.height / 2) * view.k }, true)
  }

  // Wheel: Ctrl/⌘ (or a trackpad pinch) zooms at the pointer; a plain wheel pans while there's room, then lets the page scroll.
  useEffect(() => {
    const el = viewportRef.current
    if (!el || !size) return
    const onWheel = (e: globalThis.WheelEvent) => {
      const box = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        move(zoomAt(view, view.k * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), e.clientX - box.left, e.clientY - box.top), false)
        return
      }
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
      const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY
      const next = clampView({ ...view, x: view.x - dx, y: view.y - dy }, size.w, size.h, content)
      if (Math.abs(next.x - view.x) < 0.5 && Math.abs(next.y - view.y) < 0.5) return
      e.preventDefault()
      move(next, false)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  /* Pointers: one drags the view once it has moved a few pixels (so a still
   * click still picks a node), a finger only across so the page still
   * scrolls; two pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number; touch: boolean }>())
  const gesture = useRef<{ view: View; x: number; y: number; dist: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const startGesture = () => {
    const pts = [...pointers.current.values()]
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length
    const dist = pts.length > 1 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0
    gesture.current = { view, x, y, dist, moved: gesture.current?.moved ?? false }
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || (e.target as HTMLElement).closest('[data-slot=hierarchy-chart-controls], [data-slot=hierarchy-chart-toggle]')) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' })
    suppressClick.current = false
    startGesture()
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointers.current.get(e.pointerId)
    const g = gesture.current
    if (!p || !g || !size) return
    p.x = e.clientX
    p.y = e.clientY
    const pts = [...pointers.current.values()]
    const x = pts.reduce((s, q) => s + q.x, 0) / pts.length
    const y = pts.reduce((s, q) => s + q.y, 0) / pts.length
    if (!g.moved && Math.hypot(x - g.x, y - g.y) < 4) return
    if (!g.moved) {
      g.moved = true
      setDragging(true)
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const box = e.currentTarget.getBoundingClientRect()
    if (pts.length > 1) {
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)
      const zoomed = zoomAt(g.view, g.view.k * (dist / Math.max(1, g.dist)), g.x - box.left, g.y - box.top)
      move({ ...zoomed, x: zoomed.x + x - g.x, y: zoomed.y + y - g.y }, false)
    } else move({ ...g.view, x: g.view.x + x - g.x, y: g.view.y + (p.touch ? 0 : y - g.y) }, false)
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    if (gesture.current?.moved) suppressClick.current = true
    if (pointers.current.size) startGesture()
    else {
      gesture.current = null
      setDragging(false)
    }
  }

  /* ── State changes ────────────────────────────────────────────────────── */
  const setOpen = (ids: string[], open: boolean, anchorId?: string) => {
    const next = new Set(expanded)
    let changed = false
    for (const id of ids) {
      if (!index.get(id)?.node.children?.length || next.has(id) === open) continue
      if (open) next.add(id)
      else next.delete(id)
      changed = true
    }
    if (!changed) return
    const n = anchorId ? layout.nodes.get(anchorId) : undefined
    if (n) {
      setAnchor({ id: n.id, ...place(n) })
      fitted.current = false
    }
    const list = [...next]
    setExpandedList(list)
    onExpandedChange?.(list)
  }
  const toggle = (id: string) => {
    const open = !expanded.has(id)
    // Closing over the focused node hands focus to the branch.
    if (!open && focusedId && ancestorsOf(focusedId, index).includes(id)) focusItem(id)
    setOpen([id], open, id)
    if (sound) cue(open ? 'open' : 'close')
  }
  const select = (id: string) => {
    if (selected === id) return
    setSelected(id)
    onSelectedChange?.(id)
    if (sound) cue('select')
  }

  /* ── Focus ────────────────────────────────────────────────────────────── */
  // The Tab stop: the focused node if it shows, else its nearest showing ancestor, else the selection's, else the first.
  const showing = (id: string | null) => {
    if (!id || !index.has(id)) return null
    if (layout.nodes.has(id)) return id
    return ancestorsOf(id, index).find((a) => layout.nodes.has(a)) ?? null
  }
  const tabStop = showing(focusedId) ?? showing(selected) ?? layout.order[0] ?? null

  const focusItem = (id: string, center = false) => {
    pending.current = { id, center }
    setFocusedId(id)
  }
  // Move DOM focus once the item is rendered; a node hidden by a close hands focus to its ancestor.
  useLayoutEffect(() => {
    const p = pending.current
    if (p) {
      const el = items.current.get(p.id)
      if (el) {
        pending.current = null
        el.focus({ preventScroll: true })
        reveal(p.id, p.center)
      }
    }
  })

  useImperativeHandle(ref, () => ({
    focusNode: (id: string) => {
      if (!index.has(id)) return
      const closed = ancestorsOf(id, index).filter((a) => !expanded.has(a))
      if (closed.length) setOpen(closed, true)
      focusItem(id, true)
    },
    fit,
  }))

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-slot=hierarchy-chart-node]')
    const key = e.key
    if (key === '+' || key === '=') zoomBy(ZOOM_STEP)
    else if (key === '-' || key === '_') zoomBy(1 / ZOOM_STEP)
    else if (key === '0') fit()
    else if (item && item === e.target) {
      const id = item.dataset.yjNode!
      const at = layout.order.indexOf(id)
      const n = layout.nodes.get(id)
      if (at < 0 || !n) return
      const inward = rtl ? 'ArrowLeft' : 'ArrowRight'
      const outward = rtl ? 'ArrowRight' : 'ArrowLeft'
      const go = (i: number) => {
        const target = layout.order[Math.max(0, Math.min(layout.order.length - 1, i))]
        if (target) focusItem(target)
      }
      if (key === 'ArrowDown') go(at + 1)
      else if (key === 'ArrowUp') go(at - 1)
      else if (key === 'Home') go(0)
      else if (key === 'End') go(layout.order.length - 1)
      else if (key === inward) {
        if (!n.childCount) return
        if (!n.open) toggle(id)
        else go(at + 1)
      } else if (key === outward) {
        if (n.open) toggle(id)
        else if (n.parent) focusItem(n.parent)
      } else if (key === 'Enter') {
        if (n.childCount) toggle(id)
      } else if (key === ' ') {
        if (!e.repeat) select(id)
      } else if (key === '*') {
        const siblings = n.parent ? index.get(n.parent)!.node.children! : roots
        setOpen(
          siblings.map((s) => s.id),
          true,
          id,
        )
      } else return
    } else return
    e.preventDefault()
  }

  /* ── Drawing ──────────────────────────────────────────────────────────── */
  const path = useMemo(() => (selected && index.has(selected) ? new Set([selected, ...ancestorsOf(selected, index)]) : new Set<string>()), [selected, index])
  const spring = k.reduced ? { type: false as const } : k.spring('smooth')
  const nearestShowing = (id: string, l: HierarchyLayout) => ancestorsOf(id, index).map((a) => l.nodes.get(a)).find(Boolean)
  // AnimatePresence hands this to leaving nodes, so they shrink back into whichever ancestor still shows.
  const ctx = { layout, place }
  type Ctx = typeof ctx
  const foot = (n: HierarchyLayoutNode, c: Ctx) => {
    const p = c.place(n, c.layout)
    return orientation === 'vertical' ? { x: p.x + n.width / 2, y: p.y + n.height } : { x: p.x + (rtl ? 0 : n.width), y: p.y + n.height / 2 }
  }
  const mirror = (x: number) => (rtl ? layout.width - x : x) + offset.x
  const down = (n: HierarchyLayoutNode) => ({ ...n, y: n.y + offset.y })
  const glide = smooth ? 'transition-transform yj-duration-slow ease-standard' : undefined
  const edges = layout.order
    .map((id) => layout.nodes.get(id)!)
    .filter((n) => n.parent)
    .sort((a, b) => Number(path.has(a.id)) - Number(path.has(b.id)))
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(view.k)

  return (
    <div
      data-slot="hierarchy-chart"
      data-orientation={orientation}
      className={cn('relative w-full min-w-0', className)}
      style={{ height, ...style }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        ref={viewportRef}
        data-slot="hierarchy-chart-viewport"
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(e) => {
          if (!suppressClick.current) return
          suppressClick.current = false
          e.stopPropagation()
        }}
        className="relative size-full touch-pan-y overflow-hidden own:rounded-[min(var(--radius-xl),--spacing(4))] border border-line own:bg-well select-none cursor-grab data-dragging:cursor-grabbing"
      >
        <MotionFeatures>
          <div
            data-slot="hierarchy-chart-world"
            // youj-allow: physical side, the world is placed in px from its physical origin
            className={cn('absolute top-0 left-0 origin-top-left', glide, !size && 'invisible')}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
            onTransitionEnd={(e) => e.target === e.currentTarget && setSmooth(false)}
          >
            <svg
              aria-hidden
              data-slot="hierarchy-chart-edges"
              width={1}
              height={1}
              // youj-allow: physical side, the connectors share the world's physical origin
              className="absolute top-0 left-0 overflow-visible"
            >
              <AnimatePresence initial={false} custom={ctx}>
                {edges.map((n) => {
                  const parent = layout.nodes.get(n.parent!)!
                  const lit = path.has(n.id)
                  return (
                    <m.path
                      key={n.id}
                      data-slot="hierarchy-chart-edge"
                      data-active={lit || undefined}
                      custom={ctx}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={lit ? 2 : 1.25}
                      className={cn('transition-[stroke] yj-duration-fast ease-standard', lit ? 'stroke-accent' : 'stroke-line-strong')}
                      initial={(() => {
                        const f = foot(parent, ctx)
                        return { d: pointPath(f.x, f.y) }
                      })()}
                      animate={{ d: elbowPath(down(parent), down(n), orientation, RADIUS, mirror) }}
                      variants={{ leave: (c: Ctx) => ({ d: exitPath(n.id, c), transition: spring }) }}
                      exit="leave"
                      transition={spring}
                    />
                  )
                })}
              </AnimatePresence>
            </svg>
            <ul role="tree" aria-label={label ?? labels.hierarchyChart} aria-describedby={hintId} data-slot="hierarchy-chart-nodes"
              // youj-allow: physical side, the nodes share the world's physical origin
              className="absolute top-0 left-0"
            >
              <AnimatePresence initial={false} custom={ctx}>
                {layout.order.map((id) => {
                  const n = layout.nodes.get(id)!
                  const node = index.get(id)!.node
                  const p = place(n)
                  const branch = n.childCount > 0
                  const state: HierarchyNodeState = { depth: n.depth, selected: selected === id, onPath: path.has(id), branch, open: n.open, descendants: n.descendants }
                  const from = n.parent ? layout.nodes.get(n.parent) : undefined
                  const start = from ? place(from) : p
                  const descId = `${baseId}-${id}`
                  const description = [node.role, typeof node.badge === 'string' || typeof node.badge === 'number' ? node.badge : null, branch && !n.open ? labels.hierarchyChartHidden(n.descendants) : null].filter(Boolean).join(', ')
                  return (
                    <m.li
                      key={id}
                      ref={(el: HTMLLIElement | null) => {
                        if (el) items.current.set(id, el)
                        else items.current.delete(id)
                      }}
                      role="treeitem"
                      data-slot="hierarchy-chart-node"
                      data-yj-node={id}
                      data-selected={state.selected || undefined}
                      data-yj-path={(state.onPath && !state.selected) || undefined}
                      data-state={branch ? (n.open ? 'open' : 'closed') : undefined}
                      aria-level={n.depth + 1}
                      aria-setsize={n.size}
                      aria-posinset={n.pos}
                      aria-expanded={branch ? n.open : undefined}
                      aria-selected={state.selected}
                      aria-label={node.name}
                      aria-describedby={description ? descId : undefined}
                      tabIndex={tabStop === id ? 0 : -1}
                      custom={ctx}
                      initial={{ x: start.x, y: start.y, opacity: 0, scale: 0.92 }}
                      animate={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                      variants={{ leave: (c: Ctx) => ({ ...exitPoint(id, c), opacity: 0, scale: 0.92, transition: spring }) }}
                      exit="leave"
                      transition={spring}
                      onFocus={(e) => {
                        if (e.target !== e.currentTarget) return
                        setFocusedId(id)
                        if (keyboardFocus(e.currentTarget)) reveal(id)
                      }}
                      onClick={() => {
                        select(id)
                        setFocusedId(id)
                      }}
                      className={cn(
                        // youj-allow: physical side, nodes are placed in px from the world's physical origin
                        'absolute top-0 left-0',
                        'group/node own:flex items-center gap-3 own:rounded-[min(var(--radius-lg),--spacing(3))] border own:bg-surface own:px-3 own:text-start own:shadow-xs-soft outline-none focus-ring cursor-pointer',
                        'transition-[border-color,box-shadow,background-color] yj-duration-fast ease-standard own:hover:bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-surface))]',
                        state.selected ? 'border-accent own:ring-1 ring-accent' : state.onPath ? 'border-accent-line' : 'border-line',
                        // The chip sits on the end edge when horizontal: keep the contents clear of it.
                        orientation === 'horizontal' && branch && 'own:pe-5',
                      )}
                      style={{ width: n.width, height: n.height }}
                    >
                      {renderNode ? renderNode(node, state) : <HierarchyNodeCard node={node} />}
                      {description && (
                        <span id={descId} className="sr-only">
                          {description}
                        </span>
                      )}
                      {branch && (
                        <span
                          aria-hidden
                          data-slot="hierarchy-chart-toggle"
                          data-state={n.open ? 'open' : 'closed'}
                          title={n.open ? labels.hierarchyChartCollapse(node.name) : labels.hierarchyChartExpand(node.name)}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggle(id)
                            items.current.get(id)?.focus({ preventScroll: true })
                            setFocusedId(id)
                          }}
                          className={cn(
                            'absolute z-10 own:flex h-5 min-w-5 cursor-pointer items-center justify-center gap-0.5 own:rounded-full border border-line own:bg-surface own:px-1.5 own:text-ui-xs own:font-medium own:text-fg-muted own:tabular-nums own:shadow-xs-soft',
                            'transition-[background-color,color,border-color] yj-duration-fast ease-standard own:hover:bg-hover own:hover:text-fg',
                            orientation === 'vertical' ? 'bottom-0 start-1/2 translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2' : 'end-0 top-1/2 -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2',
                            !n.open && 'border-line-strong own:text-fg',
                            state.onPath && 'border-accent-line',
                          )}
                        >
                          {n.open ? <MinusIcon size={10} strokeWidth={2.25} /> : `+${numberFormat(locale).format(n.descendants)}`}
                        </span>
                      )}
                    </m.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>
        </MotionFeatures>

        <div data-slot="hierarchy-chart-controls" className="absolute end-2.5 bottom-2.5 own:flex items-center gap-0.5 rounded-xl border border-line bg-overlay/90 youj-allow-glass own:p-0.5 shadow-sm-soft backdrop-blur-sm">
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomOut} disabled={view.k <= MIN_ZOOM + 0.001} onClick={() => zoomBy(1 / ZOOM_STEP)}>
            <MinusIcon size={14} />
          </Button>
          <span data-slot="hierarchy-chart-zoom" aria-hidden className="w-10 own:text-center own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
            {percent}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomIn} disabled={view.k >= MAX_ZOOM - 0.001} onClick={() => zoomBy(ZOOM_STEP)}>
            <PlusIcon size={14} />
          </Button>
          <span aria-hidden className="own:mx-0.5 h-4 w-px bg-line" />
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomToFit} onClick={fit}>
            <MaximizeIcon size={14} />
          </Button>
        </div>
      </div>
      <p id={hintId} className="sr-only">
        {labels.hierarchyChartHint}
      </p>
    </div>
  )

  /** Where a leaving node goes: the ancestor that still shows, in the new layout. */
  function exitPoint(id: string, c: Ctx) {
    const to = nearestShowing(id, c.layout)
    return to ? c.place(to, c.layout) : {}
  }
  /** A leaving connector shrinks into the foot of the ancestor that still shows. */
  function exitPath(id: string, c: Ctx) {
    const to = nearestShowing(id, c.layout)
    if (!to) return undefined
    const f = foot(to, c)
    return pointPath(f.x, f.y)
  }
}
