'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, blend, camera, clamp, span, Depth, point, projectPath, type ExtraTone, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'swatch',
  title: 'Swatch',
  category: 'color',
  technique: 'planes',
  tags: ['palette', 'swatches', 'fan deck', 'color', 'tones', 'design', 'chips'],
  description: 'A fan deck of swatch cards, each a ramp of chips from the ink to one of the theme’s colors, fans open around its pin, holds, and closes; the top card’s tab is the accent.',
  order: 9,
  colors: [
    { part: 'First ramp', mono: 'ink' },
    { part: 'Second ramp', mono: 'ink' },
    { part: 'Third ramp', mono: 'ink', role: 'c4' },
  ],
} satisfies LoaderMeta

/* A designer's fan deck in the isometric view: long, thin cards stacked on a
 * pin at one end. Each card is a sheet of paper with its edge in the ink and
 * a row of chips along it, the chips a ramp from a pale ink to a full color.
 * The deck fans open (`emphasized`), each card a little further round than
 * the one below, holds open while the chips show their ramps, and closes
 * (`standard`) back into one card, as the loop began. The top card's tab, at
 * its far end, is the accent: the pick.
 *
 * Color: the cards' ramps run from the ink into `c1`, `c2`
 * and `c3`, card by card, the chips also stepping up in
 * strength, so without `colors` each is a ramp of grays. The pick is the
 * accent. */

const LENGTH = 54
const WIDTH = 11
const PIN = [-24, 0, 6] as const
const HUES: ExtraTone[] = ['c3', 'c2', 'c1']

const DETAIL = [
  { below: 32, cards: 3, chips: 3 },
  { below: 80, cards: 4, chips: 4 },
  { below: Infinity, cards: 5, chips: 5 },
]

const depth = new Depth()
const p = point()
const xy: number[] = []
const pts: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 5,
  still: 0.4,
  draw(pen, t, view) {
    const { cards, chips } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: -0.5 + 0.06 * Math.sin(TAU * t), pitch: -0.68, distance: 260, cx: view.w / 2 + 4, cy: view.h / 2 + 4 })
    const hair = 1 / view.px

    const open = view.ease.emphasized(span(t, 0.05, 0.42)) * (1 - view.ease.standard(span(t, 0.66, 0.97)))
    const spread = (cards > 4 ? 0.3 : 0.38) * open

    /** A rectangle along the card at angle `a`, from `u0` to `u1` of its length and `v0` to `v1` of its width, at height `y`. */
    const rect = (a: number, y: number, u0: number, u1: number, v0: number, v1: number) => {
      const c = Math.cos(a)
      const s = Math.sin(a)
      const corners = [
        [u0, v0],
        [u1, v0],
        [u1, v1],
        [u0, v1],
      ] as const
      corners.forEach(([u, v], k) => {
        const pt = pts[k]!
        pt[0] = PIN[0] + u * c - v * s
        pt[1] = y
        pt[2] = PIN[2] - u * s - v * c
      })
      return projectPath(pts, project, xy)
    }

    for (let i = 0; i < cards; i++) {
      // The bottom card stays; each one above swings a little further round the pin.
      const a = -0.2 + i * spread
      const y = i * 1.6
      const key = i * 10
      const top = i === cards - 1
      const hue = HUES[i % HUES.length]!
      const card = rect(a, y, -4, LENGTH, -WIDTH / 2, WIDTH / 2)
      depth.poly(card.xy, key, 0.05, 'ink', true)
      depth.path(card.xy, key + 1, { width: hair, alpha: 0.55, closed: true, join: 'miter' })
      // The ramp: from a pale ink to the full color, chip by chip.
      const pitch = (LENGTH - 12) / chips
      for (let j = 0; j < chips; j++) {
        const k = (j + 1) / chips
        const u0 = 4 + j * pitch
        const chip = rect(a, y, u0, u0 + pitch - 1.4, -WIDTH / 2 + 2, WIDTH / 2 - 2)
        depth.poly(chip.xy, key + 2, 0.2 + 0.7 * k, blend('ink', hue, 0.35 + 0.65 * k))
      }
      // The pick: the top card's tab, at its far end.
      if (top) {
        const tab = rect(a, y, LENGTH - 6.5, LENGTH - 1.5, -WIDTH / 2 + 2, WIDTH / 2 - 2)
        depth.poly(tab.xy, key + 3, 1, 'accent')
      }
    }

    // The pin through the deck.
    project(PIN[0], (cards - 1) * 1.6 + 0.4, PIN[2], p)
    p.z = 1000
    depth.dot(p, clamp(view.size * 0.03, 1.2, 2.4) / view.px, 0.85)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A fan deck of swatch cards, each a ramp into one of the theme's colors, fans open and closes; the pick is the accent. */
export function LoaderSwatch(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
