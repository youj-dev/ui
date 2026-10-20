'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, point, projectPath, roundedRect, span, Depth, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'prefix', title: 'Prefix', category: 'interface', technique: 'lines',
  tags: ['scan', 'accumulate', 'prefix sum', 'aggregation', 'dataset', 'carry'],
  description: 'Unequal input bands become an inclusive prefix scan. Each addend slides beyond the previous total while a carried span grows behind it; a stepped bracket transfers that total to the next row, then the scan unwinds to its original inputs.',
  order: 23,
  colors: [{ part: 'Carry', mono: 'ink' }],
} satisfies LoaderMeta

/* Each input is a thin lit slab, as long as its value on the ruler above.
 * The scan runs down the rows: a carry drops from the end of the total so
 * far, from a knot on the slab's corner to an arrowhead on the next row,
 * and that row's slab slides out along its carried span (a rail with a tick
 * per unit) until its corner meets the arrowhead, its leading edge in the
 * accent. Dashed ghosts show where each slab will land, a pointer on the
 * ruler follows the running total, and each total is tagged at its slab's
 * end. Then the scan unwinds, last row first, to the inputs it began with.
 *
 * Color: the carry, each running total handed down to the next bar and the ruler’s pointer, is `c1`; the bars keep the ink, each bar’s arriving edge the accent. */

