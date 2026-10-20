'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, Depth, point, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'chord',
  title: 'Chord',
  category: 'color',
  technique: 'paths',
  tags: ['waves', 'sum', 'harmonics', 'interference', 'layers', 'signal', 'audio'],
  description: 'Three sine waves on stacked planes, each in a color of its own, and their sum in ink in front, the amplitudes breathing in turn; the accent rides the sum’s crest.',
  order: 11,
  colors: [
    { part: 'Low tone', mono: 'ink' },
    { part: 'Middle tone', mono: 'ink' },
    { part: 'High tone', mono: 'ink', role: 'c4' },
  ],
} satisfies LoaderMeta

/* Three planes stand one behind another, seen from a little above and to
 * the side, each holding a sine wave on a faint baseline: a low tone at the
 * back, a middle one, a high one in front of them, each travelling a whole
 * number of wavelengths a loop (the middle one the other way). Their
 * amplitudes swell and ease in turn, a third of a loop apart. On the
 * nearest plane their sum is drawn in ink, heavier, and the accent particle
 * rides its crest: a soft maximum of the sum, so it glides from crest to
 * crest instead of jumping, with a faint drop to the baseline.
 *
 * Color: the three tones are `c1`, `c2` and `c3`
 *, farther planes fainter; the sum is the ink, its crest the
 * accent. Monochrome, the parts are told from the sum by weight and depth. */

const X = 34
const SUM_Z = 24
const SUM_SCALE = 0.75
const TONES: { y: number; z: number; cycles: number; travel: number; amp: number; tone: Tone }[] = [
  { y: 21, z: -24, cycles: 1, travel: 1, amp: 6, tone: 'c1' },
  { y: 11, z: -12, cycles: 2, travel: -1, amp: 4.2, tone: 'c2' },
  { y: 1, z: 0, cycles: 3, travel: 2, amp: 2.8, tone: 'c3' },
]
/** The sum's baseline, under the parts. */
const SUM_Y = -16
const DETAIL = [
  { below: 32, samples: 28 },
  { below: 80, samples: 52 },
  { below: Infinity, samples: 84 },
]

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const sum: number[] = []

export const scene: Scene = {
  beats: 4.5,
  still: 0.28,
  draw(pen, t, view) {
    const { samples } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const project = camera({ yaw: -0.42, pitch: -0.22, distance: 240, cx: view.w / 2, cy: view.h / 2 + 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.018, 1, 1.6) / view.px

    sum.length = samples + 1
    sum.fill(0)
    TONES.forEach((w, i) => {
      const amp = w.amp * (0.7 + 0.3 * Math.cos(TAU * (t + i / 3)))
      xy.length = 0
      for (let s = 0; s <= samples; s++) {
        const u = s / samples
        const y = amp * Math.sin(TAU * (w.cycles * u + w.travel * t) + i)
        sum[s] = sum[s]! + y
        project(-X + 2 * X * u, w.y + y, w.z, p)
        xy.push(p.x, p.y)
      }
      const fade = 0.55 + 0.45 * clamp((w.z + 24) / 28)
      depth.path(xy, w.z, { width: small ? hair * 1.3 : stroke * 0.9, alpha: 0.9 * fade, tone: w.tone, join: 'round', cap: 'round' })
      if (!small) {
        project(-X, w.y, w.z, p)
        project(X, w.y, w.z, q)
        depth.line(p, q, hair, 0.12 * fade)
      }
    })

    // The sum, in front, heavier; its baseline; and the accent riding a soft maximum of it.
    xy.length = 0
    let weight = 0
    let at = 0
    const top = Math.max(...sum)
    for (let s = 0; s <= samples; s++) {
      const u = s / samples
      project(-X + 2 * X * u, SUM_Y + sum[s]! * SUM_SCALE, SUM_Z, p)
      xy.push(p.x, p.y)
      const w = Math.exp((sum[s]! - top) * 0.9)
      weight += w
      at += w * u
    }
    depth.path(xy, SUM_Z, { width: stroke * 1.4, alpha: 0.95, join: 'round', cap: 'round' })
    project(-X, SUM_Y, SUM_Z, p)
    project(X, SUM_Y, SUM_Z, q)
    depth.line(p, q, hair, 0.22)

    const u = at / weight
    const f = u * samples
    const s0 = Math.min(samples - 1, Math.floor(f))
    const y = (sum[s0]! + (sum[s0 + 1]! - sum[s0]!) * (f - s0)) * SUM_SCALE
    if (!small) {
      project(-X + 2 * X * u, SUM_Y + y, SUM_Z, p)
      project(-X + 2 * X * u, SUM_Y, SUM_Z, q)
      depth.path([p.x, p.y, q.x, q.y], SUM_Z + 1, { width: hair, alpha: 0.35, dash: [1.5 * hair, 2 * hair] })
    }
    project(-X + 2 * X * u, SUM_Y + y, SUM_Z, p)
    p.z = SUM_Z + 2
    depth.square(p, clamp(view.size * 0.045, 2.4, 4.6) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Three colored sine waves on stacked planes and their sum in ink in front, the accent riding its crest. */
export function LoaderChord(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
