'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, span, Depth, point, type Project, type Scene, type Tone, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { detail } from './trace'

export const meta = {
  id: 'isobar',
  title: 'Isobar',
  category: 'signal',
  technique: 'planes',
  tags: ['spectrum', 'equalizer', 'isometric', 'bars', 'peak hold', 'audio', 'meter', '3d'],
  description: 'An isometric spectrum: lit columns on a plinth jump as notes are struck and fall back, each with a cap that holds its peak a moment before it drops, the last strike’s cap in the accent.',
  order: 4,
  colors: [{ part: 'Second channel', mono: 'ink' }],
} satisfies LoaderMeta

/* The illustrations' isometric language: square columns, flat-lit on three
 * faces, standing in a row on a plinth, low notes at the front. A struck
 * note throws its column up (`enter`) and its neighbors a little, then they
 * fall away as the note dies; a thin cap above each column holds the peak a
 * moment and then drops at an even rate, as a meter's peak hold does. The
 * last struck column's cap wears the accent: it fills the cap from below
 * as the note is struck and drains out of it as the next note takes it, so
 * the accent passes from cap to cap without a flicker. Eight strikes a
 * loop, each counted around the loop, so it has no seam.
 *
 * Color: the second channel’s columns behind are tinted toward `c1`, told apart from the front channel in the ink; the last strike’s cap stays the accent. */

const STRIKES = [
  { at: 0, bin: 0.35, amp: 0.95 },
  { at: 0.125, bin: 3.4, amp: 0.7 },
  { at: 0.25, bin: 1.7, amp: 0.85 },
  { at: 0.3125, bin: 2.5, amp: 0.6 },
  { at: 0.5, bin: 4.6, amp: 1 },
  { at: 0.625, bin: 2.1, amp: 0.75 },
  { at: 0.75, bin: 6.2, amp: 0.8 },
  { at: 0.875, bin: 5.3, amp: 0.65 },
]
const RISE = 0.035
const DECAY = 0.11
const HOLD = 0.05
const DROP = 5

const LEVELS = [
  { bins: 5, side: 12, gap: 4.4 },
  { bins: 6, side: 8.6, gap: 3.2 },
  { bins: 8, side: 7, gap: 2.4 },
]
const TALL = 44

/** A column's level at loop time t (0–1), with every strike counted around the loop. */
function level(i: number, bins: number, t: number, ease: View['ease']) {
  let h = 0.07 + 0.035 * (1 + Math.sin(TAU * (3 * t + i * 0.37)))
  for (const s of STRIKES) {
    const since = (((t - s.at) % 1) + 1) % 1
    const near = Math.exp(-(((i - (s.bin * (bins - 1)) / 7) / 0.75) ** 2))
    const env = since < RISE ? ease.enter(since / RISE) : Math.exp(-(since - RISE) / DECAY)
    h += s.amp * near * env
  }
  return Math.min(h, 1.15)
}

const depth = new Depth()
const p = point()
/** The accent each column's cap holds, 0–1 (reused every frame). */
const heat: number[] = Array<number>(8).fill(0)
const view3 = { yaw: Math.PI / 4, pitch: -0.6155 }
const turn = orient(view3)
const LIGHT = {
  top: lambert(...turn(0, 1, 0)),
  front: lambert(...turn(0, 0, 1)),
  left: lambert(...turn(-1, 0, 0)),
}

/** A box's three faces toward the viewer, all at one depth (`key`), so boxes sort whole and in the order they stand on the floor. */
function box(project: Project, key: number, x: number, z: number, w: number, d: number, y0: number, y1: number, tone: Tone = 'ink') {
  const c = (x1: number, y: number, z1: number) => {
    project(x1, y, z1, p)
    return [p.x, p.y] as const
  }
  const [ax, ay] = c(x, y1, z)
  const [bx, by] = c(x + w, y1, z)
  const [cx, cy] = c(x + w, y1, z + d)
  const [dx, dy] = c(x, y1, z + d)
  const [ex, ey] = c(x, y0, z + d)
  const [fx, fy] = c(x + w, y0, z + d)
  const [gx, gy] = c(x, y0, z)
  depth.face([gx, gy, ax, ay, dx, dy, ex, ey], key, LIGHT.left, tone)
  depth.face([ex, ey, dx, dy, cx, cy, fx, fy], key, LIGHT.front, tone)
  depth.face([ax, ay, bx, by, cx, cy, dx, dy], key, LIGHT.top, tone)
}

export const scene: Scene = {
  beats: 6,
  still: 0.53,
  draw(pen, t, view) {
    const lod = detail(view)
    const { bins, side, gap } = LEVELS[lod]!
    const project = camera({ ...view3, distance: 1600, cx: view.w / 2, cy: view.h * 0.6 })
    const pitch = side + gap
    const x0 = -(bins * pitch - gap) / 2
    // Two channels, left at the front, once there's room for them.
    const rows = lod ? 2 : 1
    const z0 = (rows * pitch - gap) / 2 - side

    // The plinth, beneath everything.
    box(project, -Infinity, x0 - 3, z0 - (rows - 1) * pitch - 3, bins * pitch - gap + 6, rows * pitch - gap + 6, -3.2, 0)

    // How much of the accent each column's cap holds: it fills as the column is struck and drains as the next strike takes it.
    const now = t % 1
    heat.fill(0)
    STRIKES.forEach((s, j) => {
      const since = (((now - s.at) % 1) + 1) % 1
      const gap = (((STRIKES[(j + 1) % STRIKES.length]!.at - s.at) % 1) + 1) % 1
      const k = view.ease.standard(span(since, 0, 0.02)) * (1 - view.ease.standard(span(since, gap, gap + 0.06)))
      const bin = Math.round((s.bin * (bins - 1)) / 7)
      heat[bin] = Math.max(heat[bin]!, k)
    })

    for (let r = rows - 1; r >= 0; r--) {
      const z = z0 - r * pitch
      // The right channel hears each strike a moment later and a little softer.
      const delay = r * 0.012
      const gain = r ? 0.82 : 1
      for (let i = 0; i < bins; i++) {
        const x = x0 + i * pitch
        const h = TALL * gain * level(i, bins, t - delay, view.ease)
        // Columns sort by where they stand: a cap shares its column's depth, so a nearer column covers it.
        const key = project(x + side / 2, 0, z + side / 2, p).z
        box(project, key, x, z, side, side, 0, h, r ? blend('ink', 'c1', 0.45) : 'ink')
        if (r > 0) continue
        // Peak hold, on the front channel: the highest the column has been, held, then dropping at an even rate.
        let cap = h
        for (let k = 1; k <= 20; k++) {
          const back = (k / 20) * (HOLD + 1.15 / DROP)
          const was = TALL * gain * level(i, bins, t - delay - back, view.ease)
          cap = Math.max(cap, was - TALL * DROP * Math.max(0, back - HOLD))
        }
        // The accent fills the cap from below: an accent box under an ink one, the line between them moving.
        const k = heat[i]!
        const split = cap + 0.8 + 1.6 * (k < 0.002 ? 0 : k > 0.998 ? 1 : k)
        if (split > cap + 0.8) box(project, key, x, z, side, side, cap + 0.8, split, 'accent')
        if (split < cap + 2.4) box(project, key, x, z, side, side, split, cap + 2.4)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An isometric spectrum: lit columns jump as notes are struck, each with a peak-hold cap. */
export function LoaderIsobar(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
