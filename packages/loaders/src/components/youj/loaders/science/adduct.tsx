'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, mix, orient, span, Depth, point, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, bond, partial, pens, set, slab, stick, type V3 } from './matter'

export const meta = {
  id: 'adduct', title: 'Adduct', category: 'science', technique: 'mixed',
  tags: ['catalyst', 'adsorption', 'reaction', 'desorption', 'surface chemistry', '3d'],
  description: 'Two reactants land in neighbouring hollows of a lattice of surface atoms, held by short surface bonds. They slide together and couple through a new accent bond, the product lifts off and turns away into the distance, and the next pair is already on its way in.',
  order: 7,
  colors: [{ part: 'Reactants', mono: 'ink' }],
} satisfies LoaderMeta

/* A catalyst block whose top is a lattice of surface atoms. Each reactant
 * flies in on its own arc, growing out of the distance, and settles into a
 * hollow (`enter`), anchored by two short surface bonds. The two slide
 * toward each other, a dashed partial bond reaches across and grows solid in
 * the accent, and the surface lets go: the product lifts, turns and recedes
 * until it's gone, while the next pair is already coming in. Every atom
 * moves on one continuous path through the loop; the view sways a little.
 *
 * Color: the two reactants are `c1` against the ink lattice of the surface; the bond they couple through stays the accent. */

/** The top layer, close packed: rows of four, three and four, the middle row set half a spacing over. */
const SURFACE: V3[] = []
for (const z of [-10.4, 0, 10.4]) for (const x of z === 0 ? [-12, 0, 12] : [-18, -6, 6, 18]) SURFACE.push([x, -6.6, z])
const SURFACE_SMALL: V3[] = SURFACE.filter((_, i) => i % 2 === 0)
const slabCenter: V3 = [0, -16.5, 0]
const slabHalf: V3 = [25, 4.5, 16]
/** Each reactant: where its flight starts, the hollow it lands in, where it slides to, and its surface anchors. */
const REACTANTS = [
  { from: [-26, 25, 8] as V3, site: [-12, 1.6, 6.9] as V3, slide: [-7.6, 1.6, 6.4] as V3, anchors: [4, 8] as const, start: 0.7, r: 5 },
  { from: [26, 26, -8] as V3, site: [12, 1.2, 6.9] as V3, slide: [7.6, 1.2, 6.4] as V3, anchors: [6, 9] as const, start: 0.78, r: 4.4 },
]
const LAND = [0.25, 0.31]
const S = 1.15
const atoms: V3[] = [[0, 0, 0], [0, 0, 0]]
const incoming: V3[] = [[0, 0, 0], [0, 0, 0]]
const mid: V3 = [0, 0, 0]
const depth = new Depth()
const p = point()
const q = point()

/** Along a reactant's arc from its start to its hollow, s in 0–1: a curve that drops in from above. */
function flight(out: V3, from: V3, to: V3, s: number) {
  set(out, mix(from[0], to[0], s), mix(from[1], to[1], s * (2 - s)) + 6 * Math.sin(Math.PI * s), mix(from[2], to[2], s))
}

export const scene: Scene = {
  beats: 5.75,
  still: 0.44,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const { hair } = pens(view)
    const pose = { yaw: -0.46 + 0.07 * Math.sin(TAU * t), pitch: -0.56 }
    const cam = camera({ ...pose, distance: 215, cx: view.w / 2, cy: view.h / 2 + 5 })
    // The model at 1.15×; what sits on the lattice sorts a little nearer, since from above it covers the atoms it rests on.
    const project: Project = (x, y, z, out) => cam(x * S, y * S, z * S, out)
    const above: Project = (x, y, z, out) => {
      cam(x * S, y * S, z * S, out)
      out.z += 5
      return out
    }
    slab(depth, project, orient(pose), slabCenter, slabHalf, hair * 0.75)
    for (const v of small ? SURFACE_SMALL : SURFACE) atom(depth, project, v, (small ? 6 : 5.7) * S, view, 'ink', true, 0.74)
    if (large) {
      // A ruler along the block's front edge, a tick under each lattice column.
      for (const x of [-18, -12, -6, 0, 6, 12, 18]) {
        project(x, -12, 17, p)
        project(x, (x / 6) % 2 === 0 ? -13.2 : -14.4, 17, q)
        depth.line(p, q, hair * 0.8, 0.5)
      }
    }

    // The surface's part: the pair lands, slides together and couples, then the product leaves.
    const slide = view.ease.standard(span(t, 0.33, 0.48))
    const made = view.ease.standard(span(t, 0.43, 0.56))
    const lift = view.ease.emphasized(span(t, 0.56, 0.88))
    const gone = 1 - view.ease.exit(span(t, 0.72, 0.88))
    const held = (i: number) => span(t, LAND[i]!, LAND[i]! + 0.05) * (1 - span(t, 0.54, 0.62))
    REACTANTS.forEach((r, i) => {
      const v = atoms[i]!
      set(v, mix(r.site[0], r.slide[0], slide), mix(r.site[1], r.slide[1], slide), mix(r.site[2], r.slide[2], slide))
    })
    if (t >= LAND[0]! && t < 0.88) {
      // Lifting: about the pair's middle, up and back, turning as it goes.
      set(mid, (atoms[0]![0] + atoms[1]![0]) / 2, (atoms[0]![1] + atoms[1]![1]) / 2, (atoms[0]![2] + atoms[1]![2]) / 2)
      const angle = lift * 2.2
      for (const v of atoms) {
        const dx = v[0] - mid[0]
        const dz = v[2] - mid[2]
        set(v, mid[0] + dx * Math.cos(angle) - dz * Math.sin(angle) + 9 * lift, v[1] + 30 * lift, mid[2] + dx * Math.sin(angle) + dz * Math.cos(angle) - 22 * lift)
      }
      REACTANTS.forEach((r, i) => {
        if (t < LAND[i]!) return
        // Anchored by two short surface bonds while it's down.
        const k = held(i)
        if (!small && k > 0) for (const a of r.anchors) bond(depth, project, atoms[i]!, SURFACE[a]!, hair * 1.1, 0.7 * k)
        atom(depth, above, atoms[i]!, r.r * S * gone, view, 'c1')
      })
      if (!small) partial(depth, above, atoms[0]!, atoms[1]!, hair * 1.5, span(t, 0.33, 0.42) * (1 - span(t, 0.5, 0.58)), view, 'accent')
      stick(depth, above, atoms[0]!, atoms[1]!, (small ? 1.7 : 1.8) * S * gone, view, 'accent', made)
    }

    // The next pair on its way in, growing out of the distance.
    REACTANTS.forEach((r, i) => {
      const u = (((t - r.start) % 1) + 1) % 1
      const land = (LAND[i]! - r.start + 1) % 1
      if (u >= land) return
      const s = view.ease.emphasized(span(u, 0, land))
      flight(incoming[i]!, r.from, r.site, s)
      atom(depth, above, incoming[i]!, r.r * S * view.ease.standard(span(u, 0, 0.12)), view, 'c1')
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A catalyst receives two reactants, couples them and releases a turning product. */
export function LoaderAdduct(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
