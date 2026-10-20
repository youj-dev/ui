/* The stack's camera, as plain math. The same numbers produce the CSS
 * transforms the planes wear and the screen positions of points on them, so
 * the leader lines land exactly on their planes without a single layout read.
 *
 * Coordinates: a point on a plane is given relative to the rig's center, in
 * the plane's own pixels (x right, y down), with z along the plane's normal
 * (toward the viewer). The rig is centered in the stage and the perspective
 * origin is the stage's center, so screen positions come back relative to it. */

export interface StackPose {
  /** Tip back around the screen's horizontal axis at full separation, degrees. */
  tiltX: number
  /** Turn around the planes' normal at full separation, degrees. */
  tiltZ: number
  /** Distance between neighboring planes along their normal at full separation, px. */
  gap: number
  /** CSS perspective distance, px. */
  perspective: number
}

export interface StackFrame {
  /** Separation: 0 assembled, 1 fully apart. */
  e: number
  /** Pointer tilt around the screen's vertical and horizontal axes, degrees. */
  pointerX: number
  pointerY: number
  /** Extra turn around the normal (idle drift, scroll orbit), degrees. */
  spin: number
  /** Uniform scale of the rig. */
  scale: number
  /** Screen-space shift of the rig, px. */
  shiftX: number
  shiftY: number
}

export type Vec3 = readonly [number, number, number]
export type Vec2 = readonly [number, number]

export const REST: StackFrame = { e: 0, pointerX: 0, pointerY: 0, spin: 0, scale: 1, shiftX: 0, shiftY: 0 }

const RAD = Math.PI / 180

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** 0 below `a`, 1 above `b`, a smooth S between. */
export function smoothstep(a: number, b: number, v: number) {
  const t = clamp01((v - a) / (b - a || 1))
  return t * t * (3 - 2 * t)
}

/* CSS's own rotation matrices (y points down, z toward the viewer). */
function rotateX([x, y, z]: Vec3, deg: number): Vec3 {
  const c = Math.cos(deg * RAD)
  const s = Math.sin(deg * RAD)
  return [x, y * c - z * s, y * s + z * c]
}
function rotateY([x, y, z]: Vec3, deg: number): Vec3 {
  const c = Math.cos(deg * RAD)
  const s = Math.sin(deg * RAD)
  return [x * c + z * s, y, -x * s + z * c]
}
function rotateZ([x, y, z]: Vec3, deg: number): Vec3 {
  const c = Math.cos(deg * RAD)
  const s = Math.sin(deg * RAD)
  return [x * c - y * s, x * s + y * c, z]
}

const n = (v: number) => (Math.abs(v) < 1e-6 ? 0 : Number(v.toFixed(4)))

/**
 * The rig's transform. Read right to left: turn around the normal, tip back,
 * then the pointer's tilt about the screen axes (so it pivots on the stack's
 * own center), scale (in 3D, so the gaps scale too), and shift.
 */
export function rigTransform(pose: StackPose, f: StackFrame): string {
  return (
    `translate3d(${n(f.shiftX)}px, ${n(f.shiftY)}px, 0) scale3d(${n(f.scale)}, ${n(f.scale)}, ${n(f.scale)}) ` +
    `rotateX(${n(f.pointerY)}deg) rotateY(${n(f.pointerX)}deg) rotateX(${n(pose.tiltX * f.e)}deg) rotateZ(${n(pose.tiltZ * f.e + f.spin)}deg)`
  )
}

/** A plane's height above the stack's middle, so the stack spreads about its center. */
export function planeZ(index: number, count: number, pose: StackPose, e: number): number {
  return (index - (count - 1) / 2) * pose.gap * e
}

/** Where a point on the rig lands on screen, relative to the stage's center. Mirrors rigTransform. */
export function project(pose: StackPose, f: StackFrame, point: Vec3): Vec2 {
  let v = rotateZ(point, pose.tiltZ * f.e + f.spin)
  v = rotateX(v, pose.tiltX * f.e)
  v = rotateY(v, f.pointerX)
  v = rotateX(v, f.pointerY)
  const [x, y, z] = [v[0] * f.scale + f.shiftX, v[1] * f.scale + f.shiftY, v[2] * f.scale]
  const w = pose.perspective / (pose.perspective - z)
  return [x * w, y * w]
}

export interface Box {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** How far plane content reaches past the plane, px: the same all round, or across (on each side), above and below. */
export type Bleed = number | { x: number; top: number; bottom: number }

/**
 * The screen box the planes cover at full separation (scale 1, no shift),
 * relative to the stage's center: what the stack must fit in.
 */
export function footprint(pose: StackPose, count: number, width: number, height: number, bleed: Bleed = 0): Box {
  const f: StackFrame = { ...REST, e: 1 }
  const box: Box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  const reach = typeof bleed === 'number' ? { x: bleed, top: bleed, bottom: bleed } : bleed
  const hw = width / 2 + reach.x
  const top = -height / 2 - reach.top
  const bottom = height / 2 + reach.bottom
  for (let i = 0; i < count; i++) {
    const z = planeZ(i, count, pose, 1)
    for (const [x, y] of [
      [-hw, top],
      [hw, top],
      [hw, bottom],
      [-hw, bottom],
    ] as const) {
      const [sx, sy] = project(pose, f, [x, y, z])
      box.minX = Math.min(box.minX, sx)
      box.maxX = Math.max(box.maxX, sx)
      box.minY = Math.min(box.minY, sy)
      box.maxY = Math.max(box.maxY, sy)
    }
  }
  return box
}
