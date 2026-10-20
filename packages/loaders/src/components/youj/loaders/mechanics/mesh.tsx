'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { disc, part, pin, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'mesh', title: 'Mesh', category: 'mechanics', technique: 'planes',
  tags: ['gears', 'teeth', 'drive', 'transmission', 'contact'],
  description: 'Two spur gears on pillow blocks transmit four measured pushes through their shared contact, turning continuously in the exact 15:10 tooth ratio. Lightening holes, raised hubs and an accent timing mark show each wheel turn.',
  order: 1,
  colors: [{ part: 'Follower', mono: 'ink' }],
} satisfies LoaderMeta

/* Two spur gears on pillow blocks over a base, seen a little from above.
 * The wheels are cut like real ones: lightening holes through the web (the
 * blocks behind show through them), a raised hub with its shaft end, and a
 * chamfer inside each rim. The driver turns once a loop in four pushes,
 * but never stops: its speed swells and eases four times (1 − k·cos), so
 * the rhythm reads while the drive stays continuous, and the follower turns
 * one and a half times in the 15:10 ratio (its holes and teeth repeat every
 * half turn, so the loop has no seam). At larger sizes the drawing's
 * construction shows: the line of centres, and the line of action through
 * the pitch point.
 *
 * Color: the driven gear is edged in `c1` and the driver in the ink, so the two wheels read apart; the timing mark stays the accent. */

const DRIVER = { x: -15, y: 3, r: 21, teeth: 15, holes: 3, at: 11.4, hole: 4.2, boss: 5.6 }
const FOLLOWER = { x: 20, y: 3, r: 14, teeth: 10, holes: 4, at: 7.8, hole: 2.4, boss: 4.2 }
/** One pitch of the rim, centred on a crest: root, flank, crest, flank (fraction of the pitch, radial offset from the pitch circle). */
const TOOTH = [[-0.5, -2], [-0.32, -2], [-0.23, -0.7], [-0.16, 0.9], [-0.1, 1.9], [0.1, 1.9], [0.16, 0.9], [0.23, -0.7], [0.32, -2]] as const
const FRONT = 3
const THICK = 5
const outlines = [DRIVER, FOLLOWER].map((g) => Array.from({ length: g.teeth * TOOTH.length }, (): V3 => [0, 0, 0]))
const holes = [DRIVER, FOLLOWER].map((g) => Array.from({ length: g.holes }, (): V3[] => []))
const boss: V3[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const depth = new Depth()
const p = point()
const q = point()

/** A lit box from its min and max corners: the faces toward the viewer, each outlined. */
function block(project: (x: number, y: number, z: number, o: typeof p) => typeof p, turn: Turn, lo: V3, hi: V3, hair: number, edge: number, bias = 0) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
    [[-1, 0, 0], [[lo[0], lo[1], lo[2]], [lo[0], lo[1], hi[2]], [lo[0], hi[1], hi[2]], [lo[0], hi[1], lo[2]]]],
  ]
  for (const [n, corners] of faces) {
    const v = turn(...n)
    if (v[2] <= 0.02) continue
    corners.forEach((c, i) => {
      box[i]![0] = c[0]!
      box[i]![1] = c[1]!
      box[i]![2] = c[2]!
    })
    const f = projectPath(box, project, xy)
    depth.face(f.xy, f.z + bias, lambert(...v))
    depth.path(f.xy, f.z + bias + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

export const scene: Scene = {
  beats: 5, still: 0.34,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.1 : 1.05) / view.px
    const pose = { yaw: -0.3 + (small ? 0 : 0.07) * Math.sin(TAU * t), pitch: -0.27 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2 + 1.5, cy: 46 })
    const turn = orient(pose)
    // Four pushes a turn that never stop: the speed swells and eases (1 − k·cos), the turn whole at the seam.
    const drive = TAU * (t - (0.7 * Math.sin(4 * TAU * t)) / (4 * TAU))

    if (!small) {
      // The base and the pillow block each shaft runs back into.
      block(project, turn, [-41, -36, -10], [39, -31, 7], hair * 0.9, 0.55, -60)
      for (const g of [DRIVER, FOLLOWER]) block(project, turn, [g.x - 4.2, -31, -8.5], [g.x + 4.2, g.y + 4.2, -3.2], hair * 0.9, 0.6)
    } else rod(depth, project, [-40, -31, 0], [38, -31, 0], hair, 0.55)

    ;[DRIVER, FOLLOWER].forEach((g, i) => {
      const spin = i ? Math.PI / g.teeth - (DRIVER.teeth / g.teeth) * drive : drive
      const outline = outlines[i]!
      for (let j = 0; j < g.teeth; j++) {
        TOOTH.forEach(([u, dr], k) => {
          const a = spin + (TAU * (j + u)) / g.teeth
          const v = outline[j * TOOTH.length + k]!
          v[0] = g.x + (g.r + dr) * Math.cos(a)
          v[1] = g.y + (g.r + dr) * Math.sin(a)
          v[2] = FRONT
        })
      }
      // Lightening holes through the web, between where the spokes would be.
      const cut = small ? [] : holes[i]!.map((h, k) => disc(g.x + g.at * Math.cos(spin + (TAU * (k + 0.5)) / g.holes), g.y + g.at * Math.sin(spin + (TAU * (k + 0.5)) / g.holes), FRONT, g.hole, large ? 20 : 14, h))
      const layer = part(depth, project, turn, outline, cut, THICK, hair, large ? 1.1 : 0, 0.8, undefined, false, i === 1 ? 'c1' : 'ink')
      // The hub: a raised boss, the shaft's end pinned in it.
      const top = part(depth, project, turn, disc(g.x, g.y, FRONT + 1.6, g.boss, small ? 14 : 24, boss), [], 1.6, hair * 0.9, 0, 0.85)
      pin(depth, project, turn, g.x, g.y, FRONT + 1.7, small ? 2.2 : 1.9, hair * 0.85, 'ink', top + 0.01)
      if (i === 0) {
        // The driver's timing mark: the accent square, punched near the rim.
        project(g.x + (g.r - 5) * Math.cos(spin), g.y + (g.r - 5) * Math.sin(spin), FRONT + 0.05, p)
        p.z = layer + 0.03
        depth.square(p, clamp(view.size * 0.032, 2.4, 6.5) / view.px, 1, 'accent')
      }
    })
    if (large) {
      // The line of centres and the line of action through the pitch point, 20° off the common tangent.
      const pitchX = DRIVER.x + DRIVER.r
      project(DRIVER.x + 6, DRIVER.y, FRONT + 3.4, p)
      project(FOLLOWER.x - 5, FOLLOWER.y, FRONT + 3.4, q)
      depth.path([p.x, p.y, q.x, q.y], 60, { width: hair * 0.75, alpha: 0.42, dash: [6 * hair, 2 * hair, 1.5 * hair, 2 * hair] })
      const s = Math.sin(0.35)
      const c = Math.cos(0.35)
      project(pitchX - 9 * s, DRIVER.y + 9 * c, FRONT + 3.4, p)
      project(pitchX + 9 * s, DRIVER.y - 9 * c, FRONT + 3.4, q)
      depth.path([p.x, p.y, q.x, q.y], 60, { width: hair * 0.75, alpha: 0.4, dash: [2.5 * hair, 2 * hair] })
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two gears move in four linked pushes, their teeth maintaining the transmission ratio. */
export function LoaderMesh(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
