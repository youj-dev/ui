/* Isometric drawing maths, as plain functions: grid units in, SVG user units
 * out. Everything the graphics draw goes through `project`, so a face, an
 * edge, a callout's anchor and the scene's viewBox all agree to the pixel.
 *
 * Axes: x runs to the lower right, y to the lower left, z straight up. One
 * grid unit along any axis is `unit` user units on screen (an isometric
 * drawing: equal lengths on all three axes, the axes 120° apart). The origin
 * (0, 0, 0) lands on (0, 0), the far corner of the floor.
 *
 * The viewer looks from +x, +y, +z: a larger x or y is nearer (lower on
 * screen) and a box shows its top face, its +x face (on the right) and its
 * +y face (on the left). */

const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)

export type ScreenPoint = readonly [x: number, y: number]

/** An axis-aligned box in grid units: its near-origin corner and its size. */
export interface IsoBounds {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
}

const round = (v: number) => (Math.abs(v) < 1e-9 ? 0 : Math.round(v * 100) / 100)

/** Where a grid point lands, in user units. */
export function project(x: number, y: number, z: number, unit = 1): ScreenPoint {
  return [round((x - y) * COS * unit), round(((x + y) * SIN - z) * unit)]
}

/** The screen direction of one grid unit along an axis: how far an explode along it moves, per unit. */
export function axisStep(axis: 'x' | 'y' | 'z', unit = 1): ScreenPoint {
  if (axis === 'x') return [round(COS * unit), round(SIN * unit)]
  if (axis === 'y') return [round(-COS * unit), round(SIN * unit)]
  return [0, -unit]
}

/** A polygon's points attribute. */
export const toPoints = (pts: readonly ScreenPoint[]) => pts.map(([x, y]) => `${x},${y}`).join(' ')

export interface BoxFaces {
  top: ScreenPoint[]
  /** The +y face, on the left. */
  left: ScreenPoint[]
  /** The +x face, on the right. */
  right: ScreenPoint[]
}

/** The three faces a box shows. A box of no height is just its top: a tile. */
export function boxFaces({ x, y, z, w, d, h }: IsoBounds, unit = 1): BoxFaces {
  const p = (a: number, b: number, c: number) => project(a, b, c, unit)
  const t = z + h
  return {
    top: [p(x, y, t), p(x + w, y, t), p(x + w, y + d, t), p(x, y + d, t)],
    left: [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, t), p(x, y + d, t)],
    right: [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, t), p(x + w, y, t)],
  }
}

export type Segment = readonly [ScreenPoint, ScreenPoint]

/** A box's three hidden edges, the ones that meet at its far bottom corner: a wireframe draws them dashed. */
export function hiddenEdges({ x, y, z, w, d, h }: IsoBounds, unit = 1): Segment[] {
  const corner = project(x, y, z, unit)
  return [
    [corner, project(x + w, y, z, unit)],
    [corner, project(x, y + d, z, unit)],
    [corner, project(x, y, z + h, unit)],
  ]
}

/** The top face's two near edges, which catch the light. */
export function litEdges({ x, y, z, w, d, h }: IsoBounds, unit = 1): Segment[] {
  const near = project(x + w, y + d, z + h, unit)
  return [
    [project(x, y + d, z + h, unit), near],
    [near, project(x + w, y, z + h, unit)],
  ]
}

/** A circle of radius `r` on a level plane, as the screen ellipse it projects to (always axis-aligned). */
export function isoEllipse(cx: number, cy: number, z: number, r: number, unit = 1) {
  const [x, y] = project(cx, cy, z, unit)
  return { cx: x, cy: y, rx: round(r * Math.SQRT2 * COS * unit), ry: round(r * Math.SQRT2 * SIN * unit) }
}

/** A cylinder standing in the square footprint `x..x+2r, y..y+2r`: its top ellipse and the outline of its side. */
export function cylinderShape({ x, y, z, r, h }: { x: number; y: number; z: number; r: number; h: number }, unit = 1) {
  const top = isoEllipse(x + r, y + r, z + h, r, unit)
  const base = isoEllipse(x + r, y + r, z, r, unit)
  // Down the left silhouette, along the base's near half, up the right, and back along the top's near half.
  const side =
    `M${round(top.cx - top.rx)},${top.cy} L${round(base.cx - base.rx)},${base.cy} ` +
    `A${base.rx},${base.ry} 0 0 0 ${round(base.cx + base.rx)},${base.cy} L${round(top.cx + top.rx)},${top.cy} ` +
    `A${top.rx},${top.ry} 0 0 1 ${round(top.cx - top.rx)},${top.cy} Z`
  // The base's far half, hidden behind the side: a wireframe draws it dashed.
  const hidden = `M${round(base.cx - base.rx)},${base.cy} A${base.rx},${base.ry} 0 0 1 ${round(base.cx + base.rx)},${base.cy}`
  return { top, base, side, hidden }
}