const LEVELS = [[7, 4, 8], [4, 7, 3, 6, 5]]
const SUMS = LEVELS.map(values => { let sum = 0; return values.map(v => (sum += v)) })
const LEFT = -29
const FRONT = 2
const BACK = -1.4
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const QUAD: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const lod = view.size < 32 ? 0 : 1
    const rich = view.size >= 80
    const values = LEVELS[lod]!, totals = SUMS[lod]!
    const n = values.length
    const hair = (lod === 0 ? 1.05 : 1) / view.px
    // A slow sway keeps the staircase alive while it holds the finished scan.
    const pose = { yaw: -0.24 + (lod ? 0.035 * Math.sin(TAU * t) : 0), pitch: -0.26 }
    const lens = camera({ ...pose, distance: 340, cx: view.w / 2 + (rich ? -2 : 1), cy: 51 })
    const S = lod ? 1.24 : 1.12
    const project: Project = (x, y, z, out) => lens(x * S, y * S, z * S, out)
    const turn = orient(pose)
    const scale = 58 / totals[n - 1]!
    const gap = 48 / (n - 1)
    const H = lod ? 2.6 : 3.6
    const spacing = 0.46 / (n - 1)
    const arrive = (i: number) => 0.07 + (i - 1) * spacing
    const leave = (i: number) => 0.62 + (n - 1 - i) * spacing * 0.6
    const ready = (i: number) => (i === 0 ? 1 : clamp(view.ease.emphasized(span(t, arrive(i), arrive(i) + 0.14)) - view.ease.emphasized(span(t, leave(i), leave(i) + 0.12))))
    const set = (i: number, x: number, y: number, z: number) => { QUAD[i]![0] = x; QUAD[i]![1] = y; QUAD[i]![2] = z }
    const lit = (nx: number, ny: number, nz: number, z: number) => {
      const normal = turn(nx, ny, nz)
      if (normal[2] <= 0) return
      const f = projectPath(QUAD, project, xy)
      depth.face(f.xy, f.z + z, lambert(...normal))
    }
    const segment = (ax: number, ay: number, bx: number, by: number, z: number, width: number, alpha: number, tone: Tone = 'ink') => {
      project(ax, ay, z, p); project(bx, by, z, q)
      depth.line(p, q, width, alpha, tone)
    }

    // The ruler: a baseline over the rows, a tick per unit (every fifth longer), and a pointer on the running total.
    const ruler = 24 + H + 4.6
    if (lod) {
      segment(LEFT, ruler, LEFT + 58, ruler, FRONT, hair * 0.8, 0.4)
      for (let u = 0; u <= totals[n - 1]!; u++) {
        const major = u % 5 === 0
        if (major || rich) segment(LEFT + u * scale, ruler, LEFT + u * scale, ruler + (major ? 2.4 : 1.2), FRONT, hair * 0.7, major ? 0.5 : 0.24)
      }
      if (rich) {
        let sum = values[0]!
        for (let i = 1; i < n; i++) sum += values[i]! * ready(i)
        const x = LEFT + sum * scale
        xy.length = 0
        for (const [dx, dy] of [[0, -0.5], [1.3, -2.7], [-1.3, -2.7]] as const) {
          project(x + dx, ruler + dy, FRONT, p)
          xy.push(p.x, p.y)
        }
        depth.poly(xy, p.z + 2, 0.85, 'c1')
      }
    }

    for (let i = 0; i < n; i++) {
      const y = 24 - i * gap, k = ready(i)
      const previous = i ? totals[i - 1]! * scale : 0
      const x0 = LEFT + previous * k
      const x1 = x0 + values[i]! * scale
      // Where it will land: a dashed ghost, fading as the slab arrives over it.
      if (i && lod) {
        const g = projectPath(roundedRect(LEFT + previous, y - H, values[i]! * scale, 2 * H, 0.6, 1).map(([gx, gy]) => [gx, gy, FRONT - 0.2] as const), project, xy)
        depth.path(g.xy, g.z - 4, { width: hair * 0.7, alpha: 0.24 * (1 - 0.7 * k), closed: true, dash: [2 * hair, 2 * hair] })
      }
      // The carried span: a rail behind the slab with a tick per unit, ending in a stop against its left edge.
      if (previous > 0 && k > 0.001) {
        segment(LEFT, y, x0, y, FRONT - 0.8, hair * 1.3, 0.55 * k)
        segment(x0 - 0.35, y - 1.8, x0 - 0.35, y + 1.8, FRONT - 0.8, hair, 0.7 * k)
        if (rich) for (let unit = 1; unit < totals[i - 1]!; unit++) segment(LEFT + unit * scale * k, y - 1.1, LEFT + unit * scale * k, y + 1.1, FRONT - 0.8, hair * 0.6, 0.24 * k)
      }
      segment(LEFT - 3, y - 3.6, LEFT - 3, y + 3.6, 0, hair * 0.8, 0.32)

      // The slab: its front, top and leading end, each lit by its own facing; the front outlined.
      set(0, x0, y - H, FRONT); set(1, x1, y - H, FRONT); set(2, x1, y + H, FRONT); set(3, x0, y + H, FRONT)
      lit(0, 0, 1, 0)
      const front = projectPath(QUAD, project, xy)
      depth.path(front.xy, front.z + 0.02, { width: hair * 0.8, alpha: 0.7, closed: true })
      set(0, x0, y + H, BACK); set(1, x1, y + H, BACK); set(2, x1, y + H, FRONT); set(3, x0, y + H, FRONT)
      lit(0, 1, 0, 0)
      set(0, x1, y - H, BACK); set(1, x1, y - H, FRONT); set(2, x1, y + H, FRONT); set(3, x1, y + H, BACK)
      lit(1, 0, 0, 0)
      // Its leading edge wears the accent while it moves.
      const active = i === 0 ? 0 : Math.max(Math.sin(Math.PI * span(t, arrive(i) - 0.02, arrive(i) + 0.16)) ** 2, 0.6 * Math.sin(Math.PI * span(t, leave(i), leave(i) + 0.13)) ** 2)
      if (active > 0.004) {
        project(x1, y - H, FRONT + 0.05, p); project(x1, y + H, FRONT + 0.05, q)
        depth.path([p.x, p.y, q.x, q.y], front.z + 0.05, { width: hair * 1.5, alpha: active, tone: 'accent' })
      }
      // The total so far, tagged at the slab's end on a short leader.
      if (rich) {
        const tag = i === 0 ? 1 : span(k, 0.6, 1)
        if (tag > 0.004) {
          const digits = String(totals[i]).length
          segment(x1 + 0.5, y, x1 + 2.2, y, FRONT, hair * 0.7, 0.5 * tag)
          const box = projectPath(roundedRect(x1 + 2.2, y - 1.9, 3 + 2.1 * digits, 3.8, 0.9, 2).map(([bx, by]) => [bx, by, FRONT] as const), project, xy)
          depth.path(box.xy, box.z, { width: hair * 0.75, alpha: 0.7 * tag, closed: true })
          for (let d = 0; d < digits; d++) segment(x1 + 3.7 + d * 2.1, y, x1 + 5.1 + d * 2.1, y, FRONT, hair * 1.6, 0.75 * tag)
        }
      }
      // The carry: from a knot on this slab's lower corner down to an arrowhead on the next row, where the next slab's corner will land.
      if (i < n - 1) {
        const carry = view.ease.standard(span(t, arrive(i + 1) - 0.05, arrive(i + 1) + 0.05)) * (1 - view.ease.standard(span(t, leave(i + 1) + 0.03, leave(i + 1) + 0.11)))
        if (carry > 0.004) {
          const yTop = y - H - 0.9
          const yEnd = mix(yTop, 24 - (i + 1) * gap + H + 1.1, carry)
          segment(x1, yTop, x1, yEnd, FRONT + 0.3, hair * 0.9, 0.7 * carry, 'c1')
          project(x1, y - H, FRONT + 0.3, p)
          depth.square(p, (lod ? 1.9 : 2.6) * hair, 0.85 * carry, 'c1')
          if (lod) {
            const head = span(carry, 0.6, 1)
            segment(x1 - 1.1, yEnd + 1.3, x1, yEnd, FRONT + 0.3, hair * 0.9, 0.75 * head, 'c1')
            segment(x1 + 1.1, yEnd + 1.3, x1, yEnd, FRONT + 0.3, hair * 0.9, 0.75 * head, 'c1')
          }
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Addends shift beyond carried totals to form a measured prefix staircase. */
export function LoaderPrefix(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
