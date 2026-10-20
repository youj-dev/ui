'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, face, grids, hairline, lod, near, surface, type V3 } from './sphere'

export const meta = {
  id: 'pith', title: 'Pith', category: 'orbs', technique: 'planes',
  tags: ['sphere', 'shells', 'cutaway', 'peel', 'interior', 'hinge'],
  description: 'Nested spherical shells swing open in staggered pairs on hinges at their backs, like a case opening, to expose a small turning inner orb. Lit inner walls and half-ring cut rims show the thickness of each layer before the halves close from the inside outward.',
  order: 10,
  colors: [{ part: 'Rims', mono: 'ink' }],
} satisfies LoaderMeta

/* Three shells, each split into two halves at the plane x = 0, each half
 * hinged on a vertical pin at the back of its own shell. A half turns about
 * that pin, so the cut rim, a half annulus showing the wall's thickness,
 * swings round to face the viewer and the lit inner skin comes into view.
 * The outer shell opens first (`emphasized`), the inner ones a beat later,
 * and they close from the inside out. While open the halves breathe a few
 * degrees, and the core turns its belt, so nothing parks. A closed shell
 * seals in everything inside it, so nothing within it is drawn until it
 * opens, and the inner shells, mostly hidden, are meshed coarser.
 *
 * Color: each shell’s cut rim warms to `c1` as the shell opens, and is an ink seam again once it shuts; the inner orb’s edge stays the accent. */

/** Each shell's radius, and its mesh per level of detail. */
const SHELLS = [
  { R: 26, cols: [12, 16, 18], rows: [3, 3, 3] },
  { R: 19.5, cols: [10, 12, 14], rows: [2, 3, 3] },
  { R: 13, cols: [8, 10, 10], rows: [2, 2, 2] },
]
const THICK = 1.6
const OPEN = 1e-4
const world = Array.from({ length: 4 * 19 }, (): V3 => [0, 0, 0])
const rimOuter = Array.from({ length: 3 }, (): V3 => [0, 0, 0])
const rimInner = Array.from({ length: 3 }, (): V3 => [0, 0, 0])
const depth = new Depth()
const p = point()
const knuckle = point()
const corners: V3[] = []
const rim: V3[] = []
const tmp: V3 = [0, 0, 0]
const edge: number[] = []
const opens = [0, 0, 0]
const grown = Array.from({ length: 4 }, (): V3 => [0, 0, 0])

/**
 * A facet grown by `by` units about its centre, so neighbouring facets of an
 * outer skin overlap a hair: no antialiased seam lets what's sealed inside
 * show through, whether or not it's drawn.
 */
function grow(quad: readonly V3[], by: number) {
  let cx = 0
  let cy = 0
  let cz = 0
  for (const v of quad) {
    cx += v[0] / quad.length
    cy += v[1] / quad.length
    cz += v[2] / quad.length
  }
  quad.forEach((v, i) => {
    const dx = v[0] - cx
    const dy = v[1] - cy
    const dz = v[2] - cz
    const k = 1 + by / (Math.hypot(dx, dy, dz) || 1)
    const g = grown[i]!
    g[0] = cx + dx * k
    g[1] = cy + dy * k
    g[2] = cz + dz * k
  })
  return grown
}

