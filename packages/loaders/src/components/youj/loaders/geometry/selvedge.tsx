'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'selvedge', title: 'Selvedge', category: 'geometry', technique: 'mixed',
  tags: ['cloth', 'wind', 'fabric', 'weave', 'soft', 'flag'],
  description: 'A cloth fixed to a slender mast catches a travelling gust. Its woven lines bow through depth, its free hem lags behind the body, and a short accent stitch follows the fluttering corner.',
  order: 17,
  colors: [{ part: 'Hem', mono: 'ink' }],
} satisfies LoaderMeta

/* A cloth bent on a mast: the mast stands in a foot plate with a square
 * finial on top, and the cloth's luff is laced to it through three rings.
 * A gust runs along the cloth from the mast to its free hem once a loop
 * (whole waves, so the loop has no seam), bowing it through depth; the hem
 * lags the body. The cloth is a fine mesh of facets, each lit by its own
 * normal on whichever side faces us, and its weave (every other thread)
 * rides over the facets. Its edges are hemmed, heavier than the weave, with
 * a running stitch inside the hem; the stitch at the fluttering corner is
 * in the accent. The view leans a little with the gust.
 *
 * Color: the free hem and the outer selvedge are `c1`, so the
 * lagging edge reads against the ink weave; the corner stays the accent. */

type V3 = [number, number, number]
const MAST = -28
const TOP = 19
const DROP = 34
const ZOOM = 1.24

function cloth(u: number, v: number, t: number, out: V3) {
  const a = TAU * (t - 0.85 * u)
  out[0] = MAST + 55 * u - 1.7 * u * (1 - Math.cos(a))
  out[1] = TOP - DROP * v - 4 * u + 3.4 * u * Math.sin(a - 0.5 * v)
  out[2] = 11 * u ** 1.15 * Math.sin(a + 0.8 * v) + 2.2 * u * Math.sin(2 * a - 2 * v)
  return out
}

const levels = [
  { nx: 8, ny: 4, weave: 0 },
  { nx: 12, ny: 6, weave: 2 },
  { nx: 18, ny: 8, weave: 2 },
].map((d) => ({ ...d, pts: Array.from({ length: (d.nx + 1) * (d.ny + 1) }, (): V3 => [0, 0, 0]), keys: new Float64Array(d.nx * d.ny) }))

