'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, brightness, pens, set, type V3 } from './matter'

export const meta = {
  id: 'lobule', title: 'Lobule', category: 'science', technique: 'planes',
  tags: ['orbital', 'p lobe', 's shell', 'electron density', 'nodal plane', '3d'],
  description: 'Two opposed p-orbital lobes open around a small nucleus and turn their nodal plane through depth. Lit shell strips show their volume, a spherical s-shell remains inside, and a short meridian carries the accent as the lobes breathe and reorient.',
  order: 5,
  colors: [{ part: 'S-shell', mono: 'ink' }],
} satisfies LoaderMeta

const LEVELS = [
  { rings: 5, sides: 8 }, { rings: 7, sides: 12 }, { rings: 11, sides: 20 },
].map(({ rings, sides }) => ({
  rings, sides,
  points: [0, 1].map(() => Array.from({ length: (rings + 1) * sides }, (): V3 => [0, 0, 0])),
}))
const depth = new Depth()
const p = point()
const q = point()
const nucleus: V3 = [0, 0, 0]
const xy: number[] = []
const shell: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 5,
  still: 0.28,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { rings, sides, points } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const { hair, line } = pens(view)
    // The axis swings over and back once a loop: quickest mid-swing, never parked.
    const tilt = 0.22 + 1.1 * (0.5 - 0.5 * Math.cos(TAU * t))
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const pose = { yaw: 0.45 + 0.3 * Math.sin(TAU * t), pitch: -0.22 }
    const project = camera({ ...pose, distance: 250, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const scale = 0.94 + 0.06 * Math.cos(TAU * t)
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1
      const grid = points[side]!
      for (let r = 0; r <= rings; r++) for (let j = 0; j < sides; j++) {
        const phi = r / rings * Math.PI / 2
        const a = j / sides * TAU
        // A p-density contour: radius is proportional to |cos(phi)|.
        const axial = sign * 31 * Math.cos(phi) ** 2 * scale
        const radius = 31 * Math.cos(phi) * Math.sin(phi) * scale
        const x = radius * Math.cos(a)
        set(grid[r * sides + j]!, x * ct + axial * st, axial * ct - x * st, radius * Math.sin(a))
      }
      for (let r = 0; r < rings; r++) for (let j = 0; j < sides; j++) {
        const next = (j + 1) % sides
        const a = grid[r * sides + j]!
        const b = grid[(r + 1) * sides + j]!
        const c = grid[(r + 1) * sides + next]!
        const d = grid[r * sides + next]!
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
        // At the two poles use the adjacent ring for a non-degenerate normal.
        const w = r === 0 ? c : d
        const wx = w[0] - a[0], wy = w[1] - a[1], wz = w[2] - a[2]
        const normal = turn((uz * wy - uy * wz) * sign, (ux * wz - uz * wx) * sign, (uy * wx - ux * wy) * sign)
        if (normal[2] <= 0.0001) continue
        xy.length = 0
        let z = 0
        for (const v of [a, b, c, d]) { project(...v, p); xy.push(p.x, p.y); z += p.z / 4 }
        // The two lobes are of opposite phase: the negative one a shade darker.
        depth.face(xy, z, lambert(...normal) * (0.82 + 0.18 * brightness(z)) * (side ? 1 : 0.8))
        // Sparse isodensity rulings are easier to read than every mesh edge.
        if (j % (small ? 4 : 3) === 0 || j === sides / 4) {
          project(...a, p); project(...b, q)
          // A small surface bias keeps the ruling above its own tessellated shell.
          p.z += 1.2
          q.z += 1.2
          const accent = side === 1 && j === sides / 4 && r >= 1 && r < rings - 2
          depth.line(p, q, accent ? line : hair * 0.75, (accent ? 0.95 : 0.62) * brightness(z), accent ? 'accent' : 'ink')
        }
        if (!small && r % 3 === 1) {
          project(...b, p); project(...c, q)
          depth.line(p, q, hair * 0.55, 0.24 * brightness(z))
        }
      }
    }
    // An s-shell as depth-separated circles; the solid lobes hide the rear arcs.
    for (let axis = 0; axis < (small ? 1 : 2); axis++) {
      for (let i = 0; i < 32; i++) {
        const at = (a: number, out: typeof p) => {
          set(shell, 9 * Math.cos(a), axis ? 9 * Math.sin(a) : 0, axis ? 0 : 9 * Math.sin(a))
          return project(...shell, out)
        }
        at(i / 32 * TAU, p); at((i + 1) / 32 * TAU, q)
        depth.line(p, q, hair * 0.65, 0.48 * brightness((p.z + q.z) / 2), 'c1')
      }
    }
    atom(depth, project, nucleus, Math.max(2.6, line), view)
    if (view.size >= 64) {
      // The nodal plane, a dashed ring through the waist, and the axis ruled out past both lobes.
      for (let i = 0; i < 40; i += 2) {
        const a = (i / 40) * TAU
        const b = ((i + 1) / 40) * TAU
        set(shell, 25 * Math.cos(a) * ct, -25 * Math.cos(a) * st, 25 * Math.sin(a))
        project(...shell, p)
        set(shell, 25 * Math.cos(b) * ct, -25 * Math.cos(b) * st, 25 * Math.sin(b))
        project(...shell, q)
        depth.line(p, q, hair * 0.85, 0.5 * brightness((p.z + q.z) / 2))
      }
      for (const sign of [-1, 1]) {
        set(shell, sign * 33 * st, sign * 33 * ct, 0)
        project(...shell, p)
        set(shell, sign * 43 * st, sign * 43 * ct, 0)
        project(...shell, q)
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.85, alpha: 0.45, dash: [4 * hair, 2 * hair, 1.4 * hair, 2 * hair] })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Lit p-orbital shells reveal their nodal plane around a spherical inner shell.
 *
 * Color: the spherical s-shell inside is `c1`, set apart from the ink p-lobes; the lobes’ meridian stays the accent. */
export function LoaderLobule(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
