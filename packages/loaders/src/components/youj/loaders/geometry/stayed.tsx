'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'stayed', title: 'Stayed', category: 'geometry', technique: 'lines',
  tags: ['construction', 'cable', 'bridge', 'cantilever', 'tension', 'assembly'],
  description: 'A twin-leg pylon erects above a registered crossing. Opposed deck segments advance from the tower in balanced pairs, each held by its own taut stay; a short closure seam joins the outer tips before the span withdraws toward its foundation.',
  order: 46,
  colors: [{ part: 'Stays', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.51,
  draw(pen, t, view) {
    const small = view.size < 32
    const count = small ? 3 : 4
    const step = 33 / count
    const pose = { yaw: -0.42, pitch: -0.42 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 55 })
    const turn = orient(pose)
    const hair = (small ? 1.1 : 1) / view.px
    const up = view.ease.emphasized(span(t, 0.03, 0.2))
    const down = view.ease.exit(span(t, 0.87, 0.99))
    const tower = up * (1 - down)
    const summit = -20 + 49 * tower

    // The foundation and deck datum stay through the seam. The erected
    // pylon is genuinely two legs and a crosshead, leaving an open portal.
    for (const z of [-7, 7]) {
      stock(depth, project, turn, 0, -22, z, 9, 2.2, 8, hair * 0.8)
      const h = 2.5 + 46.5 * tower
      stock(depth, project, turn, 0, -20 + h / 2, z, 3.1, h, 3.2, hair * 0.85)
    }
    if (tower > 0.004) stock(depth, project, turn, 0, summit - 4, 0, 3.1, 2.8 * tower, 17, hair * 0.8)
    project(-35, -7.5, 0, p); project(35, -7.5, 0, q)
    depth.path([p.x, p.y, q.x, q.y], -150, { width: hair * 0.75, alpha: 0.25, dash: small ? undefined : [2 * hair, 2 * hair] })
    stock(depth, project, turn, 0, -7, 0, 6, 2.2, 14, hair * 0.8)

    for (let i = 0; i < count; i++) {
      const start = 0.17 + i * 0.085
      const release = 0.73 + (count - 1 - i) * 0.033
      const arrive = view.ease.emphasized(span(t, start, start + 0.16))
      const leave = view.ease.exit(span(t, release, release + 0.14))
      const seated = clamp(arrive * (1 - leave))
      const reach = view.ease.standard(span(t, start - 0.035, start + 0.115)) * (1 - view.ease.exit(span(t, release + 0.02, release + 0.16)))
      const xTip = 3 + (i + 1) * step * 0.91
      for (const sign of [-1, 1]) {
        // Opposing banks keep the construction balanced; each segment
        // retains a real thickness instead of being an extruded stroke.
        const center = sign * (3 + (i + 0.5) * step * 0.91 + 5 * (1 - seated))
        const deckY = -7 + 5 * (1 - seated)
        if (seated > 0.004) stock(depth, project, turn, center, deckY, 0, (step * 0.91 - 0.5) * seated, 2.2 * seated, 14 * seated, hair * 0.8)
        for (const z of small ? [6] : [-6, 6]) {
          const mastY = summit - 1 - i * 2.6
          const dx = center + sign * ((step * 0.91 - 0.5) / 2 - 1.2) * seated
          project(0, mastY, z, p)
          project(mix(0, dx, reach), mix(mastY, deckY + 1.1, reach), z, q)
          if (reach > 0.004) depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.08, { width: hair * 0.9 * (p.k + q.k) / 2, alpha: clamp(0.78 + (p.z + q.z) / 240) * reach, tone: blend('ink', 'c1', 0.75) })
          if (!small && seated > 0.01) {
            // The stay meets a short anchor plate on the deck surface.
            project(dx - 1.3, deckY + 1.2, z, p); project(dx + 1.3, deckY + 1.2, z, q)
            depth.line(p, q, hair, 0.8 * seated)
          }
        }
        // A single short closing joint at each outer tip. The accent
        // waits for the last pair to be held, then cools before release.
        if (i === count - 1) {
          const closed = view.ease.standard(span(t, 0.58, 0.66)) * (1 - view.ease.exit(span(t, 0.69, 0.76)))
          project(sign * (xTip - 0.25), -5.8, -5, p); project(sign * (xTip - 0.25), -5.8, 5, q)
          depth.line(p, q, hair * 1.4, closed, 'accent')
        }
      }
    }
    if (!small) for (const sign of [-1, 1]) {
      // Fine abutment witnesses register the intended ends of the span.
      project(sign * 35, -22, -5, p); project(sign * 35, -22, 5, q); depth.line(p, q, hair * 0.7, 0.25)
      project(sign * 35, -22, 0, p); project(sign * 35, -9, 0, q)
      depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.65, alpha: 0.22, dash: [2 * hair, 2 * hair] })
    }
    depth.flush(pen)
  },
}
/* Color: the stays lean toward `c1`, each running out to its deck segment;
 * pylon and deck stay ink, and the closing joint the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A cable-stayed crossing advances in balanced, individually supported deck pairs. */
export function LoaderStayed(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
