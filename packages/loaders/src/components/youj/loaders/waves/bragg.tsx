'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, orient, point, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, box, brightness, detail, edge, hairline, packet, wire, wrap, type Turn, type V3 } from './propagation'

export const meta = {
  id: 'bragg',
  title: 'Bragg',
  category: 'waves',
  technique: 'lines',
  tags: ['crystal', 'diffraction', 'coherence', 'lattice-plane', 'reflection', '3d'],
  description: 'Three ruled crystal planes on a mount breathe apart under a collimated beam. Travelling fronts reflect at successive depths toward a detector; the outgoing strokes strengthen and its window lights when the interplane spacing restores their phase agreement, then soften as the crystal detunes.',
  order: 9,
  colors: [{ part: 'Reflection', mono: 'ink' }],
} satisfies LoaderMeta

/* A collimator on the left sends a parallel beam down onto three lattice
 * planes (ruled, with an atom at each crossing) standing on a mount; each
 * ray reflects from its own plane at the same glancing angle toward a
 * detector on the right, and a dashed goniometer arc joins the two. The
 * planes breathe apart and together once a loop (a plain cosine, so they
 * never park); the reflected rays and their travelling fronts brighten as
 * the spacing comes into phase agreement, and the detector's window takes
 * the accent with them. Fronts run in along each ray and out after it,
 * twice a loop, fading at both ends of their path.
 *
 * Color: an outgoing reflection warms toward `c1` as the planes come into agreement and fades back to the ink as they drift apart. */

const THETA = 0.66
const COS = Math.cos(THETA)
const SIN = Math.sin(THETA)
const REACH = 30
const HALF: V3 = [15, 0, 12]
const perimeter = Array.from({ length: 5 }, () => [0, 0, 0] as V3)
const RIM = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]] as const
const arc = Array.from({ length: 41 }, () => [0, 0, 0] as V3)
const p = point()
const depth = new Depth()

/**
 * A housing along a direction in the x–y plane, from `from` outward for
 * `len`, `w` across and `d` deep; its end toward the crystal carries a
 * window, lit in the accent by `window` (the detector's).
 */
function housing(project: Project, turn: Turn, from: V3, along: [number, number], len: number, w: number, d: number, hair: number, lod: number, window?: number) {
  const ax: V3 = [along[0], along[1], 0]
  const ay: V3 = [-along[1], along[0], 0]
  const az: V3 = [0, 0, 1]
  const center: V3 = [from[0] + (ax[0] * len) / 2, from[1] + (ax[1] * len) / 2, 0]
  box(depth, project, turn, center, ax, ay, az, [len / 2, w, d], hair * 0.8, { bevel: lod === 2 ? 0.7 : 0 })
  if (window === undefined) return
  // The detector's readout on its near face: a track, and the accent bar filling it with the agreement.
  const at = (s: number, out: V3) => {
    out[0] = from[0] + ax[0] * s
    out[1] = from[1] + ax[1] * s
    out[2] = d + 0.08
    return out
  }
  const a: V3 = [0, 0, 0]
  const b: V3 = [0, 0, 0]
  edge(depth, project, at(1.2, a), at(len - 1.2, b), hair * 0.8, 0.4)
  if (window > 0.01) edge(depth, project, at(1.2, a), at(1.2 + (len - 2.4) * window, b), hair * 2.2, 0.95, 'accent')
}

