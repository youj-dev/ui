'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import { O_BOX, O_INNER, O_OUTER, sampleOutline } from '../glyphs'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'tittle',
  title: 'Tittle',
  category: 'depth',
  technique: 'particles',
  tags: ['brand', 'letter', 'o', 'orbit', '3d', 'logo', 'particle'],
  description: 'The youj o, built in particles and given depth, turns and lands while the j’s square tittle orbits it in the accent, passing behind the letter and through its counter.',
  order: 1,
  colors: [{ part: 'Letter', mono: 'ink' }],
} satisfies LoaderMeta

/* The o is its real outline and counter (the wordmark's bends), set on a
 * front and a back face. Depth is perspective: nearer particles are larger
 * and brighter, and it rests turned, so its depth shows even when still.
 * Each half turn is `emphasized` (a short wind-up, a fast middle, a long
 * precise landing); the orbit runs at an even rate, so the piece is never
 * still. Two half turns make the loop, and the o is its own mirror, so it
 * has no seam.
 *
 * Color: the far third of the o leans toward `c1` and the rest keeps the ink, so the turn shows as a shift of color. */

/** The o's height in world units, and its half-depth. */
const HEIGHT = 60
const DEPTH = 5.5
const SCALE = HEIGHT / O_BOX.h
const CX = O_BOX.x + O_BOX.w / 2
const CY = O_BOX.y + O_BOX.h / 2

type Letter = { x: number; y: number; z: number }[]

/** The o's particles for a level of detail: points along both outlines, on each depth layer. */
function letter(outer: number, inner: number, layers: number): Letter {
  const flat = [...sampleOutline(O_OUTER, outer), ...sampleOutline(O_INNER, inner)].map(([x, y]) => ({ x: (x - CX) * SCALE, y: -(y - CY) * SCALE }))
  const out: Letter = []
  for (let l = 0; l < layers; l++) {
    const z = layers === 1 ? 0 : DEPTH - (2 * DEPTH * l) / (layers - 1)
    for (const p of flat) out.push({ x: p.x, y: p.y, z })
  }
  return out
}

const DETAIL = [
  { below: 32, o: letter(26, 18, 2) },
  { below: 80, o: letter(36, 24, 2) },
  { below: Infinity, o: letter(48, 32, 3) },
]

const ORBIT = 38
const depth = new Depth()
const p = point()
const q = point()

/** Brightness by depth: the far side a quarter, the near side full. */
const shade = (z: number) => 0.22 + 0.78 * clamp((z + 34) / 68) ** 1.4

export const scene: Scene = {
  beats: 4,
  still: 0.36,
  draw(pen, t, view) {
    t %= 1
    const { o } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    // Two half turns a loop: it turns, lands, and turns on. The curve is the emphasized landing with a little of the
    // standard one in it, so the fastest moment is gentler and the particles don't strobe at small sizes.
    const turnAt = (time: number) => {
      const w = ((time % 1) + 1) % 1
      const half = w < 0.5 ? 0 : 1
      const u = span(w - half * 0.5, 0.03, 0.47)
      return half + 0.6 * view.ease.emphasized(u) + 0.4 * view.ease.standard(u)
    }
    const turn = turnAt(t)
    // As it whips round, the particles soften a little (a hint of blur), and sharpen as it lands.
    // (Two half turns a loop: across the seam the turn reads 2 then 0, the same pose.)
    const step = turnAt(t + 0.004) - turnAt(t - 0.004)
    const speed = Math.abs(step < -1 ? step + 2 : step) / 0.008
    const blur = clamp(speed / 9) * (small ? 0.4 : view.size < 80 ? 0.32 : 0.2)
    const project = camera({ yaw: 0.6 + Math.PI * turn, pitch: -0.3, distance: 230, cx: view.w / 2, cy: view.h / 2 + 1 })
    const side = clamp(view.size * 0.044, 1.35, 3) / view.px
    const hair = 1 / view.px

    // The o's far side leans toward its color, its near side the ink: a gradient through depth as it turns.
    for (const c of o) depth.square(project(c.x, c.y, c.z, p), side, shade(p.z) * (1 - blur), blend('ink', 'c1', 0.65 * span(1 - clamp((p.z + 30) / 60), 0.45, 1)))

    // The tittle's orbit: a circle round the o, tipped toward the viewer and leaning a little, one lap a loop.
    const orbit = camera({ yaw: 0, pitch: -0.3, roll: 0.22, distance: 230, cx: view.w / 2, cy: view.h / 2 + 1 })
    // Its track, a faint dotted ring, so the lap reads as a path that passes behind the letter and in front of it.
    if (view.size >= 40) {
      const steps = 48
      for (let i = 0; i < steps; i += 2) {
        const a0 = (TAU * i) / steps
        const a1 = (TAU * (i + 1)) / steps
        orbit(Math.cos(a0) * ORBIT, Math.sin(a0) * ORBIT * 0.34, Math.sin(a0) * ORBIT, p)
        orbit(Math.cos(a1) * ORBIT, Math.sin(a1) * ORBIT * 0.34, Math.sin(a1) * ORBIT, q)
        depth.line(p, q, hair, 0.08 + 0.12 * shade((p.z + q.z) / 2))
      }
    }
    for (let ghost = 4; ghost >= 0; ghost--) {
      const a = TAU * (t - ghost * 0.018) + 0.6
      const x = Math.cos(a) * ORBIT
      const z = Math.sin(a) * ORBIT
      orbit(x, z * 0.34, z, p)
      const lead = ghost === 0
      depth.square(p, side * (lead ? 2.4 : 1.6 - ghost * 0.18), (lead ? 1 : 0.34 - ghost * 0.06) * (0.45 + 0.55 * shade(p.z)), 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The youj o in particles turns and lands, while the j's square tittle orbits it in the accent. */
export function LoaderTittle(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