/** A drawing's extent on screen, in user units. */
export interface ScreenBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** The screen extent of a box (every corner projected). */
export function boxExtent({ x, y, z, w, d, h }: IsoBounds, unit = 1): ScreenBox {
  const xs: number[] = []
  const ys: number[] = []
  for (const [a, b, c] of [
    [x, y, z],
    [x + w, y, z],
    [x, y + d, z],
    [x + w, y + d, z],
    [x, y, z + h],
    [x + w, y, z + h],
    [x, y + d, z + h],
    [x + w, y + d, z + h],
  ] as const) {
    const [sx, sy] = project(a, b, c, unit)
    xs.push(sx)
    ys.push(sy)
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

/** The screen extent of a cylinder in the footprint x..x+2r, y..y+2r, from z up h. */
export function cylinderExtent({ x, y, z, r, h }: { x: number; y: number; z: number; r: number; h: number }, unit = 1): ScreenBox {
  const top = isoEllipse(x + r, y + r, z + h, r, unit)
  const base = isoEllipse(x + r, y + r, z, r, unit)
  return { minX: round(top.cx - top.rx), maxX: round(top.cx + top.rx), minY: round(top.cy - top.ry), maxY: round(base.cy + base.ry) }
}

/** The smallest box holding all of them. */
export function unionExtent(boxes: readonly ScreenBox[]): ScreenBox | undefined {
  if (!boxes.length) return undefined
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
  }
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

/** Room round the drawing, in user units: one number, or [top, end, bottom, start]. */
export type ScenePad = number | readonly [top: number, right: number, bottom: number, left: number]

/** The screen extent of the volume `[0, w] × [0, d] × [0, h]`. */
export function volumeExtent([w, d, h]: readonly [number, number, number], unit: number): ScreenBox {
  return boxExtent({ x: 0, y: 0, z: 0, w, d, h }, unit)
}

/** A viewBox round an extent, plus padding. */
export function viewBoxOf(extent: ScreenBox, pad: ScenePad = 0): ViewBox {
  const [top, right, bottom, left] = typeof pad === 'number' ? [pad, pad, pad, pad] : pad
  const minX = extent.minX - left
  const minY = extent.minY - top
  return { x: round(minX), y: round(minY), width: round(extent.maxX + right - minX), height: round(extent.maxY + bottom - minY) }
}

/** The viewBox that holds the volume `[0, w] × [0, d] × [0, h]`, plus padding. */
export function sceneViewBox(size: readonly [number, number, number], unit: number, pad: ScenePad = 0): ViewBox {
  return viewBoxOf(volumeExtent(size, unit), pad)
}

const EPSILON = 1e-6

/** True when `a` lies wholly on the far side of `b` along some axis, so it must be drawn first. */
function behind(a: IsoBounds, b: IsoBounds) {
  return a.x + a.w <= b.x + EPSILON || a.y + a.d <= b.y + EPSILON || a.z + a.h <= b.z + EPSILON
}

const depth = (b: IsoBounds) => b.x + b.w / 2 + b.y + b.d / 2 + b.z + b.h / 2

/**
 * Painter's order, far to near: the order to draw boxes in so nearer ones
 * cover farther ones. Two boxes are ordered only when one lies wholly behind
 * the other along an axis and not the other way round (when both hold, they
 * can't overlap on screen). Ties keep the input order; boxes that interpenetrate,
 * or a rare cycle of long boxes, fall back to their centers' depth.
 */
export function isoSort<T>(items: readonly T[], boundsOf: (item: T) => IsoBounds): T[] {
  const bounds = items.map(boundsOf)
  const n = items.length
  const after: number[][] = Array.from({ length: n }, () => [])
  const blockers = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ij = behind(bounds[i]!, bounds[j]!)
      const ji = behind(bounds[j]!, bounds[i]!)
      if (ij && !ji) {
        after[i]!.push(j)
        blockers[j]!++
      } else if (ji && !ij) {
        after[j]!.push(i)
        blockers[i]!++
      }
    }
  }
  const order: number[] = []
  const done = new Array<boolean>(n).fill(false)
  while (order.length < n) {
    // The first unblocked item in input order; if a cycle blocks them all, the farthest one left.
    let next = -1
    for (let i = 0; i < n; i++) if (!done[i] && blockers[i] === 0) { next = i; break }
    if (next === -1) {
      for (let i = 0; i < n; i++) if (!done[i] && (next === -1 || depth(bounds[i]!) < depth(bounds[next]!))) next = i
    }
    done[next] = true
    order.push(next)
    for (const j of after[next]!) blockers[j]!--
  }
  return order.map((i) => items[i]!)
}
