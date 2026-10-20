'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, point, type Projected, type Scene } from '../field'
import { O_INNER, WORDMARK, sampleOutline } from '../glyphs'
import type { LoaderMeta } from '../categories'
import { LETTER_BOXES, METRICS, TITTLE, CENTER } from './word'

export const meta = {
  id: 'spell',
  title: 'Spell',
  category: 'glyph',
  technique: 'type',
  tags: ['morph', 'letters', 'wordmark', 'outline', 'type', 'brand', 'transform'],
  description: 'One outline spells the word: y becomes o becomes u becomes j and back to y, the letter turning in space as it changes and landing square on its guide lines.',
  order: 3,
  colors: [{ part: 'Outline', mono: 'ink' }],
} satisfies LoaderMeta

/* Each letter's outline is sampled to the same number of points, from the
 * same corner and in the same direction, so any letter morphs into any
 * other without tangling. The letter sits on a specimen plane (its guide
 * lines, crop marks at its corners, a fainter outline behind it for depth)
 * that never stops turning: slowly while a letter is read, then a fast half
 * turn (`emphasized`) through edge-on, and the outline changes only around
 * edge-on, where it is foreshortened to a sliver, so no half-made shape is
 * ever seen face on. Each letter after a half turn is laid out mirrored, so
 * it reads true from the plane's other side. Four half turns make the loop,
 * two whole turns, ending on the y it began with, so it has no seam.
 *
 * Color: the outline’s back face is `c1`, and the letter warms toward it as it changes edge-on, landing in the ink. */

const N = 120
const SCALE = 4.05
const LETTERS = [0, 1, 2, 3]
const DEPTH = 2.2
/** The slow turn through a letter's hold, as a share of the half turn. */
const DRIFT = 0.08

/** A letter's outer outline: N points from its top-left-most point, centered on its own box. */
function shape(letter: number, d: string, n = N): [number, number][] {
  const box = LETTER_BOXES[letter]!
  const cx = (box.x0 + box.x1) / 2
  const pts = sampleOutline(d, n).map(([x, y]): [number, number] => [(x - cx) * SCALE, -(y - CENTER.y) * SCALE])
  let start = 0
  pts.forEach(([x, y], i) => {
    const [sx, sy] = pts[start]!
    if (x - y < sx - sy) start = i
  })
  return [...pts.slice(start), ...pts.slice(0, start)]
}

/**
 * A letter as laid out on the plane's other side: mirrored, so it reads true
 * from behind, and put back in the same order as the others on the plane
 * (from its top-left, the same way round), so a morph between a letter and
 * the next one's mirror image never turns inside out.
 */
function mirrored(pts: [number, number][]): [number, number][] {
  const flipped = pts.map(([x, y]): [number, number] => [-x, y])
  let start = 0
  flipped.forEach(([x, y], i) => {
    const [sx, sy] = flipped[start]!
    if (x - y < sx - sy) start = i
  })
  const turned = [...flipped.slice(start), ...flipped.slice(0, start)]
  return [turned[0]!, ...turned.slice(1).reverse()]
}

const SHAPES = LETTERS.map((l) => shape(l, WORDMARK[l]!.outlines[0]!))
const BACKS = SHAPES.map(mirrored)
const COUNTER = (() => {
  const box = LETTER_BOXES[1]!
  const cx = (box.x0 + box.x1) / 2
  return sampleOutline(O_INNER, 40).map(([x, y]): [number, number] => [(x - cx) * SCALE, -(y - CENTER.y) * SCALE])
})()
const TOP = -(METRICS[0]! - CENTER.y) * SCALE
const BOTTOM = -(METRICS[3]! - CENTER.y) * SCALE
const HALF = 22

