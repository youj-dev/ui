'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, point, span, Depth, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'calyx', title: 'Calyx', category: 'geometry', technique: 'planes',
  tags: ['botanical', 'sepals', 'shell', 'unfurl', 'veins', '3d'],
  description: 'Six curved sepals peel away from a closed bud in a staggered spiral. Their central veins stay attached to the stalk, the tips open into a shallow crown, and the shells close in the same order around a fine accent stamen.',
  order: 34,
  colors: [{ part: 'Veins', mono: 'ink' }],
} satisfies LoaderMeta

/* A bud on a stalk, turning slowly like a specimen on a turntable (a sixth
 * of a turn a loop: its own symmetry, so the loop has no seam). Six curved
 * sepals spring from a lit receptacle cup; each is a shell of lit facets
 * with its central vein drawn on it and its edge outlined. They peel open
 * one after another (`emphasized`) into a shallow crown around a single
 * stamen, a filament with its anther in the accent, then close in the same
 * order. The stalk carries a node partway down and stands on a small
 * registration cross.
 *
 * Color: each sepal’s central vein warms toward `c1` as it peels
 * open and cools as it closes; the stamen’s anther stays the accent. */

const STALK = -33
const BASE = -17
const NODE = -26
const YAW = 0.22
const PITCH = -0.3
const ZOOM = 1.16

const depth = new Depth()
const p = point()
const q = point()
const r = point()
const s = point()
const v = [0, 0, 0] as [number, number, number]
const c0 = [0, 0, 0] as [number, number, number]
const c1 = [0, 0, 0] as [number, number, number]
const c2 = [0, 0, 0] as [number, number, number]
const c3 = [0, 0, 0] as [number, number, number]
/** The depth of each facet of the sepal being drawn, row by row and half by half, for the lines laid over them. */
const layers: number[] = []

/** A sepal's surface: `u` along its vein from the cup (0) to its tip (1), `across` −1 to 1; its open-ness bends it out. */
function shell(u: number, across: number, a: number, open: number, out: typeof v) {
  const radial = 5 + (7 + 22 * open) * u - 11 * (1 - open) * u * u
  const y = BASE + (44 - 23 * open) * u - 8 * open * u * u
  const width = (3 + 7 * open) * Math.sin(Math.PI * u) * across
  const bow = 3 * Math.sin(Math.PI * u) * (1 - across * across)
  out[0] = radial * Math.cos(a) - width * Math.sin(a)
  out[1] = y + bow
  out[2] = radial * Math.sin(a) + width * Math.cos(a)
}

