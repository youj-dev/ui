import { boundsOf, moveShape, unionBoxes, type Box, type Lookup, type WhiteboardShape } from './whiteboard-model'

/* The board's arithmetic that isn't about one shape: the view (pan and zoom),
 * snapping a moving selection to the grid and to its neighbours, and lining
 * a selection up or spreading it out evenly. Pure, so it's tested alone. */

/** The view: the world's origin on screen (`x`, `y`, in px) and the zoom (`k`, 1 = 100%). */
interface View {
  x: number
  y: number
  k: number
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.25
/** The grid's spacing in world units: the dots, and what Snap to grid snaps to. */
const GRID = 24

const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))

/** Zooms to `k` keeping the screen point (`px`, `py`) over the same spot of the world. */
function zoomAt(v: View, k: number, px: number, py: number): View {
  const next = clampZoom(k)
  return { k: next, x: px - ((px - v.x) / v.k) * next, y: py - ((py - v.y) / v.k) * next }
}

/** The view that centers `box` in a `width` × `height` viewport with `pad` px around it, never closer than `maxZoom`. */
function fitView(box: Box, width: number, height: number, pad = 48, maxZoom = 1.5): View {
  const k = clampZoom(Math.min(maxZoom, (width - pad * 2) / Math.max(1, box.w), (height - pad * 2) / Math.max(1, box.h)))
  return { k, x: width / 2 - (box.x + box.w / 2) * k, y: height / 2 - (box.y + box.h / 2) * k }
}

/** The part of the world a view shows in a `width` × `height` viewport. */
function visibleBox(v: View, width: number, height: number): Box {
  return { x: -v.x / v.k, y: -v.y / v.k, w: width / v.k, h: height / v.k }
}

const overlaps = (a: Box, b: Box) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h

/** A guide: a line through `at` on `axis` (`x` draws a vertical line), from `from` to `to` on the other axis. */
interface Guide {
  axis: 'x' | 'y'
  at: number
  from: number
  to: number
}

/** A spacing hint: a gap of `size` on `axis`, from `from` to `to`, drawn across at `at` on the other axis. */
interface Gap {
  axis: 'x' | 'y'
  from: number
  to: number
  at: number
  size: number
}

interface Snap {
  dx: number
  dy: number
  guides: Guide[]
  gaps: Gap[]
}

type Axis = 'x' | 'y'
const start = (b: Box, a: Axis) => (a === 'x' ? b.x : b.y)
const size = (b: Box, a: Axis) => (a === 'x' ? b.w : b.h)
const end = (b: Box, a: Axis) => start(b, a) + size(b, a)
const lines = (b: Box, a: Axis) => [start(b, a), start(b, a) + size(b, a) / 2, end(b, a)]
const other = (a: Axis): Axis => (a === 'x' ? 'y' : 'x')
/** Whether two boxes share some of the other axis: they sit in one row (for `x`) or one column (for `y`). */
const sameBand = (a: Box, b: Box, axis: Axis) => start(a, other(axis)) < end(b, other(axis)) && start(b, other(axis)) < end(a, other(axis))

/** The best move along one axis: lining an edge or center up with a neighbour's, or matching a spacing already on the board. */
function snapAxis(box: Box, others: readonly Box[], axis: Axis, threshold: number): { delta: number; gaps: Gap[] } | null {
  let best: { delta: number; gaps: Gap[] } | null = null
  const offer = (delta: number, gaps: Gap[] = []) => {
    if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta) - 0.01)) best = { delta, gaps }
  }
  for (const o of others) for (const m of lines(box, axis)) for (const t of lines(o, axis)) offer(t - m)

  // Spacing: the neighbours in the same row (or column), nearest first on each side.
  const band = others.filter((o) => sameBand(o, box, axis))
  const before = band.filter((o) => end(o, axis) <= start(box, axis) + threshold).sort((a, b) => end(b, axis) - end(a, axis))
  const after = band.filter((o) => start(o, axis) >= end(box, axis) - threshold).sort((a, b) => start(a, axis) - start(b, axis))
  const across = (a: Box, b: Box) => {
    const lo = Math.max(start(a, other(axis)), start(b, other(axis)))
    const hi = Math.min(end(a, other(axis)), end(b, other(axis)))
    return (lo + hi) / 2
  }
  const gap = (a: Box, b: Box): Gap => ({ axis, from: end(a, axis), to: start(b, axis), at: across(a, b), size: start(b, axis) - end(a, axis) })
  const shifted = (delta: number): Box => (axis === 'x' ? { ...box, x: box.x + delta } : { ...box, y: box.y + delta })
  const L = before[0]
  const R = after[0]
  if (L && R) {
    // Centered between two neighbours.
    const delta = (end(L, axis) + start(R, axis) - size(box, axis)) / 2 - start(box, axis)
    const moved = shifted(delta)
    offer(delta, [gap(L, moved), gap(moved, R)])
  }
  // The same spacing as the pair beside it: L's own left neighbour, or R's right one.
  const LL = L && band.filter((o) => o !== L && end(o, axis) <= start(L, axis) && sameBand(o, L, axis)).sort((a, b) => end(b, axis) - end(a, axis))[0]
  if (L && LL) {
    const g = start(L, axis) - end(LL, axis)
    const delta = end(L, axis) + g - start(box, axis)
    offer(delta, [gap(LL, L), gap(L, shifted(delta))])
  }
  const RR = R && band.filter((o) => o !== R && start(o, axis) >= end(R, axis) && sameBand(o, R, axis)).sort((a, b) => start(a, axis) - start(b, axis))[0]
  if (R && RR) {
    const g = start(RR, axis) - end(R, axis)
    const delta = start(R, axis) - g - end(box, axis)
    offer(delta, [gap(shifted(delta), R), gap(R, RR)])
  }
  return best
}