const depth = new Depth()
const p = point()
const q = point()
const front: number[] = []
const back: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.335,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    // Four half turns: in each, a slow drift while the letter reads, then the turn through edge-on.
    const quarter = Math.min(3, Math.floor(t * 4))
    const u = t * 4 - quarter
    const phi = Math.PI * (DRIFT * u + (1 - DRIFT) * view.ease.emphasized(span(u, 0.22, 1)))
    const yaw = Math.PI * quarter + phi - (Math.PI * DRIFT * 0.22) / 2
    const project = camera({ yaw, pitch: -0.16, distance: 320, cx: view.w / 2, cy: view.h / 2 })
    // The outline changes only about edge-on, where it can't be seen face on.
    const change = view.ease.standard(span(phi, Math.PI * 0.36, Math.PI * 0.64))
    const odd = quarter % 2 === 1
    const from = (odd ? BACKS : SHAPES)[quarter]!
    const to = (odd ? SHAPES : BACKS)[(quarter + 1) % 4]!
    const stroke = clamp(view.size * 0.026, 1, 2.2) / view.px
    const hair = 1 / view.px
    // Which way the plane faces: 1 square on, 0 edge-on. Construction marks fade toward edge-on.
    const facing = Math.abs(Math.cos(yaw))
    const at = (x: number, y: number, z: number, out: Projected) => project(x, y, z, out)

    // The guides the letters stand on, and crop marks at the plane's corners. A guide keeps its number
    // of dashes as it turns, so they close up with it rather than crawl along it.
    const dashes = Math.max(3, Math.round(56 / (6 * hair)))
    for (const y of METRICS) {
      at(-28, -(y - CENTER.y) * SCALE, 0, p)
      at(28, -(y - CENTER.y) * SCALE, 0, q)
      const d = Math.hypot(q.x - p.x, q.y - p.y) / (2 * dashes - 1)
      depth.path([p.x, p.y, q.x, q.y], -999, { width: hair, alpha: (y === 20 ? 0.24 : 0.12) * (0.35 + 0.65 * facing), dash: small ? undefined : [d, d] })
    }
    if (!small) {
      const arm = 4
      for (const sx of [-1, 1]) {
        for (const y of [TOP + 3, BOTTOM - 3]) {
          const sy = y > 0 ? 1 : -1
          at(sx * HALF, y, 0, p)
          at(sx * (HALF - arm), y, 0, q)
          depth.line(p, q, hair, 0.4 * facing)
          at(sx * HALF, y - sy * arm, 0, q)
          depth.line(p, q, hair, 0.4 * facing)
        }
      }
    }

    // The outline, front and (fainter) back, so the turn reads in depth.
    front.length = 0
    back.length = 0
    let zf = 0
    let zb = 0
    for (let i = 0; i < N; i++) {
      const x = mix(from[i]![0], to[i]![0], change)
      const y = mix(from[i]![1], to[i]![1], change)
      at(x, y, DEPTH / 2, p)
      front.push(p.x, p.y)
      zf += p.z / N
      at(x, y, -DEPTH / 2, q)
      back.push(q.x, q.y)
      zb += q.z / N
    }
    depth.poly(zf > zb ? front : back, Math.min(zf, zb) - 0.02, 0.06)
    if (!small) depth.path(zf > zb ? back : front, Math.min(zf, zb) - 0.01, { width: hair, alpha: 0.32, closed: true, join: 'round', tone: 'c1' })
    // The letter warms toward the color as it changes, edge-on, and lands in the ink.
    depth.path(zf > zb ? front : back, Math.max(zf, zb), { width: stroke, alpha: 0.95, closed: true, join: 'round', tone: blend('ink', 'c1', 0.6 * Math.sin(Math.PI * change)) })

    // The o's counter, there while the shape is the o.
    const letterFrom = quarter
    const letterTo = (quarter + 1) % 4
    const isO = letterFrom === 1 ? 1 - change : letterTo === 1 ? change : 0
    if (isO > 0.02) {
      const flip = (letterFrom === 1 ? odd : !odd) ? -1 : 1
      front.length = 0
      for (const [x, y] of COUNTER) {
        at(flip * x, y, DEPTH / 2 * Math.sign(zf - zb || 1), p)
        front.push(p.x, p.y)
      }
      depth.path(front, Math.max(zf, zb) + 0.01, { width: stroke, alpha: 0.95 * isO ** 2, closed: true, join: 'round' })
    }

    // The tittle over the j: it rises into place with the j and lifts away as the j turns into the y.
    const isJ = letterFrom === 3 ? 1 - change : letterTo === 3 ? change : 0
    if (isJ > 0.02) {
      const flip = (letterFrom === 3 ? odd : !odd) ? -1 : 1
      const box = LETTER_BOXES[3]!
      const cx = (box.x0 + box.x1) / 2
      const s = TITTLE.size * SCALE * mix(0.4, 1, isJ)
      const x = flip * (TITTLE.x + TITTLE.size / 2 - cx) * SCALE
      const y = -(TITTLE.y + TITTLE.size / 2 - CENTER.y) * SCALE + (1 - isJ) * 6
      front.length = 0
      for (const [dx, dy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]] as const) {
        at(x + (dx * s) / 2, y + (dy * s) / 2, 0, p)
        front.push(p.x, p.y)
      }
      depth.poly(front, Math.max(zf, zb) + 0.02, isJ, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** One outline spells youj, letter into letter, turning in space as it changes. */
export function LoaderSpell(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
