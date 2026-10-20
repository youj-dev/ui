'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'tributary', title: 'Tributary', category: 'geometry', technique: 'mixed',
  tags: ['river', 'confluence', 'channel', 'terrain', 'fluid', 'cartography'],
  description: 'Two narrow streams descend a cut terrain model and meet in a wider channel. Paired flow fronts arrive together, become one double-width front at the junction, and continue downstream beneath the raised banks.',
  order: 32,
  colors: [{ part: 'Streams', mono: 'ink' }],
} satisfies LoaderMeta

/* A landscape model, cut square from its site and set on a base: two
 * terraced banks and a wedge between two narrow streams, which join and run
 * on as one channel twice as wide. The channels are cut down to a darker
 * bed under a film of water, and the water flows: dashes stream down every
 * lane at one speed, the lanes of each stream bending at the junction into
 * its own half of the wide channel. Fronts run down both streams in pairs,
 * meet at the junction as one front the width of both, take the accent as
 * they become one and carry on to the cut edge, where the channel shows its
 * section. Every bank and terrace is a solid extrusion, lit by its faces,
 * and hides the water behind it.
 *
 * Color: the two streams’ flow fronts are `c1` until they join,
 * when the shared front takes the accent. */

const FAR = -29
const NEAR = 30
const HALF = 32
/** A stream's half-width across x, and the joined channel's. */
const WX = 5
const WM = 7.6
/** Where along the flow (0–1) the streams meet. */
const UJ = 34.66 / 68.66
const BASE = -6.5
const BED = -2.6
const WATER = -1.5
const LOW = 1.4
const HIGH = 4
const YAW = -0.36
const PITCH = -0.84
const ZOOM = 0.98

const smooth = (x: number) => {
  const c = clamp(x)
  return c * c * (3 - 2 * c)
}

/**
 * A point of the flow: stream `b` (−1 the left, 1 the right), `a` across it
 * (−1 its outer bank, 1 its inner), `u` along it (0 the far cut, 1 the near).
 * Upstream a stream runs on the diagonal; through the junction it bends into
 * its own half of the joined channel, so its lanes never cross the other's.
 */
function lane(b: number, a: number, u: number): [number, number] {
  const z = u <= UJ ? mix(FAR, -4, u / UJ) : mix(-4, NEAR, (u - UJ) / (1 - UJ))
  const s = u / UJ
  const branch = b * (24 * (1 - s) - a * WX)
  const main = (b * (1 - a) * WM) / 2
  return [mix(branch, main, smooth((u - UJ * 0.55) / (UJ * 0.4))), z]
}

/** Where the two streams' banks at `a` meet over the wedge: the wedge's tip, as progress along the flow. */
function tip(a: number) {
  let lo = 0
  let hi = UJ
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2
    if (lane(-1, a, m)[0] < 0) lo = m
    else hi = m
  }
  return lo
}

type P2 = [number, number]
interface Prism {
  pts: P2[]
  /** Each edge's outward normal (x, z), and whether it faces a channel (its wall starts at the water). */
  edges: { n: P2; wet: boolean }[]
  y0: number
  y1: number
  /** Draw order among the solids: an upper terrace after the one it stands on. */
  layer: number
}

function prism(pts: P2[], wet: (i: number) => boolean, y0: number, y1: number, layer: number): Prism {
  let area = 0
  pts.forEach(([x, z], i) => {
    const [nx, nz] = pts[(i + 1) % pts.length]!
    area += x * nz - nx * z
  })
  const sign = area > 0 ? -1 : 1
  const edges = pts.map(([x, z], i) => {
    const [nx, nz] = pts[(i + 1) % pts.length]!
    const len = Math.hypot(nx - x, nz - z) || 1
    return { n: [(sign * (nz - z)) / len, (sign * -(nx - x)) / len] as P2, wet: wet(i) }
  })
  return { pts, edges, y0, y1, layer }
}

