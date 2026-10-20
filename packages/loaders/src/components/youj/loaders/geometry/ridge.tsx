'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'ridge',
  title: 'Ridge',
  category: 'geometry',
  technique: 'lines',
  tags: ['wave', 'sheet', 'profile', 'hidden line', 'terrain', 'signal', 'plateau'],
  description:
    'A surface drawn only in profile lines, nearer ones hiding the farther: a squared swell runs through it toward the viewer, lifting each line into a plateau, with the accent square riding its crest.',
  order: 6,
  colors: [{ part: 'Ridges', mono: 'ink' }],
} satisfies LoaderMeta

/* Parallel profile lines across a sheet, seen from the front and a little
 * above. Each line hides what's behind it (a cut-out skirt under it), so the
 * sheet reads as a surface, not a tangle. The swell is square-shouldered, a
 * plateau rather than a hill, the way Youj rounds a square, and it runs
 * from the back of the sheet to the front once a loop, one swell to a
 * period, so the next arrives at the back as this one leaves at the front.
 * The accent square rides the crest and is hidden by the lines in front of
 * it like everything else. Far lines are fainter.
 *
 * Color: the far ridges lean toward `c1` and the near ones keep
 * the ink, a gradient through depth; the marker stays the accent. */

const W = 40
const NEAR = 22
const FAR = -48
const LIFT = 15

const DETAIL = [
  { below: 32, rows: 6, samples: 26 },
  { below: 80, rows: 11, samples: 44 },
  { below: Infinity, rows: 16, samples: 72 },
]

/** The swell's shape across the sheet: flat-topped, square-shouldered (a superellipse). */
const across = (x: number) => 1 / (1 + (x / 15) ** 6)
/** Its shape along the sheet, at distance `d` from the crest (one swell per sheet length). */
const along = (d: number) => {
  const u = d / (NEAR - FAR)
  const w = u - Math.round(u)
  return Math.exp(-((w / 0.16) ** 2))
}

const depth = new Depth()
const p = point()
const base = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 4.5,
  still: 0.42,
  draw(pen, t, view) {
    const { rows, samples } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0, pitch: -0.72, distance: 190, cx: view.w / 2, cy: view.h * 0.56 })
    const hair = (view.size < 32 ? 1.15 : 1) / view.px
    const crest = FAR + (NEAR - FAR) * t
    const step = (NEAR - FAR) / rows

    // Back to front: each line, then the skirt that hides the lines behind it.
    for (let r = 0; r <= rows; r++) {
      const z = FAR + r * step
      const lift = LIFT * along(z - crest) * (0.85 + 0.15 * Math.sin(TAU * t + r))
      xy.length = 0
      let zsum = 0
      for (let i = 0; i <= samples; i++) {
        const x = -W + (2 * W * i) / samples
        project(x, lift * across(x), z, p)
        xy.push(p.x, p.y)
        zsum += p.z
      }
      const zr = zsum / (samples + 1)
      const nearness = (z - FAR) / (NEAR - FAR)
      const edge = Math.min(1, r / 1.5, (rows - r + 0.5) / 1.5)
      project(W, 0, z, base)
      const bottom = base.y + 1.5
      depth.poly([...xy, xy[xy.length - 2]!, bottom, xy[0]!, bottom], zr, 0, 'ink', true)
      depth.path(xy, zr, { width: hair, alpha: (0.22 + 0.7 * nearness ** 1.3) * edge, join: 'round', tone: blend('ink', 'c1', 0.7 * (1 - nearness)) })
    }

    // The accent square on the crest, between the rows, hidden by the ones in front.
    const show = span(t, 0, 0.12) * (1 - span(t, 0.88, 1))
    if (show > 0) {
      project(0, LIFT * (0.85 + 0.15 * Math.sin(TAU * t)) + 1.4, crest, p)
      depth.square(p, clamp(view.size * 0.03, 2.2, 6) / view.px, show, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A sheet of profile lines, nearer hiding farther, with a squared swell and the accent square running toward the viewer. */
export function LoaderRidge(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
