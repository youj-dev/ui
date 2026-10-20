/* The terrain's drawing maths, in grid units, as plain functions. Weeks run
 * along x (to the lower right), days along y (to the lower left) and
 * readings up z, in an isometric view: one unit along any axis is the same
 * length on screen. The viewer looks from +x, +y, +z, so a larger x or y is
 * nearer and a column shows its top, its +y face (left) and its +x face
 * (right). The frame (the drawing's extent) holds the floor and the highest
 * any column reaches in every view the data offers, so switching views never
 * resizes the box. */

const COS = Math.cos(Math.PI / 6)

/** A column's inset from its cell on each side: the gaps that let the rows behind show through. */
export const GAP = 0.15
/** The tallest column, grid units. */
export const TALL = 5.4
/** The floor: how far it runs past the grid, and how thick it is. */
export const MARGIN = 0.5
export const SLAB = 0.34
/** Every column stands at least this tall, so a rest day is still a tile on the floor. */
export const FLOOR_HEIGHT = 0.03

export type Point = readonly [x: number, y: number]

/** Where a grid point lands on screen, in grid units. */
export const project = (x: number, y: number, z: number): Point => [(x - y) * COS, (x + y) * 0.5 - z]

export interface Frame {
  rows: number
  cols: number
  /** The drawing's extent on screen, in grid units: its top-left corner and size. */
  x: number
  y: number
  width: number
  height: number
}

/**
 * The screen extent of a grid of `rows` × `cols`: the floor, the columns up
 * to `reach` (the highest point any of them gets to, from `reachOf`; by
 * default a tallest column at the far corner), room above for the pin, and
 * room around for the axis labels.
 */
export function frameOf(rows: number, cols: number, reach = -TALL): Frame {
  const left = project(-MARGIN, rows + MARGIN, 0)[0] - 1.6
  const right = project(cols + MARGIN, -MARGIN, 0)[0] + 2.4
  const top = Math.min(reach, -MARGIN) - 1.2
  const bottom = project(cols + MARGIN, rows + MARGIN, -SLAB)[1] + 1.2
  return { rows, cols, x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * The highest point on screen (the least y) that any column reaches, over
 * every set of readings the terrain may show (each drawn to its own peak).
 * Rounded up to half a unit, so small changes in live readings don't resize
 * the drawing.
 */
export function reachOf(sets: readonly (readonly (readonly number[])[])[]) {
  let top = -MARGIN
  for (const rows of sets) {
    let peak = 0
    for (const row of rows) for (const v of row) peak = Math.max(peak, v)
    if (!(peak > 0)) continue
    rows.forEach((row, r) => row.forEach((v, c) => (top = Math.min(top, (c + r + 2 * GAP) / 2 - (v / peak) * TALL))))
  }
  return Math.floor(top * 2) / 2
}

/** A point as a share of the frame, for placing HTML over the drawing in percentages. */
export function shareOf(frame: Frame, [x, y]: Point) {
  return { left: ((x - frame.x) / frame.width) * 100, top: ((y - frame.y) / frame.height) * 100 }
}

/** A column's three visible faces (its pin, inset from the cell), each a list of corners. */
export function columnFaces(row: number, col: number, h: number) {
  const x0 = col + GAP
  const x1 = col + 1 - GAP
  const y0 = row + GAP
  const y1 = row + 1 - GAP
  return {
    top: [project(x0, y0, h), project(x1, y0, h), project(x1, y1, h), project(x0, y1, h)],
    left: [project(x0, y1, 0), project(x1, y1, 0), project(x1, y1, h), project(x0, y1, h)],
    right: [project(x1, y0, 0), project(x1, y1, 0), project(x1, y1, h), project(x1, y0, h)],
    /** The outline of all three: drawn first, so the faces meet without a seam. */
    outline: [project(x0, y0, h), project(x1, y0, h), project(x1, y0, 0), project(x1, y1, 0), project(x0, y1, 0), project(x0, y1, h)],
  }
}

/** The whole cell as the pointer sees it: its footprint, gaps included, up to its column's top. */
function cellOutline(row: number, col: number, h: number): Point[] {
  return [project(col, row, h), project(col + 1, row, h), project(col + 1, row, 0), project(col + 1, row + 1, 0), project(col, row + 1, 0), project(col, row + 1, h)]
}

/** Inside a convex polygon whose corners go round one way. */
function inside(poly: Point[], [x, y]: Point) {
  let sign = 0
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i]!
    const [bx, by] = poly[(i + 1) % poly.length]!
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
    if (cross === 0) continue
    if (sign === 0) sign = Math.sign(cross)
    else if (Math.sign(cross) !== sign) return false
  }
  return true
}

/**
 * The cell under a screen point (grid units): the first whose shape holds it,
 * nearest first, so a column in front wins over the one it hides and a floor
 * tile answers for its own day; null over empty space. `heightAt` gives a
 * cell's drawn height.
 */
export function cellAt(frame: Frame, heightAt: (row: number, col: number) => number, point: Point): { row: number; col: number } | null {
  const { rows, cols } = frame
  for (let d = rows + cols - 2; d >= 0; d--) {
    for (let row = Math.min(rows - 1, d); row >= 0 && d - row < cols; row--) {
      const col = d - row
      if (inside(cellOutline(row, col, heightAt(row, col)), point)) return { row, col }
    }
  }
  return null
}