export const scene: Scene = {
  beats: 6,
  still: 0.38,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const rows = small ? 4 : view.size < 80 ? 6 : 10
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const pose = { yaw: YAW, pitch: PITCH }
    const lens = camera({ ...pose, distance: 350, cx: view.w / 2, cy: view.h / 2 + 1 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, (y + 2) * ZOOM, z * ZOOM, out)
    const turn = orient(pose)
    const spin = (TAU / 6) * t
    // How far the crown as a whole is open, for the stamen.
    let crown = 0

    for (let petal = 0; petal < 6; petal++) {
      const a = (TAU * petal) / 6 + spin
      const delay = petal * 0.025
      const open = view.ease.emphasized(span(t, 0.04 + delay, 0.29 + delay)) - view.ease.standard(span(t, 0.59 + delay, 0.84 + delay))
      crown += open / 6
      for (let j = 0; j < rows; j++) {
        for (let side = 0; side < 2; side++) {
          const u = j / rows
          // Each facet reaches a little into the next one, and the two halves overlap at the vein, so no seam of background shows between them.
          const next = Math.min(1, (j + 1.3) / rows)
          const w0 = side - 1 - (side ? 0.05 : 0)
          const w1 = side + (side ? 0 : 0.05)
          shell(u, w0, a, open, c0)
          project(c0[0], c0[1], c0[2], p)
          shell(next, w0, a, open, c1)
          project(c1[0], c1[1], c1[2], q)
          shell(next, w1, a, open, c2)
          project(c2[0], c2[1], c2[2], r)
          shell(u, w1, a, open, c3)
          project(c3[0], c3[1], c3[2], s)
          // The facet's own normal from its diagonals (one always spans the sepal, even where it narrows to its tip or its foot),
          // carried into the camera's light; whichever side we see is lit, the inside a little darker.
          const dx = c2[0] - c0[0]
          const dy = c2[1] - c0[1]
          const dz = c2[2] - c0[2]
          const ex = c3[0] - c1[0]
          const ey = c3[1] - c1[1]
          const ez = c3[2] - c1[2]
          const n = turn(dy * ez - dz * ey, dz * ex - dx * ez, dx * ey - dy * ex)
          // Two-sided light that turns over smoothly as a facet passes edge-on: no facet changes tone in one step.
          const outside = clamp(0.5 + n[2] / (0.2 * (Math.hypot(n[0], n[1], n[2]) || 1)))
          const light = mix(lambert(-n[0], -n[1], -n[2]) * 0.82, lambert(n[0], n[1], n[2]), outside)
          const layer = (p.z + q.z + r.z + s.z) / 4
          layers[j * 2 + side] = layer
          depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], layer, light)
        }
      }
      // The vein down the middle and the sepal's edges, each piece exactly its row's length, over the facets on both sides of it.
      for (let j = 0; j < rows; j++) {
        const u = j / rows
        const end = (j + 1) / rows
        // The piece lies on its own row's facet and on the last bit of the row before, which reaches into it.
        const before = Math.max(0, j - 1)
        const over = (side: number) => Math.max(layers[j * 2 + side]!, layers[before * 2 + side]!) + 0.01
        if (!small) {
          shell(u, 0, a, open, v)
          project(v[0], v[1], v[2], p)
          shell(end, 0, a, open, v)
          project(v[0], v[1], v[2], q)
          depth.path([p.x, p.y, q.x, q.y], Math.max(over(0), over(1)), { width: hair * 0.9, alpha: 0.55, tone: blend('ink', 'c1', 0.9 * open) })
        }
        for (const side of [0, 1]) {
          shell(u, side ? 1 : -1, a, open, v)
          project(v[0], v[1], v[2], p)
          shell(end, side ? 1 : -1, a, open, v)
          project(v[0], v[1], v[2], q)
          depth.path([p.x, p.y, q.x, q.y], over(side), { width: hair, alpha: 0.7 })
        }
      }
    }

    // The receptacle the sepals spring from: a lit cup of six faces, turning with them.
    for (let k = 0; k < 6; k++) {
      const a0 = (TAU * k) / 6 + spin + Math.PI / 6
      const a1 = a0 + TAU / 6
      const mid = (a0 + a1) / 2
      const [nx, ny, nz] = turn(Math.cos(mid), -0.45, Math.sin(mid))
      if (nz <= 0) continue
      project(3 * Math.cos(a0), BASE - 4, 3 * Math.sin(a0), p)
      project(3 * Math.cos(a1), BASE - 4, 3 * Math.sin(a1), q)
      project(5.6 * Math.cos(a1), BASE + 0.6, 5.6 * Math.sin(a1), r)
      project(5.6 * Math.cos(a0), BASE + 0.6, 5.6 * Math.sin(a0), s)
      depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], (p.z + q.z + r.z + s.z) / 4 - 0.5, lambert(nx, ny, nz))
    }

    // The stalk, with a node partway down, on a registration cross.
    project(0, STALK, 0, p)
    project(0, BASE - 4, 0, q)
    depth.line(p, q, line * (small ? 1.2 : 1.4), 0.75)
    if (!small) {
      const nodeW = 1.9
      project(-nodeW, NODE, 0, p)
      project(nodeW, NODE, 0, q)
      depth.line(p, q, line * 1.6, 0.8)
      if (fine) {
        project(-6, STALK, 0, p)
        project(6, STALK, 0, q)
        depth.line(p, q, hair, 0.4)
        project(0, STALK, -6, p)
        project(0, STALK, 6, q)
        depth.line(p, q, hair, 0.4)
      }
    }

    // The stamen: a fine filament standing in the cup, its anther in the accent; it lifts a little as the crown opens.
    const top = BASE + mix(15, 19, view.ease.standard(clamp(crown)))
    project(0, BASE - 1, 0, p)
    project(0, top, 0, q)
    depth.line(p, q, hair, 0.6)
    project(0, top + 0.8, 0, r)
    depth.square(r, clamp(view.size * 0.026, 1.8, 5.2) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Six curved shells open around a single slender stamen. */
export function LoaderCalyx(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
