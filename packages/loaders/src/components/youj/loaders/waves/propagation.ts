/* Small drawing tools for the wave scenes. Geometry is held by each scene;
 * these scratch points are consumed immediately by Depth, which copies them. */
import { TAU, clamp, lambert, mix, point, type Depth, type Project, type Tone, type View } from '../field'

export type V3 = [number, number, number]
export type Turn = (x: number, y: number, z: number) => V3
export const detail = (view: View) => view.size < 32 ? 0 : view.size < 80 ? 1 : 2
export const hairline = (view: View) => (view.size < 32 ? 1.05 : 1.1) / view.px
export const brightness = (z: number) => clamp(0.62 + z / 140, 0.3, 0.94)
/** A compact pulse whose value and derivative vanish at its boundaries. */
export const packet = (x: number, width: number) => {
  const u = Math.abs(x / width)
  return u >= 1 ? 0 : (0.5 + 0.5 * Math.cos(Math.PI * u)) ** 2
}
export const wrap = (t: number) => ((t % 1) + 1) % 1
/** Signed distance round the loop from `at` to `t`, in (-0.5, 0.5]: for a beat that straddles the seam. */
export const around = (t: number, at: number) => wrap(t - at + 0.5) - 0.5

const p = point()
const q = point()
const xy: number[] = []

export function edge(depth: Depth, project: Project, a: V3, b: V3, width: number, alpha: number, tone: Tone = 'ink') {
  project(...a, p)
  project(...b, q)
  depth.line(p, q, width * clamp((p.k + q.k) / 2, 0.8, 1.2), alpha * brightness((p.z + q.z) / 2), tone)
}

/** Short paths sort independently in depth, including opposite sides of a ring. */
export function wire(depth: Depth, project: Project, vertices: readonly V3[], width: number, alpha: number, tone: Tone = 'ink', chunk = 8, dash?: readonly number[]) {
  for (let from = 0; from < vertices.length - 1; from += chunk) {
    xy.length = 0
    let z = 0
    let k = 0
    const end = Math.min(from + chunk, vertices.length - 1)
    for (let i = from; i <= end; i++) {
      project(...vertices[i]!, p)
      xy.push(p.x, p.y)
      z += p.z
      k += p.k
    }
    const n = end - from + 1
    depth.path(xy, z / n, { width: width * clamp(k / n, 0.8, 1.2), alpha: alpha * brightness(z / n), tone, join: 'round', cap: dash ? 'butt' : 'round', dash })
  }
}

const C = Array.from({ length: 8 }, () => [0, 0, 0] as V3)
const FACES = [
  { ids: [0, 4, 6, 2], normal: [-1, 0, 0] as V3 },
  { ids: [1, 3, 7, 5], normal: [1, 0, 0] as V3 },
  { ids: [0, 1, 5, 4], normal: [0, -1, 0] as V3 },
  { ids: [2, 6, 7, 3], normal: [0, 1, 0] as V3 },
  { ids: [0, 2, 3, 1], normal: [0, 0, -1] as V3 },
  { ids: [4, 5, 7, 6], normal: [0, 0, 1] as V3 },
]

export interface Finish {
  /** Units: a chamfer line drawn just inside each visible face's edge, catching the light. */
  bevel?: number
  /** Multiplies the faces' light, for a part that flashes as something reaches it. */
  lift?: number
  /** The outline's alpha. */
  edge?: number
}

/** A chamfer: the face's corners pulled toward its centre by `inset` units (in screen space), a faint line just inside the edge. */
function chamfer(depth: Depth, xy4: readonly number[], z: number, inset: number, width: number, alpha: number) {
  const n = xy4.length / 2
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += xy4[2 * i]! / n
    cy += xy4[2 * i + 1]! / n
  }
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const x = xy4[2 * i]! - cx
    const y = xy4[2 * i + 1]! - cy
    const d = Math.hypot(x, y) || 1
    const k = Math.max(0, d - inset) / d
    out.push(cx + x * k, cy + y * k)
  }
  depth.path(out, z + 0.012, { width: width * 0.7, alpha, closed: true, join: 'round' })
}

/** A lit cuboid, with its outline at the same depth as each visible face. */
export function block(depth: Depth, project: Project, turn: Turn, center: V3, half: V3, width: number, tone: Tone = 'ink', finish: Finish = {}) {
  for (let i = 0; i < 8; i++) {
    const c = C[i]!
    c[0] = center[0] + (i & 1 ? half[0] : -half[0])
    c[1] = center[1] + (i & 2 ? half[1] : -half[1])
    c[2] = center[2] + (i & 4 ? half[2] : -half[2])
  }
  for (const f of FACES) {
    const n = turn(...f.normal)
    if (n[2] <= 0) continue
    xy.length = 0
    let z = 0
    for (const i of f.ids) {
      project(...C[i]!, p)
      xy.push(p.x, p.y)
      z += p.z
    }
    depth.face(xy, z / 4, clamp(lambert(...n) * (finish.lift ?? 1)), tone)
    depth.path(xy, z / 4 + 0.01, { width, alpha: brightness(z / 4) * (finish.edge ?? 0.72), closed: true })
    if (finish.bevel && n[2] > 0.25) chamfer(depth, xy, z / 4, finish.bevel, width, 0.3 * brightness(z / 4))
  }
}