const depth = new Depth()
const P = [point(), point(), point(), point()]
const a = point()
const b = point()
const c: V3 = [0, 0, 0]
const xy: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.37,
  draw(pen, t, view) {
    const lod = levels[view.size < 32 ? 0 : view.size < 80 ? 1 : 2]!
    const { nx, ny, pts, keys } = lod
    const small = view.size < 32
    const fine = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    // The view leans with the gust and back, eased at both ends.
    const half = t < 0.5 ? t * 2 : (1 - t) * 2
    const pose = { yaw: -0.3 + 0.08 * view.ease.standard(half), pitch: -0.18 }
    const lens = camera({ ...pose, distance: 260, cx: view.w / 2 + 1, cy: 52 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient(pose)
    const at = (i: number, j: number) => pts[j * (nx + 1) + i]!
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) cloth(i / nx, j / ny, t, at(i, j))

    // The cloth: each facet reaches a little past its neighbours (no seams of background between them),
    // lit by its normal (from its diagonals) on whichever side we see, turning over smoothly where it's edge-on.
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const u0 = i / nx
        const v0 = j / ny
        const u1 = Math.min(1, (i + 1.3) / nx)
        const v1 = Math.min(1, (j + 1.3) / ny)
        const p00 = at(i, j)
        const p11 = at(i + 1, j + 1)
        const p10 = at(i + 1, j)
        const p01 = at(i, j + 1)
        project(...cloth(u0, v0, t, c), P[0]!)
        project(...cloth(u1, v0, t, c), P[1]!)
        project(...cloth(u1, v1, t, c), P[2]!)
        project(...cloth(u0, v1, t, c), P[3]!)
        const dx = p11[0] - p00[0]
        const dy = p11[1] - p00[1]
        const dz = p11[2] - p00[2]
        const ex = p01[0] - p10[0]
        const ey = p01[1] - p10[1]
        const ez = p01[2] - p10[2]
        const [nx0, ny0, nz0] = turn(dy * ez - dz * ey, dz * ex - dx * ez, dx * ey - dy * ex)
        const toward = clamp(0.5 + nz0 / (0.2 * (Math.hypot(nx0, ny0, nz0) || 1)))
        const light = mix(lambert(-nx0, -ny0, -nz0) * 0.86, lambert(nx0, ny0, nz0), toward)
        const key = (P[0]!.z + P[1]!.z + P[2]!.z + P[3]!.z) / 4
        keys[j * nx + i] = key
        xy.length = 0
        for (const p of P) xy.push(p.x, p.y)
        depth.face(xy, key, light)
      }
    }

    // The weave, every other thread, each piece laid over the facets round it (those either side, and those that reach over it).
    const over = (i0: number, j0: number, i1: number, j1: number) => {
      let k = -Infinity
      for (let j = Math.min(j0, j1) - 1; j <= Math.max(j0, j1); j++)
        for (let i = Math.min(i0, i1) - 1; i <= Math.max(i0, i1); i++) if (i >= 0 && j >= 0 && i < nx && j < ny) k = Math.max(k, keys[j * nx + i]!)
      return k + 0.01
    }
    const thread = (p: V3, q: V3, key: number, width: number, alpha: number) => {
      project(p[0], p[1], p[2], a)
      project(q[0], q[1], q[2], b)
      depth.path([a.x, a.y, b.x, b.y], key, { width, alpha, cap: 'round' })
    }
    for (let j = 0; j <= ny; j++) {
      const hem = j === 0 || j === ny
      if (!hem && (!lod.weave || j % lod.weave)) continue
      for (let i = 0; i < nx; i++) thread(at(i, j), at(i + 1, j), over(i, j - 1, i, j), hem ? line : hair * 0.8, hem ? 0.9 : 0.32)
    }
    for (let i = 1; i <= nx; i++) {
      const hem = i === nx
      if (!hem && (!lod.weave || i % lod.weave)) continue
      for (let j = 0; j < ny; j++) thread(at(i, j), at(i, j + 1), over(i - 1, j, i, j), hem ? line : hair * 0.8, hem ? 0.95 : 0.32)
    }

    // A running stitch inside the hem along the foot and the free edge, its last stretch at the fluttering corner in the accent.
    if (!small) {
      const inset = 0.06
      for (let k = 0; k < nx; k++) {
        const u0 = k / nx
        const u1 = (k + 0.55) / nx
        const corner = u0 >= 1 - 2 / nx
        project(...cloth(u0, 1 - inset, t, c), a)
        project(...cloth(u1, 1 - inset, t, c), b)
        depth.path([a.x, a.y, b.x, b.y], over(k, ny - 1, k, ny - 1) + 0.01, { width: corner ? line : hair, alpha: corner ? 1 : 0.5, tone: corner ? 'accent' : 'c1', cap: 'round' })
      }
      for (let k = 0; k < ny; k++) {
        const v0 = k / ny
        const v1 = (k + 0.55) / ny
        const corner = v0 >= 1 - 1.5 / ny
        project(...cloth(1 - inset * 0.6, v0, t, c), a)
        project(...cloth(1 - inset * 0.6, v1, t, c), b)
        depth.path([a.x, a.y, b.x, b.y], over(nx - 1, k, nx - 1, k) + 0.01, { width: corner ? line : hair, alpha: corner ? 1 : 0.5, tone: corner ? 'accent' : 'c1', cap: 'round' })
      }
    } else {
      cloth(1, 0.72, t, c)
      project(c[0], c[1], c[2], a)
      project(...at(nx, ny), b)
      depth.path([a.x, a.y, b.x, b.y], over(nx - 1, ny - 1, nx - 1, ny - 1) + 0.02, { width: line * 1.2, alpha: 1, tone: 'accent', cap: 'round' })
    }

    // The mast: a foot plate, the pole, a square finial, and the rings that lace the cloth's luff to it.
    project(MAST, 30, 0, a)
    project(MAST, -31, 0, b)
    depth.path([a.x, a.y, b.x, b.y], a.z + 0.5, { width: line * (fine ? 1.3 : 1.1), alpha: 0.85, cap: 'butt' })
    project(MAST, 31.4, 0, a)
    a.z += 1
    depth.square(a, clamp(view.size * 0.028, 1.8, 5.5) / view.px, 0.9)
    if (!small) {
      project(MAST - 6, -31, 0, a)
      project(MAST + 6, -31, 0, b)
      depth.line(a, b, line, 0.6)
      project(MAST, -31, -4, a)
      project(MAST, -31, 4, b)
      depth.line(a, b, hair, 0.45)
      for (const v of [0, 0.5, 1]) {
        const y = TOP - DROP * v
        xy.length = 0
        let z = 0
        for (let k = 0; k <= 10; k++) {
          const ang = (TAU * k) / 10
          project(MAST + 1.6 * Math.cos(ang), y, 1.6 * Math.sin(ang), a)
          xy.push(a.x, a.y)
          z += a.z / 11
        }
        depth.path(xy, z + 1, { width: hair, alpha: 0.8, closed: true })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A pinned cloth breathes in a travelling gust, its weave and free hem moving through depth. */
export function LoaderSelvedge(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
