'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, face, hairline, lod, ring, type V3 } from './sphere'

export const meta = {
  id: 'brim', title: 'Brim', category: 'orbs', technique: 'mixed',
  tags: ['orb', 'gauge', 'fill', 'progress', 'liquid'],
  description: 'A glass sphere fills in three measured pours from a nozzle above its neck, each stream landing in ripples and a settling slosh. A level witness rides the meniscus up its scale, each calibration stroke lights as it is reached, and a valve below drains it back down.',
  order: 7,
  colors: [{ part: 'Liquid', mono: 'ink' }],
} satisfies LoaderMeta

/* A spherical gauge in glass: a neck at the top under a filling nozzle, a
 * drain valve at the bottom, a printed scale on the front. The liquid is the
 * part of the sphere under its meniscus plane, built in that plane's own
 * frame, so when the surface sloshes (the plane tips a few degrees after
 * every disturbance and settles) the lit liquid and its rim follow exactly.
 * Three pours lift the level stroke by stroke (`standard`, rising as each
 * stream flows and settling after it), the strokes they reach light up, and
 * the valve turns open and drains the level back down (`standard`, slowing
 * as the head falls). Nothing parks: the slosh, ripples and a slow sway of
 * the view carry the moments between pours.
 *
 * Color: the liquid is `c1`: the pouring streams, the drain and its last drop, and the meniscus; each calibration stroke warms to it as the level reaches it. The witness stays the accent. */

const R = 27
const D = 340
const NECK = 5
const NECK_Y = Math.sqrt(R * R - NECK * NECK)
const LIP = NECK_Y + 5
const SCALE = 1.08
/** The level after each pour, from the start. */
const LEVELS = [-23, -9.5, 4.5, 18.5]
/** The pours: when each stream runs. The level follows its stream a moment behind. */
const POURS: [number, number][] = [[0, 0.15], [0.21, 0.36], [0.42, 0.57]]
const DRAIN: [number, number] = [0.66, 0.955]

const rowsBy = [5, 7, 10]
const colsBy = [16, 20, 28]
const grid = Array.from({ length: (10 + 1) * (28 + 1) }, (): V3 => [0, 0, 0])
const quad: V3[] = []
const depth = new Depth()
const p = point()
const q = point()
const n: V3 = [0, 1, 0]
const e1: V3 = [1, 0, 0]
const e2: V3 = [0, 0, 1]
const c: V3 = [0, 0, 0]
const tmp: V3 = [0, 0, 0]
const rim: number[] = []

/** A decaying slosh after a disturbance at `at`: a few swings, dying to exactly nothing `life` later. */
const slosh = (t: number, at: number, life = 0.22) => {
  const u = t - at
  return u <= 0 || u >= life ? 0 : Math.sin(TAU * 2.5 * (u / life)) * (1 - u / life) ** 2
}

/** The level at t: three pours up, then the drain down. */
function level(t: number, view: View) {
  let h = LEVELS[0]!
  POURS.forEach(([a, b], i) => (h += (LEVELS[i + 1]! - LEVELS[i]!) * view.ease.standard(span(t, a + 0.025, b + 0.05))))
  return h - (LEVELS[3]! - LEVELS[0]!) * view.ease.standard(span(t, DRAIN[0] + 0.01, DRAIN[1]))
}

