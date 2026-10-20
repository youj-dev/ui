'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, point, span, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'leader', title: 'Leader', category: 'signal', technique: 'lines',
  tags: ['discharge', 'lightning', 'stepped leader', 'return stroke', 'electricity', 'branches'],
  description: 'A stepped discharge tests several paths between two electrodes. A rising streamer meets the descending leader, a restrained return stroke runs back up the connected channel, and the unsuccessful side branches drain away before the gap clears.',
  order: 40,
  colors: [{ part: 'Return stroke', mono: 'ink' }],
} satisfies LoaderMeta

/* A spark gap on a test stand: two lit electrode slabs held apart by
 * insulator columns at the back, each with a short terminal pin. Charge
 * gathers at the pins while the gap is empty (faint field lines stand between
 * the plates), then a leader steps down from the upper pin, testing side
 * paths that branch off its corners and thin out along their length; a
 * streamer rises from the lower pin to meet it. On contact a return stroke
 * runs back up the joined channel, a bright core in a faint halo with one
 * short accent stroke riding it, while the side branches drain away. The
 * channel fades, the charge relaxes, and it gathers again for the next one,
 * so the gap is never quite still and the loop has no seam.
 *
 * Color: the connected channel warms to `c1` as the return stroke runs up it, and cools back to the ink; the leader’s tip stays the accent. */

type V3 = [number, number, number]
const CHANNEL: V3[] = [[-4, 27.5, 0], [-9, 21, 2], [1, 14, -1], [-6, 6, 1], [6, -2, 0], [1, -10, 2], [7, -19, 0], [3, -27.5, 0]]
const BRANCHES = [
  { at: 1, path: [[-9, 21, 2], [-20, 14, -6], [-23, 5, -3]] as V3[] },
  { at: 2, path: [[1, 14, -1], [14, 11, -9], [21, 2, -12]] as V3[] },
  { at: 3, path: [[-6, 6, 1], [-18, 0, 8], [-23, -12, 11]] as V3[] },
  { at: 4, path: [[6, -2, 0], [18, -9, -5], [24, -18, -7]] as V3[] },
  { at: 2, path: [[1, 14, -1], [9, 7, 12], [15, -1, 16]] as V3[] },
] as const
/** The plates' inner faces, and how thick the slabs are. */
const GAP = 30
const SLAB = 2.6
const TERMINALS = [[-4, 1], [3, -1]] as const
const COLUMNS = [-20, 20]
const xy: number[] = []
const p = point()
const q = point()
const corner = Array.from({ length: 8 }, () => point())
const depth = new Depth()
const SLAB_FACES = [
  { ids: [2, 3, 7, 6], n: [0, 1, 0] },
  { ids: [0, 1, 5, 4], n: [0, -1, 0] },
  { ids: [4, 5, 7, 6], n: [0, 0, 1] },
  { ids: [0, 1, 3, 2], n: [0, 0, -1] },
  { ids: [1, 3, 7, 5], n: [1, 0, 0] },
  { ids: [0, 2, 6, 4], n: [-1, 0, 0] },
] as const

/** A lit slab from y0 to y1 across the stand, its visible faces outlined and its near top edge picked out. */
function slab(project: Project, turn: ReturnType<typeof orient>, y0: number, y1: number, hair: number) {
  for (let j = 0; j < 8; j++) project(j & 1 ? 25 : -25, j & 2 ? y1 : y0, j & 4 ? 10 : -10, corner[j]!)
  for (const face of SLAB_FACES) {
    const n = turn(face.n[0], face.n[1], face.n[2])
    if (n[2] <= 0.01) continue
    xy.length = 0
    let z = 0
    for (const j of face.ids) { xy.push(corner[j]!.x, corner[j]!.y); z += corner[j]!.z / 4 }
    depth.face(xy, z, lambert(...n) * 0.7)
    depth.path(xy, z + 0.01, { width: hair * 0.8, alpha: 0.5, closed: true })
  }
  // The near edge where the top meets the front catches the light.
  depth.line(corner[6]!, corner[7]!, hair * 1.1, 0.85)
}