export const scene: Scene = {
  beats: 5,
  still: 0.4,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const hair = hairline(view)
    const yaw = -0.24 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.36
    const project = camera({ yaw, pitch, distance: 300, cx: view.w / 2, cy: 60 })
    const turn = orient({ yaw, pitch })
    const breath = 0.5 - 0.5 * Math.cos(TAU * u)
    const gap = 6.5 + 2 * breath
    const agreement = (1 + 2 * Math.cos((TAU * (gap - 8.5)) / 4.2)) ** 2 / 9
    const rays = lod === 0 ? 1 : lod === 1 ? 2 : 3
    const base = -gap - 1.4

    // The mount the crystal stands on, and the goniometer arc from collimator to detector.
    block(depth, project, turn, [0, base - 1.8, 0], [HALF[0] + 1.5, 1.8, HALF[2] + 1.5], hair * 0.8, 'ink', { bevel: lod === 2 ? 0.8 : 0 })
    // The crystal's own outline, standing on the mount and breathing with its planes.
    if (lod > 0) {
      const top = gap + 1.4
      for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) edge(depth, project, [x * HALF[0], base, z * HALF[2]], [x * HALF[0], top, z * HALF[2]], hair * 0.7, 0.32)
      for (let j = 0; j < 5; j++) {
        const v = perimeter[j]!
        v[0] = RIM[j]![0] * HALF[0]
        v[1] = top
        v[2] = RIM[j]![1] * HALF[2]
      }
      wire(depth, project, perimeter, hair * 0.7, 0.32, 'ink', 1)
    }
    if (lod > 0) {
      for (let i = 0; i <= 40; i++) {
        const a = Math.PI - THETA - 0.08 - ((Math.PI - 2 * THETA - 0.16) * i) / 40
        const v = arc[i]!
        v[0] = (REACH + 7) * Math.cos(a)
        v[1] = (REACH + 7) * Math.sin(a) - 2
        v[2] = -HALF[2] - 1
      }
      wire(depth, project, arc, hair * 0.7, 0.32, 'ink', 8, [2.4 * hair, 2 * hair])
    }

    for (let layer = 0; layer < 3; layer++) {
      const y = (layer - 1) * gap
      // The plane: its rim, its rulings, and (larger sizes) an atom at each crossing.
      for (let j = 0; j < 5; j++) {
        const v = perimeter[j]!
        v[0] = RIM[j]![0] * HALF[0]
        v[1] = y
        v[2] = RIM[j]![1] * HALF[2]
      }
      wire(depth, project, perimeter, hair, 0.75, 'ink', 1)
      const rulings = lod === 0 ? 2 : lod === 1 ? 3 : 4
      for (let j = 1; j <= rulings; j++) {
        const z = -HALF[2] + (2 * HALF[2] * j) / (rulings + 1)
        edge(depth, project, [-HALF[0], y, z], [HALF[0], y, z], hair * 0.7, 0.36)
        const x = -HALF[0] + (2 * HALF[0] * j) / (rulings + 1)
        edge(depth, project, [x, y, -HALF[2]], [x, y, HALF[2]], hair * 0.7, 0.36)
        if (lod > 0) {
          for (let k = 1; k <= rulings; k++) {
            project(-HALF[0] + (2 * HALF[0] * k) / (rulings + 1), y, z, p)
            p.z += 0.05
            depth.square(p, (lod === 2 ? 1.6 : 1.3) / view.px, 0.85 * brightness(p.z))
          }
        }
      }
      for (let ray = 0; ray < rays; ray++) {
        const z = rays === 1 ? 0 : -6 + (12 * ray) / (rays - 1)
        // A parallel beam: each ray meets its own plane under the same point, at the same glancing angle.
        const inFrom: V3 = [-REACH * COS, y + REACH * SIN, z]
        const outTo: V3 = [REACH * COS, y + REACH * SIN, z]
        edge(depth, project, inFrom, [0, y, z], hair * 0.85, 0.42)
        edge(depth, project, [0, y, z], outTo, hair * 0.85, 0.14 + 0.5 * agreement, blend('ink', 'c1', agreement))
        // Fronts: in along the ray, then out after reflection, faded at both ends of the path.
        for (let pulse = 0; pulse < 2; pulse++) {
          const phase = wrap(2 * u + pulse * 0.5 - layer * 0.06)
          const fade = packet(phase - 0.5, 0.5)
          const before = phase < 0.5
          const s = before ? 1 - phase * 2 : (phase - 0.5) * 2
          const cx = before ? -REACH * COS * s : REACH * COS * s
          const cy = y + REACH * SIN * s
          // The front's stroke lies across the ray.
          const nx = before ? SIN : -SIN
          const ny = COS
          const alpha = before ? 0.95 : 0.25 + 0.75 * agreement
          edge(depth, project, [cx - nx * 2.4, cy - ny * 2.4, z], [cx + nx * 2.4, cy + ny * 2.4, z], hair * 1.3, fade * alpha)
        }
      }
    }
    // The collimator the beam leaves and the detector it reaches, its window lit with the agreement.
    const mid = REACH + 1
    housing(project, turn, [-mid * COS, mid * SIN, 0], [-COS, SIN], 9, gap * COS + 2.4, 8.5, hair, lod)
    housing(project, turn, [mid * COS, mid * SIN, 0], [COS, SIN], 7, gap * COS + 2.4, 8.5, hair, lod, agreement)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A layered crystal exchanges phase agreement as beam fronts reflect through its depth. */
export function LoaderBragg(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
