'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, point, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, brightness, cylinder, detail, edge, hairline, ruler, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'overtone',
  title: 'Overtone',
  category: 'waves',
  technique: 'lines',
  tags: ['string', 'standing-wave', 'nodes', 'reflection', 'resonance', '3d'],
  description: 'Opposing travelling waves combine on a string drawn over two saddle bridges to anchor pins on a lit bed. Three antinodes exchange displacement while two interior nodes stay pinned; faint envelopes and a small exciter riding an antinode expose the standing mode.',
  order: 5,
  colors: [
    { part: 'Incoming wave', mono: 'ink' },
    { part: 'Reflected wave', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A string stretched over two saddle bridges (triangular prisms, the string
 * breaking over their crests) and down to an anchor pin past each one, on
 * a lit bed with a scale marked in sixths of the speaking length. Its third
 * mode stands on it: two waves running opposite ways (drawn faint behind)
 * add into three antinodes that swing through the string's plane while
 * the two interior nodes stay put, ringed. The envelope of the mode is
 * drawn faint above and below. The accent is the exciter riding the first
 * antinode. The phase turns twice a loop and the amplitude breathes once,
 * so the loop has no seam.
 *
 * Color: the two travelling waves that sum on the string are told apart, the incoming in `c1` and the reflected in `c2`; the string itself stays the ink. */

const LEVELS = [32, 48, 80].map((samples) => ({
  string: Array.from({ length: samples + 1 }, () => [0, 0, 0] as V3),
  incoming: Array.from({ length: samples + 1 }, () => [0, 0, 0] as V3),
  reflected: Array.from({ length: samples + 1 }, () => [0, 0, 0] as V3),
  envelope: Array.from({ length: samples + 1 }, () => [0, 0, 0] as V3),
}))
const END = 31
const BED = -11.5
const ring = Array.from({ length: 17 }, () => [0, 0, 0] as V3)
const tri = Array.from({ length: 4 }, () => point())
const xy: number[] = []
const depth = new Depth()

/** A saddle bridge at x: a triangular prism on the bed, its crest at the string's height. */
function saddle(project: Parameters<typeof block>[1], turn: Parameters<typeof block>[2], x: number, hair: number) {
  const w = 3.6
  const d = 3.4
  const faces: [V3, [number, number, number][]][] = [
    // The two sloping flanks and the front and back triangles.
    [[-1, w / -BED, 0], [[x - w, BED, -d], [x - w, BED, d], [x, 0, d], [x, 0, -d]]],
    [[1, w / -BED, 0], [[x + w, BED, d], [x + w, BED, -d], [x, 0, -d], [x, 0, d]]],
    [[0, 0, 1], [[x - w, BED, d], [x + w, BED, d], [x, 0, d]]],
    [[0, 0, -1], [[x + w, BED, -d], [x - w, BED, -d], [x, 0, -d]]],
  ]
  for (const [normal, corners] of faces) {
    const n = turn(...normal)
    if (n[2] <= 0) continue
    xy.length = 0
    let z = 0
    corners.forEach((c, i) => {
      project(c[0], c[1], c[2], tri[i]!)
      xy.push(tri[i]!.x, tri[i]!.y)
      z += tri[i]!.z / corners.length
    })
    depth.face(xy, z, lambert(...n))
    depth.path(xy, z + 0.01, { width: hair * 0.8, alpha: 0.7 * brightness(z), closed: true, join: 'round' })
  }
}

export const scene: Scene = {
  beats: 4.5,
  still: 0.04,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { string, incoming, reflected, envelope } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = -0.3 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.3
    const project = camera({ yaw, pitch, distance: 230, cx: view.w / 2, cy: 45 })
    const turn = orient({ yaw, pitch })
    const phase = TAU * 2 * u
    const amp = 8.2 + 1.6 * (0.5 - 0.5 * Math.cos(TAU * u))

    // The bed, the scale along its front edge, the bridges and the anchor pins.
    block(depth, project, turn, [0, BED - 1.6, 0], [39, 1.6, 6.5], hair * 0.85, 'ink', { bevel: lod === 2 ? 0.8 : 0 })
    if (lod > 0) ruler(depth, project, [-END, BED + 0.05, 6.4], [END, BED + 0.05, 6.4], 6, 3, [0, 0, -1], 1.1, hair * 0.75, 0.55)
    for (const s of [-1, 1]) {
      saddle(project, turn, s * END, hair)
      cylinder(depth, project, turn, [s * 36.5, BED, 0], 'y', 1.1, 3.4, lod === 0 ? 6 : 10, hair * 0.75)
      // The string's tail: from the bridge's crest down to its pin.
      edge(depth, project, [s * END, 0.1, 0], [s * 36.5, BED + 3.1, 0], hair * 1.3, 0.85)
    }

    for (let i = 0; i < string.length; i++) {
      const s = i / (string.length - 1)
      const x = -END + 2 * END * s
      const a = 3 * Math.PI * s
      const v = string[i]!
      v[0] = x
      v[1] = amp * Math.sin(a) * Math.cos(phase)
      v[2] = 2.4 * Math.sin(a) * Math.sin(phase)
      const one = incoming[i]!
      one[0] = x
      one[1] = amp * 0.5 * Math.sin(a - phase)
      one[2] = -5
      const two = reflected[i]!
      two[0] = x
      two[1] = amp * 0.5 * Math.sin(a + phase)
      two[2] = -5
      const env = envelope[i]!
      env[0] = x
      env[1] = amp * Math.abs(Math.sin(a))
      env[2] = 0
    }
    if (lod > 0) {
      wire(depth, project, incoming, hair * 0.7, 0.22, 'c1')
      wire(depth, project, reflected, hair * 0.7, 0.22, 'c2')
      wire(depth, project, envelope, hair * 0.7, 0.18, 'ink', 8, [2 * hair, 2 * hair])
      for (const v of envelope) v[1] *= -1
      wire(depth, project, envelope, hair * 0.7, 0.18, 'ink', 8, [2 * hair, 2 * hair])
    }
    wire(depth, project, string, hair * 1.6, 1)

    // The interior nodes, ringed where the string stays still.
    if (lod > 0) {
      for (const k of [1, 2]) {
        const x = -END + (2 * END * k) / 3
        for (let i = 0; i <= 16; i++) {
          const a = (TAU * i) / 16
          const v = ring[i]!
          v[0] = x
          v[1] = 2.2 * Math.cos(a)
          v[2] = 2.2 * Math.sin(a)
        }
        wire(depth, project, ring, hair * 0.8, 0.6, 'ink', 4)
      }
    }
    // The exciter riding the first antinode, in the accent.
    const sx = -END + (2 * END) / 6
    const y = amp * Math.cos(phase)
    const z = 2.4 * Math.sin(phase)
    edge(depth, project, [sx - 2.2, y, z + 0.6], [sx + 2.2, y, z + 0.6], hair * 1.9, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Opposing waves leave stationary nodes on a string stretched between solid bridges. */
export function LoaderOvertone(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
