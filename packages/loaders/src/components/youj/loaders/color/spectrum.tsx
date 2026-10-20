'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, span, Depth, point, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'spectrum',
  title: 'Spectrum',
  category: 'color',
  technique: 'particles',
  tags: ['gradient', 'hue', 'wave', 'grid', 'isometric', 'swatch', 'shimmer'],
  description: 'An isometric grid of the brand’s square particles, a gradient sliding through it once a loop: each square lifts and passes from the ink through two colors and back, the accent corner leading.',
  order: 3,
  colors: [
    { part: 'Leading hue', mono: 'ink' },
    { part: 'Trailing hue', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A square grid of particles on the floor, seen isometric. Once a loop a
 * wave leaves the corner held by the accent particle and runs diagonally to
 * the far corner: as it reaches a square, the square lifts a little, grows a
 * little, and passes from the ink through the first color into the second
 * and back to the ink, so a band of gradient slides through the grid
 * behind the front. Each square's pass is a function of the loop and its
 * distance from the corner, one pass a loop, so the loop has no seam.
 *
 * Color: the wave's front is `c1`, its tail `c2`, the
 * grid at rest the ink and the leading corner the accent. Monochrome, the
 * wave is a lift and a brightening. */

const HALF = 26
const DETAIL = [
  { below: 32, n: 5 },
  { below: 80, n: 7 },
  { below: Infinity, n: 9 },
]
/** How much of the loop one square's pass takes. */
const PASS = 0.42

const depth = new Depth()
const p = point()

/** The square's color through its pass (0–1): the ink, the first color, the second, the ink. */
function tone(u: number): Tone {
  if (u <= 0 || u >= 1) return 'ink'
  if (u < 1 / 3) return blend('ink', 'c1', u * 3)
  if (u < 2 / 3) return blend('c1', 'c2', u * 3 - 1)
  return blend('c2', 'ink', u * 3 - 2)
}

export const scene: Scene = {
  beats: 4,
  still: 0.36,
  draw(pen, t, view) {
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: Math.PI / 4, pitch: -0.62, distance: 260, cx: view.w / 2, cy: view.h * 0.55 })
    const side = clamp(view.size * 0.044, 1.5, 3.2) / view.px
    const step = (2 * HALF) / (n - 1)

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const far = (i + j) / (2 * (n - 1))
        const local = (((t - 0.55 * far) % 1) + 1) % 1
        const u = span(local, 0, PASS)
        const swell = Math.sin(Math.PI * u)
        project(HALF - i * step, 4 * swell * swell, HALF - j * step, p)
        const shade = 0.4 + 0.45 * clamp((p.z + HALF * 1.4) / (HALF * 2.8))
        const lead = i === 0 && j === 0
        depth.square(p, side * (lead ? 1.9 : 1 + 0.35 * swell), lead ? 1 : clamp(shade + 0.3 * swell), lead ? 'accent' : tone(u))
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A gradient slides once a loop through an isometric grid of square particles, from the accent corner. */
export function LoaderSpectrum(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