/**
 * A lit box on its own axes (unit vectors `ax`, `ay`, `az`, right-handed)
 * about `center`, with half-extents along each: the faces toward the
 * viewer, outlined. Returns the depth of the face on the −ax end (where a
 * window or aperture goes), or NaN when it's turned away.
 */
export function box(depth: Depth, project: Project, turn: Turn, center: V3, ax: V3, ay: V3, az: V3, half: V3, width: number, finish: Finish = {}) {
  for (let i = 0; i < 8; i++) {
    const c = C[i]!
    const sx = i & 1 ? half[0] : -half[0]
    const sy = i & 2 ? half[1] : -half[1]
    const sz = i & 4 ? half[2] : -half[2]
    for (let j = 0; j < 3; j++) c[j] = center[j]! + ax[j]! * sx + ay[j]! * sy + az[j]! * sz
  }
  let end = NaN
  FACES.forEach((f, k) => {
    const [fx, fy, fz] = f.normal
    const n = turn(ax[0] * fx + ay[0] * fy + az[0] * fz, ax[1] * fx + ay[1] * fy + az[1] * fz, ax[2] * fx + ay[2] * fy + az[2] * fz)
    if (n[2] <= 0) return
    xy.length = 0
    let z = 0
    for (const i of f.ids) {
      project(...C[i]!, p)
      xy.push(p.x, p.y)
      z += p.z / 4
    }
    depth.face(xy, z, clamp(lambert(...n) * (finish.lift ?? 1)))
    depth.path(xy, z + 0.01, { width, alpha: brightness(z) * (finish.edge ?? 0.72), closed: true })
    if (finish.bevel && n[2] > 0.25) chamfer(depth, xy, z, finish.bevel, width, 0.3 * brightness(z))
    if (k === 0) end = z
  })
  return end
}

/**
 * A lit planar polygon through world corners (convex, in order), shaded by
 * its own normal: drawn from whichever side faces the viewer, so a thin
 * plate or fin reads from both sides.
 */
export function panel(depth: Depth, project: Project, turn: Turn, corners: readonly V3[], width: number, tone: Tone = 'ink', finish: Finish = {}) {
  const a = corners[0]!
  const b = corners[1]!
  const c = corners[2]!
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const uz = b[2] - a[2]
  const vx = c[0] - a[0]
  const vy = c[1] - a[1]
  const vz = c[2] - a[2]
  const n = turn(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
  const s = n[2] < 0 ? -1 : 1
  xy.length = 0
  let z = 0
  for (const v of corners) {
    project(...v, p)
    xy.push(p.x, p.y)
    z += p.z / corners.length
  }
  depth.face(xy, z, clamp(lambert(n[0] * s, n[1] * s, n[2] * s) * (finish.lift ?? 1)), tone)
  if (width > 0) depth.path(xy, z + 0.01, { width, alpha: brightness(z) * (finish.edge ?? 0.72), closed: true, join: 'round' })
  if (finish.bevel) chamfer(depth, xy, z, finish.bevel, width, 0.3 * brightness(z))
  return z
}

/** The outward normals of a square's sides, in the order `frame` walks them. */
const SIDES: V3[] = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]]

/**
 * A square frame lying flat, its top at `y`: four mitred top faces, each
 * sorted at its own depth (so the near side passes in front of whatever it
 * holds and the far side behind), the outer walls and the inner walls that
 * face the viewer, and the top's edges and mitres drawn.
 */
