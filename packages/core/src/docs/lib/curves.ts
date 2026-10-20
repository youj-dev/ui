/* Curve math for the Motion page: cubic-bezier easing and the exact spring
 * response Motion produces for { visualDuration, bounce }. */

export type Bezier = readonly [number, number, number, number]

const coord = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t
const slope = (t: number, p1: number, p2: number) =>
  3 * (1 - t) * (1 - t) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (1 - p2)

/** Point on the curve at parameter t (not time). */
export function bezierPoint([x1, y1, x2, y2]: Bezier, t: number): [number, number] {
  return [coord(t, x1, x2), coord(t, y1, y2)]
}

/** Eased progress for linear time x in 0..1, as CSS/Motion evaluate it. */
export function ease(curve: Bezier, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const [x1, , x2] = curve
  let t = x
  for (let i = 0; i < 8; i++) {
    const err = coord(t, x1, x2) - x
    const d = slope(t, x1, x2)
    if (Math.abs(err) < 1e-7) break
    if (Math.abs(d) < 1e-6) break
    t -= err / d
  }
  let lo = 0
  let hi = 1
  if (Math.abs(coord(t, x1, x2) - x) > 1e-5 || t < 0 || t > 1) {
    t = x
    for (let i = 0; i < 40; i++) {
      if (coord(t, x1, x2) < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
  }
  return coord(t, curve[1], curve[3])
}

export interface SpringShape {
  visualDuration: number
  bounce: number
}

/** Same derivation as motion-dom: omega = 2π / (1.2 · visualDuration), zeta = 1 − bounce. */
export function springParams({ visualDuration, bounce }: SpringShape) {
  const omega = (2 * Math.PI) / (visualDuration * 1.2)
  const zeta = Math.min(1, Math.max(0.05, 1 - bounce))
  return { omega, zeta, stiffness: omega * omega, damping: 2 * zeta * omega }
}

/** Progress (0 → 1, may overshoot) of a unit-mass spring from rest, at t seconds. */
export function springAt(shape: SpringShape, t: number): number {
  const { omega, zeta } = springParams(shape)
  if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t)
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
}

/** Peak overshoot as a fraction of the distance traveled (0 for critically damped). */
export function springOvershoot(shape: SpringShape): number {
  const { zeta } = springParams(shape)
  if (zeta >= 1) return 0
  return Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta))
}
