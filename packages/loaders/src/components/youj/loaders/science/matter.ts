import { TAU, clamp, lambert, mix, point, type Depth, type Project, type Tone, type View } from '../field'

export type V3 = [number, number, number]

export function set(v: V3, x: number, y: number, z: number) {
  v[0] = x
  v[1] = y
  v[2] = z
}

export function pens(view: View) {
  return {
    hair: (view.size < 32 ? 0.8 : 0.9) / view.px,
    line: (view.size < 32 ? 1.05 : view.size < 80 ? 1.1 : 1.35) / view.px,
  }
}

/** Perspective depth controls the ink as well as the size of each mark. */
export const brightness = (z: number) => clamp(0.7 + z / 150, 0.36, 1)

/* The light as the screen sees it: `lambert`'s light (up, a little left,
 * in front) flattened onto the picture plane, in screen units (y down). */
const LIGHT = Math.hypot(0.38, 0.78)
const LX = -0.38 / LIGHT
const LY = -0.78 / LIGHT
/** The unit circle at three resolutions, for discs that stay round at any size. */
const RINGS = [12, 20, 32].map((n) => Array.from({ length: n }, (_, i) => [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)] as const))

const p = point()
const q = point()
const xy: number[] = []

/**
 * A lit, opaque atom: a sphere shaded in nested discs that close in on the
 * light (the terminator dark at the rim, the highlight up and to the left),
 * so it reads as smooth at any size in a handful of marks, with a crisp limb
 * once it's large enough to carry one. It sits at its front's depth, so a
 * bond running into it disappears at its surface. `dim` darkens it, for a
 * supporting cast (a lattice under the atoms that matter).
 */
export function atom(depth: Depth, project: Project, v: V3, r: number, view: View, tone: Tone = 'ink', simple = false, dim = 1) {
  if (r < 0.08) return
  project(...v, p)
  const radius = r * p.k
  // Detail from the atom's own size on screen, not its depth, so it never changes mid-loop.
  const px = r * view.px
  const steps = simple || px < 2.6 ? 1 : px < 6 ? 2 : px < 12 ? 3 : 4
  const ring = RINGS[px < 4 ? 0 : px < 10 ? 1 : 2]!
  const z = p.z + r
  const shade = (0.84 + 0.16 * brightness(p.z)) * dim
  for (let i = 0; i <= steps; i++) {
    const f = i / (steps + 1)
    const rr = radius * (1 - f * 0.92)
    const off = (radius - rr) * 0.72
    const cx = p.x + LX * off
    const cy = p.y + LY * off
    xy.length = 0
    for (const [c, s] of ring) xy.push(cx + rr * c, cy + rr * s)
    depth.face(xy, z + i * 1e-4, mix(0.26, 1, (i / steps) ** 0.85) * shade, tone)
  }
  if (px >= 5) {
    xy.length = 0
    for (const [c, s] of ring) xy.push(p.x + radius * c, p.y + radius * s)
    depth.path(xy, z + 2e-3, { width: (view.size < 80 ? 0.8 : 0.9) / view.px, alpha: 0.5 * brightness(p.z), closed: true, tone: tone === 'accent' ? 'accent' : 'ink' })
  }
}

/** A thin bond, split in depth so a crossing does not inherit one average depth. */
export function bond(depth: Depth, project: Project, a: V3, b: V3, width: number, alpha = 1, tone: Tone = 'ink', shown = 1, segments = 4) {
  if (shown < 0.004 || alpha < 0.004) return
  const end = clamp(shown)
  for (let i = 0; i < segments; i++) {
    const lo = i * end / segments
    const hi = (i + 1) * end / segments
    project(mix(a[0], b[0], lo), mix(a[1], b[1], lo), mix(a[2], b[2], lo), p)
    project(mix(a[0], b[0], hi), mix(a[1], b[1], hi), mix(a[2], b[2], hi), q)
    depth.line(p, q, width * (p.k + q.k) / 2, alpha * brightness((p.z + q.z) / 2), tone)
  }
}

/**
 * A stick bond: a lit cylinder of radius `r` from `a` toward `b` (its
 * first `shown` of the way), drawn as its body and a highlight strip on the
 * side toward the light, in short pieces sorted by their own depth, so it
 * passes in front of and behind the atoms it joins and vanishes into them.
 * Too thin to shade on screen, it's a hairline. `alpha` below 1 lays it on
 * as a line, since a solid can't be part transparent.
 */