export function frame(depth: Depth, project: Project, turn: Turn, inner: number, width: number, height: number, y: number, hair: number, finish: Finish = {}) {
  const outer = inner + width
  const sq = (h: number, yy: number): V3[] => [[-h, yy, -h], [h, yy, -h], [h, yy, h], [-h, yy, h]]
  const o = sq(outer, y)
  const i = sq(inner, y)
  const light = clamp(lambert(...turn(0, 1, 0)) * (finish.lift ?? 1))
  const lerp = (a: V3, b: V3, f: number, out: V3) => {
    out[0] = a[0] + (b[0] - a[0]) * f
    out[1] = y
    out[2] = a[2] + (b[2] - a[2]) * f
    return out
  }
  for (let k = 0; k < 4; k++) {
    // Each side in four lapped pieces, each sorted at its own depth with its stretch of the edges.
    const kb = finish.bevel ? (outer - finish.bevel) / outer : 0
    for (let piece = 0; piece < 4; piece++) {
      const f0 = Math.max(0, piece / 4 - 0.02)
      const f1 = Math.min(1, (piece + 1) / 4 + 0.02)
      xy.length = 0
      let z = 0
      for (const v of [lerp(o[k]!, o[(k + 1) % 4]!, f0, QUAD[0]!), lerp(o[k]!, o[(k + 1) % 4]!, f1, QUAD[1]!), lerp(i[k]!, i[(k + 1) % 4]!, f1, QUAD[2]!), lerp(i[k]!, i[(k + 1) % 4]!, f0, QUAD[3]!)]) {
        project(...v, p)
        xy.push(p.x, p.y)
        z += p.z / 4
      }
      depth.face(xy, z, light)
      depth.path([xy[0]!, xy[1]!, xy[2]!, xy[3]!], z + 0.01, { width: hair, alpha: 0.75 * brightness(z) })
      depth.path([xy[4]!, xy[5]!, xy[6]!, xy[7]!], z + 0.01, { width: hair * 0.85, alpha: 0.6 * brightness(z) })
      if (piece === 0) depth.path([xy[0]!, xy[1]!, xy[6]!, xy[7]!], z + 0.01, { width: hair * 0.6, alpha: 0.35 * brightness(z) })
      if (kb) {
        project(...lerp(o[k]!, o[(k + 1) % 4]!, f0, QUAD[0]!).map((c, j) => (j === 1 ? c : c * kb)) as V3, p)
        const x0 = p.x
        const y0 = p.y
        project(...lerp(o[k]!, o[(k + 1) % 4]!, f1, QUAD[0]!).map((c, j) => (j === 1 ? c : c * kb)) as V3, p)
        depth.path([x0, y0, p.x, p.y], z + 0.012, { width: hair * 0.7, alpha: 0.3 * brightness(z) })
      }
    }
  }
  // Walls: outer ones face out, inner ones face into the opening; each in lapped pieces, sorted where they are.
  for (const [loop, sign] of [[o, 1], [i, -1]] as const) {
    for (let k = 0; k < 4; k++) {
      const out = SIDES[k]!
      const n = turn(sign * out[0], 0, sign * out[2])
      if (n[2] <= 0) continue
      const light = lambert(...n)
      for (let piece = 0; piece < 4; piece++) {
        const f0 = Math.max(0, piece / 4 - 0.02)
        const f1 = Math.min(1, (piece + 1) / 4 + 0.02)
        lerp(loop[k]!, loop[(k + 1) % 4]!, f0, QUAD[0]!)
        lerp(loop[k]!, loop[(k + 1) % 4]!, f1, QUAD[1]!)
        lerp(loop[k]!, loop[(k + 1) % 4]!, f1, QUAD[2]!)[1] = y - height
        lerp(loop[k]!, loop[(k + 1) % 4]!, f0, QUAD[3]!)[1] = y - height
        xy.length = 0
        let wz = 0
        for (const c of QUAD) {
          project(...c, p)
          xy.push(p.x, p.y)
          wz += p.z / 4
        }
        depth.face(xy, wz, light)
        if (sign > 0) depth.path([xy[4]!, xy[5]!, xy[6]!, xy[7]!], wz + 0.01, { width: hair * 0.8, alpha: 0.55 * brightness(wz) })
      }
      if (sign > 0) {
        // The wall's vertical corner edges.
        for (const v of [loop[k]!, loop[(k + 1) % 4]!]) edge(depth, project, v, [v[0], y - height, v[2]], hair * 0.8, 0.55)
      }
    }
  }
}

const RING = Array.from({ length: 33 }, () => [0, 0, 0] as V3)
const QUAD = Array.from({ length: 4 }, () => [0, 0, 0] as V3)
const AXES: Record<'x' | 'y' | 'z', [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]> = { x: [1, 2, 0], y: [2, 0, 1], z: [0, 1, 2] }

/**
 * A lit cylinder from `base` along an axis (`length` may be negative), its
 * side facets toward the viewer and its end cap at `base + length`, rimmed.
 * Returns the cap's depth, for marks laid on it.
 */
