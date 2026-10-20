/* The dial's geometry, pure. The hours shown run clockwise over three
 * quarters of a circle: the first hour at nine o'clock, the quarter way
 * through at twelve, and so on round to six o'clock, which leaves the lower
 * left quadrant free for the weekday labels. Angles are degrees clockwise from
 * twelve o'clock. */

export const SWEEP = 270
export const START_ANGLE = -90

/** The angle of `minute` on a dial showing minutes `from` to `to`. */
export function angleOf(minute: number, from: number, to: number) {
  return START_ANGLE + ((minute - from) / (to - from)) * SWEEP
}

/** The point at `radius` and `angle` round (`cx`, `cy`). */
export function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) }
}

export interface DialLayout {
  cx: number
  cy: number
  /** Where the outermost ring ends. */
  outer: number
  /** Where the innermost ring starts: the room left for the figure in the middle. */
  inner: number
  /** Each ring's thickness, a little less than its step. */
  width: number
  step: number
}

/** A dial in a square of `size` pixels with `rings` rings, leaving `margin` round it for the hour labels. */
export function dialLayout(size: number, rings: number, margin: number, gap = 3): DialLayout {
  const outer = Math.max(0, size / 2 - margin)
  const inner = Math.min(Math.max(52, outer * 0.38), outer)
  const step = rings > 0 ? (outer - inner) / rings : 0
  return { cx: size / 2, cy: size / 2, outer, inner, step, width: Math.max(0, step - gap) }
}

/** The middle of ring `index` (0 is the outermost). */
export function ringRadius(layout: DialLayout, index: number) {
  return layout.outer - layout.step * index - layout.step / 2
}

/**
 * The outline of a ring segment from `from` to `to` degrees, `width` thick and centered on `radius`, its corners inset by `corner`. Fill it and stroke it
 * in the same color at `2 * corner` with round joins, and it is the full segment with rounded corners.
 */
export function segmentPath(cx: number, cy: number, radius: number, width: number, from: number, to: number, corner: number) {
  const outer = radius + width / 2 - corner
  const inner = Math.max(0.5, radius - width / 2 + corner)
  const span = ((to - from) * Math.PI) / 180
  const inset = (r: number) => Math.min(corner / r, span / 2.2) * (180 / Math.PI)
  const a = polar(cx, cy, outer, from + inset(outer))
  const b = polar(cx, cy, outer, to - inset(outer))
  const c = polar(cx, cy, inner, to - inset(inner))
  const d = polar(cx, cy, inner, from + inset(inner))
  const large = to - from > 180 ? 1 : 0
  const f = (n: number) => Number(n.toFixed(2))
  return `M${f(a.x)} ${f(a.y)}A${f(outer)} ${f(outer)} 0 ${large} 1 ${f(b.x)} ${f(b.y)}L${f(c.x)} ${f(c.y)}A${f(inner)} ${f(inner)} 0 ${large} 0 ${f(d.x)} ${f(d.y)}Z`
}