/** The banks and the wedge, a lower terrace each and (above 40px) an upper one stepped back from the water. */
function landforms(samples: number, terraces: boolean): Prism[] {
  const out: Prism[] = []
  const levels = terraces
    ? [
        { a: 1, y0: BED, y1: LOW, layer: 0 },
        { a: 1.5, y0: LOW, y1: HIGH, layer: 1 },
      ]
    : [{ a: 1, y0: BED, y1: LOW + 1.5, layer: 0 }]
  for (const { a, y0, y1, layer } of levels) {
    for (const b of [-1, 1]) {
      const edge: P2[] = Array.from({ length: samples + 1 }, (_, i) => lane(b, -a, i / samples))
      const pts: P2[] = [[b * HALF, FAR], ...edge, [b * HALF, NEAR]]
      out.push(prism(pts, (i) => i >= 1 && i <= samples, y0, y1, layer))
    }
    const end = tip(a)
    const n = Math.max(3, Math.round((samples * end) / 1))
    const left: P2[] = Array.from({ length: n + 1 }, (_, i) => lane(-1, a, (end * i) / n))
    const right: P2[] = Array.from({ length: n + 1 }, (_, i) => lane(1, a, (end * (n - i)) / n))
    right[0] = [0, left[n]![1]]
    left[n] = [0, left[n]![1]]
    const pts: P2[] = [...left, ...right.slice(1)]
    out.push(prism(pts, (i) => i < pts.length - 1, y0, y1, layer))
  }
  return out
}

/** The water's outline: down the left bank, across the near cut, up the right bank, round the wedge. */
function waterline(samples: number): P2[] {
  const out: P2[] = []
  for (let i = 0; i <= samples; i++) out.push(lane(-1, -1, i / samples))
  for (let i = samples; i >= 0; i--) out.push(lane(1, -1, i / samples))
  const end = tip(1)
  const n = Math.max(3, Math.round(samples * end))
  for (let i = 0; i < n; i++) out.push(lane(1, 1, (end * i) / n))
  out.push([0, lane(1, 1, end)[1]])
  for (let i = n - 1; i >= 0; i--) out.push(lane(-1, 1, (end * i) / n))
  return out
}

const DETAIL = [
  { below: 32, samples: 10, lanes: [-0.4, 0.4], fronts: 2, terraces: false },
  { below: 80, samples: 18, lanes: [-0.6, 0, 0.6], fronts: 3, terraces: true },
  { below: Infinity, samples: 28, lanes: [-0.62, 0, 0.62], fronts: 3, terraces: true },
].map((d) => ({ ...d, solids: landforms(d.samples, d.terraces), water: waterline(d.samples), runs: d.lanes.flatMap((a) => [-1, 1].map((b) => ({ b, a }))) }))