export function stick(depth: Depth, project: Project, a: V3, b: V3, r: number, view: View, tone: Tone = 'ink', shown = 1, alpha = 1, segments = 4) {
  if (shown < 0.004 || alpha < 0.004) return
  const end = clamp(shown)
  for (let i = 0; i < segments; i++) {
    const lo = i * end / segments
    const hi = (i + 1) * end / segments
    project(mix(a[0], b[0], lo), mix(a[1], b[1], lo), mix(a[2], b[2], lo), p)
    project(mix(a[0], b[0], hi), mix(a[1], b[1], hi), mix(a[2], b[2], hi), q)
    const w = r * (p.k + q.k) / 2
    const z = (p.z + q.z) / 2
    if (r * view.px < 0.9 || alpha < 0.999) {
      depth.line(p, q, Math.max(2 * w, 0.9 / view.px), alpha * brightness(z), tone)
      continue
    }
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    // The side of the stick that faces the light, across it on screen.
    let nx = -dy / len
    let ny = dx / len
    if (nx * LX + ny * LY < 0) {
      nx = -nx
      ny = -ny
    }
    const shade = 0.84 + 0.16 * brightness(z)
    xy.length = 0
    xy.push(p.x + nx * w, p.y + ny * w, q.x + nx * w, q.y + ny * w, q.x - nx * w, q.y - ny * w, p.x - nx * w, p.y - ny * w)
    depth.face(xy, z, 0.36 * shade, tone)
    xy.length = 0
    xy.push(p.x + nx * w * 0.72, p.y + ny * w * 0.72, q.x + nx * w * 0.72, q.y + ny * w * 0.72, q.x + nx * w * 0.08, q.y + ny * w * 0.08, p.x + nx * w * 0.08, p.y + ny * w * 0.08)
    depth.face(xy, z + 1e-4, 0.9 * shade, tone)
  }
}

/** A partial bond (forming, breaking, or a hydrogen bond): a dashed hairline whose dashes keep their place along it. */
export function partial(depth: Depth, project: Project, a: V3, b: V3, width: number, alpha: number, view: View, tone: Tone = 'ink', layer?: number) {
  if (alpha < 0.004) return
  project(...a, p)
  project(...b, q)
  const unit = Math.max(1.6, view.size * 0.012) / view.px
  depth.path([p.x, p.y, q.x, q.y], layer ?? (p.z + q.z) / 2, { width, alpha: alpha * brightness((p.z + q.z) / 2), tone, dash: [unit * 1.4, unit], cap: 'butt' })
}

const BOX_FACES: { axis: number; sign: number; axes: [number, number] }[] = [
  { axis: 0, sign: -1, axes: [1, 2] }, { axis: 0, sign: 1, axes: [1, 2] },
  { axis: 1, sign: -1, axes: [0, 2] }, { axis: 1, sign: 1, axes: [0, 2] },
  { axis: 2, sign: -1, axes: [0, 1] }, { axis: 2, sign: 1, axes: [0, 1] },
]
const corner: V3 = [0, 0, 0]
const normal: V3 = [0, 0, 0]
const SIGNS = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const

/** An opaque crystal slab, lit by world normals carried through the camera. */
export function slab(depth: Depth, project: Project, turn: (x: number, y: number, z: number) => V3, center: V3, half: V3, hair: number) {
  for (const { axis, sign, axes } of BOX_FACES) {
    set(normal, 0, 0, 0)
    normal[axis] = sign
    const n = turn(...normal)
    if (n[2] <= 0) continue
    xy.length = 0
    let z = 0
    for (const [a, b] of SIGNS) {
      set(corner, ...center)
      corner[axis]! += half[axis]! * sign
      corner[axes[0]]! += half[axes[0]]! * a
      corner[axes[1]]! += half[axes[1]]! * b
      project(...corner, p)
      xy.push(p.x, p.y)
      z += p.z / 4
    }
    depth.face(xy, z, lambert(...n))
    depth.path(xy, z + 0.01, { width: hair, alpha: 0.65 * brightness(z), closed: true })
  }
}