export const scene: Scene = {
  beats: 5.7, still: 0.59,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const lod = small ? 0 : view.size < 80 ? 1 : 2
    const hair = (small ? 1.1 : 1.15) / view.px
    const pose = { yaw: -0.26, pitch: -0.32 }
    const project = camera({ ...pose, distance: 230, cx: view.w / 2, cy: 48.5 })
    const turn = orient(pose)
    // Charge gathers while the gap is empty and relaxes after the stroke: it wraps the seam.
    const build = view.ease.standard(span((t + 0.14) % 1, 0, 0.28))
    const relax = t < 0.86 ? view.ease.standard(span(t, 0.56, 0.8)) : 0
    const charge = build * (1 - relax)

    // The stand: two lit slabs, held apart by insulator columns at the back.
    slab(project, turn, GAP, GAP + SLAB, hair)
    slab(project, turn, -GAP - SLAB, -GAP, hair)
    if (lod > 0) for (const x of COLUMNS) {
      for (const dx of lod === 2 ? [-0.9, 0.9] : [0]) {
        project(x + dx, -GAP, -7, p); project(x + dx, GAP, -7, q)
        depth.line(p, q, hair * 0.75, 0.24)
      }
      if (lod === 2) {
        // Insulator sheds, little discs stacked up the column.
        for (let k = 0; k < 7; k++) {
          const y = -21 + 7 * k
          xy.length = 0
          let z = 0
          for (let i = 0; i <= 12; i++) {
            project(x + 2.6 * Math.cos(TAU * i / 12), y, -7 + 2.6 * Math.sin(TAU * i / 12), p)
            xy.push(p.x, p.y); z += p.z / 13
          }
          depth.path(xy, z, { width: hair * 0.7, alpha: 0.24, closed: true })
        }
      }
    }
    // Field lines stand between the plates while the charge holds and the gap is still open.
    const open = 1 - view.ease.standard(span(t, 0.14, 0.3)) + view.ease.standard(span(t, 0.8, 0.9))
    // They march from the upper plate to the lower, a whole number of dashes a loop.
    if (lod === 2) for (const x of [-15, -7.5, 7.5, 15]) {
      const a = 0.2 * charge * open
      if (a < 0.005) continue
      project(x, GAP - 2, 3, p); project(x, -GAP + 2, 3, q)
      depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.7, alpha: a, dash: [2 * hair, 2.4 * hair], offset: -12 * 4.4 * hair * t })
    }

    // The terminal pins, a square cap on each, and the charge gathering beside them.
    for (const [x, s] of TERMINALS) {
      const y = s * GAP
      project(x, y, 0, p); project(x, y - s * 2.5, 0, q)
      depth.line(p, q, hair * 1.3, 0.85)
      project(x, y - s * 2.5, 0, p)
      depth.square(p, small ? 3.4 : 2.6, 0.9)
      if (!small) {
        for (const dx of [-7, 7]) {
          project(x + dx, y, 0, p)
          project(x + dx, y - s * 4 * charge, 0, q)
          depth.line(p, q, hair * 0.7, 0.42 * charge)
        }
      }
    }

    // The channel is stepped, rather than scaled from a trunk: each
    // segment advances after the previous one, with a brief hesitation.
    // The upward streamer waits until the descending path reaches it.
    for (let i = 0; i < CHANNEL.length - 1; i++) {
      const a = CHANNEL[i]!
      const b = CHANNEL[i + 1]!
      const up = i === CHANNEL.length - 2
      const born = up ? 0.39 : 0.14 + i * 0.045
      const grow = view.ease.standard(span(t, born, born + (up ? 0.11 : 0.055)))
      // The channel clears from the bottom up, the last of it at the upper pin.
      const active = 1 - view.ease.standard(span(t, 0.72 + (6 - i) * 0.025, 0.84 + (6 - i) * 0.025))
      if (grow <= 0 || active <= 0.004) continue
      const start = up ? b : a
      const finish = up ? a : b
      project(...start, p)
      project(mix(start[0], finish[0], grow), mix(start[1], finish[1], grow), mix(start[2], finish[2], grow), q)
      const pulseAt = 0.51 + (6 - i) * 0.025
      const strike = view.ease.standard(span(t, pulseAt, pulseAt + 0.025)) * (1 - view.ease.standard(span(t, pulseAt + 0.06, pulseAt + 0.2)))
      const near = clamp(0.82 + (p.z + q.z) / 120, 0.6, 1)
      const z = (p.z + q.z) / 2
      // A faint halo round the core while the stroke runs through it.
      if (!small && strike > 0.01) depth.path([p.x, p.y, q.x, q.y], z - 0.01, { width: hair * 4.5, alpha: 0.1 * strike * active, cap: 'round' })
      depth.path([p.x, p.y, q.x, q.y], z, { width: hair * (0.92 + 0.55 * strike), alpha: (0.65 + 0.32 * strike) * active * near, cap: 'round', tone: blend('ink', 'c1', 0.9 * strike) })
      // One short accent stroke rides upward along the established path.
      // There is no full-frame flash: the connected channel carries it.
      const progress = span(t, pulseAt, pulseAt + 0.06)
      const glow = Math.sin(Math.PI * progress) * active
      if (glow > 0.004) {
        const s0 = clamp(progress - 0.2)
        const s1 = clamp(progress + 0.2)
        project(mix(b[0], a[0], s0), mix(b[1], a[1], s0), mix(b[2], a[2], s0), p)
        project(mix(b[0], a[0], s1), mix(b[1], a[1], s1), mix(b[2], a[2], s1), q)
        depth.line(p, q, hair * 1.5, glow, 'accent')
      }
    }
    // Side branches thin out along their length and drain away once the channel connects.
    const branches = small ? 3 : BRANCHES.length
    for (let i = 0; i < branches; i++) {
      const branch = BRANCHES[i]!
      const show = 1 - view.ease.standard(span(t, 0.53 + i * 0.025, 0.72 + i * 0.025))
      for (let j = 0; j < branch.path.length - 1; j++) {
        const born = 0.14 + branch.at * 0.045 + j * 0.04
        const grow = view.ease.standard(span(t, born, born + 0.08))
        if (grow <= 0 || show <= 0.004) continue
        const a = branch.path[j]!
        const b = branch.path[j + 1]!
        project(...a, p)
        project(mix(a[0], b[0], grow), mix(a[1], b[1], grow), mix(a[2], b[2], grow), q)
        const taper = 1 - 0.38 * j
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.75 * taper, alpha: (0.3 + clamp((p.z + q.z) / 140, -0.08, 0.12)) * show * taper, cap: 'round' })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Stepped leaders meet a rising streamer and carry a restrained return stroke back through the gap. */
export function LoaderLeader(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
