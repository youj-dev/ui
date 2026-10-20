'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, hump, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'infill', title: 'Infill', category: 'geometry', technique: 'mixed',
  tags: ['fabrication', 'additive', 'toolpath', 'layers', 'hatch', 'construction'],
  description: 'An open square part builds in deposited courses. Each layer completes its outer and inner walls before alternating cross-hatched infill bridges the ring; the active bead follows the exact toolpath and the completed courses expose the central well in depth.',
  order: 37,
  colors: [{ part: 'Toolpath', mono: 'ink' }],
} satisfies LoaderMeta

/* A square part with an open well, printed on a build plate. The nozzle (the
 * accent square, on its stem) follows one continuous toolpath a course at a
 * time: the outer wall, the inner wall, then the infill, a zigzag laid in
 * four runs round the ring, its rows turned a quarter from one course to the
 * next so the courses cross-hatch. The hot bead trails the nozzle; the
 * course's path stays on the top as it cools, and fades as the next course
 * crosses it. The part rises as it's laid, its courses marked on its walls
 * and down the well, the footprint dashed on the plate beneath. Finished, the
 * nozzle lifts clear, and the part is taken back down into the plate from
 * the top, course lines and all, until the plate is bare and the nozzle
 * settles to begin again. The view sways throughout.
 *
 * Color: the toolpaths on the top, the course being laid and the one fading
 * under it, lean toward `c1`; the active bead and the nozzle stay
 * the accent. */

const OUT = 25
const IN = 9
const HEIGHT = 25
const BASE = -14
const PLATE = 30
const PLATE_T = 3
const BUILD: [number, number] = [0.04, 0.7]
const CLEAR: [number, number] = [0.78, 0.96]
const PARK = 7

type Seg = { ax: number; az: number; bx: number; bz: number; lay: boolean; from: number; len: number }

/**
 * A course's toolpath, as segments in plan (x, z) from the start corner round back to it: the outer wall, the
 * inner wall, then the infill rows (along x, or along z when `turn`), zigzag through four runs, travels between.
 */
function toolpath(turn: boolean, band: number[], side: number[]): { segs: Seg[]; total: number } {
  const pts: [number, number, boolean][] = []
  const at = (u: number, v: number, lay: boolean) => pts.push(turn ? [v, u, lay] : [u, v, lay])
  const w = OUT - 1
  const n = IN + 1
  // The walls (the same for every course).
  for (const [x, z] of [[-w, -w], [w, -w], [w, w], [-w, w], [-w, -w]] as const) pts.push([x, z, true])
  pts.push([-n, -n, false])
  for (const [x, z] of [[-n, n], [n, n], [n, -n], [-n, -n]] as const) pts.push([x, z, true])
  // The infill: four zigzag runs, each reached by a travel.
  const zigzag = (rows: number[], u0: number, u1: number) => {
    rows.forEach((v, i) => {
      const [a, b] = i % 2 ? [u1, u0] : [u0, u1]
      at(a, v, i > 0)
      at(b, v, true)
    })
  }
  const inner = OUT - 3
  zigzag(band.map((v) => -v), -inner, inner)
  zigzag(side, -inner, -n - 2)
  zigzag([...side].reverse(), n + 2, inner)
  zigzag(band, inner, -inner)
  pts.push([-w, -w, false])
  // The first point is the start corner; the segment to each point is laid if its point says so.
  const segs: Seg[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1]!
    const [bx, bz, lay] = pts[i]!
    const len = Math.hypot(bx - ax, bz - az)
    if (len < 1e-6) continue
    segs.push({ ax, az, bx, bz, lay, from: total, len })
    total += len
  }
  return { segs, total }
}

const LEVELS = [
  { courses: 3, band: [17], side: [0] },
  { courses: 5, band: [20, 14], side: [-4, 4] },
  { courses: 7, band: [21, 17, 13], side: [-6, -2, 2, 6] },
].map((l) => ({ ...l, paths: [toolpath(false, l.band, l.side), toolpath(true, l.band, l.side)] }))

const depth = new Depth()
const P = Array.from({ length: 10 }, () => point())
const a = point()
const b = point()
const xy: number[] = []
const run: number[] = []

