'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, polylineLength, span, Depth, point, projectPath, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'gantry',
  title: 'Gantry',
  category: 'interface',
  technique: 'lines',
  tags: ['plotter', 'layout', 'carriage', 'rails', 'artboard', 'construction', 'isometric'],
  description: 'A carriage riding a bridge across two rails plots a square layout on an isometric bed with its accent nib. The bridge follows every precise corner, lifts the pen after closing the outline, and clears the drawing for another pass.',
  order: 8,
  colors: [
    { part: 'Machine', mono: 'ink' },
    { part: 'Plot', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A flatbed plotter in the isometric view: a bed with a sheet on it, two
 * rails along its sides with stops at their ends, and a bridge riding the
 * rails on two trucks and posts, all lit solids. A carriage straddles the
 * bridge; its pen hangs to the sheet, the accent nib at its tip. The bridge
 * runs along the rails and the carriage along the bridge, edge by edge
 * (`standard`), each corner of the square they plot marked with a pen-down
 * dot. When the outline closes the bridge lifts the pen clear (`emphasized`),
 * the drawing fades, and it settles back for the next pass.
 *
 * Color: what moves apart from what it makes, `c1` the machine (the
 * trucks, the posts, the bridge and the carriage; the theme color) and `c2` the plot
 * (the drawing and its corner dots; the theme color), both the ink without colors.
 * The rails stay the ink and the nib the accent. */

type V3 = [number, number, number]
const BED = [[-31, -23], [31, -23], [31, 23], [-31, 23]] as const
const SHEET = [[-25, -18], [25, -18], [25, 18], [-25, 18]] as const
const DRAWING = [[-18, -13], [18, -13], [18, 13], [-18, 13], [-18, -13]] as const
const PLAN: V3[] = DRAWING.map(([x, z]) => [x, -3, z])
const PLATE: V3[] = BED.map(([x, z]) => [x, -4, z])
const PAPER: V3[] = SHEET.map(([x, z]) => [x, -3.6, z])
const RAIL = 28
/** A box's faces: its corners (bit 0 is x, bit 1 y, bit 2 z) and its normal. */
const FACES = [
  { ids: [2, 3, 7, 6], n: [0, 1, 0] },
  { ids: [0, 1, 5, 4], n: [0, -1, 0] },
  { ids: [4, 5, 7, 6], n: [0, 0, 1] },
  { ids: [0, 1, 3, 2], n: [0, 0, -1] },
  { ids: [1, 3, 7, 5], n: [1, 0, 0] },
  { ids: [0, 2, 6, 4], n: [-1, 0, 0] },
] as const
const depth = new Depth()
const p = point()
const q = point()
const corners = Array.from({ length: 8 }, () => point())
const xy: number[] = []

export const scene: Scene = {
  beats: 5.5,
  still: 0.37,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.55, pitch: -0.72 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 + 2 })
    const turn = orient(pose)
    const hair = (small ? 1 : 0.9) / view.px
    const stroke = clamp(view.size * 0.018, 1.1, 1.8) / view.px
    const phase = span(t, 0.03, 0.73) * 4
    const edge = Math.min(3, Math.floor(phase))
    const move = view.ease.standard(span(phase - edge, 0.04, 0.94))
    const a = DRAWING[edge]!
    const b = DRAWING[edge + 1]!
    const x = mix(a[0], b[0], move)
    const z = mix(a[1], b[1], move)
    const lift = view.ease.emphasized(span(t, 0.74, 0.86)) * (1 - view.ease.emphasized(span(t, 0.88, 0.99)))
    const height = 7 + 6 * lift
    const erase = 1 - view.ease.exit(span(t, 0.83, 0.97))

    /** A lit box from its least to its greatest corner, sorted whole at `key` so the machine stacks in its own order. */
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, key: number, tone: Tone = 'ink') => {
      for (let j = 0; j < 8; j++) project(j & 1 ? x1 : x0, j & 2 ? y1 : y0, j & 4 ? z1 : z0, corners[j]!)
      for (const face of FACES) {
        const n = turn(face.n[0], face.n[1], face.n[2])
        if (n[2] <= 0.02) continue
        xy.length = 0
        for (const j of face.ids) xy.push(corners[j]!.x, corners[j]!.y)
        depth.face(xy, key, lambert(...n), tone)
      }
    }
    const line = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, alpha: number, width = hair, key?: number, tone: Tone = 'ink') => {
      project(ax, ay, az, p)
      project(bx, by, bz, q)
      if (key === undefined) depth.line(p, q, width * (p.k + q.k) / 2, alpha, tone)
      else depth.path([p.x, p.y, q.x, q.y], key, { width: width * (p.k + q.k) / 2, alpha, tone })
    }

    // The bed and the sheet on it, below everything the machine carries.
    const bed = projectPath(PLATE, project, xy)
    depth.poly(bed.xy, bed.z, 0.035, 'ink', true)
    depth.path(bed.xy, bed.z + 0.01, { width: hair, alpha: 0.4, closed: true })
    if (!small) {
      const sheet = projectPath(PAPER, project, xy)
      depth.poly(sheet.xy, bed.z + 0.012, 0.06, 'ink', true)
      depth.path(sheet.xy, bed.z + 0.013, { width: hair, alpha: 0.22, closed: true })
    }
    const drawing = projectPath(PLAN, project, xy)
    const length = polylineLength(drawing.xy)
    // Use projected segment lengths: the nib and dash meet even when the
    // two screen axes are foreshortened by different amounts.
    let shown = 0
    for (let i = 0; i <= edge; i++) {
      const segment = Math.hypot(drawing.xy[2 * i + 2]! - drawing.xy[2 * i]!, drawing.xy[2 * i + 3]! - drawing.xy[2 * i + 1]!)
      shown += segment * (i === edge ? move : 1)
    }
    // The paper and its drawing are parallel planes. Sort the drawing just
    // above its paper: its repeated closing corner must not bias its mean
    // depth enough to send it behind the bed.
    if (shown > 0) depth.path(drawing.xy, bed.z + 0.02, { width: stroke, alpha: 0.86 * erase, tone: 'c2', dash: [shown, length + 1], join: 'miter' })
    // A pen-down dot at each corner the plot has reached.
    if (!small) {
      for (let i = 0; i < 4; i++) {
        const reached = clamp((phase - i) / 0.12) * erase
        if (reached < 0.01) continue
        project(DRAWING[i]![0], -3, DRAWING[i]![1], p)
        p.z = bed.z + 0.03
        depth.square(p, stroke * 2.2, 0.9 * reached, 'c2')
      }
    }

    // The machine, after the bed in this order: rails, trucks, posts, the pen, the bridge, the carriage.
    const base = bed.z + 100
    for (const side of [-1, 1]) {
      const rx = side * RAIL
      if (small) line(rx, 5, -25, rx, 5, 25, 0.6, hair, base)
      else {
        box(rx - 0.8, 4.2, -24, rx + 0.8, 5.4, 24, base)
        // Stops at both ends of each rail, and the rail's legs to the bed.
        for (const end of [-1, 1]) {
          box(rx - 1.3, 4.2, end > 0 ? 24 : -25.6, rx + 1.3, 6.4, end > 0 ? 25.6 : -24, base + 0.5)
          line(rx, -4, end * 23, rx, 4.2, end * 23, 0.36, hair, base - 0.5)
        }
        box(rx - 1.4, 5.4, z - 2.4, rx + 1.4, 6.8, z + 2.4, base + 1, 'c1')
      }
      if (small) line(rx, 5, z, rx, height, z, 0.78, hair, base + 2, 'c1')
      else if (height - 1 > 6.85) box(rx - 0.55, 6.8, z - 0.55, rx + 0.55, height - 1, z + 0.55, base + 2, 'c1')
    }
    // The pen hangs from the carriage to the sheet, the accent nib at its tip; the bridge lifts it clear at the end.
    const nibY = -3 + 6 * lift
    line(x, height - 1.6, z, x, nibY, z, 0.8, hair, base + 2.5)
    project(x, nibY, z, p)
    p.z = base + 2.6
    depth.square(p, clamp(view.size * 0.04, 2.6, 5.2) / view.px, 1, 'accent')
    box(-RAIL - 1.2, height - 1, z - 1.2, RAIL + 1.2, height + 0.8, z + 1.2, base + 3, 'c1')
    box(x - 2.4, height - 1.6, z - 2, x + 2.4, height + 1.6, z + 2, base + 4, 'c1')

    if (view.size >= 80) {
      // Scale ticks live on the bed rather than crowding the small icon.
      for (let i = -2; i <= 2; i++) line(i * 10, -3.9, 19, i * 10, -3.9, 22, 0.32, hair, bed.z + 0.05)
      for (let i = -1; i <= 1; i++) line(-30, -3.9, i * 10, -27, -3.9, i * 10, 0.32, hair, bed.z + 0.05)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An orthogonal drawing carriage plots a square layout, lifts, and clears its bed. */
export function LoaderGantry(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
