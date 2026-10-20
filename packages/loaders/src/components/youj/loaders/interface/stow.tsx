'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'stow', title: 'Stow', category: 'interface', technique: 'planes',
  tags: ['packing', 'allocation', 'bin', 'fit', 'stages', 'capacity'],
  description: 'Six unequal parcels fill a wireframe bay without overlap. The lower course settles before the upper pieces arrive, a short accent seam closes the final fit, and the packing withdraws in reverse order to make room for the next allocation.',
  order: 12,
  colors: [{ part: 'Labels', mono: 'ink' }],
} satisfies LoaderMeta

const BOXES = [
  [-15.5, -7, 0, 25, 14, 36], [12.5, -7, -8, 31, 14, 20], [12.5, -7, 10, 31, 14, 16],
  [-15.5, 7, -8, 25, 14, 20], [-15.5, 7, 10, 25, 14, 16], [12.5, 7, 0, 31, 14, 36],
]
const FACES = [
  { corners: [2, 3, 7, 6], normal: [0, 1, 0] }, { corners: [4, 5, 7, 6], normal: [0, 0, 1] },
  { corners: [1, 3, 7, 5], normal: [1, 0, 0] }, { corners: [0, 2, 6, 4], normal: [-1, 0, 0] },
  { corners: [0, 1, 3, 2], normal: [0, 0, -1] },
]
const depth = new Depth()
const P = Array.from({ length: 8 }, () => point())
const a = point(), b = point()
const xy: number[] = []
const label: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    // A slow sway keeps the packed bay alive while it holds; none when tiny.
    const pose = { yaw: -0.6 + (small ? 0 : 0.04 * Math.sin(TAU * t)), pitch: -0.48 }
    const project = camera({ ...pose, distance: 380, cx: 50, cy: 57 })
    const turn = orient(pose)
    // The permanent bay is a spatial guide, faint behind the packing and
    // stronger along its floor. Parcel faces occlude its rear members.
    for (const y of [-15, 15]) for (const z of [-19, 19]) {
      project(-29, y, z, a); project(29, y, z, b)
      depth.line(a, b, hair, y < 0 ? 0.48 : 0.23)
    }
    for (const x of [-29, 29]) for (const z of [-19, 19]) {
      project(x, -15, z, a); project(x, 15, z, b); depth.line(a, b, hair, 0.3)
    }
    for (const x of [-29, 29]) {
      project(x, -15, -19, a); project(x, -15, 19, b); depth.line(a, b, hair, 0.48)
    }
    for (let i = 0; i < BOXES.length; i++) {
      const parcel = BOXES[i]!
      const enter = view.ease.emphasized(span(t, 0.02 + i * 0.075, 0.16 + i * 0.075))
      const exit = view.ease.exit(span(t, 0.73 + (5 - i) * 0.023, 0.87 + (5 - i) * 0.023))
      // A lively arrival may overshoot its easing curve, but a parcel
      // cannot expand beyond its allotted volume or cross a neighbour.
      const fit = clamp(enter * (1 - exit))
      if (fit < 0.005) continue
      const cx = parcel[0]!, cy = parcel[1]! + 22 * (1 - fit), cz = parcel[2]!
      const hx = (parcel[3]! / 2 - 0.5) * fit, hy = (parcel[4]! / 2 - 0.4) * fit, hz = (parcel[5]! / 2 - 0.5) * fit
      for (let k = 0; k < 8; k++) project(cx + (k & 1 ? hx : -hx), cy + (k & 2 ? hy : -hy), cz + (k & 4 ? hz : -hz), P[k]!)
      for (const face of FACES) {
        const n = turn(face.normal[0]!, face.normal[1]!, face.normal[2]!)
        if (n[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const k of face.corners) { xy.push(P[k]!.x, P[k]!.y); z += P[k]!.z / 4 }
        const light = lambert(...n)
        depth.face(xy, z, light)
        depth.path(xy, z + 0.08, { width: hair * 0.85, alpha: 0.72, closed: true })
        // The last parcel closes the fit: its seam is drawn along the top edge once it has settled.
        if (i === 5 && face.normal[1] === 1) {
          const seam = view.ease.emphasized(span(t, 0.52, 0.64)) * fit
          if (seam > 0.004) depth.path([xy[2]!, xy[3]!, mix(xy[2]!, xy[4]!, seam), mix(xy[3]!, xy[5]!, seam)], z + 0.1, { width: hair * 1.4, alpha: fit, tone: 'accent' })
        }
        // Each parcel carries a label on its front, a darker card that grows with it.
        if (!small && face.normal[2] === 1) {
          const lx0 = cx - hx * 0.78, lx1 = cx - hx * 0.18, ly0 = cy - hy * 0.62, ly1 = cy - hy * 0.08
          project(lx0, ly0, cz + hz, a); project(lx1, ly0, cz + hz, b)
          label.length = 0
          label.push(a.x, a.y, b.x, b.y)
          project(lx1, ly1, cz + hz, a); project(lx0, ly1, cz + hz, b)
          label.push(a.x, a.y, b.x, b.y)
          depth.face(label, z + 0.09, light * 0.74, 'c1')
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Unequal parcels settle into a complete two-course packing.
 *
 * Color: each parcel’s label is `c1`, lit as a color is; the parcels and the bay keep the ink, the closing seam the accent. */
export function LoaderStow(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