export const scene: Scene = {
  beats: 6, still: 0.4,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const hair = hairline(view)
    const pose = { yaw: -0.22 + 0.12 * Math.sin(TAU * t), pitch: -0.3 - 0.08 * Math.cos(TAU * t) }
    const project = camera({ ...pose, distance: 400, cx: view.w / 2, cy: view.h / 2 + 1 })
    const turn = orient(pose)
    for (let shell = 0; shell < SHELLS.length; shell++) {
      const lag = shell * 0.07
      opens[shell] = view.ease.emphasized(span(t, 0.03 + lag, 0.3 + lag)) - view.ease.emphasized(span(t, 0.72 - lag, 0.95 - lag))
    }
    /** Whether anything at this depth of nesting can be seen: every shell round it has parted. */
    const seen = (shell: number) => {
      for (let k = 0; k < shell; k++) if (opens[k]! <= OPEN) return false
      return true
    }

    // The core: a small lit orb, its accent belt turning.
    if (seen(SHELLS.length)) {
      const core = grids[0]!
      core.unit.forEach((v, i) => {
        const w = core.world[i]!
        w[0] = 6.5 * v[0]
        w[1] = 6.5 * v[1]
        w[2] = 6.5 * v[2]
      })
      surface(depth, project, turn, core)
      if (!small) {
        const steps = circles[0]!.length - 1
        const tilt = 0.45
        for (let i0 = 0; i0 < steps; i0 += 6) {
          edge.length = 0
          let z = 0
          for (let i = i0; i <= i0 + 6; i++) {
            const a = (TAU * i) / steps + TAU * t
            project(6.7 * Math.cos(a), 6.7 * Math.sin(a) * Math.sin(tilt), 6.7 * Math.sin(a) * Math.cos(tilt), p)
            edge.push(p.x, p.y)
            z += p.z / 7
          }
          depth.path(edge, z + 0.05, { width: hair * 0.9, alpha: 0.7 * near(z), tone: 'accent', join: 'round' })
        }
      }
    }

    SHELLS.forEach(({ R, cols: colsBy, rows: rowsBy }, shell) => {
      if (!seen(shell)) return
      const cols = colsBy[level]!
      const rows = rowsBy[level]!
      const open = opens[shell]!
      const apart = open > OPEN
      const angle = open * (0.78 - shell * 0.1 + 0.05 * Math.sin(TAU * t * 2 + shell))
      // While the halves are nearly shut, their outer skin sorts above everything sealed inside (an outer shell above an inner one), so nothing leaks through it.
      const seal = 40 * (SHELLS.length - shell) * (1 - span(open, 0, 0.35))
      for (const side of [-1, 1]) {
        // About the pin at the back of this shell: (0, y, −R).
        const cs = Math.cos(side * angle)
        const sn = Math.sin(side * angle)
        const hinge = (x: number, y: number, z: number, out: V3) => {
          out[0] = x * cs + (z + R) * sn
          out[1] = y
          out[2] = -x * sn + (z + R) * cs - R
          return out
        }
        // The outer skin always; the inner skin only once the halves part (closed, it's sealed inside).
        for (let skin = 0; skin < (apart ? 2 : 1); skin++) {
          const radius = R - skin * THICK
          for (let j = 0; j <= rows; j++) {
            for (let i = 0; i <= cols; i++) {
              const lat = (Math.PI / 2) * (j / rows)
              const lon = (TAU * i) / cols
              hinge(side * radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon), radius * Math.cos(lat) * Math.sin(lon), world[j * (cols + 1) + i]!)
            }
          }
          for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
              const a = j * (cols + 1) + i
              const reverse = (side < 0) !== (skin === 1)
              corners.length = 0
              if (reverse) corners.push(world[a + 1]!, world[a]!, world[a + cols + 1]!, world[a + cols + 2]!)
              else corners.push(world[a]!, world[a + 1]!, world[a + cols + 2]!, world[a + cols + 1]!)
              if (skin === 0) face(depth, project, turn, grow(corners, 0.45 / view.px), 0, 'ink', 0, false, seal)
              else face(depth, project, turn, corners)
            }
          }
        }
        // The cut rim at the plane of the split, once the halves part: the wall's thickness, flat, lit by its own normal, two steps a piece.
        for (let i = 0; apart && i < cols; i += 2) {
          const steps = Math.min(2, cols - i)
          rim.length = 0
          for (let k = 0; k <= steps; k++) {
            const u = (TAU * (i + k)) / cols
            rim.push(hinge(0, R * Math.cos(u), R * Math.sin(u), rimOuter[k]!))
          }
          for (let k = steps; k >= 0; k--) {
            const u = (TAU * (i + k)) / cols
            rim.push(hinge(0, (R - THICK) * Math.cos(u), (R - THICK) * Math.sin(u), rimInner[k]!))
          }
          if (side < 0) rim.reverse()
          face(depth, project, turn, rim)
        }
        // The rim's edge, always (closed, it's the seam between the halves), in short runs that each sort at their own depth.
        for (let i0 = 0; i0 < cols; i0 += 4) {
          edge.length = 0
          let z = 0
          const i1 = Math.min(cols, i0 + 4)
          for (let i = i0; i <= i1; i++) {
            const a = (TAU * i) / cols
            project(...hinge(0, R * Math.cos(a), R * Math.sin(a), tmp), p)
            edge.push(p.x, p.y)
            z += p.z / (i1 - i0 + 1)
          }
          // A rim warms toward its color as its shell opens, and is the ink seam again once it's shut.
          depth.path(edge, z + seal + 0.03, { width: hair * 0.85, alpha: near(z) * 0.9, join: 'round', tone: blend('ink', 'c1', 0.8 * span(open, 0.02, 0.3)) })
        }
      }
      // The hinge pin at the back of the shell, with its knuckles, while the halves are apart.
      if (!small && open > 0.02) {
        for (const [y0, y1] of [[-R * 0.42, -R * 0.18], [R * 0.18, R * 0.42]]) {
          project(0, y0!, -R - 0.6, p)
          project(0, y1!, -R - 0.6, knuckle)
          depth.line(p, knuckle, hair * 2.2, 0.85 * span(open, 0.02, 0.2))
        }
      }
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Nested hinged shells swing open in staggered pairs to expose a turning inner orb, then close. */
export function LoaderPith(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