/** A stream between two heights on a vertical line, its head falling in at `on` and its tail following at `off`. */
function stream(t: number, top: number, bottom: number, on: number, off: number, view: View): [number, number] | null {
  const head = mix(top, bottom, view.ease.exit(span(t, on, on + 0.035)))
  const tail = mix(top, bottom, view.ease.exit(span(t, off, off + 0.035)))
  return head < tail - 0.05 ? [tail, head] : null
}

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    t %= 1
    const level0 = lod(view)
    const small = level0 === 0
    const hair = hairline(view)
    const circle = circles[level0]!
    const yaw = 0.2 + 0.1 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.3 }
    const cy = 47
    const project = camera({ ...pose, distance: D, cx: view.w / 2, cy })
    const turn = orient(pose)

    // The meniscus plane: its height, and its tip from every pour's impact and the drain's pull.
    const h = level(t, view)
    let tx = 0
    let tz = 0
    POURS.forEach(([a], i) => {
      tx += 0.065 * slosh(t, a + 0.03) * (i % 2 ? -1 : 1)
      tz += 0.05 * slosh(t, a + 0.06)
    })
    tx += 0.05 * slosh(t, DRAIN[0] + 0.02, 0.26)
    // A liquid surface is never quite still: a small idle sway, whole cycles a loop.
    tx += 0.014 * Math.sin(TAU * 2 * t)
    tz += 0.011 * Math.cos(TAU * 3 * t)
    const len = Math.hypot(tz, 1, tx)
    n[0] = tz / len
    n[1] = 1 / len
    n[2] = tx / len
    // A frame in the plane, handed like the sphere's grid (e1 × e2 = −n), so faces wind outward.
    const ex = n[1]
    const ey = -n[0]
    const el = Math.hypot(ex, ey)
    e1[0] = ex / el
    e1[1] = ey / el
    e1[2] = 0
    e2[0] = e1[1] * n[2] - e1[2] * n[1]
    e2[1] = e1[2] * n[0] - e1[0] * n[2]
    e2[2] = e1[0] * n[1] - e1[1] * n[0]
    c[0] = h * n[0]
    c[1] = h * n[1]
    c[2] = h * n[2]
    const r = Math.sqrt(Math.max(0, R * R - h * h))
    const top = Math.acos(clamp(-h / R, -1, 1))

    // The liquid: the sphere below the meniscus, rows up from the low pole of the plane's own axis.
    const rows = rowsBy[level0]!
    const cols = colsBy[level0]!
    for (let j = 0; j <= rows; j++) {
      const phi = (top * j) / rows
      const cp = Math.cos(phi)
      const sp = Math.sin(phi)
      for (let i = 0; i <= cols; i++) {
        const a = (TAU * i) / cols
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const v = grid[j * (cols + 1) + i]!
        for (let k = 0; k < 3; k++) v[k] = R * (-n[k]! * cp + sp * (ca * e1[k]! + sa * e2[k]!))
      }
    }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i
        quad.length = 0
        quad.push(grid[a]!, grid[a + cols + 1]!, grid[a + cols + 2]!, grid[a + 1]!)
        face(depth, project, turn, quad)
      }
    }

    // The meniscus: a lit face on the tipped plane, its rim where it wets the glass.
    rim.length = 0
    let zMid = 0
    const samples = circle.length - 1
    for (let i = 0; i < samples; i++) {
      const [ca, sa] = circle[i]!
      for (let k = 0; k < 3; k++) tmp[k] = c[k]! + r * (ca * e1[k]! + sa * e2[k]!)
      project(tmp[0], tmp[1], tmp[2], p)
      rim.push(p.x, p.y)
      zMid += p.z / samples
    }
    const surface = zMid + 0.04
    depth.face(rim, surface, lambert(...turn(n[0], n[1], n[2])))
    depth.path(rim, surface + 0.01, { width: hair * 0.95, alpha: 0.75, closed: true, join: 'round', tone: 'c1' })

    // Where a stream lands, rings run out across the surface and fade.
    if (!small) {
      const iy = h / n[1]
      for (const [a] of POURS) {
        for (const lag of [0.03, 0.075]) {
          const u = span(t, a + lag, a + lag + 0.13)
          if (u <= 0 || u >= 1) continue
          const rho = mix(1.2, r * 0.82, view.ease.enter(u))
          ring(depth, project, circle, (ca, sa, out) => {
            out[0] = rho * (ca * e1[0] + sa * e2[0])
            out[1] = iy + rho * (ca * e1[1] + sa * e2[1])
            out[2] = rho * (ca * e1[2] + sa * e2[2])
          }, hair * 0.7, 0.5 * (1 - u) * Math.min(1, u * 6))
        }
      }
    }

    // The glass: its exact outline in front of everything inside it, a faint inner edge, a highlight.
    const rl = (R * D) / Math.sqrt(D * D - R * R)
    const outline: number[] = []
    for (let i = 0; i < samples; i++) outline.push(view.w / 2 + rl * circle[i]![0], cy - rl * circle[i]![1])
    depth.path(outline, R + 1, { width: hair * (small ? 1.15 : 1), alpha: 0.82, closed: true, join: 'round' })
    if (!small) {
      outline.length = 0
      for (let i = 0; i < samples; i++) outline.push(view.w / 2 + rl * 0.955 * circle[i]![0], cy - rl * 0.955 * circle[i]![1])
      depth.path(outline, R + 1, { width: hair * 0.7, alpha: 0.16, closed: true, join: 'round' })
    }
    const glare: number[] = []
    for (let i = 0; i <= 8; i++) {
      const a = mix(3.6, 4.1, i / 8) + 0.6 * (yaw - 0.2)
      glare.push(view.w / 2 + rl * 0.85 * Math.cos(a), cy + rl * 0.85 * Math.sin(a))
    }
    depth.path(glare, R + 2, { width: hair * (small ? 1.2 : 1.9), alpha: 0.42, cap: 'round', join: 'round' })

    // The neck: its lip and its root on the sphere, and its two silhouette lines.
    const A = turn(1, 0, 0)[2]
    const B = turn(0, 0, 1)[2]
    const side = Math.atan2(-A, B)
    for (const s of [0, Math.PI]) {
      const a = side + s
      project(NECK * Math.cos(a), NECK_Y, NECK * Math.sin(a), p)
      project(NECK * Math.cos(a), LIP, NECK * Math.sin(a), q)
      depth.line(p, q, hair, 0.72)
    }
    ring(depth, project, circle, (ca, sa, out) => {
      out[0] = (NECK + 0.7) * ca
      out[1] = LIP
      out[2] = (NECK + 0.7) * sa
    }, hair, 0.95)
    if (!small) ring(depth, project, circle, (ca, sa, out) => {
      out[0] = NECK * ca
      out[1] = NECK_Y
      out[2] = NECK * sa
    }, hair * 0.8, 0.7)

    // The nozzle that fills it, and the drain below: a short tube and a valve that turns open.
    if (!small) {
      // The filling tube comes down from above and tapers to its tip inside the neck's mouth.
      for (const x of [-1.6, 1.6]) {
        project(x, LIP + 13, 0, p)
        project(x, LIP + 6.5, 0, q)
        depth.line(p, q, hair * 0.9, 0.8)
        project(x * 0.45, LIP + 2.5, 0, p)
        depth.line(q, p, hair * 0.9, 0.8)
      }
      ring(depth, project, circle, (ca, sa, out) => {
        out[0] = 2.3 * ca
        out[1] = LIP + 8
        out[2] = 2.3 * sa
      }, hair * 1.1, 0.9)
    }
    // The drain: a short pipe out of the bottom, a valve body on it, its handle across the pipe when shut and along it when open.
    const valve = view.ease.standard(span(t, DRAIN[0] - 0.05, DRAIN[0] + 0.01)) * (1 - view.ease.standard(span(t, DRAIN[1] - 0.03, DRAIN[1] + 0.02)))
    for (const x of [-1.7, 1.7]) {
      project(x, -R + 0.25, 0, p)
      project(x, -R - 6.5, 0, q)
      depth.line(p, q, hair, 0.82)
    }
    ring(depth, project, circle, (ca, sa, out) => {
      out[0] = 1.7 * ca
      out[1] = -R - 6.5
      out[2] = 1.7 * sa
    }, hair, 0.85)
    if (!small) {
      ring(depth, project, circle, (ca, sa, out) => {
        out[0] = 2.9 * ca
        out[1] = -R - 3.2
        out[2] = 2.9 * sa
      }, hair * 1.1, 0.85)
      const a = mix(0, Math.PI / 2, valve)
      project(0, -R - 3.2, 3.1, p)
      project(5.4 * Math.cos(a), -R - 3.2 + 5.4 * Math.sin(a), 3.1, q)
      depth.line(p, q, hair * 1.7, 0.92)
      p.z += 0.01
      depth.dot(p, 1.1 / view.px, 0.95)
    }

    // The streams: the pour from the nozzle to the surface, and the drain from the valve.
    if (!small) {
      const wob = (y: number) => 0.07 * Math.sin(y * 0.8 + TAU * 4 * t)
      for (const [a, b] of POURS) {
        const s = stream(t, LIP + 2.5, h / n[1], a, b, view)
        if (!s) continue
        const xy: number[] = []
        for (let i = 0; i <= 8; i++) {
          const y = mix(s[0], s[1], i / 8)
          project(wob(y), y, 0, p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, surface + 0.08, { width: hair * 1.7, alpha: 0.85, cap: 'round', join: 'round', tone: 'c1' })
      }
      const s = stream(t, -R - 6.5, -R - 16, DRAIN[0] + 0.01, DRAIN[1] - 0.04, view)
      if (s) {
        const xy: number[] = []
        for (let i = 0; i <= 6; i++) {
          const y = mix(s[0], s[1], i / 6)
          project(wob(y) * 0.6, y, 0, p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, R + 1, { width: hair * 1.4, alpha: 0.8, cap: 'round', join: 'round', tone: 'c1' })
      }
      // The last drop leaves the shut valve and falls away before the next pour.
      const fall = span(t, DRAIN[1] + 0.005, 1)
      if (fall > 0) {
        project(0, mix(-R - 7.2, -R - 17, view.ease.exit(fall)), 0, p)
        p.z = R + 1
        depth.dot(p, 0.75 / view.px + 0.35, 0.85 * (1 - span(fall, 0.7, 1)), 'c1')
      }
    }

    // The printed scale on the front of the glass: a spine, a stroke at each pour's level that lights as it's reached.
    const onScale = (y: number, dl: number, out: typeof p, lift = 0.25) => {
      const lat = Math.asin(clamp(y / R, -1, 1))
      const lon = SCALE + dl
      return project((R + lift) * Math.cos(lat) * Math.cos(lon), (R + lift) * Math.sin(lat), (R + lift) * Math.cos(lat) * Math.sin(lon), out)
    }
    if (!small) {
      const spine: number[] = []
      let zs = 0
      for (let i = 0; i <= 12; i++) {
        onScale(mix(LEVELS[0]!, LEVELS[3]!, i / 12), 0.17, p)
        spine.push(p.x, p.y)
        zs += p.z / 13
      }
      depth.path(spine, zs + 0.3, { width: hair * 0.7, alpha: 0.4, join: 'round' })
    }
    LEVELS.forEach((y, i) => {
      if (i === 0) return
      const reached = view.ease.standard(span(h, y - 2.5, y - 0.3))
      onScale(y, 0.17, p)
      onScale(y, small ? -0.02 : 0.02, q)
      depth.line(p, q, hair * (small ? 1 : 1.1), 0.3 + 0.6 * reached, blend('ink', 'c1', reached))
    })
    if (level0 === 2) {
      for (let i = 0; i < 3; i++) {
        const y = (LEVELS[i]! + LEVELS[i + 1]!) / 2
        onScale(y, 0.17, p)
        onScale(y, 0.09, q)
        depth.line(p, q, hair * 0.7, 0.32)
      }
    }

    // The level witness: an accent arc along the meniscus rim where it crosses the scale, and its pointer.
    const dx = Math.cos(SCALE)
    const dz = Math.sin(SCALE)
    const a0 = Math.atan2(dx * e2[0] + dz * e2[2], dx * e1[0] + dz * e1[2])
    const arc: number[] = []
    let za = 0
    for (let i = 0; i <= 6; i++) {
      const a = a0 - 0.26 + (0.52 * i) / 6
      for (let k = 0; k < 3; k++) tmp[k] = c[k]! + (r + 0.35) * (Math.cos(a) * e1[k]! + Math.sin(a) * e2[k]!)
      project(tmp[0], tmp[1], tmp[2], p)
      arc.push(p.x, p.y)
      za += p.z / 7
    }
    depth.path(arc, Math.max(za, surface) + 0.5, { width: hair * (small ? 1.6 : 1.7), alpha: 1, tone: 'accent', cap: 'round', join: 'round' })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A glass sphere fills in three measured pours and drains, a witness riding its level up the scale. */
export function LoaderBrim(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