export const scene: Scene = {
  beats: 6.5,
  still: 0.5,
  draw(pen, t, view) {
    t %= 1
    const lod = view.size < 32 ? 0 : view.size < 80 ? 1 : 2
    const { courses, paths } = LEVELS[lod]!
    const small = lod === 0
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const bead = (small ? 1.5 : view.size < 80 ? 1.6 : 1.9) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const yaw = -0.52 + 0.07 * Math.sin(TAU * t)
    const pitch = -0.6
    const lens = camera({ yaw, pitch, distance: 360, cx: view.w / 2, cy: view.h * 0.5 })
    const zoom = small ? 1.12 : 1.04
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient({ yaw, pitch })
    const shade = (nx: number, ny: number, nz: number) => {
      const [x, y, z] = turn(nx, ny, nz)
      return z > 0.001 ? lambert(x, y, z) : -1
    }

    // How far the build has gone, in courses (0 to all of them), and how much has been taken back down.
    const built = courses * mix(span(t, ...BUILD), view.ease.emphasized(span(t, ...BUILD)), 0.4)
    const cleared = view.ease.emphasized(span(t, ...CLEAR))
    const h = HEIGHT / courses
    const top = BASE + HEIGHT * (built / courses - cleared)
    const tall = top - BASE
    const course = Math.min(courses - 1, Math.floor(built))
    const within = built - course

    // The build plate: a lit slab, the part's footprint dashed on it, and registration marks at its corners.
    const plate: [number, number][] = [[-PLATE, -PLATE], [PLATE, -PLATE], [PLATE, PLATE], [-PLATE, PLATE]]
    plate.forEach(([x0, z0], i) => {
      const [x1, z1] = plate[(i + 1) % 4]!
      const nx = z1 - z0
      const nz = x0 - x1
      const light = shade(nx, 0, nz)
      if (light < 0) return
      project(x0, BASE, z0, P[0]!)
      project(x1, BASE, z1, P[1]!)
      project(x1, BASE - PLATE_T, z1, P[2]!)
      project(x0, BASE - PLATE_T, z0, P[3]!)
      xy.length = 0
      for (let j = 0; j < 4; j++) xy.push(P[j]!.x, P[j]!.y)
      depth.face(xy, -120, light)
      depth.path(xy, -119, { width: hair, alpha: 0.55, closed: true, join: 'miter' })
    })
    xy.length = 0
    for (const [x, z] of plate) {
      project(x, BASE, z, a)
      xy.push(a.x, a.y)
    }
    depth.face(xy, -118, shade(0, 1, 0))
    depth.path(xy, -117, { width: hair, alpha: 0.6, closed: true, join: 'miter' })
    if (!small) {
      for (const half of [OUT, IN]) {
        const sq: [number, number][] = [[-half, -half], [half, -half], [half, half], [-half, half]]
        sq.forEach(([x0, z0], i) => {
          const [x1, z1] = sq[(i + 1) % 4]!
          project(x0, BASE, z0, a)
          project(x1, BASE, z1, b)
          depth.path([a.x, a.y, b.x, b.y], -116, { width: hair, alpha: 0.26, dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
        })
      }
      const arm = 3.2
      const r = PLATE - 2.5
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
        project(sx * r, BASE, sz * r, a)
        project(sx * (r - arm), BASE, sz * r, b)
        depth.path([a.x, a.y, b.x, b.y], -116, { width: hair, alpha: 0.45 })
        project(sx * r, BASE, sz * (r - arm), b)
        depth.path([a.x, a.y, b.x, b.y], -116, { width: hair, alpha: 0.45 })
      }
    }

    // The part as built so far: its outer walls and the well's far walls lit, its courses marked on both.
    const rim = clamp(tall / 1.2)
    if (tall > 0.02) {
      const wall = (x0: number, z0: number, x1: number, z1: number, nx: number, nz: number, key: number) => {
        const light = shade(nx, 0, nz)
        if (light < 0) return
        project(x0, top, z0, P[0]!)
        project(x1, top, z1, P[1]!)
        project(x1, BASE, z1, P[2]!)
        project(x0, BASE, z0, P[3]!)
        xy.length = 0
        for (let j = 0; j < 4; j++) xy.push(P[j]!.x, P[j]!.y)
        depth.face(xy, key, light)
        depth.path(xy, key + 0.5, { width: hair, alpha: 0.5 * rim, closed: true, join: 'miter' })
        // Each finished course, a line round the wall, there once the top has risen past it.
        for (let k = 1; k < courses; k++) {
          const y = BASE + k * h
          const shows = clamp((top - y) / (h * 0.45))
          if (shows <= 0) continue
          project(x0, y, z0, a)
          project(x1, y, z1, b)
          depth.path([a.x, a.y, b.x, b.y], key + 0.6, { width: hair, alpha: (small ? 0.22 : 0.3) * shows })
        }
      }
      const square = (half: number, inward: boolean, key: number) => {
        const s = inward ? -1 : 1
        wall(-half, -half, half, -half, 0, -s, key)
        wall(half, -half, half, half, s, 0, key)
        wall(half, half, -half, half, 0, s, key)
        wall(-half, half, -half, -half, -s, 0, key)
      }
      square(IN, true, -60)
      square(OUT, false, -40)
      // The top: one ring, the outer square round and back through the well, so no seam crosses it.
      const ring: [number, number][] = [
        [-OUT, -OUT], [OUT, -OUT], [OUT, OUT], [-OUT, OUT], [-OUT, -OUT],
        [-IN, -IN], [-IN, IN], [IN, IN], [IN, -IN], [-IN, -IN],
      ]
      xy.length = 0
      for (const [x, z] of ring) {
        project(x, top, z, a)
        xy.push(a.x, a.y)
      }
      // A little under full light, so the toolpaths on it read in both schemes; the plate's own light as it
      // comes down to meet it, so the last course sinks into the plate instead of blinking off it.
      depth.face(xy, -30, shade(0, 1, 0) * mix(1, 0.8, clamp(tall / 4)))
      for (const half of [OUT, IN]) {
        xy.length = 0
        for (const [x, z] of [[-half, -half], [half, -half], [half, half], [-half, half]] as const) {
          project(x, top, z, a)
          xy.push(a.x, a.y)
        }
        depth.path(xy, -29, { width: half === OUT ? line : hair, alpha: (half === OUT ? 0.85 : 0.6) * rim, closed: true, join: 'miter' })
      }
    }

    // The toolpaths on the top: the course being laid, and the one before it, fading as the new one crosses it.
    const y = top + 0.05
    const lay = (path: (typeof paths)[number], upTo: number, alpha: number, width: number) => {
      if (alpha <= 0.004) return
      run.length = 0
      const flush = () => {
        if (run.length >= 4) depth.path(run, -20, { width, alpha, join: 'miter', cap: 'round', tone: blend('ink', 'c1', 0.55) })
        run.length = 0
      }
      for (const s of path.segs) {
        if (s.from >= upTo) break
        if (!s.lay) {
          flush()
          continue
        }
        const u = clamp((upTo - s.from) / s.len)
        if (!run.length) {
          project(s.ax, y, s.az, a)
          run.push(a.x, a.y)
        }
        project(mix(s.ax, s.bx, u), y, mix(s.az, s.bz, u), a)
        run.push(a.x, a.y)
      }
      flush()
    }
    const building = t > BUILD[0] && t < BUILD[1]
    const current = paths[course % 2]!
    const sAt = within * current.total
    const trace = hair * (small ? 1.1 : 1.15)
    if (building) {
      lay(current, sAt, 0.55, trace)
      if (course > 0) lay(paths[(course - 1) % 2]!, Infinity, 0.55 * (1 - view.ease.standard(clamp(within / 0.3))), trace)
    } else if (t >= BUILD[1]) lay(current, Infinity, 0.55 * (1 - view.ease.standard(span(t, CLEAR[0] - 0.02, CLEAR[0] + 0.05))), trace)

    // The nozzle: on the path while it lays, hopping over its travels; it lifts clear when the part is done,
    // rides down with the part as it's taken back, and settles on the start corner to begin again.
    let nx = -(OUT - 1)
    let nz = -(OUT - 1)
    let hop = 0
    if (building) {
      const seg = current.segs.find((s) => sAt < s.from + s.len) ?? current.segs[current.segs.length - 1]!
      const u = clamp((sAt - seg.from) / seg.len)
      nx = mix(seg.ax, seg.bx, u)
      nz = mix(seg.az, seg.bz, u)
      if (!seg.lay) hop = 1.6 * hump(u)
      // The hot bead: the last stretch the nozzle laid, bright, behind it.
      const hot = 9
      run.length = 0
      for (const s of current.segs) {
        if (s.from >= sAt) break
        if (s.from + s.len <= sAt - hot || !s.lay) continue
        const u0 = clamp((sAt - hot - s.from) / s.len)
        const u1 = clamp((sAt - s.from) / s.len)
        if (!run.length) {
          project(mix(s.ax, s.bx, u0), y, mix(s.az, s.bz, u0), a)
          run.push(a.x, a.y)
        }
        project(mix(s.ax, s.bx, u1), y, mix(s.az, s.bz, u1), a)
        run.push(a.x, a.y)
      }
      if (run.length >= 4) depth.path(run, -19, { width: bead, alpha: 1, tone: 'accent', join: 'round', cap: 'round' })
    }
    const tw = t < 0.5 ? t + 1 : t
    const lift = PARK * (view.ease.standard(span(t, BUILD[1], BUILD[1] + 0.06)) - view.ease.standard(span(tw, 0.97, 1 + BUILD[0])))
    const ny = top + hop + lift
    project(nx, ny, nz, a)
    a.z = 50
    if (!small) {
      project(nx, ny + 9, nz, b)
      b.z = 50
      depth.line(a, b, hair, 0.7)
      project(nx - 1.6, ny + 9, nz, P[8]!)
      project(nx + 1.6, ny + 9, nz, P[9]!)
      P[8]!.z = P[9]!.z = 50
      depth.line(P[8]!, P[9]!, line, 0.8)
    }
    depth.square(a, clamp(view.size * 0.03, 2.2, 5.5) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Alternating hatch courses deposit a ring with an open central well. */
export function LoaderInfill(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
