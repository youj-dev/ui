'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, TAU, camera, clamp, hump, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'ravel', title: 'Ravel', category: 'geometry', technique: 'lines',
  tags: ['braid', 'cord', 'textile', 'interlace', 'depth', 'plait'],
  description: 'Three cords exchange places in a travelling plait. Each crossing passes at its own depth, the strands open and tighten together, and a short accent filament rides one cord through the over-and-under structure.',
  order: 28,
  colors: [{ part: 'Cord', mono: 'ink' }],
} satisfies LoaderMeta

/* Three cords plaited, drawn as a knotwork draughtsman draws rope: each
 * cord a band with its two edges in ink and its body solid, so where one
 * crosses over another it simply hides it, and the over-and-under reads at
 * every size. The plait travels down the cords (a whole period a loop, so
 * the loop has no seam) and breathes, opening and tightening together. Both
 * ends are whipped: a lit binding wrapped round the three cords. A short
 * accent filament rides the middle of one cord, drawn to the exact point
 * at both its ends, going under and over with it.
 *
 * Color: one of the three cords is `c1`, so its path through the
 * plait can be followed; the travelling filament stays the accent. */

const TOP = 40
const DROP = 80

const depth = new Depth()
const a = point()
const b = point()
const xy: number[] = []
/** One cord's centreline on screen: x, y, depth and perspective scale per sample, reused each frame. */
const cx: number[] = []
const cy: number[] = []
const cz: number[] = []
const ck: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.28,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const steps = small ? 26 : view.size < 80 ? 40 : 48
    const hair = (small ? 1.1 : 1) / view.px
    const edge = (small ? 1.15 : fine ? 1.2 : 1.1) / view.px
    const half = small ? 3.2 : 2.5
    // The cord runs on the diagonal, so the plait has the whole frame's length to travel in.
    const project = camera({ yaw: 0.08, pitch: -0.12, roll: -0.62, distance: 260, cx: 50, cy: 50 })
    const spread = 11 + 3 * view.ease.standard(hump(t))
    const turns = small ? 1 : 1.5
    // A three-strand plait, not a helix: depth swings at twice the lateral rate, which settles every crossing.
    // The cords gather into their whippings at both ends.
    const at = (u: number, strand: number, out: Projected) => {
      const phase = TAU * (turns * u - t + strand / 3)
      const taper = 0.28 + 0.72 * Math.sin(Math.PI * u) ** 0.7
      return project(spread * Math.sin(phase) * taper, TOP - DROP * u, 6 * Math.sin(2 * phase) * taper, out)
    }

    for (let strand = 0; strand < 3; strand++) {
      for (let j = 0; j <= steps; j++) {
        at(j / steps, strand, a)
        cx[j] = a.x
        cy[j] = a.y
        cz[j] = a.z
        ck[j] = a.k
      }
      // The middle cord is the plait's color, so the exchange can be followed.
      const cord: Tone = strand === 1 ? 'c1' : 'ink'
      // Each piece: the cord's solid body, then its two edges over it, at the piece's own depth.
      for (let j = 0; j < steps; j++) {
        const z = (cz[j]! + cz[j + 1]!) / 2
        const nx = (i: number) => {
          const i0 = Math.max(0, i - 1)
          const i1 = Math.min(steps, i + 1)
          const dx = cx[i1]! - cx[i0]!
          const dy = cy[i1]! - cy[i0]!
          const len = Math.hypot(dx, dy) || 1
          return [(-dy / len) * half * ck[i]!, (dx / len) * half * ck[i]!] as const
        }
        const [ax, ay] = nx(j)
        const [bx, by] = nx(j + 1)
        xy.length = 0
        xy.push(cx[j]! + ax, cy[j]! + ay, cx[j + 1]! + bx, cy[j + 1]! + by, cx[j + 1]! - bx, cy[j + 1]! - by, cx[j]! - ax, cy[j]! - ay)
        depth.poly(xy, z, 0.12, cord, true)
        // The edges ride over this cord's own neighbouring pieces too, so its body never nicks them where the pieces join.
        const zEdge = Math.max(cz[Math.max(0, j - 1)]!, cz[j]!, cz[j + 1]!, cz[Math.min(steps, j + 2)]!) + 0.01
        depth.path([cx[j]! + ax, cy[j]! + ay, cx[j + 1]! + bx, cy[j + 1]! + by], zEdge, { width: edge, alpha: 1, cap: 'round', tone: cord })
        depth.path([cx[j]! - ax, cy[j]! - ay, cx[j + 1]! - bx, cy[j + 1]! - by], zEdge, { width: edge, alpha: 1, cap: 'round', tone: cord })
        // The lay of the rope: a short twist mark across the body every few pieces, above 64px.
        if (fine && j % 3 === 1) {
          depth.path([cx[j]! + ax * 0.7, cy[j]! + ay * 0.7, cx[j + 1]! - bx * 0.7, cy[j + 1]! - by * 0.7], z + 0.005, { width: hair * 0.8, alpha: 0.35, cap: 'round' })
        }
      }
      // The accent filament on the first cord: from tail to head, ends drawn to the exact point.
      if (strand === 0) {
        const length = 0.1
        const head = ((t * 1) % 1) + 0.04
        for (let j = 0; j < steps; j++) {
          const u0 = j / steps
          const u1 = (j + 1) / steps
          const from = Math.max(u0, head - length)
          const to = Math.min(u1, head)
          if (to <= from || from >= 1) continue
          const s0 = (from - u0) / (u1 - u0)
          const s1 = (to - u0) / (u1 - u0)
          const fade = clamp((from - (head - length)) / (length * 0.4) + 0.25) * clamp((1 - to) / 0.05)
          depth.path(
            [cx[j]! + (cx[j + 1]! - cx[j]!) * s0, cy[j]! + (cy[j + 1]! - cy[j]!) * s0, cx[j]! + (cx[j + 1]! - cx[j]!) * s1, cy[j]! + (cy[j + 1]! - cy[j]!) * s1],
            (cz[j]! + cz[j + 1]!) / 2 + 0.02,
            { width: edge * 1.3, alpha: fade, tone: 'accent', cap: 'butt' },
          )
        }
      }
    }

    // The whippings: a lit binding wrapped round the three cords at each end, with its turns drawn on it.
    for (const y of [TOP + 1.2, TOP - DROP - 1.2]) {
      const w = 8
      const h = small ? 3.6 : 3
      const cornersY = [y - h / 2, y + h / 2]
      xy.length = 0
      for (const [x, yy] of [[-w, cornersY[0]!], [w, cornersY[0]!], [w, cornersY[1]!], [-w, cornersY[1]!]] as const) {
        project(x, yy, 6.5, a)
        xy.push(a.x, a.y)
      }
      depth.poly(xy, 100, 0.55, 'ink', true)
      depth.path(xy, 100.01, { width: edge, alpha: 1, closed: true, join: 'miter' })
      if (!small) {
        for (const f of [1 / 3, 2 / 3]) {
          project(-w, cornersY[0]! + h * f, 6.5, a)
          project(w, cornersY[0]! + h * f, 6.5, b)
          depth.path([a.x, a.y, b.x, b.y], 100.02, { width: hair, alpha: 0.5 })
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A travelling three-strand plait reveals every crossing in depth. */
export function LoaderRavel(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
