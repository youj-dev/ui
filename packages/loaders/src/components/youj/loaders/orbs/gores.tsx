'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { face, hairline, lod, near, type V3 } from './sphere'

export const meta = {
  id: 'gores', title: 'Gores', category: 'orbs', technique: 'planes',
  tags: ['cartography', 'globe', 'projection', 'unwrap', 'longitude'],
  description: 'Longitudinal shell gores peel from a globe into a flat interrupted map, each strip a beat behind its neighbour. The latitude rulings straighten, a map frame and equator register the sheet, and the seams close in reverse around the globe.',
  order: 1,
  colors: [{ part: 'Register', mono: 'ink' }],
} satisfies LoaderMeta

/* Each gore is a lens of the globe between two meridians, sampled across
 * and down, and each of its points moves between two places: on the sphere,
 * and on the flat map, where the gores stand side by side touching at the
 * equator, as a globe maker's printed sheet does (an interrupted
 * sinusoidal map, so a strip's width at a latitude is its width on the
 * sphere there). The strips peel one after another (`emphasized`), so a
 * wave runs round the globe; both faces of every strip are drawn, lit by
 * their own normals, so the inside of the shell turns into view without a
 * cut. The view sways a little throughout, and a frame with registration
 * marks and an equator line registers the sheet while it lies flat.
 *
 * Color: the flat sheet’s registration marks and equator are `c1`, showing while it lies flat; the gores stay the ink and the marker the accent. */

const R = 27
/** The flat map's scale against the globe: its width is the equator's length times this. */
const FLAT = 82 / (TAU * R)
const levels = [
  { count: 6, rows: 8, across: 3 },
  { count: 8, rows: 10, across: 3 },
  { count: 10, rows: 10, across: 3 },
].map((l) => ({ ...l, world: Array.from({ length: l.count * (l.rows + 1) * (l.across + 1) }, (): V3 => [0, 0, 0]) }))
const depth = new Depth()
const p = point()
const q = point()
const quad: V3[] = []
const tmp: V3 = [0, 0, 0]
const xy: number[] = []

export const scene: Scene = {
  beats: 5.5, still: 0.27,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const { count, rows, across, world } = levels[level]!
    const hair = hairline(view)
    const yaw = 0.16 * Math.sin(TAU * t) - 0.05
    const pitch = -0.14 - 0.05 * Math.cos(TAU * t)
    const pose = { yaw, pitch }
    const project = camera({ ...pose, distance: 420, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const cols = across + 1
    let mean = 0
    const opens: number[] = []
    for (let g = 0; g < count; g++) {
      const lag = (g / (count - 1)) * 0.13
      const open = view.ease.emphasized(span(t, 0.04 + lag, 0.37 + lag)) - view.ease.emphasized(span(t, 0.55 + lag * 0.6, 0.86 + lag * 0.6))
      opens.push(open)
      mean += open / count
      const centre = -Math.PI + (TAU * (g + 0.5)) / count
      const flatX = (g - (count - 1) / 2) * ((TAU * R * FLAT) / count)
      for (let j = 0; j <= rows; j++) {
        const lat = -Math.PI / 2 + (Math.PI * j) / rows
        for (let i = 0; i < cols; i++) {
          // Just inside the gore's two meridians, so neighbouring strips keep a hairline of air between them.
          const dl = (Math.PI / count) * ((2 * i) / across - 1) * 0.985
          const lon = centre + dl
          const v = world[(g * (rows + 1) + j) * cols + i]!
          v[0] = mix(R * Math.cos(lat) * Math.sin(lon), flatX + R * FLAT * dl * Math.cos(lat), open)
          v[1] = mix(R * Math.sin(lat), R * FLAT * lat * 1.08, open)
          v[2] = mix(R * Math.cos(lat) * Math.cos(lon), 0, open)
        }
      }
      // Both faces of the strip, each lit by its normal: the inside comes round without a switch.
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < across; i++) {
          const a = (g * (rows + 1) + j) * cols + i
          quad.length = 0
          quad.push(world[a]!, world[a + 1]!, world[a + cols + 1]!, world[a + cols]!)
          face(depth, project, turn, quad, 0, 'ink', 0, true)
        }
      }
      // The strip's two seams, in short runs that each sort at their own depth, and its latitude rulings, which straighten as it flattens.
      // Marks sort just above the strip they're printed on, even where strips lie in one plane.
      for (const i of [0, across]) {
        for (let j0 = 0; j0 < rows; j0 += 5) {
          xy.length = 0
          let z = 0
          const j1 = Math.min(rows, j0 + 5)
          for (let j = j0; j <= j1; j++) {
            project(...world[(g * (rows + 1) + j) * cols + i]!, p)
            xy.push(p.x, p.y)
            z += p.z / (j1 - j0 + 1)
          }
          depth.path(xy, z + 0.35, { width: hair * (small ? 1 : 0.9), alpha: near(z) * 0.95, join: 'round' })
        }
      }
      for (let j = 2; j < rows; j += 2) {
        const major = j * 2 === rows
        xy.length = 0
        let z = 0
        for (let i = 0; i <= across; i++) {
          project(...world[(g * (rows + 1) + j) * cols + i]!, p)
          xy.push(p.x, p.y)
          z += p.z / (across + 1)
        }
        depth.path(xy, z + 0.3, { width: hair * (major ? 0.85 : 0.6), alpha: (major ? 0.5 : 0.24) * near(z), join: 'round' })
      }
    }

    // A place marked on one strip: the accent square rides the surface from globe to sheet.
    {
      const g = Math.floor(count / 2)
      const open = opens[g]!
      const lat = 0.5
      const centre = -Math.PI + (TAU * (g + 0.5)) / count
      const flatX = (g - (count - 1) / 2) * ((TAU * R * FLAT) / count)
      tmp[0] = mix((R + 0.3) * Math.cos(lat) * Math.sin(centre), flatX, open)
      tmp[1] = mix((R + 0.3) * Math.sin(lat), R * FLAT * lat * 1.08, open)
      tmp[2] = mix((R + 0.3) * Math.cos(lat) * Math.cos(centre), 0.3, open)
      project(...tmp, p)
      p.z += 0.4
      depth.square(p, clamp(view.size * 0.028, 2.2, 5.5) / view.px, 1, 'accent')
    }

    // While the sheet lies flat: its frame's registration marks and the equator, dash-dot.
    const flat = span(mean, 0.55, 0.95)
    if (flat > 0 && !small) {
      const hw = (TAU * R * FLAT) / 2 + 2.5
      const hh = R * FLAT * (Math.PI / 2) * 1.08 + 2.5
      const arm = 4
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
        project(sx * hw, sy * hh, 0, p)
        project(sx * (hw - arm), sy * hh, 0, q)
        depth.line(p, q, hair, 0.6 * flat, 'c1')
        project(sx * hw, sy * (hh - arm), 0, q)
        depth.line(p, q, hair, 0.6 * flat, 'c1')
      }
      project(-hw + 1, 0, 0.2, p)
      project(hw - 1, 0, 0.2, q)
      depth.path([p.x, p.y, q.x, q.y], 40, { width: hair * 0.75, alpha: 0.5 * flat, dash: [5 * hair, 2 * hair, 1.4 * hair, 2 * hair], tone: 'c1' })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A globe's gores peel into a flat interrupted map and close again, one strip behind another. */
export function LoaderGores(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
