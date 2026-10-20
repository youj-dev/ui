'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, span, Depth, point, projectPath, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'prism',
  title: 'Prism',
  category: 'color',
  technique: 'lines',
  tags: ['light', 'ray', 'dispersion', 'spectrum', 'optics', 'refraction', 'wireframe'],
  description: 'A ray of light crosses a wireframe prism and comes out as a fan of three colors, each landing on a screen as a band; the prism sways and the bands sweep.',
  order: 1,
  colors: [
    { part: 'First ray', mono: 'ink' },
    { part: 'Second ray', mono: 'ink' },
    { part: 'Third ray', mono: 'ink', role: 'c4' },
  ],
} satisfies LoaderMeta

/* A triangular prism in hairlines, apex up, its faces barely tinted, the
 * camera swaying around it. A ray of ink comes in from the left and meets
 * the near face where the accent marks the point of entry; inside it runs
 * faint, and out of the far face it splits into a fan of three, bent down
 * toward the base, each running to a screen and landing there as a short
 * band. Once a loop a packet of light travels the path: along the ray,
 * through the glass, then three packets, one down each colored ray, and the
 * bands brighten as they land and fade back before the seam. The bands
 * sweep up and down the screen with the sway, one whole swing a loop.
 *
 * Color: the dispersed rays, their packets and bands are `c1`,
 * `c2` and `c3`; the incoming ray and the prism stay the
 * ink, the entry point the accent. Monochrome, the fan is three ink rays. */

const TRI: [number, number][] = [
  [-17, -13],
  [17, -13],
  [0, 17],
]
const HALF = 12
const SOURCE: [number, number] = [-46, -2]
const ENTRY: [number, number] = [-8.5, 2]
const EXIT: [number, number] = [8.5, 2]
const SCREEN = 40
const GAP = 7
const RAYS: Tone[] = ['c1', 'c2', 'c3']

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

/** A packet: the stretch of the segment a→b between `from` and `to` (0–1), projected. */
function packet(project: Project, a: [number, number], b: [number, number], from: number, to: number, width: number, alpha: number, tone: Tone) {
  const f = clamp(from)
  const g = clamp(to)
  if (g - f <= 0.002 || alpha <= 0.01) return
  project(mix(a[0], b[0], f), mix(a[1], b[1], f), 0, p)
  project(mix(a[0], b[0], g), mix(a[1], b[1], g), 0, q)
  depth.path([p.x, p.y, q.x, q.y], 20, { width, alpha, tone, cap: 'round' })
}

export const scene: Scene = {
  beats: 5,
  still: 0.62,
  draw(pen, t, view) {
    const small = view.size < 32
    const project = camera({ yaw: -0.3 + 0.14 * Math.sin(TAU * t), pitch: -0.2, distance: 180, cx: view.w / 2 - 2, cy: view.h / 2 + 2 })
    const hair = (small ? 1.2 : 1) / view.px
    const stroke = clamp(view.size * 0.022, 1.1, 2) / view.px

    // The prism: both ends, the three long edges, the near end faintly filled.
    for (const z of [-HALF, HALF]) {
      const end = projectPath(
        TRI.map(([x, y]) => [x, y, z] as const),
        project,
        xy,
      )
      if (z > 0) depth.poly(end.xy, end.z - 1, 0.05)
      depth.path(end.xy, end.z, { width: hair, alpha: z > 0 ? 0.6 : 0.3, closed: true, join: 'miter' })
    }
    for (const [x, y] of TRI) {
      project(x, y, -HALF, p)
      project(x, y, HALF, q)
      depth.line(p, q, hair, 0.4)
    }

    // The screen the bands land on.
    project(SCREEN, -30, 0, p)
    project(SCREEN, 24, 0, q)
    depth.line(p, q, hair, 0.3)
    if (view.size >= 64) {
      for (let i = 0; i <= 6; i++) {
        project(SCREEN, -30 + i * 9, 0, p)
        project(SCREEN + 2.2, -30 + i * 9, 0, q)
        depth.line(p, q, hair, 0.22)
      }
    }

    // The ray in, faint inside the glass, then the fan out, its bands sweeping with the sway.
    packet(project, SOURCE, ENTRY, 0, 1, hair, 0.4, 'ink')
    packet(project, ENTRY, EXIT, 0, 1, hair, 0.22, 'ink')
    const sweep = -10 + 6 * Math.sin(TAU * t)
    const land = span(t, 0.78, 0.84) * (1 - span(t, 0.84, 1))
    const band = (small ? 3.2 : 2.6)
    RAYS.forEach((tone, i) => {
      const end: [number, number] = [SCREEN, sweep + (1 - i) * GAP]
      const from: [number, number] = [EXIT[0], EXIT[1] + (1 - i) * 0.6]
      packet(project, from, end, 0, 1, hair * 1.1, 0.5, tone)
      project(SCREEN, end[1] - band, 0, p)
      project(SCREEN, end[1] + band, 0, q)
      depth.path([p.x, p.y, q.x, q.y], 21, { width: stroke * 1.8, alpha: 0.45 + 0.55 * land, tone })
    })

    // Once a loop, a packet of light travels the path: in, through, and out down each ray.
    const head = view.ease.standard(span(t, 0.02, 0.32))
    packet(project, SOURCE, ENTRY, head - 0.22, head, stroke, 0.9 * (1 - span(t, 0.3, 0.34)), 'ink')
    const through = span(t, 0.32, 0.42)
    packet(project, ENTRY, EXIT, through - 0.5, through, stroke, 0.7 * Math.sin(Math.PI * through), 'ink')
    const out = view.ease.standard(span(t, 0.42, 0.8))
    RAYS.forEach((tone, i) => {
      const end: [number, number] = [SCREEN, sweep + (1 - i) * GAP]
      const from: [number, number] = [EXIT[0], EXIT[1] + (1 - i) * 0.6]
      packet(project, from, end, out - 0.24, out, stroke, 0.95 * (1 - span(t, 0.78, 0.82)), tone)
    })

    // The point of entry.
    project(ENTRY[0], ENTRY[1], 0, p)
    p.z = 30
    depth.square(p, clamp(view.size * 0.045, 2.4, 4.6) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A ray crosses a wireframe prism and fans out into three colored rays that land on a screen as bands. */
export function LoaderPrism(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