export function cylinder(depth: Depth, project: Project, turn: Turn, base: V3, axis: 'x' | 'y' | 'z', radius: number, length: number, sides: number, width: number, finish: Finish = {}) {
  const [u, v, w] = AXES[axis]
  const at = (a: number, h: number, out: V3) => {
    out[u] = base[u]! + radius * Math.cos(a)
    out[v] = base[v]! + radius * Math.sin(a)
    out[w] = base[w]! + h
    return out
  }
  const nrm: V3 = [0, 0, 0]
  for (let i = 0; i < sides; i++) {
    const a0 = (TAU * i) / sides
    const a1 = (TAU * (i + 1)) / sides
    const mid = (a0 + a1) / 2
    nrm[u] = Math.cos(mid)
    nrm[v] = Math.sin(mid)
    nrm[w] = 0
    const n = turn(...nrm)
    if (n[2] <= 0) continue
    at(a0, 0, QUAD[0]!)
    at(a1, 0, QUAD[1]!)
    at(a1, length, QUAD[2]!)
    at(a0, length, QUAD[3]!)
    xy.length = 0
    let z = 0
    for (const c of QUAD) {
      project(...c, p)
      xy.push(p.x, p.y)
      z += p.z / 4
    }
    depth.face(xy, z, clamp(lambert(...n) * (finish.lift ?? 1)))
  }
  nrm[u] = 0
  nrm[v] = 0
  nrm[w] = Math.sign(length) || 1
  const capN = turn(...nrm)
  xy.length = 0
  let z = 0
  for (let i = 0; i < sides; i++) {
    project(...at((TAU * i) / sides, length, RING[0]!), p)
    xy.push(p.x, p.y)
    z += p.z / sides
  }
  if (capN[2] > 0) {
    depth.face(xy, z, clamp(lambert(...capN) * (finish.lift ?? 1)))
    depth.path(xy, z + 0.01, { width, alpha: brightness(z) * (finish.edge ?? 0.75), closed: true, join: 'round' })
  }
  // The silhouette's two long edges, where the side turns edge-on: n·view = A cos a + B sin a = 0.
  nrm[u] = 1
  nrm[v] = 0
  nrm[w] = 0
  const A = turn(...nrm)[2]
  nrm[u] = 0
  nrm[v] = 1
  const B = turn(...nrm)[2]
  const a0 = Math.atan2(A, -B)
  for (const e of [a0, a0 + Math.PI]) edge(depth, project, at(e, 0, QUAD[0]!), at(e, length, QUAD[1]!), width, finish.edge ?? 0.7)
  return z
}

/**
 * A graduated scale from `a` to `b`: the rule, a tick every `1 / count` of
 * it toward `dir` (`len` long), every `major`th tick half again as long.
 */
export function ruler(depth: Depth, project: Project, a: V3, b: V3, count: number, major: number, dir: V3, len: number, width: number, alpha: number) {
  edge(depth, project, a, b, width, alpha)
  const s: V3 = [0, 0, 0]
  const e: V3 = [0, 0, 0]
  for (let i = 0; i <= count; i++) {
    const f = i / count
    const l = i % major === 0 ? len * 1.6 : len
    for (let j = 0; j < 3; j++) {
      s[j] = a[j]! + (b[j]! - a[j]!) * f
      e[j] = s[j]! + dir[j]! * l
    }
    edge(depth, project, s, e, width, alpha * (i % major === 0 ? 1 : 0.7))
  }
}

/* The light as the screen sees it (up, a little left), for shading a sphere in place. */
const LIGHT = Math.hypot(0.38, 0.78)
const LX = -0.38 / LIGHT
const LY = -0.78 / LIGHT
const DISC = [12, 20, 32].map((n) => Array.from({ length: n }, (_, i) => [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)] as const))

/**
 * A lit, opaque sphere: nested discs closing in on the light (dark at the
 * rim, the highlight up and to the left), so it reads as smooth at any size
 * in a handful of marks, with a crisp limb once it's large enough to carry
 * one. It sorts at its front, so a line running into it stops at its surface.
 */
export function orb(depth: Depth, project: Project, center: V3, r: number, view: View, tone: Tone = 'ink') {
  project(...center, p)
  const radius = r * p.k
  const px = r * view.px
  const steps = px < 2.6 ? 1 : px < 6 ? 2 : px < 12 ? 3 : 4
  const ring = DISC[px < 4 ? 0 : px < 10 ? 1 : 2]!
  const z = p.z + r
  for (let i = 0; i <= steps; i++) {
    const f = i / (steps + 1)
    const rr = radius * (1 - f * 0.92)
    const off = (radius - rr) * 0.72
    xy.length = 0
    for (const [c, s] of ring) xy.push(p.x + LX * off + rr * c, p.y + LY * off + rr * s)
    depth.face(xy, z + i * 1e-4, mix(0.26, 1, (i / steps) ** 0.85) * (0.84 + 0.16 * brightness(p.z)), tone)
  }
  if (px >= 5) {
    xy.length = 0
    for (const [c, s] of ring) xy.push(p.x + radius * c, p.y + radius * s)
    depth.path(xy, z + 2e-3, { width: (view.size < 80 ? 0.8 : 0.9) / view.px, alpha: 0.5 * brightness(p.z), closed: true, tone })
  }
}