const depth = new Depth()
const a = point()
const b = point()
const xy: number[] = []
const lanePts: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.62,
  draw(pen, t, view) {
    const d = DETAIL.find((x) => view.size < x.below)!
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const yaw = YAW + 0.06 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 380, cx: view.w / 2 + 1, cy: view.h * 0.48 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, (y + 1) * ZOOM, z * ZOOM, out)
    const turn = orient({ yaw, pitch: PITCH })
    const quad = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, key: number, light: number) => {
      xy.length = 0
      project(x0, y0, z0, a)
      xy.push(a.x, a.y)
      project(x1, y0, z1, a)
      xy.push(a.x, a.y)
      project(x1, y1, z1, a)
      xy.push(a.x, a.y)
      project(x0, y1, z0, a)
      xy.push(a.x, a.y)
      depth.face(xy, key, light)
    }

    // The base the model is cut from, and its bed, darker where the channels are cut down to it.
    for (const [nx, nz, x0, z0, x1, z1] of [
      [0, 1, -HALF, NEAR, HALF, NEAR],
      [1, 0, HALF, NEAR, HALF, FAR],
      [-1, 0, -HALF, FAR, -HALF, NEAR],
      [0, -1, HALF, FAR, -HALF, FAR],
    ] as const) {
      const [vx, vy, vz] = turn(nx, 0, nz)
      if (vz > 0.001) quad(x0, BASE, z0, x1, BED, z1, -1000, lambert(vx, vy, vz))
    }
    xy.length = 0
    for (const [x, z] of [[-HALF, FAR], [HALF, FAR], [HALF, NEAR], [-HALF, NEAR]] as const) {
      project(x, BED, z, a)
      xy.push(a.x, a.y)
    }
    depth.face(xy, -900, lambert(...turn(0, 1, 0)) * 0.5)
    depth.path(xy, -899, { width: hair, alpha: 0.5, closed: true, join: 'miter' })

    // The water: a film over the bed, and its section where the near cut crosses the channel.
    xy.length = 0
    for (const [x, z] of d.water) {
      project(x, WATER, z, a)
      xy.push(a.x, a.y)
    }
    depth.poly(xy, -800, 0.07)
    quad(-WM, BED, NEAR, WM, WATER, NEAR, -799, lambert(...turn(0, 0, 1)) * 0.62)

    // The flow: dashes stream down every lane at one speed, two whole dash lengths a loop.
    const dash = clamp(view.size * 0.022, 2, 4.5) / view.px
    const steps = d.samples * 2
    for (const { b: s, a: across } of d.runs) {
      lanePts.length = 0
      for (let i = 0; i <= steps; i++) {
        const [x, z] = lane(s, across, i / steps)
        project(x, WATER + 0.05, z, a)
        lanePts.push(a.x, a.y)
      }
      depth.path(lanePts, -700, small ? { width: hair, alpha: 0.3 } : { width: hair, alpha: 0.45, dash: [dash * 2, dash * 2.2], offset: -t * dash * 4.2 * 3, cap: 'round' })
    }

    // The fronts: a pair down the streams, one front across the joined channel, the accent as they become one.
    for (let f = 0; f < d.fronts; f++) {
      const u = (t + f / d.fronts) % 1
      const fade = view.ease.enter(span(u, 0, 0.06)) * (1 - view.ease.exit(span(u, 0.92, 1)))
      if (fade <= 0.005) continue
      const joined = f === 0 ? view.ease.standard(span(u, UJ - 0.03, UJ + 0.07)) : 0
      for (let wake = 0; wake < (small ? 1 : 3); wake++) {
        const at = Math.max(0, u - wake * 0.022)
        const alpha = fade * (wake === 0 ? 0.95 : 0.34 / wake)
        for (const s of [-1, 1]) {
          xy.length = 0
          for (let k = 0; k <= 6; k++) {
            const [x, z] = lane(s, -0.98 + (1.96 * k) / 6, at)
            project(x, WATER + 0.1, z, a)
            xy.push(a.x, a.y)
          }
          const width = wake === 0 ? line : hair
          if (joined < 1) depth.path(xy, -600 - wake, { width, alpha: alpha * (1 - joined), cap: 'round', join: 'round', tone: 'c1' })
          if (joined > 0 && wake === 0) depth.path(xy, -599, { width, alpha: alpha * joined, tone: 'accent', cap: 'round', join: 'round' })
        }
      }
    }

    // The land: each bank and the wedge, lit wall by wall, the terrace above stepped back from the water.
    for (const solid of d.solids) {
      const key = solid.layer * 100
      solid.pts.forEach(([x0, z0], i) => {
        const [x1, z1] = solid.pts[(i + 1) % solid.pts.length]!
        const { n, wet } = solid.edges[i]!
        const [vx, vy, vz] = turn(n[0], 0, n[1])
        if (vz <= 0.001) return
        project((x0 + x1) / 2, solid.y1, (z0 + z1) / 2, b)
        quad(x0, wet && solid.layer === 0 ? WATER : solid.y0, z0, x1, solid.y1, z1, key + b.z / 1000, lambert(vx, vy, vz))
      })
      xy.length = 0
      for (const [x, z] of solid.pts) {
        project(x, solid.y1, z, a)
        xy.push(a.x, a.y)
      }
      depth.face(xy, key + 50, lambert(...turn(0, 1, 0)))
      depth.path(xy, key + 50.01, { width: hair, alpha: 0.62, closed: true, join: 'round' })
    }

    // Registration marks on the ground at the base's corners.
    if (view.size >= 64) {
      const arm = 3.2
      for (const [x, z] of [[-HALF, FAR], [HALF, FAR], [HALF, NEAR], [-HALF, NEAR]] as const) {
        const sx = Math.sign(x)
        const sz = Math.sign(z)
        project(x + sx * 1.5, BASE, z + sz * 1.5, a)
        project(x + sx * (1.5 + arm), BASE, z + sz * 1.5, b)
        depth.line(a, b, hair, 0.4)
        project(x + sx * 1.5, BASE, z + sz * (1.5 + arm), b)
        depth.line(a, b, hair, 0.4)
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two inset channels merge their flow beneath an extruded terrain model. */
export function LoaderTributary(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