/**
 * Snaps a moving box: on each axis, to the nearest edge or center of the
 * `others` (or the spacing between them) within `threshold`, else to the
 * `grid` when one is given. Returns the extra move and the guides and gaps
 * that explain it.
 */
function snapBox(box: Box, others: readonly Box[], threshold: number, grid?: number): Snap {
  const result: Snap = { dx: 0, dy: 0, guides: [], gaps: [] }
  for (const axis of ['x', 'y'] as const) {
    const hit = snapAxis(box, others, axis, threshold)
    const delta = hit ? hit.delta : grid ? Math.round(start(box, axis) / grid) * grid - start(box, axis) : 0
    if (axis === 'x') result.dx = delta
    else result.dy = delta
    if (hit) result.gaps.push(...hit.gaps)
  }
  const moved = { ...box, x: box.x + result.dx, y: box.y + result.dy }
  // A guide for every neighbour that lines up with the box where it landed.
  for (const axis of ['x', 'y'] as const) {
    for (const m of lines(moved, axis)) {
      const aligned = others.filter((o) => lines(o, axis).some((t) => Math.abs(t - m) < 0.5))
      if (!aligned.length) continue
      const span = [moved, ...aligned]
      result.guides.push({ axis, at: m, from: Math.min(...span.map((b) => start(b, other(axis)))), to: Math.max(...span.map((b) => end(b, other(axis)))) })
    }
  }
  return result
}

type WhiteboardAlign = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
type WhiteboardDistribute = 'horizontal' | 'vertical'

/** Shapes that are placed by a box of their own (a connector follows the shapes it joins). */
const placeable = (s: WhiteboardShape) => s.type !== 'connector'

/** Lines the shapes up on one edge or center of the box around them all. Returns the moved shapes by id. */
function alignShapes(shapes: readonly WhiteboardShape[], mode: WhiteboardAlign, lookup?: Lookup): Map<string, WhiteboardShape> {
  const movable = shapes.filter(placeable)
  const all = unionBoxes(movable.map((s) => boundsOf(s, lookup)))
  const moved = new Map<string, WhiteboardShape>()
  if (!all || movable.length < 2) return moved
  for (const s of movable) {
    const b = boundsOf(s, lookup)
    const dx = mode === 'left' ? all.x - b.x : mode === 'center' ? all.x + all.w / 2 - (b.x + b.w / 2) : mode === 'right' ? all.x + all.w - (b.x + b.w) : 0
    const dy = mode === 'top' ? all.y - b.y : mode === 'middle' ? all.y + all.h / 2 - (b.y + b.h / 2) : mode === 'bottom' ? all.y + all.h - (b.y + b.h) : 0
    if (dx || dy) moved.set(s.id, moveShape(s, dx, dy))
  }
  return moved
}

/** Spreads three or more shapes so the gaps between them are equal, keeping the first and last where they are. */
function distributeShapes(shapes: readonly WhiteboardShape[], mode: WhiteboardDistribute, lookup?: Lookup): Map<string, WhiteboardShape> {
  const axis: Axis = mode === 'horizontal' ? 'x' : 'y'
  const items = shapes
    .filter(placeable)
    .map((s) => ({ s, b: boundsOf(s, lookup) }))
    .sort((a, b) => start(a.b, axis) - start(b.b, axis))
  const moved = new Map<string, WhiteboardShape>()
  if (items.length < 3) return moved
  const first = start(items[0]!.b, axis)
  const last = Math.max(...items.map((i) => end(i.b, axis)))
  const gap = (last - first - items.reduce((sum, i) => sum + size(i.b, axis), 0)) / (items.length - 1)
  let at = first
  for (const { s, b } of items) {
    const delta = at - start(b, axis)
    if (Math.abs(delta) > 0.001) moved.set(s.id, axis === 'x' ? moveShape(s, delta, 0) : moveShape(s, 0, delta))
    at += size(b, axis) + gap
  }
  return moved
}

export { GRID, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP, alignShapes, clampZoom, distributeShapes, fitView, overlaps, snapBox, visibleBox, zoomAt }
export type { Gap, Guide, Snap, View, WhiteboardAlign, WhiteboardDistribute }
